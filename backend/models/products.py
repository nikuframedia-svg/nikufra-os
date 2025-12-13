"""Product model (Modelos)."""
from sqlalchemy import Column, Integer, String, Numeric, Text
from sqlalchemy.orm import relationship
from backend.models.database import Base


class Product(Base):
    """Product/Model catalog (Catálogo de Modelos)."""
    __tablename__ = "products"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Product attributes
    product_code = Column(String, unique=True, index=True, nullable=False)  # Código do modelo
    name = Column(String, nullable=False)  # Nome do produto
    description = Column(Text, nullable=True)  # Descrição
    weight = Column(Numeric, nullable=True)  # Peso
    dimensions = Column(String, nullable=True)  # Dimensões
    category = Column(String, nullable=True)  # Categoria
    
    # Relationships
    orders = relationship("Order", back_populates="product")
    phase_standards = relationship("ProductPhaseStandard", back_populates="product", cascade="all, delete-orphan")


