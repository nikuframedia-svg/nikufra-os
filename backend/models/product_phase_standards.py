"""Product Phase Standard model (FasesStandardModelos)."""
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from backend.models.database import Base


class ProductPhaseStandard(Base):
    """Standard phase sequence for a product (Roteiro padrão)."""
    __tablename__ = "product_phase_standards"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    phase_id = Column(Integer, ForeignKey("phases.id"), nullable=False, index=True)
    
    # Standard route attributes
    sequence_order = Column(Integer, nullable=False)  # ProdutoFase_Sequencia
    standard_duration_minutes = Column(Numeric, nullable=True)  # Duração standard para este produto
    mandatory = Column(String, nullable=True)  # Obrigatória (sim/não)
    notes = Column(String, nullable=True)  # Notas
    # Campos adicionais do Excel
    coeficiente = Column(Numeric, nullable=True)  # ProdutoFase_Coeficiente
    coeficiente_x = Column(Numeric, nullable=True)  # ProdutoFase_CoeficienteX
    
    # Relationships
    product = relationship("Product", back_populates="phase_standards")
    phase = relationship("Phase", back_populates="product_standards")


