"""Phase model (Fases)."""
from sqlalchemy import Column, Integer, String, Numeric, Text
from sqlalchemy.orm import relationship
from backend.models.database import Base


class Phase(Base):
    """Phase catalog (Catálogo de Fases)."""
    __tablename__ = "phases"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Phase attributes
    phase_code = Column(String, unique=True, index=True, nullable=False)  # Código da fase
    name = Column(String, nullable=False)  # Nome da fase
    description = Column(Text, nullable=True)  # Descrição
    standard_duration_minutes = Column(Numeric, nullable=True)  # Duração standard (minutos)
    machine_type = Column(String, nullable=True)  # Tipo de máquina requerida
    center = Column(String, nullable=True)  # Centro de trabalho
    sequence_order = Column(Integer, nullable=True)  # Ordem na sequência padrão
    
    # Relationships
    order_phases = relationship("OrderPhase", back_populates="phase")
    worker_skills = relationship("WorkerPhaseSkill", back_populates="phase")
    product_standards = relationship("ProductPhaseStandard", back_populates="phase")



