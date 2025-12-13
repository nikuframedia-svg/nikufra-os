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
    error_type = Column(String, nullable=True)  # Tipo de erro
    error_description = Column(Text, nullable=True)  # Descrição do erro
    severity = Column(String, nullable=True)  # Severidade (alta, média, baixa)
    resolved = Column(String, nullable=True)  # Resolvido (sim/não)
    resolution_date = Column(DateTime, nullable=True)  # Data de resolução
    
    # Relationships
    order = relationship("Order", back_populates="errors")
    order_phase = relationship("OrderPhase", back_populates="errors")


