#!/usr/bin/env python3
"""
Smoke test script for all backend services.
Tests critical paths end-to-end with real data.
"""
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from datetime import datetime, timedelta
from backend.models.database import get_session
from backend.services.planning_service import PlanningService
from backend.services.inventory_service import InventoryService
from backend.services.whatif_service import WhatIfService
from backend.services.rd_service import RDService
from backend.models import Order, Product, Phase


def test_planning_service(session):
    """Test PRODPLAN service."""
    print("\n" + "="*60)
    print("TESTING PRODPLAN SERVICE")
    print("="*60)
    
    service = PlanningService(session)
    
    # Test 1: Generate plan base
    print("\n1. Generating base plan...")
    try:
        plan = service.get_plan(horizon_days=7, use_historical_times=True)
        assert isinstance(plan, dict)
        assert 'operations' in plan
        assert 'kpis' in plan
        print(f"   ✅ Plan generated: {len(plan['operations'])} operations")
        print(f"   ✅ KPIs: OTD={plan['kpis'].get('otd_pct', 0)}%, Lead Time={plan['kpis'].get('lead_time_h', 0)}h")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    # Test 2: Generate plan V2
    print("\n2. Generating plan V2...")
    try:
        plan_v2 = service.get_plan_v2(horizon_hours=168, use_historical=True)
        assert isinstance(plan_v2, dict)
        assert 'optimized' in plan_v2
        print(f"   ✅ Plan V2 generated: batch_id={plan_v2.get('batch_id', 'N/A')}")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    # Test 3: KPIs consistency
    print("\n3. Validating KPIs consistency...")
    try:
        kpis = plan['kpis']
        assert 0 <= kpis.get('otd_pct', 0) <= 100
        assert kpis.get('lead_time_h', 0) >= 0
        print(f"   ✅ KPIs are consistent")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    print("\n✅ PRODPLAN SERVICE: ALL TESTS PASSED")
    return True


def test_inventory_service(session):
    """Test SMARTINVENTORY service."""
    print("\n" + "="*60)
    print("TESTING SMARTINVENTORY SERVICE")
    print("="*60)
    
    service = InventoryService(session)
    
    # Test 1: ROP calculation
    print("\n1. Calculating ROP...")
    try:
        rop = service.calculate_rop(
            mu=10.0,
            sigma=2.0,
            lead_time_days=5.0,
            service_level=0.95
        )
        assert rop >= 0
        print(f"   ✅ ROP calculated: {rop:.2f}")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    # Test 2: Rupture risk
    print("\n2. Calculating rupture risk...")
    try:
        risk = service.calculate_rupture_risk_30d(
            stock_current=100.0,
            mu=10.0,
            sigma=2.0
        )
        assert 0 <= risk <= 1
        print(f"   ✅ Rupture risk: {risk*100:.1f}%")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    # Test 3: MRP calculation
    print("\n3. Calculating MRP...")
    try:
        product = session.query(Product).join(Order).first()
        if product:
            mrp = service.calculate_mrp(
                product_id=product.id,
                horizon_days=30,
                moq=200.0,
                multiple=50.0
            )
            assert isinstance(mrp, list)
            print(f"   ✅ MRP calculated: {len(mrp)} planned orders")
        else:
            print(f"   ⚠️  SKIPPED: No products with orders found")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    # Test 4: Inventory SKUs
    print("\n4. Getting inventory SKUs...")
    try:
        skus = service.get_inventory_skus()
        assert isinstance(skus, list)
        print(f"   ✅ Inventory SKUs: {len(skus)} SKUs")
        if skus:
            sku = skus[0]
            print(f"   ✅ Sample SKU: {sku.get('sku')} - Risk: {sku.get('risco_30d', 0)}%")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    print("\n✅ SMARTINVENTORY SERVICE: ALL TESTS PASSED")
    return True


