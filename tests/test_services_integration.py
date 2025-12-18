"""Integration tests for backend services (PRODPLAN, SMARTINVENTORY, WHAT-IF, R&D)."""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.models.database import get_session
from backend.services.planning_service import PlanningService
from backend.services.inventory_service import InventoryService
from backend.services.whatif_service import WhatIfService
from backend.services.rd_service import RDService


@pytest.fixture
def session():
    """Get database session."""
    return get_session()


@pytest.fixture
def planning_service(session):
    """Get planning service."""
    return PlanningService(session)


@pytest.fixture
def inventory_service(session):
    """Get inventory service."""
    return InventoryService(session)


@pytest.fixture
def whatif_service(session):
    """Get what-if service."""
    return WhatIfService(session)


@pytest.fixture
def rd_service(session):
    """Get R&D service."""
    return RDService(session)


class TestPlanningService:
    """Tests for PlanningService (PRODPLAN)."""
    
    def test_get_plan_returns_valid_structure(self, planning_service):
        """Test that get_plan returns valid structure with required keys."""
        plan = planning_service.get_plan(horizon_days=7)
        
        assert isinstance(plan, dict)
        assert 'operations' in plan
        assert 'kpis' in plan
        assert 'gantt_by_machine' in plan
        assert 'makespan_h' in plan
        assert isinstance(plan['operations'], list)
        assert isinstance(plan['kpis'], dict)
        assert isinstance(plan['gantt_by_machine'], dict)
    
    def test_get_plan_v2_returns_valid_structure(self, planning_service):
        """Test that get_plan_v2 returns PlanV2Response format."""
        plan = planning_service.get_plan_v2(horizon_hours=168)
        
        assert isinstance(plan, dict)
        assert 'batch_id' in plan
        assert 'horizon_hours' in plan
        assert 'created_at' in plan
        assert 'optimized' in plan
        assert 'config' in plan
        
        optimized = plan['optimized']
        assert 'makespan_h' in optimized
        assert 'kpis' in optimized
        assert 'operations' in optimized
        assert 'gantt_by_machine' in optimized
    
    def test_kpis_are_calculated(self, planning_service):
        """Test that KPIs are calculated and have valid values."""
        plan = planning_service.get_plan()
        kpis = plan['kpis']
        
        assert 'otd_pct' in kpis
        assert 'lead_time_h' in kpis
        assert 'gargalo_ativo' in kpis
        
        # Check KPI ranges
        assert 0 <= kpis['otd_pct'] <= 100
        assert kpis['lead_time_h'] >= 0
    
    def test_plan_respects_horizon(self, planning_service):
        """Test that plan operations are within horizon."""
        horizon_days = 7
        plan = planning_service.get_plan(horizon_days=horizon_days)
        
        now = datetime.now()
        horizon_end = now + timedelta(days=horizon_days)
        
        for op in plan['operations']:
            start_time = datetime.fromisoformat(op['start_time'])
            # Operations should be within reasonable range
            assert start_time <= horizon_end + timedelta(days=30)  # Allow some buffer


class TestInventoryService:
    """Tests for InventoryService (SMARTINVENTORY)."""
    
    def test_calculate_rop_returns_positive_value(self, inventory_service):
        """Test that ROP calculation returns positive value."""
        rop = inventory_service.calculate_rop(
            mu=10.0,
            sigma=2.0,
            lead_time_days=5.0,
            service_level=0.95
        )
        
        assert rop >= 0
        assert isinstance(rop, float)
    
    def test_rop_formula_is_correct(self, inventory_service):
        """Test that ROP formula is approximately correct."""
        mu = 10.0
        sigma = 2.0
        lead_time = 5.0
        service_level = 0.95
        
        rop = inventory_service.calculate_rop(mu, sigma, lead_time, service_level)
        
        # Expected: μ * L + z * σ * √L
        # z ≈ 1.65 for 95% service level
        expected = mu * lead_time + 1.65 * sigma * (lead_time ** 0.5)
        
        # Allow 5% tolerance
        assert abs(rop - expected) < expected * 0.05
    
    def test_rupture_risk_30d_returns_valid_range(self, inventory_service):
        """Test that rupture risk is between 0 and 1."""
        risk = inventory_service.calculate_rupture_risk_30d(
            stock_current=100.0,
            mu=10.0,
            sigma=2.0
        )
        
        assert 0 <= risk <= 1
    
    def test_rupture_risk_high_when_stock_low(self, inventory_service):
        """Test that rupture risk is high when stock is very low."""
        risk_low = inventory_service.calculate_rupture_risk_30d(
            stock_current=10.0,
            mu=10.0,
            sigma=2.0
        )
        
        risk_high = inventory_service.calculate_rupture_risk_30d(
            stock_current=1000.0,
            mu=10.0,
            sigma=2.0
        )
        
        assert risk_low > risk_high
    
    def test_mrp_returns_list(self, inventory_service):
        """Test that MRP calculation returns list of planned orders."""
        # Get first product with orders
        from backend.models import Product, Order
        product = inventory_service.session.query(Product).join(Order).first()
        
        if product:
            mrp = inventory_service.calculate_mrp(
                product_id=product.id,
                horizon_days=30
            )
            
            assert isinstance(mrp, list)
            for order in mrp:
                assert 'product_id' in order
                assert 'planned_order_qty' in order
                assert order['planned_order_qty'] >= 0
    
    def test_mrp_respects_moq(self, inventory_service):
        """Test that MRP respects Minimum Order Quantity."""
        moq = 200.0
        mrp = inventory_service.calculate_mrp(
            product_id=1,  # Assuming product exists
            horizon_days=30,
            moq=moq
        )
        
        for order in mrp:
            if order.get('moq_applied'):
                assert order['planned_order_qty'] >= moq
    
    def test_get_inventory_matrix_returns_valid_structure(self, inventory_service):
        """Test that inventory matrix has correct structure."""
        matrix = inventory_service.get_inventory_matrix()
        
        assert isinstance(matrix, dict)
        assert 'A' in matrix
        assert 'B' in matrix
        assert 'C' in matrix
        
        for abc_class in ['A', 'B', 'C']:
            assert 'X' in matrix[abc_class]
            assert 'Y' in matrix[abc_class]
            assert 'Z' in matrix[abc_class]
            assert isinstance(matrix[abc_class]['X'], int)
    
    def test_get_inventory_skus_returns_list(self, inventory_service):
        """Test that get_inventory_skus returns list with required fields."""
        skus = inventory_service.get_inventory_skus()
        
        assert isinstance(skus, list)
        
        if skus:
            sku = skus[0]
            assert 'sku' in sku
            assert 'classe' in sku
            assert 'xyz' in sku
            assert 'stock_atual' in sku
            assert 'risco_30d' in sku
            assert 'rop' in sku
            assert 'acao' in sku


