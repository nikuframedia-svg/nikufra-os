"""Worker model (Funcionarios)."""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from backend.models.database import Base


class Worker(Base):
    """Worker/Employee (Funcionário)."""
    __tablename__ = "workers"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Worker attributes
    worker_code = Column(String, unique=True, index=True, nullable=False)  # Código do funcionário
    name = Column(String, nullable=True)  # Nome
    department = Column(String, nullable=True)  # Departamento
    position = Column(String, nullable=True)  # Cargo
    hire_date = Column(DateTime, nullable=True)  # Data de contratação
    active = Column(Boolean, default=True)  # Ativo/Inativo
    
    # Relationships
    phase_skills = relationship("WorkerPhaseSkill", back_populates="worker", cascade="all, delete-orphan")
    order_phase_assignments = relationship("OrderPhaseWorker", back_populates="worker")



