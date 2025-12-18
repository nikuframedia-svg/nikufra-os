#!/usr/bin/env python3
"""Script to validate data integrity and referential consistency."""
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from backend.models.database import get_session
from backend.models import (
    Order, OrderPhase, OrderPhaseWorker, OrderError,
    Product, Phase, Worker,
    WorkerPhaseSkill, ProductPhaseStandard
)

def check_orphans(session: Session) -> dict:
    """Check for orphaned records (FK without parent)."""
    issues = {}
    
    # Check OrderPhase without Order
    orphan_phases = session.query(OrderPhase).filter(
        ~OrderPhase.of_id.in_(session.query(Order.id))
    ).count()
    if orphan_phases > 0:
        issues["order_phases_orphans"] = orphan_phases
    
    # Check OrderPhase without Phase (if phase_id is set)
    orphan_phases_no_phase = session.query(OrderPhase).filter(
        OrderPhase.phase_id.isnot(None),
        ~OrderPhase.phase_id.in_(session.query(Phase.id))
    ).count()
    if orphan_phases_no_phase > 0:
        issues["order_phases_no_phase"] = orphan_phases_no_phase
    
    # Check OrderPhaseWorker without OrderPhase
    orphan_workers = session.query(OrderPhaseWorker).filter(
        ~OrderPhaseWorker.order_phase_id.in_(session.query(OrderPhase.id))
    ).count()
    if orphan_workers > 0:
        issues["order_phase_workers_orphans"] = orphan_workers
    
    # Check OrderPhaseWorker without Worker
    orphan_workers_no_worker = session.query(OrderPhaseWorker).filter(
        ~OrderPhaseWorker.worker_id.in_(session.query(Worker.id))
    ).count()
    if orphan_workers_no_worker > 0:
        issues["order_phase_workers_no_worker"] = orphan_workers_no_worker
    
    # Check OrderError without Order
    orphan_errors = session.query(OrderError).filter(
        ~OrderError.order_id.in_(session.query(Order.id))
    ).count()
    if orphan_errors > 0:
        issues["order_errors_orphans"] = orphan_errors
    
    # Check OrderError without OrderPhase (if order_phase_id is set)
    orphan_errors_no_phase = session.query(OrderError).filter(
        OrderError.order_phase_id.isnot(None),
        ~OrderError.order_phase_id.in_(session.query(OrderPhase.id))
    ).count()
    if orphan_errors_no_phase > 0:
        issues["order_errors_no_phase"] = orphan_errors_no_phase
    
    # Check Order without Product (if product_id is set)
    orphan_orders = session.query(Order).filter(
        Order.product_id.isnot(None),
        ~Order.product_id.in_(session.query(Product.id))
    ).count()
    if orphan_orders > 0:
        issues["orders_no_product"] = orphan_orders
    
    # Check ProductPhaseStandard without Product
    orphan_standards = session.query(ProductPhaseStandard).filter(
        ~ProductPhaseStandard.product_id.in_(session.query(Product.id))
    ).count()
    if orphan_standards > 0:
        issues["product_phase_standards_no_product"] = orphan_standards
    
    # Check ProductPhaseStandard without Phase
    orphan_standards_no_phase = session.query(ProductPhaseStandard).filter(
        ~ProductPhaseStandard.phase_id.in_(session.query(Phase.id))
    ).count()
    if orphan_standards_no_phase > 0:
        issues["product_phase_standards_no_phase"] = orphan_standards_no_phase
    
    # Check WorkerPhaseSkill without Worker
    orphan_skills = session.query(WorkerPhaseSkill).filter(
        ~WorkerPhaseSkill.worker_id.in_(session.query(Worker.id))
    ).count()
    if orphan_skills > 0:
        issues["worker_phase_skills_no_worker"] = orphan_skills
    
    # Check WorkerPhaseSkill without Phase
    orphan_skills_no_phase = session.query(WorkerPhaseSkill).filter(
        ~WorkerPhaseSkill.phase_id.in_(session.query(Phase.id))
    ).count()
    if orphan_skills_no_phase > 0:
        issues["worker_phase_skills_no_phase"] = orphan_skills_no_phase
    
    return issues


def check_duplicates(session: Session) -> dict:
    """Check for duplicate natural keys."""
    issues = {}
    
    # Check duplicate of_id in Orders
    duplicate_orders = session.query(Order.of_id, func.count(Order.id)).group_by(
        Order.of_id
    ).having(func.count(Order.id) > 1).count()
    if duplicate_orders > 0:
        issues["duplicate_order_of_ids"] = duplicate_orders
    
    # Check duplicate fase_of_id in OrderPhase
    duplicate_phases = session.query(OrderPhase.fase_of_id, func.count(OrderPhase.id)).group_by(
        OrderPhase.fase_of_id
    ).having(func.count(OrderPhase.id) > 1).count()
    if duplicate_phases > 0:
        issues["duplicate_order_phase_fase_of_ids"] = duplicate_phases
    
    # Check duplicate product_code in Products
    duplicate_products = session.query(Product.product_code, func.count(Product.id)).group_by(
        Product.product_code
    ).having(func.count(Product.id) > 1).count()
    if duplicate_products > 0:
        issues["duplicate_product_codes"] = duplicate_products
    
    # Check duplicate phase_code in Phases
    duplicate_phase_codes = session.query(Phase.phase_code, func.count(Phase.id)).group_by(
        Phase.phase_code
    ).having(func.count(Phase.id) > 1).count()
    if duplicate_phase_codes > 0:
        issues["duplicate_phase_codes"] = duplicate_phase_codes
    
    # Check duplicate worker_code in Workers
    duplicate_workers = session.query(Worker.worker_code, func.count(Worker.id)).group_by(
        Worker.worker_code
    ).having(func.count(Worker.id) > 1).count()
    if duplicate_workers > 0:
        issues["duplicate_worker_codes"] = duplicate_workers
    
    return issues


