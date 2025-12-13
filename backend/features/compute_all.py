"""Compute and store all features."""
from datetime import datetime
from sqlalchemy.orm import Session

from backend.features.order_features import compute_order_lead_times, compute_order_statistics
from backend.features.phase_features import compute_phase_durations, compute_phase_statistics
from backend.features.worker_features import compute_worker_productivity, compute_worker_statistics
from backend.features.bottleneck_features import compute_bottlenecks, compute_bottleneck_statistics
from backend.features.feature_tables import (
    OrderFeature,
    PhaseFeature,
    WorkerFeature,
    BottleneckStat,
)
from backend.models import Order, OrderPhase, Worker, Phase, OrderError


def compute_and_store_all_features(session: Session, recompute: bool = False):
    """
    Compute all features and store in feature tables.
    
    Args:
        session: Database session.
        recompute: If True, recompute existing features.
    """
    computed_at = datetime.now()
    
    # 1. Order features
    print("Computing order features...")
    order_lead_times = compute_order_lead_times(session)
    
    for _, row in order_lead_times.iterrows():
        if recompute:
            # Delete existing
            session.query(OrderFeature).filter(
                OrderFeature.order_id == row["order_id"]
            ).delete()
        
        # Get phase and error counts
        phase_count = session.query(OrderPhase).filter(
            OrderPhase.of_id == row["order_id"]  # of_id is FK to orders.id
        ).count()
        
        error_count = session.query(OrderError).filter(
            OrderError.order_id == row["order_id"]
        ).count()
        
        feature = OrderFeature(
            order_id=row["order_id"],
            lead_time_days=row["lead_time_days"],
            lead_time_hours=row["lead_time_hours"],
            phase_count=phase_count,
            error_count=error_count,
            computed_at=computed_at,
        )
        session.add(feature)
    
    # 2. Phase features
    print("Computing phase features...")
    phase_durations = compute_phase_durations(session)
    
    for _, row in phase_durations.iterrows():
        if recompute:
            session.query(PhaseFeature).filter(
                PhaseFeature.order_phase_id == row["order_phase_id"]
            ).delete()
        
        feature = PhaseFeature(
            order_phase_id=row["order_phase_id"],
            real_duration_minutes=row["real_duration_minutes"],
            standard_duration_minutes=row["standard_duration_minutes"],
            correction_factor=row["correction_factor"],
            variance_minutes=row["variance_minutes"],
            computed_at=computed_at,
        )
        session.add(feature)
    
    # 3. Worker features
    print("Computing worker features...")
    worker_productivity = compute_worker_productivity(session)
    
    for _, row in worker_productivity.iterrows():
        if recompute:
            session.query(WorkerFeature).filter(
                WorkerFeature.worker_id == row["worker_id"]
            ).delete()
        
        feature = WorkerFeature(
            worker_id=row["worker_id"],
            total_phases_executed=row["total_phases_executed"],
            total_hours_worked=row["total_hours_worked"],
            avg_hours_per_phase=row["avg_hours_per_phase"],
            error_count=row["error_count"],
            error_rate=row["error_rate"],
            computed_at=computed_at,
        )
        session.add(feature)
    
    # 4. Bottleneck stats
    print("Computing bottleneck stats...")
    bottlenecks = compute_bottlenecks(session, top_n=20)
    
    if recompute:
        session.query(BottleneckStat).delete()
    
    for _, row in bottlenecks.iterrows():
        feature = BottleneckStat(
            phase_id=row["phase_id"],
            total_minutes=row["total_minutes"],
            avg_minutes=row["avg_minutes"],
            phase_count=row["phase_count"],
            avg_queue_minutes=row["avg_queue_minutes"],
            error_count=row["error_count"],
            bottleneck_score=row["bottleneck_score"],
            computed_at=computed_at,
        )
        session.add(feature)
    
    session.commit()
    print("All features computed and stored.")


if __name__ == "__main__":
    from backend.models.database import get_session
    
    session = get_session()
    compute_and_store_all_features(session, recompute=True)

