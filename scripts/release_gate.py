#!/usr/bin/env python3
"""
Release Gate Script - Valida se backend está pronto para produção.
Falha se qualquer validação não passar.
"""
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
import json

# Try to import structlog (optional)
try:
    import structlog
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
        ]
    )
    logger = structlog.get_logger()
except ImportError:
    # Fallback to print if structlog not available
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.config import DATABASE_URL
from app.ingestion.validate_counts import CountValidator, EXPECTED_COUNTS

FAILED = []
PASSED = []


def _write_release_blocked(reason: str):
    """Write release blocked document."""
    docs_dir = Path(__file__).parent.parent / "docs"
    docs_dir.mkdir(exist_ok=True)
    blocked_file = docs_dir / "RELEASE_BLOCKED.md"
    
    from datetime import datetime
    with open(blocked_file, "w") as f:
        f.write(f"# Release Blocked\n\n")
        f.write(f"**Date**: {datetime.now().isoformat()}\n\n")
        f.write(f"**Reason**: {reason}\n\n")
        f.write(f"## Action Required\n\n")
        f.write(f"1. Fix the issue described above\n")
        f.write(f"2. Re-run: `python scripts/release_gate.py`\n")
        f.write(f"3. Ensure all checks pass before releasing\n\n")
    
    print(f"\n📝 Release blocked document written: {blocked_file}")


def check(name: str, condition: bool, message: str = ""):
    """Check condition and record result."""
    if condition:
        PASSED.append(name)
        print(f"✅ {name}")
        if message:
            print(f"   {message}")
    else:
        FAILED.append(name)
        print(f"❌ {name}")
        if message:
            print(f"   {message}")