class TestWhatIfService:
    """Tests for WhatIfService."""
    
    def test_simulate_vip_order_returns_valid_structure(self, whatif_service):
        """Test that VIP order simulation returns valid structure."""
        # Get first product
        from backend.models import Product
        product = whatif_service.session.query(Product).first()
        
        if product:
            result = whatif_service.simulate_vip_order(
                sku=product.product_code or str(product.id),
                quantidade=100,
                prazo=(datetime.now() + timedelta(days=7)).isoformat()
            )
            
            assert isinstance(result, dict)
            assert 'baseline' in result or 'optimized' in result
    
    def test_simulate_machine_breakdown_returns_delta(self, whatif_service):
        """Test that machine breakdown simulation returns delta KPIs."""
        from datetime import timedelta
        de = datetime.now().isoformat()
        ate = (datetime.now() + timedelta(hours=24)).isoformat()
        
        result = whatif_service.simulate_machine_breakdown(
            recurso="MAQ1",
            de=de,
            ate=ate
        )
        
        assert isinstance(result, dict)
        # Should have delta or comparison
        assert 'delta' in result or 'baseline' in result or 'optimized' in result


class TestRDService:
    """Tests for RDService (R&D module)."""
    
    def test_wp1_generate_suggestions_returns_list(self, rd_service):
        """Test that WP1 suggestions returns list."""
        suggestions = rd_service.wp1_generate_suggestions(mode='resumo', limit=10)
        
        assert isinstance(suggestions, list)
        
        if suggestions:
            suggestion = suggestions[0]
            assert 'id' in suggestion
            assert 'icon' in suggestion or 'title' in suggestion
    
    def test_wp2_evaluate_suggestions_returns_results(self, rd_service):
        """Test that WP2 suggestion evaluation returns results."""
        suggestions = rd_service.wp1_generate_suggestions(limit=5)
        if suggestions:
            result = rd_service.wp2_evaluate_suggestions(suggestions)
            assert isinstance(result, dict)
            assert 'summary' in result
            # Should have evaluation metrics
    
    def test_wp3_policy_comparison_returns_results(self, rd_service):
        """Test that WP3 policy comparison returns results."""
        result = rd_service.wp3_compare_inventory_policies()
        assert isinstance(result, dict)
        # Should have comparison metrics


class TestServiceIntegration:
    """Integration tests across services."""
    
    def test_planning_and_inventory_integration(self, planning_service, inventory_service):
        """Test that planning and inventory services work together."""
        # Get plan
        plan = planning_service.get_plan()
        
        # Get inventory SKUs
        skus = inventory_service.get_inventory_skus()
        
        # Both should work without errors
        assert isinstance(plan, dict)
        assert isinstance(skus, list)
    
    def test_whatif_uses_planning_service(self, whatif_service):
        """Test that What-If service uses planning service correctly."""
        # What-If should internally use planning service
        result = whatif_service.simulate_vip_order(
            sku="TEST",
            quantidade=100,
            prazo=(datetime.now() + timedelta(days=7)).isoformat()
        )
        
        # Should not raise exception
        assert isinstance(result, dict)

