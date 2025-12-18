"""Worker-level feature engineering."""
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd

from backend.models import Worker, OrderPhaseWorker, OrderPhase, OrderError


def compute_worker_productivity(session: Session, worker_id: Optional[int] = None) -> pd.DataFrame:
    """
    Compute worker productivity metrics.
    
    Metrics:
    - Number of phases executed
    - Average time per phase type
    - Error rate (via OrdemFabricoErros)
    
    Args:
        session: Database session.
        worker_id: Optional filter by worker.
    
    Returns:
        DataFrame with worker productivity metrics.
    """
    query = session.query(
        Worker.id,
        Worker.worker_code,
        Worker.name,
        func.count(OrderPhaseWorker.id).label("total_phases"),
        func.sum(
            func.extract("epoch", OrderPhaseWorker.end_time - OrderPhaseWorker.start_time) / 3600
        ).label("total_hours"),
        func.avg(
            func.extract("epoch", OrderPhaseWorker.end_time - OrderPhaseWorker.start_time) / 3600
        ).label("avg_hours_per_phase"),
    ).join(
        OrderPhaseWorker, Worker.id == OrderPhaseWorker.worker_id
    ).filter(
        OrderPhaseWorker.start_time.isnot(None),
        OrderPhaseWorker.end_time.isnot(None)
    ).group_by(
        Worker.id, Worker.worker_code, Worker.name
    )
    
    if worker_id:
        query = query.filter(Worker.id == worker_id)
    
    results = query.all()
    
    data = []
    for row in results:
        # Count errors associated with this worker's phases
        error_count = session.query(func.count(OrderError.id)).join(
            OrderPhase, OrderError.order_phase_id == OrderPhase.id
        ).join(
            OrderPhaseWorker, OrderPhase.id == OrderPhaseWorker.order_phase_id
        ).filter(
            OrderPhaseWorker.worker_id == row.id
        ).scalar()
        
        error_rate = error_count / row.total_phases if row.total_phases > 0 else 0
        
        data.append({
            "worker_id": row.id,
            "worker_code": row.worker_code,
            "worker_name": row.name,
            "total_phases_executed": row.total_phases,
            "total_hours_worked": float(row.total_hours) if row.total_hours else 0,
            "avg_hours_per_phase": float(row.avg_hours_per_phase) if row.avg_hours_per_phase else 0,
            "error_count": error_count,
            "error_rate": error_rate,
        })
    
    return pd.DataFrame(data)


def compute_worker_statistics(session: Session) -> Dict:
    """
    Compute aggregate statistics for workers.
    
    Returns:
        Dictionary with statistics.
    """
    total_workers = session.query(func.count(Worker.id)).scalar()
    
    active_workers = session.query(func.count(Worker.id)).filter(
        Worker.active == True
    ).scalar()
    
    # Top workers by productivity
    top_workers = session.query(
        Worker.worker_code,
        Worker.name,
        func.count(OrderPhaseWorker.id).label("phase_count")
    ).join(
        OrderPhaseWorker, Worker.id == OrderPhaseWorker.worker_id
    ).group_by(
        Worker.id, Worker.worker_code, Worker.name
    ).order_by(
        func.count(OrderPhaseWorker.id).desc()
    ).limit(10).all()
    
    return {
        "total_workers": total_workers,
        "active_workers": active_workers,
        "top_workers_by_phases": [
            {"worker_code": row.worker_code, "name": row.name, "phase_count": row.phase_count}
            for row in top_workers
        ],
    }



