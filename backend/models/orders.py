"""Order model (OrdensFabrico)."""
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from backend.models.database import Base


class Order(Base):
    """Order of production (Ordem de Fabrico)."""
    __tablename__ = "orders"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)  # Maps to Of_Id

    # Order attributes (inferred from Excel structure)
    of_id = Column(String, unique=True, index=True, nullable=False)  # Original Of_Id from Excel
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)  # FK to products
    creation_date = Column(DateTime, nullable=True)  # Of_DataCriacao
    completion_date = Column(DateTime, nullable=True)  # Of_DataAcabamento
    status = Column(String, nullable=True)  # Status da ordem
    quantity = Column(Numeric, nullable=True)  # Quantidade produzida
    priority = Column(Integer, nullable=True)  # Prioridade
    
    # Additional fields that might exist in Excel
    notes = Column(String, nullable=True)
    
    # Relationships
    phases = relationship("OrderPhase", back_populates="order", cascade="all, delete-orphan")
    errors = relationship("OrderError", back_populates="order", cascade="all, delete-orphan")
    product = relationship("Product", back_populates="orders")


