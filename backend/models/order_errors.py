"""Order Error model (OrdemFabricoErros)."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.models.database import Base


class OrderError(Base):
    """Error record for an order or order phase."""
    __tablename__ = "order_errors"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    order_phase_id = Column(Integer, ForeignKey("order_phases.id"), nullable=True, index=True)
    
    # Error attributes
    error_date = Column(DateTime, nullable=True)  # Data do erro
    error_type = Column(String, nullable=True)  # Erro_FaseAvaliacao
    error_description = Column(Text, nullable=True)  # Erro_Descricao
    severity = Column(String, nullable=True)  # OFCH_GRAVIDADE
    resolved = Column(String, nullable=True)  # Resolvido (sim/não)
    resolution_date = Column(DateTime, nullable=True)  # Data de resolução
    # Campos adicionais do Excel
    fase_avaliacao = Column(String, nullable=True)  # Erro_FaseAvaliacao (código da fase)
    fase_of_avaliacao_id = Column(String, nullable=True)  # Erro_FaseOfAvaliacao (FaseOf_Id)
    fase_of_culpada_id = Column(String, nullable=True)  # Erro_FaseOfCulpada (FaseOf_Id)
    
    # Relationships
    order = relationship("Order", back_populates="errors")
    order_phase = relationship("OrderPhase", back_populates="errors")


