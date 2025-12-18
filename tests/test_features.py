"""Tests for feature engineering."""
import pytest
from datetime import datetime, timedelta
from backend.models import Order, OrderPhase, Phase, Product, Worker, OrderPhaseWorker
from backend.features.order_features import compute_order_lead_times
from backend.features.phase_features import compute_phase_durations
from backend.features.worker_features import compute_worker_productivity


class TestOrderFeatures:
    """Tests for order-level features."""
    
    def test_compute_order_lead_times(self, test_db):
        """Test computing order lead times."""
        # Create product
        product = Product(product_code="PROD001", name="Test Product")
        test_db.add(product)
        test_db.commit()
        
        # Create order with dates
        creation = datetime(2024, 1, 15)
        completion = datetime(2024, 1, 20)
        order = Order(
            of_id="OF001",
            product_id=product.id,
            creation_date=creation,
            completion_date=completion,
        )
        test_db.add(order)
        test_db.commit()
        
        # Compute lead times
        df = compute_order_lead_times(test_db)
        
        assert len(df) > 0
        assert "lead_time_days" in df.columns
        assert df.iloc[0]["lead_time_days"] == 5.0  # 5 days difference
    
    def test_lead_times_positive(self, test_db):
        """Test that lead times are always positive."""
        product = Product(product_code="PROD002", name="Test Product 2")
        test_db.add(product)
        test_db.commit()
        
        order = Order(
            of_id="OF002",
            product_id=product.id,
            creation_date=datetime(2024, 1, 15),
            completion_date=datetime(2024, 1, 20),
        )
        test_db.add(order)
        test_db.commit()
        
        df = compute_order_lead_times(test_db)
        
        if len(df) > 0:
            assert all(df["lead_time_days"] >= 0)


class TestPhaseFeatures:
    """Tests for phase-level features."""
    
    def test_compute_phase_durations(self, test_db):
        """Test computing phase durations."""
        # Create phase
        phase = Phase(phase_code="PHASE001", name="Test Phase", standard_duration_minutes=60.0)
        test_db.add(phase)
        test_db.commit()
        
        # Create order
        product = Product(product_code="PROD001", name="Test Product")
        test_db.add(product)
        test_db.commit()
        
        order = Order(of_id="OF001", product_id=product.id)
        test_db.add(order)
        test_db.commit()
        
        # Create order phase
        start = datetime(2024, 1, 15, 10, 0)
        end = datetime(2024, 1, 15, 11, 30)
        order_phase = OrderPhase(
            fase_of_id="FASE001",
            of_id=order.id,
            phase_id=phase.id,
            start_date=start,
            end_date=end,
        )
        test_db.add(order_phase)
        test_db.commit()
        
        # Compute durations
        df = compute_phase_durations(test_db)
        
        assert len(df) > 0
        assert "real_duration_minutes" in df.columns
        assert df.iloc[0]["real_duration_minutes"] == 90.0  # 90 minutes


class TestWorkerFeatures:
    """Tests for worker-level features."""
    
    def test_compute_worker_productivity(self, test_db):
        """Test computing worker productivity."""
        # Create worker
        worker = Worker(worker_code="WORKER001", name="Test Worker")
        test_db.add(worker)
        test_db.commit()
        
        # Create phase
        phase = Phase(phase_code="PHASE001", name="Test Phase")
        test_db.add(phase)
        test_db.commit()
        
        # Create order and phase
        product = Product(product_code="PROD001", name="Test Product")
        test_db.add(product)
        test_db.commit()
        
        order = Order(of_id="OF001", product_id=product.id)
        test_db.add(order)
        test_db.commit()
        
        order_phase = OrderPhase(
            fase_of_id="FASE001",
            of_id=order.id,
            phase_id=phase.id,
        )
        test_db.add(order_phase)
        test_db.commit()
        
        # Create worker assignment
        start = datetime(2024, 1, 15, 10, 0)
        end = datetime(2024, 1, 15, 12, 0)
        assignment = OrderPhaseWorker(
            order_phase_id=order_phase.id,
            worker_id=worker.id,
            start_time=start,
            end_time=end,
        )
        test_db.add(assignment)
        test_db.commit()
        
        # Compute productivity
        df = compute_worker_productivity(test_db)
        
        assert len(df) > 0
        assert "total_phases_executed" in df.columns
        assert df.iloc[0]["total_phases_executed"] >= 1



