"""
Jobs para computar aggregates incrementais.
"""
from typing import Dict, Any
from datetime import date, datetime, timedelta
from sqlalchemy import create_engine, text
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.analytics.incremental_aggregates import IncrementalAggregates
from backend.config import DATABASE_URL
import structlog

logger = structlog.get_logger()


async def compute_aggregates_incremental(ctx) -> Dict[str, Any]:
    """
    Compute all aggregates incrementally since last watermark.
    
    Args:
        ctx: Arq context
    
    Returns:
        Results summary
    """
    logger.info("computing_aggregates_incremental")
    
    aggregates = IncrementalAggregates(DATABASE_URL)
    
    # Get date range to process
    # Default: last 7 days or since last watermark
    today = date.today()
    
    results = {}
    total_rows = 0
    
    # Process last 7 days (or since watermark if more recent)
    for i in range(7):
        snapshot_date = today - timedelta(days=i)
        
        result = aggregates.compute_all_incremental(snapshot_date)
        total_rows += sum(result.values())
        
        results[f"date_{snapshot_date}"] = result
    
    logger.info("aggregates_computed", total_rows=total_rows)
    
    return {
        "status": "ok",
        "message": f"Computed aggregates for last 7 days",
        "total_rows": total_rows,
        "results": results
    }


async def compute_agg_wip_current(ctx) -> Dict[str, Any]:
    """
    Compute current WIP aggregate (fast, incremental).
    
    Args:
        ctx: Arq context
    
    Returns:
        Results summary
    """
    logger.info("computing_agg_wip_current")
    
    aggregates = IncrementalAggregates(DATABASE_URL)
    rowcount = aggregates.compute_agg_wip_current()
    
    logger.info("agg_wip_current_computed", rows=rowcount)
    
    return {
        "status": "ok",
        "message": f"Computed WIP current aggregate",
        "rows": rowcount
    }

