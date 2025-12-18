"""
Jobs para manutenção automática de partições.
"""
from typing import Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.config import DATABASE_URL
import structlog

logger = structlog.get_logger()


async def ensure_partitions_ahead(ctx) -> Dict[str, Any]:
    """
    Cria partições RANGE futuras para fases_ordem_fabrico.
    Horizonte mínimo: 6 meses.
    
    Args:
        ctx: Arq context
    
    Returns:
        Results summary
    """
    logger.info("ensuring_partitions_ahead")
    
    engine = create_engine(DATABASE_URL)
    
    # Get current date and 6 months ahead
    today = datetime.now().date()
    horizon = today + timedelta(days=180)  # 6 months
    
    created_partitions = []
    
    with engine.connect() as conn:
        # Get existing partitions (using pg_inherits and pg_class)
        result = conn.execute(text("""
            SELECT 
                n.nspname as schemaname,
                c.relname as tablename,
                c.relname as partition_name
            FROM pg_inherits i
            JOIN pg_class c ON i.inhrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            JOIN pg_class p ON i.inhparent = p.oid
            WHERE p.relname = 'fases_ordem_fabrico'
              AND c.relname LIKE 'fases_ordem_fabrico_%'
            ORDER BY c.relname DESC
            LIMIT 1
        """))
        
        last_partition = result.fetchone()
        last_partition_date = None
        
        if last_partition:
            # Extract date from partition name (fases_ordem_fabrico_p_YYYY_MM)
            partition_name = last_partition[2]  # partition_name
            try:
                # Extract p_YYYY_MM from full name
                if '_p_' in partition_name:
                    parts = partition_name.split('_p_')
                    if len(parts) == 2:
                        year_month = parts[1].split('_')
                        if len(year_month) >= 2:
                            last_partition_date = datetime(int(year_month[0]), int(year_month[1]), 1).date()
            except Exception as e:
                logger.warning("partition_date_extraction_failed", partition=partition_name, error=str(e))
                pass
        
        # Create partitions for each month until horizon
        # Start from next month after last partition, or today if no partitions
        if last_partition_date:
            # Start from next month after last partition
            if last_partition_date.month == 12:
                current_date = last_partition_date.replace(year=last_partition_date.year + 1, month=1, day=1)
            else:
                current_date = last_partition_date.replace(month=last_partition_date.month + 1, day=1)
        else:
            current_date = today.replace(day=1)
        
        while current_date <= horizon:
            partition_name = f"p_{current_date.year}_{current_date.month:02d}"
            start_date = current_date
            # Next month
            if current_date.month == 12:
                end_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                end_date = current_date.replace(month=current_date.month + 1)
            
            # Check if partition exists
            check_query = text("""
                SELECT EXISTS (
                    SELECT 1 FROM pg_class c
                    JOIN pg_namespace n ON c.relnamespace = n.oid
                    WHERE c.relname = :partition_name
                      AND n.nspname = 'core'
                )
            """)
            
            exists = conn.execute(check_query, {"partition_name": partition_name}).scalar()
            
            if not exists:
                # Create partition
                full_partition_name = f"core.fases_ordem_fabrico_{partition_name}"
                create_query = text(f"""
                    CREATE TABLE IF NOT EXISTS {full_partition_name}
                    PARTITION OF core.fases_ordem_fabrico
                    FOR VALUES FROM ('{start_date}') TO ('{end_date}')
                """)
                
                conn.execute(create_query)
                conn.commit()
                
                created_partitions.append(partition_name)
                logger.info("partition_created", partition=partition_name, start=start_date, end=end_date)
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
    
    logger.info("partitions_ensured", created=len(created_partitions))
    
    return {
        "status": "ok",
        "message": f"Ensured partitions ahead (horizon: {horizon})",
        "created_partitions": created_partitions,
        "horizon": str(horizon)
    }


async def partition_health_report(ctx) -> Dict[str, Any]:
    """
    Gera relatório de saúde das partições.
    
    Args:
        ctx: Arq context
    
    Returns:
        Health report
    """
    logger.info("generating_partition_health_report")
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Get partition sizes and stats
        query = text("""
            SELECT 
                n.nspname as schemaname,
                p.relname as tablename,
                c.relname as partition_name,
                pg_size_pretty(pg_total_relation_size(c.oid)) as size,
                pg_total_relation_size(c.oid) as size_bytes,
                (SELECT COUNT(*) FROM pg_indexes WHERE tablename = c.relname) as index_count,
                (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = c.relname) as row_count
            FROM pg_inherits i
            JOIN pg_class c ON i.inhrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            JOIN pg_class p ON i.inhparent = p.oid
            WHERE p.relname IN ('fases_ordem_fabrico', 'funcionarios_fase_ordem_fabrico', 'erros_ordem_fabrico')
            ORDER BY p.relname, c.relname
        """)
        
        result = conn.execute(query)
        partitions = []
        
        for row in result:
            partitions.append({
                "schema": row[0],
                "table": row[1],
                "partition": row[2],
                "size": row[3],
                "size_bytes": row[4],
                "index_count": row[5] or 0,
                "row_count": row[6] or 0
            })
        
        # Check for missing indexes
        missing_indexes = []
        for partition in partitions:
            if partition["index_count"] == 0 and partition["row_count"] > 0:
                missing_indexes.append(partition["partition"])
        
        # Estimate bloat (simplified)
        bloat_estimates = []
        for partition in partitions:
            if partition["row_count"] > 0:
                # Simplified bloat estimate (would need VACUUM stats for accurate)
                bloat_estimates.append({
                    "partition": partition["partition"],
                    "estimated_bloat_pct": 0  # Placeholder
                })
    
    report = {
        "generated_at": datetime.now().isoformat(),
        "partitions": partitions,
        "missing_indexes": missing_indexes,
        "bloat_estimates": bloat_estimates,
        "summary": {
            "total_partitions": len(partitions),
            "partitions_with_missing_indexes": len(missing_indexes),
            "total_size_bytes": sum(p["size_bytes"] for p in partitions)
        }
    }
    
    logger.info("partition_health_report_generated", partitions=len(partitions))
    
    return report