def check_data_consistency(session: Session) -> dict:
    """Check for data consistency issues."""
    issues = {}
    
    # Check invalid date ranges (end_date < start_date)
    invalid_dates = session.query(OrderPhase).filter(
        OrderPhase.start_date.isnot(None),
        OrderPhase.end_date.isnot(None),
        OrderPhase.end_date < OrderPhase.start_date
    ).count()
    if invalid_dates > 0:
        issues["invalid_order_phase_dates"] = invalid_dates
    
    # Check negative durations
    negative_durations = session.query(OrderPhase).filter(
        OrderPhase.duration_minutes < 0
    ).count()
    if negative_durations > 0:
        issues["negative_durations"] = negative_durations
    
    # Check orders with completion_date < creation_date
    invalid_order_dates = session.query(Order).filter(
        Order.creation_date.isnot(None),
        Order.completion_date.isnot(None),
        Order.completion_date < Order.creation_date
    ).count()
    if invalid_order_dates > 0:
        issues["invalid_order_dates"] = invalid_order_dates
    
    # Check negative quantities
    negative_quantities = session.query(Order).filter(
        Order.quantity < 0
    ).count()
    if negative_quantities > 0:
        issues["negative_quantities"] = negative_quantities
    
    # Check negative coeficientes
    negative_coefs = session.query(OrderPhase).filter(
        or_(
            OrderPhase.coeficiente < 0,
            OrderPhase.coeficiente_x < 0
        )
    ).count()
    if negative_coefs > 0:
        issues["negative_coeficientes"] = negative_coefs
    
    return issues


def get_statistics(session: Session) -> dict:
    """Get basic statistics about the database."""
    stats = {
        "orders": session.query(Order).count(),
        "order_phases": session.query(OrderPhase).count(),
        "order_phase_workers": session.query(OrderPhaseWorker).count(),
        "order_errors": session.query(OrderError).count(),
        "products": session.query(Product).count(),
        "phases": session.query(Phase).count(),
        "workers": session.query(Worker).count(),
        "worker_phase_skills": session.query(WorkerPhaseSkill).count(),
        "product_phase_standards": session.query(ProductPhaseStandard).count(),
    }
    
    # Additional stats
    stats["orders_with_product"] = session.query(Order).filter(
        Order.product_id.isnot(None)
    ).count()
    
    stats["order_phases_with_phase"] = session.query(OrderPhase).filter(
        OrderPhase.phase_id.isnot(None)
    ).count()
    
    stats["active_workers"] = session.query(Worker).filter(
        Worker.active == True
    ).count()
    
    return stats


def main():
    """Main validation function."""
    session = get_session()
    
    print("=" * 60)
    print("DATA INTEGRITY VALIDATION")
    print("=" * 60)
    print()
    
    # Statistics
    print("DATABASE STATISTICS:")
    print("-" * 60)
    stats = get_statistics(session)
    for key, value in stats.items():
        print(f"  {key}: {value:,}")
    print()
    
    # Check orphans
    print("REFERENTIAL INTEGRITY (Orphans):")
    print("-" * 60)
    orphans = check_orphans(session)
    if orphans:
        for issue, count in orphans.items():
            print(f"  ❌ {issue}: {count:,} records")
    else:
        print("  ✅ No orphaned records found")
    print()
    
    # Check duplicates
    print("UNIQUE CONSTRAINTS (Duplicates):")
    print("-" * 60)
    duplicates = check_duplicates(session)
    if duplicates:
        for issue, count in duplicates.items():
            print(f"  ❌ {issue}: {count:,} duplicate groups")
    else:
        print("  ✅ No duplicate natural keys found")
    print()
    
    # Check consistency
    print("DATA CONSISTENCY:")
    print("-" * 60)
    consistency = check_data_consistency(session)
    if consistency:
        for issue, count in consistency.items():
            print(f"  ⚠️  {issue}: {count:,} records")
    else:
        print("  ✅ No data consistency issues found")
    print()
    
    # Summary
    total_issues = len(orphans) + len(duplicates) + len(consistency)
    if total_issues == 0:
        print("=" * 60)
        print("✅ ALL VALIDATIONS PASSED")
        print("=" * 60)
        return 0
    else:
        print("=" * 60)
        print(f"⚠️  {total_issues} VALIDATION ISSUE(S) FOUND")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())


