"""Bottleneck identification feature engineering."""
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd

from backend.models import OrderPhase, Phase, OrderError


def compute_bottlenecks(session: Session, top_n: int = 10) -> pd.DataFrame:
    """
    Identify bottlenecks (phases/centers with highest time consumption, queues, errors).
    
    Bottleneck indicators:
    - Highest total time spent
    - Highest queue time (delay between planned and actual start)
    - Highest error count
    
    Args:
        session: Database session.
        top_n: Number of top bottlenecks to return.
    
    Returns:
        DataFrame with bottleneck analysis.
    """
    # Total time spent by phase
    time_by_phase = session.query(
        Phase.id,
        Phase.phase_code,
        Phase.name,
        Phase.center,
        func.sum(
            func.extract("epoch", OrderPhase.end_date - OrderPhase.start_date) / 60
        ).label("total_minutes"),
        func.avg(
            func.extract("epoch", OrderPhase.end_date - OrderPhase.start_date) / 60
        ).label("avg_minutes"),
        func.count(OrderPhase.id).label("phase_count"),
    ).join(
        OrderPhase, Phase.id == OrderPhase.phase_id
    ).filter(
        OrderPhase.start_date.isnot(None),
        OrderPhase.end_date.isnot(None)
    ).group_by(
        Phase.id, Phase.phase_code, Phase.name, Phase.center
    ).all()
    
    # Queue time (delay between planned and actual start)
    queue_times = session.query(
        Phase.id,
        Phase.phase_code,
        func.avg(
            func.extract("epoch", OrderPhase.start_date - OrderPhase.planned_start) / 60
        ).label("avg_queue_minutes"),
        func.count(OrderPhase.id).label("count_with_queue"),
    ).join(
        OrderPhase, Phase.id == OrderPhase.phase_id
    ).filter(
        OrderPhase.planned_start.isnot(None),
        OrderPhase.start_date.isnot(None),
        OrderPhase.start_date > OrderPhase.planned_start  # Only delays
    ).group_by(
        Phase.id, Phase.phase_code
    ).all()
    
    # Error count by phase
    error_counts = session.query(
        Phase.id,
        Phase.phase_code,
        func.count(OrderError.id).label("error_count"),
    ).join(
        OrderPhase, Phase.id == OrderPhase.phase_id
    ).join(
        OrderError, OrderPhase.id == OrderError.order_phase_id, isouter=True
    ).group_by(
        Phase.id, Phase.phase_code
    ).all()
    
    # Combine data
    phase_dict = {}
    
    for row in time_by_phase:
        phase_dict[row.id] = {
            "phase_id": row.id,
            "phase_code": row.phase_code,
            "phase_name": row.name,
            "center": row.center,
            "total_minutes": float(row.total_minutes) if row.total_minutes else 0,
            "avg_minutes": float(row.avg_minutes) if row.avg_minutes else 0,
            "phase_count": row.phase_count,
            "avg_queue_minutes": 0,
            "error_count": 0,
        }
    
    for row in queue_times:
        if row.id in phase_dict:
            phase_dict[row.id]["avg_queue_minutes"] = float(row.avg_queue_minutes) if row.avg_queue_minutes else 0
    
    for row in error_counts:
        if row.id in phase_dict:
            phase_dict[row.id]["error_count"] = row.error_count
    
    # Convert to DataFrame and calculate bottleneck score
    data = list(phase_dict.values())
    df = pd.DataFrame(data)
    
    if len(df) > 0:
        # Normalize metrics for scoring (0-1 scale)
        if df["total_minutes"].max() > 0:
            df["time_score"] = df["total_minutes"] / df["total_minutes"].max()
        else:
            df["time_score"] = 0
        
        if df["avg_queue_minutes"].max() > 0:
            df["queue_score"] = df["avg_queue_minutes"] / df["avg_queue_minutes"].max()
        else:
            df["queue_score"] = 0
        
        if df["error_count"].max() > 0:
            df["error_score"] = df["error_count"] / df["error_count"].max()
        else:
            df["error_score"] = 0
        
        # Combined bottleneck score (weighted)
        df["bottleneck_score"] = (
            0.4 * df["time_score"] +
            0.3 * df["queue_score"] +
            0.3 * df["error_score"]
        )
        
        # Sort by bottleneck score
        df = df.sort_values("bottleneck_score", ascending=False).head(top_n)
    
    return df


def compute_bottleneck_statistics(session: Session) -> Dict:
    """
    Compute aggregate bottleneck statistics.
    
    Returns:
        Dictionary with statistics.
    """
    bottlenecks = compute_bottlenecks(session, top_n=5)
    
    return {
        "top_bottlenecks": bottlenecks.to_dict("records") if len(bottlenecks) > 0 else [],
    }


