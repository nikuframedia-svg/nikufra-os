"""
Batch upsert operations using COPY or execute_values for performance.
Handles upserts with ON CONFLICT for idempotency.
"""
from contextlib import closing
from typing import List, Dict, Any, Optional
from sqlalchemy import text, create_engine
from sqlalchemy.engine import Engine
import psycopg2
from psycopg2.extras import execute_values
import structlog

logger = structlog.get_logger()

# Batch size for processing
BATCH_SIZE = 5000


def batch_upsert(
    engine: Engine,
    table_name: str,
    rows: List[Dict[str, Any]],
    primary_keys: List[str],
    ingestion_run_id: Optional[int] = None
) -> int:
    """
    Upsert rows in batches using execute_values.
    
    Args:
        engine: SQLAlchemy engine
        table_name: Target table name
        rows: List of row dicts
        primary_keys: List of primary key column names
        ingestion_run_id: Optional ingestion run ID for tracking
    
    Returns:
        Number of rows inserted/updated
    """
    if not rows:
        return 0
    
    # Get column names from first row
    columns = list(rows[0].keys())
    
    # Build ON CONFLICT clause
    conflict_target = ', '.join(primary_keys)
    
    # Build UPDATE clause (update all columns except PKs)
    update_cols = [col for col in columns if col not in primary_keys]
    update_set = ', '.join(f"{col} = EXCLUDED.{col}" for col in update_cols)
    
    # Build INSERT statement with ON CONFLICT
    placeholders = ', '.join(['%s'] * len(columns))
    insert_sql = f"""
        INSERT INTO {table_name} ({', '.join(columns)})
        VALUES {placeholders}
        ON CONFLICT ({conflict_target}) 
        DO UPDATE SET {update_set}
    """
    
    # Prepare data tuples
    data_tuples = [tuple(row.get(col) for col in columns) for row in rows]
    
    # Execute in batches with explicit transaction handling
    total_affected = 0
    with closing(engine.raw_connection()) as conn:
        cur = conn.cursor()
        try:
            for i in range(0, len(data_tuples), BATCH_SIZE):
                batch = data_tuples[i:i + BATCH_SIZE]
                execute_values(
                    cur,
                    insert_sql,
                    batch,
                    template=None,
                    page_size=BATCH_SIZE
                )
                total_affected += len(batch)
                logger.debug(
                    "batch_upsert_progress",
                    table=table_name,
                    batch_start=i,
                    batch_size=len(batch),
                    total_rows=len(data_tuples)
                )
            conn.commit()
        except Exception:
            conn.rollback()
            logger.error(
                "batch_upsert_error",
                table=table_name,
                batch_start=i if 'i' in locals() else 0,
                exc_info=True
            )
            raise
        finally:
            cur.close()
    
    return total_affected


def batch_insert_rejects(
    engine: Engine,
    table_name: str,
    rejects: List[Dict[str, Any]],
    ingestion_run_id: int
) -> int:
    """
    Insert rejected rows into rejects table.
    
    Args:
        engine: SQLAlchemy engine
        table_name: Source table name
        rejects: List of reject dicts with keys: row_number, reason_code, reason_detail, raw_json
        ingestion_run_id: Ingestion run ID
    
    Returns:
        Number of rejects inserted
    """
    if not rejects:
        return 0
    
    reject_table = f"{table_name}_rejects"
    
    columns = ['ingestion_run_id', 'sheet_name', 'row_number', 'reason_code', 'reason_detail', 'raw_json']
    
    insert_sql = f"""
        INSERT INTO {reject_table} ({', '.join(columns)})
        VALUES %s
    """
    
    data_tuples = [
        (
            ingestion_run_id,
            reject['sheet_name'],
            reject['row_number'],
            reject['reason_code'],
            reject['reason_detail'],
            reject.get('raw_json')
        )
        for reject in rejects
    ]
    
    with closing(engine.raw_connection()) as conn:
        cur = conn.cursor()
        try:
            execute_values(
                cur,
                insert_sql,
                data_tuples,
                page_size=BATCH_SIZE
            )
            conn.commit()
            return len(data_tuples)
        except Exception:
            conn.rollback()
            logger.error("batch_insert_rejects_error", table=reject_table, exc_info=True)
            raise
        finally:
            cur.close()


def get_table_row_count(engine: Engine, table_name: str) -> int:
    """
    Get row count for a table.
    
    Args:
        engine: SQLAlchemy engine
        table_name: Table name
    
    Returns:
        Row count
    """
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        return result.scalar() or 0

