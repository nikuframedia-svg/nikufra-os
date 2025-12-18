"""Phase-level feature engineering."""
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd

from backend.models import OrderPhase, Phase, ProductPhaseStandard


def compute_phase_durations(session: Session, phase_id: Optional[int] = None) -> pd.DataFrame:
    """
    Compute phase durations (real vs standard).
    
    Duration real = FaseOf_Fim - FaseOf_Inicio
    
    Args:
        session: Database session.
        phase_id: Optional filter by phase.
    
    Returns:
        DataFrame with phase info, real duration, standard duration, correction factor.
    """
    query = session.query(
        OrderPhase.id,
        OrderPhase.fase_of_id,
        OrderPhase.start_date,
        OrderPhase.end_date,
        OrderPhase.duration_minutes,
        OrderPhase.phase_id,
        Phase.phase_code,
        Phase.name.label("phase_name"),
        Phase.standard_duration_minutes.label("phase_standard_duration"),
        OrderPhase.order_id,
    ).join(Phase, OrderPhase.phase_id == Phase.id, isouter=True)
    
    if phase_id:
        query = query.filter(OrderPhase.phase_id == phase_id)
    
    # Only phases with both dates
    query = query.filter(
        OrderPhase.start_date.isnot(None),
        OrderPhase.end_date.isnot(None)
    )
    
    results = query.all()
    
    data = []
    for row in results:
        # Calculate real duration
        if row.start_date and row.end_date:
            delta = row.end_date - row.start_date
            real_duration_minutes = delta.total_seconds() / 60.0
        elif row.duration_minutes:
            real_duration_minutes = float(row.duration_minutes)
        else:
            continue
        
        standard_duration = float(row.phase_standard_duration) if row.phase_standard_duration else None
        
        # Correction factor: real / standard
        correction_factor = None
        if standard_duration and standard_duration > 0:
            correction_factor = real_duration_minutes / standard_duration
        
        data.append({
            "order_phase_id": row.id,
            "fase_of_id": row.fase_of_id,
            "order_id": row.order_id,
            "phase_id": row.phase_id,
            "phase_code": row.phase_code,
            "phase_name": row.phase_name,
            "start_date": row.start_date,
            "end_date": row.end_date,
            "real_duration_minutes": real_duration_minutes,
            "real_duration_hours": real_duration_minutes / 60.0,
            "standard_duration_minutes": standard_duration,
            "correction_factor": correction_factor,
            "variance_minutes": real_duration_minutes - standard_duration if standard_duration else None,
        })
    
    return pd.DataFrame(data)


def compute_phase_statistics(session: Session) -> Dict:
    """
    Compute aggregate statistics for phases.
    
    Returns:
        Dictionary with statistics.
    """
    # Average duration by phase
    avg_durations = session.query(
        Phase.phase_code,
        Phase.name,
        func.avg(
            func.extract("epoch", OrderPhase.end_date - OrderPhase.start_date) / 60
        ).label("avg_duration_minutes"),
        func.count(OrderPhase.id).label("count"),
    ).join(
        OrderPhase, Phase.id == OrderPhase.phase_id
    ).filter(
        OrderPhase.start_date.isnot(None),
        OrderPhase.end_date.isnot(None)
    ).group_by(
        Phase.id, Phase.phase_code, Phase.name
    ).all()
    
    return {
        "average_durations_by_phase": [
            {
                "phase_code": row.phase_code,
                "name": row.name,
                "avg_duration_minutes": float(row.avg_duration_minutes) if row.avg_duration_minutes else None,
                "count": row.count,
            }
            for row in avg_durations
        ],
    }



