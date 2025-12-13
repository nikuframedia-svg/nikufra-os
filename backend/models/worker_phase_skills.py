"""Worker Phase Skill model (FuncionariosFasesAptos)."""
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.models.database import Base


class WorkerPhaseSkill(Base):
    """Worker's skill/aptitude for a phase (Matriz de competências)."""
    __tablename__ = "worker_phase_skills"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False, index=True)
    phase_id = Column(Integer, ForeignKey("phases.id"), nullable=False, index=True)
    
    # Skill attributes
    certified = Column(Boolean, default=False)  # Certificado para esta fase
    certification_date = Column(DateTime, nullable=True)  # Data de certificação
    skill_level = Column(String, nullable=True)  # Nível (iniciante, intermédio, avançado, especialista)
    notes = Column(String, nullable=True)  # Notas adicionais
    
    # Relationships
    worker = relationship("Worker", back_populates="phase_skills")
    phase = relationship("Phase", back_populates="worker_skills")


