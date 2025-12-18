"""
Bottleneck detection service.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
import structlog

logger = structlog.get_logger()


class BottleneckService:
    """Service for detecting bottlenecks."""
    
    def __init__(self, db_url: str):
        """
        Initialize service.
        
        Args:
            db_url: Database URL
        """
        self.engine = create_engine(db_url)
    
    def get_bottlenecks(self, top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Get top bottlenecks by WIP age p90 and queue size.
        
        Args:
            top_n: Number of bottlenecks to return
        
        Returns:
            List of bottleneck dicts
        """
        query = text("""
            WITH wip_stats AS (
                SELECT 
                    faseof_fase_id as fase_id,
                    COUNT(*) as wip_count,
                    PERCENTILE_CONT(0.9) WITHIN GROUP (
                        ORDER BY EXTRACT(EPOCH FROM (NOW() - faseof_inicio))
                    ) as p90_age_seconds,
                    AVG(EXTRACT(EPOCH FROM (NOW() - faseof_inicio))) as avg_age_seconds,
                    MAX(EXTRACT(EPOCH FROM (NOW() - faseof_inicio))) as max_age_seconds
                FROM fases_ordem_fabrico
                WHERE faseof_inicio IS NOT NULL
                  AND faseof_fim IS NULL
                GROUP BY faseof_fase_id
            ),
            queue_stats AS (
                SELECT 
                    faseof_fase_id as fase_id,
                    COUNT(*) as queue_count
                FROM fases_ordem_fabrico
                WHERE faseof_inicio IS NULL
                  AND faseof_fim IS NULL
                GROUP BY faseof_fase_id
            ),
            combined AS (
                SELECT 
                    COALESCE(w.fase_id, q.fase_id) as fase_id,
                    COALESCE(w.wip_count, 0) as wip_count,
                    COALESCE(w.p90_age_seconds, 0) as p90_age_seconds,
                    COALESCE(w.avg_age_seconds, 0) as avg_age_seconds,
                    COALESCE(w.max_age_seconds, 0) as max_age_seconds,
                    COALESCE(q.queue_count, 0) as queue_count,
                    -- Bottleneck score: weighted combination
                    (COALESCE(w.p90_age_seconds, 0) * 0.5 + 
                     COALESCE(q.queue_count, 0) * 100 * 0.3 +
                     COALESCE(w.wip_count, 0) * 10 * 0.2) as bottleneck_score
                FROM wip_stats w
                FULL OUTER JOIN queue_stats q ON w.fase_id = q.fase_id
            )
            SELECT 
                c.fase_id,
                f.fase_nome,
                c.wip_count,
                c.queue_count,
                c.p90_age_seconds,
                c.avg_age_seconds,
                c.max_age_seconds,
                c.bottleneck_score
            FROM combined c
            JOIN fases_catalogo f ON c.fase_id = f.fase_id
            WHERE c.bottleneck_score > 0
            ORDER BY c.bottleneck_score DESC
            LIMIT :top_n
        """)
        
        try:
            with self.engine.connect() as conn:
                result = conn.execute(query, {"top_n": top_n})
                rows = result.fetchall()
                
                return [
                    {
                        "fase_id": row[0],
                        "fase_nome": row[1] if row[1] else f"Fase {row[0]}",
                        "wip_count": int(row[2]) if row[2] else 0,
                        "queue_count": int(row[3]) if row[3] else 0,
                        "p90_age_seconds": float(row[4]) if row[4] else 0,
                        "avg_age_seconds": float(row[5]) if row[5] else 0,
                        "max_age_seconds": float(row[6]) if row[6] else 0,
                        "bottleneck_score": float(row[7]) if row[7] else 0
                    }
                    for row in rows
                ]
        except Exception as e:
            logger.error("bottlenecks_query_error", error=str(e))
            # Return empty list on error
            return []
    
    def get_risk_queue(self, top_n: int = 20) -> List[Dict[str, Any]]:
        """
        Get orders at risk (due date < ETA).
        
        Args:
            top_n: Number of orders to return
        
        Returns:
            List of at-risk orders
        """
        query = text("""
            WITH order_etas AS (
                SELECT 
                    of.of_id,
                    of.of_produto_id,
                    of.of_data_transporte as due_date,
                    of.of_data_criacao,
                    -- ETA: soma de medianas históricas por fase restante
                    COALESCE(
                        (SELECT SUM(COALESCE(
                            (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY faseof_duration_seconds)
                             FROM fases_ordem_fabrico fof2
                             JOIN ordens_fabrico of2 ON fof2.faseof_of_id = of2.of_id
                             WHERE of2.of_produto_id = of.of_produto_id
                               AND fof2.faseof_fase_id = fof.faseof_fase_id
                               AND fof2.faseof_fim IS NOT NULL
                               AND fof2.faseof_inicio IS NOT NULL
                               AND EXTRACT(EPOCH FROM (fof2.faseof_fim - fof2.faseof_inicio)) > 0
                             LIMIT 1),
                            -- Fallback: baseline por coeficientes
                            (SELECT COALESCE(
                                fsm.coeficiente * COALESCE(fof.faseof_peso, m.produto_peso_desmolde, 0) + fsm.coeficiente_x,
                                3600  -- Default 1 hour
                            )
                             FROM fases_standard_modelos fsm
                             JOIN modelos m ON fsm.produto_id = of.of_produto_id
                             WHERE fsm.fase_id = fof.faseof_fase_id
                             LIMIT 1)
                        ))
                         FROM fases_ordem_fabrico fof
                         WHERE fof.faseof_of_id = of.of_id
                           AND fof.faseof_inicio IS NOT NULL
                           AND fof.faseof_fim IS NULL
                        ),
                        0
                    ) as remaining_seconds,
                    NOW() + COALESCE(
                        (SELECT SUM(COALESCE(
                            (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY faseof_duration_seconds)
                             FROM fases_ordem_fabrico fof2
                             JOIN ordens_fabrico of2 ON fof2.faseof_of_id = of2.of_id
                             WHERE of2.of_produto_id = of.of_produto_id
                               AND fof2.faseof_fase_id = fof.faseof_fase_id
                               AND fof2.faseof_fim IS NOT NULL
                               AND fof2.faseof_inicio IS NOT NULL
                               AND EXTRACT(EPOCH FROM (fof2.faseof_fim - fof2.faseof_inicio)) > 0
                             LIMIT 1),
                            (SELECT COALESCE(
                                fsm.coeficiente * COALESCE(fof.faseof_peso, m.produto_peso_desmolde, 0) + fsm.coeficiente_x,
                                3600
                            )
                             FROM fases_standard_modelos fsm
                             JOIN modelos m ON fsm.produto_id = of.of_produto_id
                             WHERE fsm.fase_id = fof.faseof_fase_id
                             LIMIT 1)
                        ))
                         FROM fases_ordem_fabrico fof
                         WHERE fof.faseof_of_id = of.of_id
                           AND fof.faseof_inicio IS NOT NULL
                           AND fof.faseof_fim IS NULL
                        ) || ' seconds'::interval,
                        '0 seconds'::interval
                    ) as eta
                FROM ordens_fabrico of
                WHERE of.of_data_transporte IS NOT NULL
                  AND EXISTS (
                      SELECT 1 FROM fases_ordem_fabrico fof
                      WHERE fof.faseof_of_id = of.of_id
                        AND fof.faseof_inicio IS NOT NULL
                        AND fof.faseof_fim IS NULL
                  )
            )
            SELECT 
                o.of_id,
                o.of_produto_id,
                m.produto_nome,
                o.due_date,
                o.eta,
                EXTRACT(EPOCH FROM (o.eta - o.due_date)) as delay_seconds,
                o.remaining_seconds
            FROM order_etas o
            JOIN modelos m ON o.of_produto_id = m.produto_id
            WHERE o.eta > o.due_date
            ORDER BY (o.eta - o.due_date) DESC
            LIMIT :top_n
        """)
        
        try:
            with self.engine.connect() as conn:
                result = conn.execute(query, {"top_n": top_n})
                rows = result.fetchall()
                
                return [
                    {
                        "of_id": row[0],
                        "produto_id": row[1],
                        "produto_nome": row[2] if row[2] else f"Produto {row[1]}",
                        "due_date": row[3].isoformat() if row[3] else None,
                        "eta": row[4].isoformat() if row[4] else None,
                        "delay_seconds": float(row[5]) if row[5] else 0,
                        "remaining_seconds": float(row[6]) if row[6] else 0
                    }
                    for row in rows
                ]
        except Exception as e:
            logger.error("risk_queue_query_error", error=str(e))
            # Return empty list on error
            return []
