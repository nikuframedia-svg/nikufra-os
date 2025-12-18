"""Order Phase Worker model (FuncionariosFaseOrdemFabrico)."""
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from backend.models.database import Base


class OrderPhaseWorker(Base):
    """Worker assignment to an order phase."""
    __tablename__ = "order_phase_workers"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    order_phase_id = Column(Integer, ForeignKey("order_phases.id"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False, index=True)
    
    # Assignment attributes
    start_time = Column(DateTime, nullable=True)  # Início da afetação
    end_time = Column(DateTime, nullable=True)  # Fim da afetação
    hours_worked = Column(Numeric, nullable=True)  # Horas trabalhadas
    role = Column(String, nullable=True)  # FuncionarioFaseOf_Chefe (chefe ou trabalhador)
    is_chefe = Column(String, nullable=True)  # FuncionarioFaseOf_Chefe (0/1 ou sim/não)
    
    # Relationships
    order_phase = relationship("OrderPhase", back_populates="workers")
    worker = relationship("Worker", back_populates="order_phase_assignments")


