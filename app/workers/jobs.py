"""
Background job functions for Arq worker.
"""
from typing import Dict, Any
from sqlalchemy import create_engine, text
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.config import DATABASE_URL
import structlog

logger = structlog.get_logger()


async def refresh_mvs_incremental(ctx) -> Dict[str, Any]:
    """Refresh materialized views incrementally."""
    logger.info("refreshing_mvs")
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Refresh all MVs concurrently
            conn.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_phase_durations_by_model"))
            conn.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_order_leadtime_by_model"))
            conn.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_quality_by_phase"))
            conn.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_wip_by_phase_current"))
            conn.commit()
        
        logger.info("mvs_refreshed")
        return {"status": "ok", "message": "Materialized views refreshed"}
    except Exception as e:
        logger.error("mv_refresh_error", error=str(e))
        raise


async def compute_kpi_snapshots_incremental(ctx) -> Dict[str, Any]:
    """Compute KPI snapshots incrementally using aggregates."""
    logger.info("computing_kpi_snapshots_incremental")
    # Use aggregates for KPI computation
    from app.analytics.incremental_aggregates import IncrementalAggregates
    aggregates = IncrementalAggregates(DATABASE_URL)
    
    try:
        # Compute aggregates which are used for KPIs
        result = aggregates.compute_all_incremental()
        logger.info("kpi_snapshots_computed")
        return {"status": "ok", "message": "KPI snapshots computed via aggregates", "result": result}
    except Exception as e:
        logger.error("kpi_snapshot_error", error=str(e))
        raise


async def backfill_ofch_event_time(ctx) -> Dict[str, Any]:
    """Backfill ofch_event_time (imported from jobs_backfill)."""
    from app.workers.jobs_backfill import backfill_ofch_event_time as _backfill
    return await _backfill(ctx)


async def backfill_faseof_derived_columns(ctx) -> Dict[str, Any]:
    """Backfill derived columns in fases_ordem_fabrico (imported from jobs_backfill)."""
    from app.workers.jobs_backfill import backfill_faseof_derived_columns as _backfill
    return await _backfill(ctx)


async def compute_aggregates_incremental(ctx) -> Dict[str, Any]:
    """Compute aggregates incremental (imported from jobs_aggregates)."""
    from app.workers.jobs_aggregates import compute_aggregates_incremental as _compute
    return await _compute(ctx)


async def compute_agg_wip_current(ctx) -> Dict[str, Any]:
    """Compute WIP current aggregate (imported from jobs_aggregates)."""
    from app.workers.jobs_aggregates import compute_agg_wip_current as _compute
    return await _compute(ctx)


async def ensure_partitions_ahead(ctx) -> Dict[str, Any]:
    """Ensure partitions ahead (imported from jobs_partitions)."""
    from app.workers.jobs_partitions import ensure_partitions_ahead as _ensure
    return await _ensure(ctx)


async def partition_health_report(ctx) -> Dict[str, Any]:
    """Partition health report (imported from jobs_partitions)."""
    from app.workers.jobs_partitions import partition_health_report as _report
    return await _report(ctx)


async def ensure_partitions_ahead(ctx) -> Dict[str, Any]:
    """Ensure partitions ahead (imported from jobs_partitions)."""
    from app.workers.jobs_partitions import ensure_partitions_ahead as _ensure
    return await _ensure(ctx)


async def partition_health_report(ctx) -> Dict[str, Any]:
    """Partition health report (imported from jobs_partitions)."""
    from app.workers.jobs_partitions import partition_health_report as _report
    return await _report(ctx)


async def reconcile_orphans(ctx) -> Dict[str, Any]:
    """Reconcile orphaned foreign keys."""
    logger.info("reconciling_orphans")
    engine = create_engine(DATABASE_URL)
    
    try:
        orphan_count = 0
        
        # Find orphaned faseof_of_id
        query = text("""
            SELECT DISTINCT fof.faseof_of_id
            FROM fases_ordem_fabrico fof
            LEFT JOIN ordens_fabrico of ON fof.faseof_of_id = of.of_id
            WHERE of.of_id IS NULL
            LIMIT 1000
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query)
            orphans = [row[0] for row in result]
            
            for orphan_id in orphans:
                # Try to find matching order (maybe ID format issue)
                # This is simplified - would need more sophisticated matching
                check_query = text("""
                    SELECT of_id FROM ordens_fabrico 
                    WHERE of_id::text LIKE :pattern
                    LIMIT 1
                """)
                match_result = conn.execute(check_query, {"pattern": f"%{orphan_id[-6:]}%"})
                match = match_result.fetchone()
                
                if match:
                    # Update orphan
                    update_query = text("""
                        UPDATE fases_ordem_fabrico
                        SET faseof_of_id = :correct_id
                        WHERE faseof_of_id = :orphan_id
                    """)
                    conn.execute(update_query, {
                        "correct_id": match[0],
                        "orphan_id": orphan_id
                    })
                    orphan_count += 1
                else:
                    # Log as data quality issue
                    issue_query = text("""
                        INSERT INTO data_quality_issues (
                            issue_type, entity, entity_key, details_json
                        ) VALUES (
                            'ORPHAN_FK',
                            'fases_ordem_fabrico',
                            :orphan_id,
                            '{"faseof_of_id": "' || :orphan_id || '", "reason": "No matching order found"}'
                        )
                        ON CONFLICT DO NOTHING
                    """)
                    conn.execute(issue_query, {"orphan_id": orphan_id})
            
            conn.commit()
        
        logger.info("orphans_reconciled", count=orphan_count)
        return {"status": "ok", "message": f"Reconciled {orphan_count} orphans"}
    except Exception as e:
        logger.error("orphan_reconciliation_error", error=str(e))
        raise