def main():
    """Run release gate checks."""
    print("="*80)
    print("RELEASE GATE - PRODPLAN 4.0 OS")
    print("="*80)
    print()
    
    # A1: Schema e migrations
    print("A1. Schema, migrations e arranque limpo")
    print("-" * 80)
    
    # Validate PostgreSQL first (fail-fast)
    if not DATABASE_URL:
        check("A1.0 DATABASE_URL is configured", False, "DATABASE_URL is required. PostgreSQL 15+ only.")
        _write_release_blocked("DATABASE_URL is not configured. PostgreSQL 15+ is required.")
        return 1
    
    if DATABASE_URL.startswith("sqlite"):
        check("A1.0 DATABASE_URL is PostgreSQL", False, "SQLite is not supported. PostgreSQL 15+ only.")
        _write_release_blocked("DATABASE_URL points to SQLite. PostgreSQL 15+ is required.")
        return 1
    
    if not (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgresql+psycopg2://")):
        check("A1.0 DATABASE_URL is PostgreSQL", False, f"Unsupported scheme. Use PostgreSQL 15+. Got: {DATABASE_URL[:50]}")
        _write_release_blocked(f"Unsupported DATABASE_URL scheme: {DATABASE_URL[:50]}")
        return 1
    
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            # Set search_path to core, public, staging (tables may be in core or public)
            conn.execute(text("SET search_path TO core, public, staging;"))
            
            # A1.0: Database connection
            check("A1.0 Database connection", True, "Connected to PostgreSQL")
            
            # A1.1: Check if migrations table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = 'alembic_version'
                )
            """))
            has_alembic = result.scalar()
            if not has_alembic:
                check("A1.1 Alembic version table exists", False, "Migrations não aplicaram. Execute: python3 -m alembic upgrade head")
            else:
                check("A1.1 Alembic version table exists", True)
            
            # Check current migration version
            if has_alembic:
                result = conn.execute(text("SELECT version_num FROM alembic_version LIMIT 1"))
                current_version = result.scalar()
                if current_version is None:
                    check("A1.2 Migration version exists", False, "Tabela alembic_version existe mas está vazia. Migrations não aplicaram corretamente.")
                else:
                    check("A1.2 Migration version exists", True, f"Current: {current_version}")
            else:
                check("A1.2 Migration version exists", False, "Tabela alembic_version não existe. Migrations não aplicaram.")
            
            # Check for partitioned tables (using pg_class, not pg_partitions which doesn't exist)
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM pg_class c 
                JOIN pg_namespace n ON n.oid = c.relnamespace 
                WHERE c.relname IN ('fases_ordem_fabrico', 'funcionarios_fase_ordem_fabrico', 'erros_ordem_fabrico')
                AND c.relkind = 'p'
            """))
            partitioned_parents = result.scalar()
            
            # Check child partitions
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM pg_class c 
                JOIN pg_namespace n ON n.oid = c.relnamespace 
                WHERE c.relname LIKE 'erros_ordem_fabrico_p_%' 
                AND c.relkind = 'r'
            """))
            erros_partitions = result.scalar()
            
            if partitioned_parents < 3:
                missing = []
                for table in ['fases_ordem_fabrico', 'funcionarios_fase_ordem_fabrico', 'erros_ordem_fabrico']:
                    result = conn.execute(text(f"""
                        SELECT EXISTS (
                            SELECT 1 FROM pg_class c 
                            JOIN pg_namespace n ON n.oid = c.relnamespace 
                            WHERE c.relname = '{table}' AND c.relkind = 'p'
                        )
                    """))
                    if not result.scalar():
                        missing.append(table)
                check("A1.3 Partitioned tables exist", False, f"Tabelas particionadas em falta: {missing}. Migrations não aplicaram corretamente.")
            elif erros_partitions != 32:
                check("A1.3 Partitioned tables exist", False, f"erros_ordem_fabrico deve ter 32 partições HASH, encontradas {erros_partitions}. Migrations não aplicaram corretamente.")
            else:
                check("A1.3 Partitioned tables exist", True, f"3 tabelas particionadas, {erros_partitions} partições de erros_ordem_fabrico")
            
            # Check if core tables exist
            core_tables = [
                "ordens_fabrico", "fases_ordem_fabrico", "erros_ordem_fabrico",
                "funcionarios", "modelos", "fases_catalogo", "ingestion_runs"
            ]
            missing_core = []
            for table in core_tables:
                result = conn.execute(text(f"""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = '{table}'
                    )
                """))
                exists = result.scalar()
                if not exists:
                    missing_core.append(table)
                check(f"A1.4 Core table {table} exists", exists)
            
            if missing_core:
                check("A1.4 All core tables exist", False, f"Tabelas core em falta: {missing_core}. Migrations não aplicaram corretamente.")
            
            # Check if aggregates exist (optional - may be created by migration 004)
            agg_tables = [
                "agg_phase_stats_daily", "agg_order_stats_daily",
                "agg_quality_daily", "agg_wip_current"
            ]
            missing_agg = []
            for table in agg_tables:
                result = conn.execute(text(f"""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = '{table}'
                    )
                """))
                exists = result.scalar()
                if not exists:
                    missing_agg.append(table)
                check(f"A1.5 Aggregate table {table} exists", exists)
            
            if missing_agg:
                print(f"⚠️  Aggregate tables missing (may be created in migration 004): {missing_agg}")
    
    except Exception as e:
        check("A1.0 Database connection", False, f"Error: {e}")
        _write_release_blocked(f"Database connection failed: {e}. Check DATABASE_URL and ensure PostgreSQL is running.")
        return 1
    
    print()
    
    # A2: Ingestão e data contract
    print("A2. Ingestão e data contract")
    print("-" * 80)
    
    try:
        validator = CountValidator(DATABASE_URL)
        validation_results = validator.validate_all()
        
        all_valid = validation_results["all_valid"]
        check("A2.1 All counts match Excel", all_valid)
        
        if not all_valid:
            mismatches = validation_results["mismatches"]
            for mismatch in mismatches:
                check(
                    f"A2.2 {mismatch['sheet']} count",
                    False,
                    f"Expected: {mismatch['expected']:,}, Core: {mismatch['core_count']:,}, Rejects: {mismatch['rejected_count']:,}, Total: {mismatch['total_count']:,}, Diff: {mismatch['diff']:,}"
                )
        
        # Check if ingestion report exists
        report_path = Path(__file__).parent.parent / "data" / "processed" / "ingestion_report.json"
        report_exists = report_path.exists()
        check("A2.3 Ingestion report exists", report_exists, f"Path: {report_path}")
        
        if report_exists:
            with open(report_path) as f:
                report = json.load(f)
                check("A2.4 Ingestion report has run_id", "run_id" in report)
                check("A2.5 Ingestion report has validation", "validation" in report)
                if "validation" in report:
                    validation_status = report["validation"].get("status")
                    check("A2.6 Validation status is PASSED", validation_status == "PASSED")
    
    except Exception as e:
        error_msg = str(e)
        if "UndefinedTable" in error_msg or "relation" in error_msg.lower() or "does not exist" in error_msg.lower():
            check("A2.0 Count validation", False, f"Migrations not applied or tables missing. Run: python3 -m alembic upgrade head")
        else:
            check("A2.0 Count validation", False, f"Error: {e}")
    
    print()
    
    # A3: Performance e SLOs (check if benchmarks exist)
    print("A3. Performance e SLOs")
    print("-" * 80)
    
    perf_dir = Path(__file__).parent.parent / "docs" / "perf"
    perf_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if benchmark files exist (generated by generate_benchmarks.py)
    # Look for both .md and .json files
    benchmark_md_files = list(perf_dir.glob("benchmarks*.md"))
    benchmark_json_files = list(perf_dir.glob("benchmarks*.json"))
    benchmark_files = benchmark_md_files + benchmark_json_files
    
    if len(benchmark_files) == 0:
        check("A3.1 Benchmark files exist", False, f"No benchmark files found in {perf_dir}. Run: python3 scripts/generate_benchmarks.py")
    else:
        check("A3.1 Benchmark files exist", True, f"Found: {len(benchmark_files)} file(s): {[f.name for f in benchmark_files]}")
    
    explain_files = list(perf_dir.glob("EXPLAIN_*.md"))
    check("A3.2 EXPLAIN plans exist", len(explain_files) > 0, f"Found: {len(explain_files)}")
    
    print()
    
    # A4: Feature gating
    print("A4. Feature gating automático")
    print("-" * 80)
    
    try:
        from app.services.data_quality import get_data_quality_service
        dq_service = get_data_quality_service(DATABASE_URL)
        
        # Check employee productivity support
        support_check = dq_service.check_feature_support("employee_productivity")
        status = support_check.get("status", "UNKNOWN")
        
        if status == "ERROR":
            # Tables don't exist - migrations not applied
            reason = support_check.get("reason", "Unknown error")
            check("A4.0 Feature gating check", False, f"{reason}. Querying: funcionarios_fase_ordem_fabrico, fases_ordem_fabrico (schema: core/public)")
        elif status == "SKIPPED":
            # Tables exist but empty - ingestion not run
            reason = support_check.get("reason", "Ingestion not run")
            check("A4.0 Feature gating check", False, f"{reason}. Tables exist but are empty. Run ingestion first.")
        elif status == "NOT_SUPPORTED_BY_DATA":
            # Feature is blocked due to low match rate
            is_blocked = True
            check("A4.0 Feature gating check", True, f"Feature gating working. Status: {status}")
            check("A4.1 Employee productivity is blocked", is_blocked)
            
            match_rate = support_check.get("match_rate", 0)
            check(
                "A4.2 Match rate < 0.90",
                match_rate < 0.90,
                f"Match rate: {match_rate:.1%}"
            )
        elif status == "SUPPORTED":
            # Feature is supported
            check("A4.0 Feature gating check", True, f"Feature gating working. Status: {status}")
            check("A4.1 Employee productivity is blocked", False, "Feature is supported by data")
        else:
            check("A4.0 Feature gating check", False, f"Unknown status: {status}")
    
    except Exception as e:
        check("A4.0 Feature gating check", False, f"Error: {e}")
    
    print()
    
    # Summary
    print("="*80)
    print("SUMMARY")
    print("="*80)
    print(f"✅ Passed: {len(PASSED)}")
    print(f"❌ Failed: {len(FAILED)}")
    print()
    
    if FAILED:
        print("FAILED CHECKS:")
        for check_name in FAILED:
            print(f"  - {check_name}")
        print()
        print("❌ RELEASE GATE FAILED")
        print("   Backend NÃO está pronto para produção.")
        _write_release_blocked(f"Release gate failed with {len(FAILED)} check(s): {', '.join(FAILED)}")
        return 1
    else:
        print("✅ RELEASE GATE PASSED")
        print("   Backend está pronto para produção.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
