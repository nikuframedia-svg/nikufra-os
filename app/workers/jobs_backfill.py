"""
Backfill jobs for derived columns.
"""
from typing import Dict, Any
from sqlalchemy import create_engine, text
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.config import DATABASE_URL
import structlog

logger = structlog.get_logger()


async def backfill_ofch_event_time(ctx) -> Dict[str, Any]:
    """
    Backfill ofch_event_time in erros_ordem_fabrico.
    
    Uses: COALESCE(faseof_fim da faseof_avaliacao, faseof_inicio da faseof_avaliacao, of_data_criacao)
    """
    logger.info("backfilling_ofch_event_time")
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Backfill ofch_event_time
            # Strategy: join com fases_ordem_fabrico e ordens_fabrico
            update_query = text("""
                UPDATE erros_ordem_fabrico e
                SET ofch_event_time = COALESCE(
                    (SELECT faseof_fim 
                     FROM fases_ordem_fabrico fof 
                     WHERE fof.faseof_id = e.ofch_faseof_avaliacao),
                    (SELECT faseof_inicio 
                     FROM fases_ordem_fabrico fof 
                     WHERE fof.faseof_id = e.ofch_faseof_avaliacao),
                    (SELECT of_data_criacao 
                     FROM ordens_fabrico of 
                     WHERE of.of_id = e.ofch_of_id)
                )
                WHERE ofch_event_time IS NULL
                  AND (ofch_faseof_avaliacao IS NOT NULL OR ofch_of_id IS NOT NULL);
            """)
            
            result = conn.execute(update_query)
            updated_count = result.rowcount
            conn.commit()
        
        logger.info("ofch_event_time_backfilled", updated_count=updated_count)
        return {
            "status": "ok",
            "message": f"Backfilled {updated_count} rows",
            "updated_count": updated_count
        }
    except Exception as e:
        logger.error("backfill_error", error=str(e))
        raise


async def backfill_faseof_derived_columns(ctx) -> Dict[str, Any]:
    """Backfill derived columns in fases_ordem_fabrico."""
    logger.info("backfilling_faseof_derived_columns")
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            update_query = text("""
                UPDATE fases_ordem_fabrico
                SET 
                    faseof_event_time = COALESCE(faseof_fim, faseof_inicio, faseof_data_prevista),
                    faseof_duration_seconds = CASE 
                        WHEN faseof_fim IS NOT NULL AND faseof_inicio IS NOT NULL 
                        THEN EXTRACT(EPOCH FROM (faseof_fim - faseof_inicio))
                        ELSE NULL
                    END,
                    faseof_is_open = (faseof_inicio IS NOT NULL AND faseof_fim IS NULL),
                    faseof_is_done = (faseof_fim IS NOT NULL)
                WHERE faseof_event_time IS NULL
                   OR faseof_duration_seconds IS NULL
                   OR faseof_is_open IS NULL
                   OR faseof_is_done IS NULL;
            """)
            
            result = conn.execute(update_query)
            updated_count = result.rowcount
            conn.commit()
        
        logger.info("faseof_derived_backfilled", updated_count=updated_count)
        return {
            "status": "ok",
            "message": f"Backfilled {updated_count} rows",
            "updated_count": updated_count
        }
    except Exception as e:
        logger.error("backfill_error", error=str(e))
        raise

