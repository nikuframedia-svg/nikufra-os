"""Order Phase model (FasesOrdemFabrico)."""
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from backend.models.database import Base


class OrderPhase(Base):
    """Phase of an order (Fase de Ordem de Fabrico)."""
    __tablename__ = "order_phases"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    of_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)  # FaseOf_OfId
    phase_id = Column(Integer, ForeignKey("phases.id"), nullable=True)  # FK to phases catalog
    
    # Phase attributes
    fase_of_id = Column(String, unique=True, index=True, nullable=False)  # Original FaseOf_Id from Excel
    start_date = Column(DateTime, nullable=True)  # FaseOf_Inicio
    end_date = Column(DateTime, nullable=True)  # FaseOf_Fim
    planned_start = Column(DateTime, nullable=True)  # Data prevista início
    planned_end = Column(DateTime, nullable=True)  # Data prevista fim
    duration_minutes = Column(Numeric, nullable=True)  # Calculated duration
    status = Column(String, nullable=True)  # Status da fase
    machine_id = Column(String, nullable=True)  # Máquina utilizada
    center = Column(String, nullable=True)  # Centro de trabalho
    
    # Relationships
    order = relationship("Order", back_populates="phases")
    phase = relationship("Phase", back_populates="order_phases")
    workers = relationship("OrderPhaseWorker", back_populates="order_phase", cascade="all, delete-orphan")
    errors = relationship("OrderError", back_populates="order_phase", cascade="all, delete-orphan")


