"""Pytest configuration and fixtures."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.database import Base, get_session
from backend.config import DATABASE_URL


@pytest.fixture(scope="function")
def test_db():
    """Create a test database session."""
    # Use in-memory SQLite for tests
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(bind=engine)


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


