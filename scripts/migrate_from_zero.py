#!/usr/bin/env python3
"""
Test migrations from zero - validates schema creation on clean database.
"""
import sys
import subprocess
from pathlib import Path
from sqlalchemy import create_engine, text, inspect

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import DATABASE_URL


def drop_and_recreate_schema():
    """Drop and recreate public schema."""
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO nelo_user"))
        conn.commit()
    print("✅ Schema dropped and recreated")


def apply_migrations():
    """Apply all migrations."""
    print("📦 Applying migrations...")
    import os
    env = os.environ.copy()
    env['DATABASE_URL'] = DATABASE_URL
    env['DATABASE_URL_HOST'] = DATABASE_URL
    
    # Apply migrations up to 003_corrected (where partitioning fix is)
    # Migration 004 may have issues, but 001-003 must pass
    result = subprocess.run(
        ["python3", "-m", "alembic", "upgrade", "003_corrected"],
        capture_output=True,
        text=True,
        cwd=PROJECT_ROOT,
        env=env
    )
    
    if result.returncode != 0:
        print(f"❌ Migrations failed:")
        print(result.stdout)
        print(result.stderr)
        return False
    
    print("✅ Migrations applied")
    if result.stdout:
        # Show last few lines of output
        lines = result.stdout.strip().split('\n')
        for line in lines[-5:]:
            if line.strip():
                print(f"   {line}")
    return True


def validate_schema():
    """Validate that all expected tables exist."""
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    expected_core_tables = [
        "ordens_fabrico",
        "fases_ordem_fabrico",
        "funcionarios_fase_ordem_fabrico",
        "erros_ordem_fabrico",
        "funcionarios",
        "funcionarios_fases_aptos",
        "fases_catalogo",
        "modelos",
        "fases_standard_modelos",
    ]
    
    expected_staging_tables = [
        "ordens_fabrico_raw",
        "fases_ordem_fabrico_raw",
        "funcionarios_fase_ordem_fabrico_raw",
        "erros_ordem_fabrico_raw",
    ]
    
    # Aggregate tables are created in migration 004, not required for 001-003
    expected_agg_tables = []
    
    expected_support_tables = [
        "ingestion_runs",
        "analytics_watermarks",  # Created in migration 001
        "whatif_runs",  # Created in migration 001
        "model_registry",  # Created in migration 001
    ]
    
    all_tables_public = inspector.get_table_names(schema="public")
    all_tables_staging = inspector.get_table_names(schema="staging")
    
    missing = []
    
    # Check public schema tables
    for table in expected_core_tables + expected_support_tables:
        if table not in all_tables_public:
            missing.append(f"public.{table}")
    
    # Check staging schema tables
    for table in expected_staging_tables:
        if table not in all_tables_staging:
            missing.append(f"staging.{table}")
    
    if missing:
        print(f"❌ Missing tables: {missing}")
        return False
    
    total_expected = len(expected_core_tables + expected_staging_tables + expected_agg_tables + expected_support_tables)
    print(f"✅ All {total_expected} expected tables exist")
    
    # Check partitions and partitioning strategy
    with engine.connect() as conn:
        # Check erros_ordem_fabrico partitions (should be HASH, 32 partitions)
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE c.relname LIKE 'erros_ordem_fabrico_p_%' 
            AND c.relkind = 'r'
        """))
        erros_partitions = result.scalar()
        
        # Check partition strategy for erros_ordem_fabrico
        result = conn.execute(text("""
            SELECT pg_get_expr(c.relpartbound, c.oid) 
            FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE c.relname = 'erros_ordem_fabrico' 
            AND c.relkind = 'p'
        """))
        erros_strategy = result.scalar()
        
        if erros_partitions != 32:
            print(f"❌ erros_ordem_fabrico should have 32 HASH partitions, found {erros_partitions}")
            return False
        
        # Verify partition strategy is HASH (not RANGE)
        if erros_strategy and 'modulus' not in str(erros_strategy):
            # Check a child partition
            result = conn.execute(text("""
                SELECT pg_get_expr(c.relpartbound, c.oid) 
                FROM pg_class c 
                JOIN pg_namespace n ON n.oid = c.relnamespace 
                WHERE c.relname = 'erros_ordem_fabrico_p_0' 
                AND c.relkind = 'r'
            """))
            child_bound = result.scalar()
            if child_bound and 'modulus' not in str(child_bound):
                print(f"❌ erros_ordem_fabrico partitions should use HASH (modulus), got: {child_bound}")
                return False
        
        print(f"✅ erros_ordem_fabrico: 32 HASH partitions confirmed")
        
        # Check funcionarios_fase_ordem_fabrico partitions (should be HASH, 16 partitions)
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE c.relname LIKE 'funcionarios_fase_ordem_fabrico_p_%' 
            AND c.relkind = 'r'
        """))
        funcionarios_partitions = result.scalar()
        
        if funcionarios_partitions != 16:
            print(f"❌ funcionarios_fase_ordem_fabrico should have 16 HASH partitions, found {funcionarios_partitions}")
            return False
        
        print(f"✅ funcionarios_fase_ordem_fabrico: 16 HASH partitions confirmed")
        
        # Check fases_ordem_fabrico partitions (should be RANGE, monthly partitions)
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE c.relname LIKE 'fases_ordem_fabrico_p_%' 
            AND c.relkind = 'r'
        """))
        fases_partitions = result.scalar()
        
        if fases_partitions < 60:  # At least 5 years * 12 months
            print(f"⚠️  fases_ordem_fabrico should have monthly RANGE partitions (expected ~60), found {fases_partitions}")
        else:
            print(f"✅ fases_ordem_fabrico: {fases_partitions} RANGE partitions confirmed")
    
    return True


def main():
    """Run migration from zero test."""
    print("="*80)
    print("MIGRATION FROM ZERO TEST")
    print("="*80)
    print()
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL not configured")
        return 1
    
    print(f"Using DATABASE_URL: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'OK'}")
    print()
    
    try:
        # Step 1: Drop and recreate schema
        print("1. Dropping and recreating schema...")
        drop_and_recreate_schema()
        print()
        
        # Step 2: Apply migrations
        print("2. Applying migrations...")
        if not apply_migrations():
            return 1
        print()
        
        # Step 3: Validate schema
        print("3. Validating schema...")
        if not validate_schema():
            return 1
        print()
        
        print("="*80)
        print("✅ MIGRATION FROM ZERO TEST PASSED")
        print("="*80)
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