def test_whatif_service(session):
    """Test WHAT-IF service."""
    print("\n" + "="*60)
    print("TESTING WHAT-IF SERVICE")
    print("="*60)
    
    service = WhatIfService(session)
    
    # Test 1: VIP order simulation
    print("\n1. Simulating VIP order...")
    try:
        product = session.query(Product).first()
        if product:
            result = service.simulate_vip_order(
                sku=product.product_code or str(product.id),
                quantidade=100,
                prazo=(datetime.now() + timedelta(days=7)).isoformat()
            )
            assert isinstance(result, dict)
            print(f"   ✅ VIP order simulation completed")
        else:
            print(f"   ⚠️  SKIPPED: No products found")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    # Test 2: Machine breakdown simulation
    print("\n2. Simulating machine breakdown...")
    try:
        de = datetime.now().isoformat()
        ate = (datetime.now() + timedelta(hours=24)).isoformat()
        result = service.simulate_machine_breakdown(
            recurso="MAQ1",
            de=de,
            ate=ate
        )
        assert isinstance(result, dict)
        print(f"   ✅ Machine breakdown simulation completed")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    print("\n✅ WHAT-IF SERVICE: ALL TESTS PASSED")
    return True


def test_rd_service(session):
    """Test R&D service."""
    print("\n" + "="*60)
    print("TESTING R&D SERVICE")
    print("="*60)
    
    service = RDService(session)
    
    # Test 1: WP1 - Generate suggestions
    print("\n1. WP1: Generating AI suggestions...")
    try:
        suggestions = service.wp1_generate_suggestions(mode='resumo', limit=10)
        assert isinstance(suggestions, list)
        print(f"   ✅ Generated {len(suggestions)} suggestions")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    # Test 2: WP2 - Evaluate suggestions
    print("\n2. WP2: Evaluating suggestions...")
    try:
        suggestions = service.wp1_generate_suggestions(mode='resumo', limit=5)
        if suggestions:
            result = service.wp2_evaluate_suggestions(suggestions)
            assert isinstance(result, dict)
            assert 'summary' in result
            print(f"   ✅ Suggestions evaluated: {result['summary'].get('beneficial', 0)} beneficial")
        else:
            print(f"   ⚠️  SKIPPED: No suggestions to evaluate")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    # Test 3: WP3 - Compare inventory policies
    print("\n3. WP3: Comparing inventory policies...")
    try:
        result = service.wp3_compare_inventory_policies()
        assert isinstance(result, dict)
        print(f"   ✅ Policy comparison completed")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    # Test 4: WP4 - Learning scheduler
    print("\n4. WP4: Learning scheduler...")
    try:
        plan = service.wp4_learning_scheduler()
        assert isinstance(plan, dict)
        print(f"   ✅ Learning scheduler completed")
    except Exception as e:
        print(f"   ❌ FAILED: {e}")
        return False
    
    print("\n✅ R&D SERVICE: ALL TESTS PASSED")
    return True


def main():
    """Run all smoke tests."""
    print("="*60)
    print("SMOKE TEST - ALL BACKEND SERVICES")
    print("="*60)
    print(f"Started at: {datetime.now().isoformat()}")
    
    session = get_session()
    
    results = {
        'PRODPLAN': False,
        'SMARTINVENTORY': False,
        'WHAT-IF': False,
        'R&D': False,
    }
    
    try:
        # Test each service
        results['PRODPLAN'] = test_planning_service(session)
        results['SMARTINVENTORY'] = test_inventory_service(session)
        results['WHAT-IF'] = test_whatif_service(session)
        results['R&D'] = test_rd_service(session)
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        session.close()
    
    # Summary
    print("\n" + "="*60)
    print("SMOKE TEST SUMMARY")
    print("="*60)
    
    all_passed = True
    for service, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{service:20} {status}")
        if not passed:
            all_passed = False
    
    print("="*60)
    
    if all_passed:
        print("✅ ALL SERVICES: TESTS PASSED")
        return 0
    else:
        print("❌ SOME SERVICES: TESTS FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())

