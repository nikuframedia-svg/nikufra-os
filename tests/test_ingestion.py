"""Tests for data ingestion."""
import pytest
from datetime import datetime
from backend.models import Product, Phase, Worker, Order
from backend.data_ingestion.folha_ia.data_cleaner import (
    parse_date,
    parse_numeric,
    clean_string,
    calculate_duration_minutes,
)


class TestDataCleaner:
    """Tests for data cleaning utilities."""
    
    def test_parse_date_valid(self):
        """Test parsing valid dates."""
        assert parse_date("2024-01-15") is not None
        assert parse_date("15/01/2024") is not None
        assert parse_date(datetime(2024, 1, 15)) is not None
    
    def test_parse_date_invalid(self):
        """Test parsing invalid dates."""
        assert parse_date(None) is None
        assert parse_date("invalid") is None
        assert parse_date("") is None
    
    def test_parse_numeric_valid(self):
        """Test parsing valid numeric values."""
        assert parse_numeric("10.5") == 10.5
        assert parse_numeric(10) == 10.0
        assert parse_numeric(10.5) == 10.5
    
    def test_parse_numeric_invalid(self):
        """Test parsing invalid numeric values."""
        assert parse_numeric(None) is None
        assert parse_numeric("invalid") is None
    
    def test_clean_string(self):
        """Test string cleaning."""
        assert clean_string("  test  ") == "test"
        assert clean_string(None) is None
        assert clean_string("") is None
    
    def test_calculate_duration_minutes(self):
        """Test duration calculation."""
        start = datetime(2024, 1, 15, 10, 0)
        end = datetime(2024, 1, 15, 11, 30)
        duration = calculate_duration_minutes(start, end)
        assert duration == 90.0
        
        # Invalid (end before start)
        assert calculate_duration_minutes(end, start) is None


class TestModels:
    """Tests for database models."""
    
    def test_create_product(self, test_db, sample_product_data):
        """Test creating a product."""
        product = Product(**sample_product_data)
        test_db.add(product)
        test_db.commit()
        
        assert product.id is not None
        assert product.product_code == "PROD001"
    
    def test_create_phase(self, test_db, sample_phase_data):
        """Test creating a phase."""
        phase = Phase(**sample_phase_data)
        test_db.add(phase)
        test_db.commit()
        
        assert phase.id is not None
        assert phase.phase_code == "PHASE001"
    
    def test_create_worker(self, test_db, sample_worker_data):
        """Test creating a worker."""
        worker = Worker(**sample_worker_data)
        test_db.add(worker)
        test_db.commit()
        
        assert worker.id is not None
        assert worker.worker_code == "WORKER001"
    
    def test_create_order_with_product(self, test_db, sample_product_data):
        """Test creating an order with product relationship."""
        product = Product(**sample_product_data)
        test_db.add(product)
        test_db.commit()
        
        order = Order(
            of_id="OF001",
            product_id=product.id,
            creation_date=datetime(2024, 1, 15),
        )
        test_db.add(order)
        test_db.commit()
        
        assert order.id is not None
        assert order.product_id == product.id
        assert order.product is not None



