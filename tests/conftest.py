"""Pytest configuration and fixtures."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.database import Base, get_session
from backend.config import DATABASE_URL


@pytest.fixture(scope="function")
def test_db():
    """Create a test database session using PostgreSQL."""
    # PostgreSQL-only: tests require PostgreSQL features (partitions, INCLUDE, etc.)
    from backend.config import DATABASE_URL
    
    if not DATABASE_URL:
        pytest.skip("Tests require PostgreSQL. DATABASE_URL not configured.")
    
    if DATABASE_URL.startswith("sqlite"):
        pytest.skip("Tests require PostgreSQL. SQLite is not supported.")
    
    if not (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgresql+psycopg2://")):
        pytest.skip(f"Tests require PostgreSQL. Unsupported scheme: {DATABASE_URL[:50]}")
    
    engine = create_engine(DATABASE_URL, echo=False)
    
    # Use transactions for cleanup (PostgreSQL-specific)
    connection = engine.connect()
    transaction = connection.begin()
    
    try:
        Base.metadata.create_all(bind=connection)
        SessionLocal = sessionmaker(bind=connection)
        session = SessionLocal()
        
        yield session
        
        session.close()
        transaction.rollback()  # Cleanup via rollback
    finally:
        connection.close()


@pytest.fixture
def sample_product_data():
    """Sample product data for testing."""
    return {
        "product_code": "PROD001",
        "name": "Test Product",
        "description": "Test Description",
        "weight": 10.5,
    }


@pytest.fixture
def sample_phase_data():
    """Sample phase data for testing."""
    return {
        "phase_code": "PHASE001",
        "name": "Test Phase",
        "standard_duration_minutes": 60.0,
    }


@pytest.fixture
def sample_worker_data():
    """Sample worker data for testing."""
    return {
        "worker_code": "WORKER001",
        "name": "Test Worker",
        "department": "Production",
    }



