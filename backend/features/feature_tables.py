"""Feature tables for storing computed features."""
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.models.database import Base


class OrderFeature(Base):
    """Stored order-level features."""
    __tablename__ = "order_features"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    
    # Features
    lead_time_days = Column(Numeric, nullable=True)
    lead_time_hours = Column(Numeric, nullable=True)
    phase_count = Column(Integer, nullable=True)
    error_count = Column(Integer, nullable=True)
    total_duration_minutes = Column(Numeric, nullable=True)
    
    # Metadata
    computed_at = Column(DateTime, nullable=False)
    
    __table_args__ = (Index("idx_order_features_order_id", "order_id"),)


class PhaseFeature(Base):
    """Stored phase-level features."""
    __tablename__ = "phase_features"

    id = Column(Integer, primary_key=True, index=True)
    order_phase_id = Column(Integer, ForeignKey("order_phases.id"), nullable=False, index=True)
    
    # Features
    real_duration_minutes = Column(Numeric, nullable=True)
    standard_duration_minutes = Column(Numeric, nullable=True)
    correction_factor = Column(Numeric, nullable=True)
    variance_minutes = Column(Numeric, nullable=True)
    queue_time_minutes = Column(Numeric, nullable=True)
    
    # Metadata
    computed_at = Column(DateTime, nullable=False)
    
    __table_args__ = (Index("idx_phase_features_order_phase_id", "order_phase_id"),)


class WorkerFeature(Base):
    """Stored worker-level features."""
    __tablename__ = "worker_features"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False, index=True)
    
    # Features
    total_phases_executed = Column(Integer, nullable=True)
    total_hours_worked = Column(Numeric, nullable=True)
    avg_hours_per_phase = Column(Numeric, nullable=True)
    error_count = Column(Integer, nullable=True)
    error_rate = Column(Numeric, nullable=True)
    
    # Metadata
    computed_at = Column(DateTime, nullable=False)
    period_start = Column(DateTime, nullable=True)  # Period this feature covers
    period_end = Column(DateTime, nullable=True)
    
    __table_args__ = (Index("idx_worker_features_worker_id", "worker_id"),)


class BottleneckStat(Base):
    """Stored bottleneck statistics."""
    __tablename__ = "bottleneck_stats"

    id = Column(Integer, primary_key=True, index=True)
    phase_id = Column(Integer, ForeignKey("phases.id"), nullable=False, index=True)
    
    # Statistics
    total_minutes = Column(Numeric, nullable=True)
    avg_minutes = Column(Numeric, nullable=True)
    phase_count = Column(Integer, nullable=True)
    avg_queue_minutes = Column(Numeric, nullable=True)
    error_count = Column(Integer, nullable=True)
    bottleneck_score = Column(Numeric, nullable=True)
    
    # Metadata
    computed_at = Column(DateTime, nullable=False)
    
    __table_args__ = (Index("idx_bottleneck_stats_phase_id", "phase_id"),)


