"""
Performance tests to validate SLOs.
"""
import pytest
import time
from fastapi.testclient import TestClient
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.api.main import app

client = TestClient(app)


@pytest.mark.performance
def test_orders_endpoint_slo():
    """Test /orders endpoint meets p95 < 400ms SLO."""
    times = []
    for _ in range(100):
        start = time.time()
        response = client.get("/api/prodplan/orders?limit=100")
        elapsed = (time.time() - start) * 1000  # Convert to ms
        times.append(elapsed)
        assert response.status_code == 200
    
    p95 = sorted(times)[int(len(times) * 0.95)]
    assert p95 < 400, f"p95 latency {p95}ms exceeds 400ms SLO"


@pytest.mark.performance
def test_order_detail_slo():
    """Test /orders/{id} endpoint meets p95 < 250ms SLO."""
    # First get an order ID
    response = client.get("/api/prodplan/orders?limit=1")
    assert response.status_code == 200
    orders = response.json().get("orders", [])
    
    if not orders:
        pytest.skip("No orders available for testing")
    
    of_id = orders[0]["of_id"]
    
    times = []
    for _ in range(100):
        start = time.time()
        response = client.get(f"/api/prodplan/orders/{of_id}")
        elapsed = (time.time() - start) * 1000
        times.append(elapsed)
        assert response.status_code == 200
    
    p95 = sorted(times)[int(len(times) * 0.95)]
    assert p95 < 250, f"p95 latency {p95}ms exceeds 250ms SLO"


@pytest.mark.performance
def test_schedule_current_slo():
    """Test /schedule/current endpoint meets p95 < 250ms SLO."""
    times = []
    for _ in range(100):
        start = time.time()
        response = client.get("/api/prodplan/schedule/current")
        elapsed = (time.time() - start) * 1000
        times.append(elapsed)
        assert response.status_code == 200
    
    p95 = sorted(times)[int(len(times) * 0.95)]
    assert p95 < 250, f"p95 latency {p95}ms exceeds 250ms SLO"

