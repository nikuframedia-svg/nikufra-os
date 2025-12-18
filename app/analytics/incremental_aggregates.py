"""
Incremental aggregates computation with watermarks.
Performance-first: only compute new data since last watermark.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
import structlog

logger = structlog.get_logger()


class IncrementalAggregates:
    """Compute incremental aggregates using watermarks."""
    
    def __init__(self, db_url: str):
        """
        Initialize aggregates computer.
        
        Args:
            db_url: Database URL
        """
        self.engine = create_engine(db_url)
    
    def get_watermark(
        self,
        source_table: str,
        source_column: str
    ) -> Optional[datetime]:
        """
        Get last processed watermark.
        
        Args:
            source_table: Table name
            source_column: Column name
        
        Returns:
            Last processed timestamp or None
        """
        # Schema real: mv_name (unique), last_ts (timestamp)
        mv_name = f"{source_table}.{source_column}"
        query = text("""
            SELECT last_ts
            FROM analytics_watermarks
            WHERE mv_name = :mv_name
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {"mv_name": mv_name})
            row = result.fetchone()
            return row[0] if row else None
    
    def update_watermark(
        self,
        source_table: str,
        source_column: str,
        last_processed_ts: datetime,
        run_id: Optional[int] = None
    ):
        """
        Update watermark.
        
        Args:
            source_table: Table name
            source_column: Column name
            last_processed_ts: Last processed timestamp
            run_id: Optional run ID
        """
        # Schema real: mv_name (unique), last_ts (timestamp)
        mv_name = f"{source_table}.{source_column}"
        query = text("""
            INSERT INTO analytics_watermarks 
            (mv_name, last_ts, last_run_id)
            VALUES (:mv_name, :last_ts, :run_id)
            ON CONFLICT (mv_name)
            DO UPDATE SET 
                last_ts = EXCLUDED.last_ts,
                last_run_id = EXCLUDED.last_run_id,
                updated_at = now()
        """)
        
        with self.engine.connect() as conn:
            conn.execute(query, {
                "mv_name": mv_name,
                "last_ts": last_processed_ts,
                "run_id": run_id
            })
            conn.commit()
    
    def compute_agg_phase_stats_daily(
        self,
        snapshot_date: date,
        since_watermark: Optional[datetime] = None
    ) -> int:
        """
        Compute daily phase stats incrementally.
        
        Args:
            snapshot_date: Date to compute for
            since_watermark: Only process data after this timestamp
        
        Returns:
            Number of rows inserted/updated
        """
        logger.info("computing_agg_phase_stats_daily", date=snapshot_date, since=since_watermark)
        
        # Build WHERE clause for incremental
        where_clause = """
            DATE(fof.faseof_event_time) = :snapshot_date
            AND fof.faseof_duration_seconds IS NOT NULL
            AND fof.faseof_duration_seconds > 0
        """
        params = {"snapshot_date": snapshot_date}
        
        if since_watermark:
            where_clause += " AND fof.faseof_event_time >= :since_watermark"
            params["since_watermark"] = since_watermark
        
        query = text(f"""
            INSERT INTO agg_phase_stats_daily 
            (snapshot_date, produto_id, fase_id, n, sum_duration_seconds, sum_duration_sq, 
             min_duration_seconds, max_duration_seconds)
            SELECT 
                :snapshot_date,
                of.of_produto_id,
                fof.faseof_fase_id,
                COUNT(*) as n,
                SUM(fof.faseof_duration_seconds) as sum_duration_seconds,
                SUM(fof.faseof_duration_seconds * fof.faseof_duration_seconds) as sum_duration_sq,
                MIN(fof.faseof_duration_seconds) as min_duration_seconds,
                MAX(fof.faseof_duration_seconds) as max_duration_seconds
            FROM fases_ordem_fabrico fof
            JOIN ordens_fabrico of ON fof.faseof_of_id = of.of_id
            WHERE {where_clause}
            GROUP BY of.of_produto_id, fof.faseof_fase_id
            ON CONFLICT (snapshot_date, produto_id, fase_id)
            DO UPDATE SET
                n = agg_phase_stats_daily.n + EXCLUDED.n,
                sum_duration_seconds = agg_phase_stats_daily.sum_duration_seconds + EXCLUDED.sum_duration_seconds,
                sum_duration_sq = agg_phase_stats_daily.sum_duration_sq + EXCLUDED.sum_duration_sq,
                min_duration_seconds = LEAST(agg_phase_stats_daily.min_duration_seconds, EXCLUDED.min_duration_seconds),
                max_duration_seconds = GREATEST(agg_phase_stats_daily.max_duration_seconds, EXCLUDED.max_duration_seconds),
                updated_at = now()
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, params)
            rowcount = result.rowcount
            conn.commit()
        
        logger.info("agg_phase_stats_daily_computed", date=snapshot_date, rows=rowcount)
        return rowcount
    
    def compute_agg_order_stats_daily(
        self,
        snapshot_date: date,
        since_watermark: Optional[datetime] = None
    ) -> int:
        """
        Compute daily order stats incrementally.
        
        Args:
            snapshot_date: Date to compute for
            since_watermark: Only process data after this timestamp
        
        Returns:
            Number of rows inserted/updated
        """
        logger.info("computing_agg_order_stats_daily", date=snapshot_date, since=since_watermark)
        
        where_clause = """
            DATE(of.of_data_acabamento) = :snapshot_date
            AND of.of_data_criacao IS NOT NULL
            AND of.of_data_acabamento IS NOT NULL
            AND of.of_data_acabamento >= of.of_data_criacao
        """
        params = {"snapshot_date": snapshot_date}
        
        if since_watermark:
            where_clause += " AND of.of_data_acabamento >= :since_watermark"
            params["since_watermark"] = since_watermark
        
        query = text(f"""
            INSERT INTO agg_order_stats_daily
            (snapshot_date, produto_id, n, sum_leadtime_seconds, sum_leadtime_sq,
             on_time_count, late_count)
            SELECT 
                :snapshot_date,
                of.of_produto_id,
                COUNT(*) as n,
                SUM(EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao))) as sum_leadtime_seconds,
                SUM(EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao)) * 
                    EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao))) as sum_leadtime_sq,
                COUNT(CASE WHEN of.of_data_transporte IS NOT NULL 
                          AND of.of_data_acabamento <= of.of_data_transporte 
                     THEN 1 END) as on_time_count,
                COUNT(CASE WHEN of.of_data_transporte IS NOT NULL 
                          AND of.of_data_acabamento > of.of_data_transporte 
                     THEN 1 END) as late_count
            FROM ordens_fabrico of
            WHERE {where_clause}
            GROUP BY of.of_produto_id
            ON CONFLICT (snapshot_date, produto_id)
            DO UPDATE SET
                n = agg_order_stats_daily.n + EXCLUDED.n,
                sum_leadtime_seconds = agg_order_stats_daily.sum_leadtime_seconds + EXCLUDED.sum_leadtime_seconds,
                sum_leadtime_sq = agg_order_stats_daily.sum_leadtime_sq + EXCLUDED.sum_leadtime_sq,
                on_time_count = agg_order_stats_daily.on_time_count + EXCLUDED.on_time_count,
                late_count = agg_order_stats_daily.late_count + EXCLUDED.late_count,
                updated_at = now()
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, params)
            rowcount = result.rowcount
            conn.commit()
        
        logger.info("agg_order_stats_daily_computed", date=snapshot_date, rows=rowcount)
        return rowcount
    
    def compute_agg_quality_daily(
        self,
        snapshot_date: date,
        since_watermark: Optional[datetime] = None
    ) -> int:
        """
        Compute daily quality stats incrementally.
        
        Args:
            snapshot_date: Date to compute for
            since_watermark: Only process data after this timestamp
        
        Returns:
            Number of rows inserted/updated
        """
        logger.info("computing_agg_quality_daily", date=snapshot_date, since=since_watermark)
        
        where_clause = """
            DATE(e.ofch_event_time) = :snapshot_date
        """
        params = {"snapshot_date": snapshot_date}
        
        if since_watermark:
            where_clause += " AND e.ofch_event_time >= :since_watermark"
            params["since_watermark"] = since_watermark
        
        query = text(f"""
            INSERT INTO agg_quality_daily
            (snapshot_date, produto_id, fase_avaliacao_id, faseof_culpada_str,
             n_errors, sum_gravidade, affected_orders_count)
            SELECT 
                :snapshot_date,
                of.of_produto_id,
                e.ofch_fase_avaliacao,
                e.ofch_faseof_culpada,  -- String, não FK
                COUNT(*) as n_errors,
                SUM(e.ofch_gravidade) as sum_gravidade,
                COUNT(DISTINCT e.ofch_of_id) as affected_orders_count
            FROM erros_ordem_fabrico e
            JOIN ordens_fabrico of ON e.ofch_of_id = of.of_id
            WHERE {where_clause}
              AND e.ofch_fase_avaliacao IS NOT NULL
            GROUP BY of.of_produto_id, e.ofch_fase_avaliacao, e.ofch_faseof_culpada
            ON CONFLICT (snapshot_date, produto_id, fase_avaliacao_id, faseof_culpada_str)
            DO UPDATE SET
                n_errors = agg_quality_daily.n_errors + EXCLUDED.n_errors,
                sum_gravidade = agg_quality_daily.sum_gravidade + EXCLUDED.sum_gravidade,
                affected_orders_count = GREATEST(agg_quality_daily.affected_orders_count, EXCLUDED.affected_orders_count),
                updated_at = now()
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, params)
            rowcount = result.rowcount
            conn.commit()
        
        logger.info("agg_quality_daily_computed", date=snapshot_date, rows=rowcount)
        return rowcount
    
    def compute_agg_wip_current(self) -> int:
        """
        Compute current WIP aggregate (incremental).
        
        Returns:
            Number of rows inserted/updated
        """
        logger.info("computing_agg_wip_current")
        
        query = text("""
            INSERT INTO agg_wip_current
            (fase_id, produto_id, wip_count, sum_age_seconds, sum_age_sq,
             min_age_seconds, max_age_seconds, oldest_event_time)
            SELECT 
                fof.faseof_fase_id,
                of.of_produto_id,
                COUNT(*) as wip_count,
                SUM(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio))) as sum_age_seconds,
                SUM(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio)) * 
                    EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio))) as sum_age_sq,
                MIN(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio))) as min_age_seconds,
                MAX(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio))) as max_age_seconds,
                MIN(fof.faseof_inicio) as oldest_event_time
            FROM fases_ordem_fabrico fof
            JOIN ordens_fabrico of ON fof.faseof_of_id = of.of_id
            WHERE fof.faseof_is_open = true
            GROUP BY fof.faseof_fase_id, of.of_produto_id
            ON CONFLICT (fase_id, produto_id)
            DO UPDATE SET
                wip_count = EXCLUDED.wip_count,
                sum_age_seconds = EXCLUDED.sum_age_seconds,
                sum_age_sq = EXCLUDED.sum_age_sq,
                min_age_seconds = EXCLUDED.min_age_seconds,
                max_age_seconds = EXCLUDED.max_age_seconds,
                oldest_event_time = EXCLUDED.oldest_event_time,
                updated_at = now()
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query)
            rowcount = result.rowcount
            conn.commit()
        
        logger.info("agg_wip_current_computed", rows=rowcount)
        return rowcount
    
    def compute_all_incremental(
        self,
        snapshot_date: date,
        run_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Compute all aggregates incrementally for a date.
        
        Args:
            snapshot_date: Date to compute for
            run_id: Optional run ID
        
        Returns:
            Results summary
        """
        results = {}
        
        # Get watermarks
        watermark_faseof = self.get_watermark("fases_ordem_fabrico", "faseof_event_time")
        watermark_of = self.get_watermark("ordens_fabrico", "of_data_acabamento")
        watermark_err = self.get_watermark("erros_ordem_fabrico", "ofch_event_time")
        
        # Compute aggregates
        results["phase_stats"] = self.compute_agg_phase_stats_daily(
            snapshot_date, watermark_faseof
        )
        results["order_stats"] = self.compute_agg_order_stats_daily(
            snapshot_date, watermark_of
        )
        results["quality_stats"] = self.compute_agg_quality_daily(
            snapshot_date, watermark_err
        )
        results["wip_current"] = self.compute_agg_wip_current()
        
        # Update watermarks
        max_faseof_ts = self._get_max_timestamp("fases_ordem_fabrico", "faseof_event_time", snapshot_date)
        max_of_ts = self._get_max_timestamp("ordens_fabrico", "of_data_acabamento", snapshot_date)
        max_err_ts = self._get_max_timestamp("erros_ordem_fabrico", "ofch_event_time", snapshot_date)
        
        if max_faseof_ts:
            self.update_watermark("fases_ordem_fabrico", "faseof_event_time", max_faseof_ts, run_id)
        if max_of_ts:
            self.update_watermark("ordens_fabrico", "of_data_acabamento", max_of_ts, run_id)
        if max_err_ts:
            self.update_watermark("erros_ordem_fabrico", "ofch_event_time", max_err_ts, run_id)
        
        return results
    
    def _get_max_timestamp(
        self,
        table: str,
        column: str,
        snapshot_date: date
    ) -> Optional[datetime]:
        """Get max timestamp for a date."""
        query = text(f"""
            SELECT MAX({column})
            FROM {table}
            WHERE DATE({column}) = :snapshot_date
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {"snapshot_date": snapshot_date})
            row = result.fetchone()
            return row[0] if row and row[0] else None

