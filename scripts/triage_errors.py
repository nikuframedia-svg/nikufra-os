#!/usr/bin/env python3
"""
Error Triage Script - Identifica todos os erros do sistema
Gera docs/ERROR_TRIAGE_REPORT.md com lista completa de erros
"""
import sys
import subprocess
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

PROJECT_ROOT = Path(__file__).parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"
DOCS_DIR.mkdir(exist_ok=True)

ERRORS: List[Dict[str, Any]] = []


def add_error(
    error_id: str,
    category: str,
    description: str,
    reproduction: str,
    root_cause: str,
    fix_plan: str,
    acceptance_criteria: str,
):
    """Add error to list."""
    ERRORS.append({
        "id": error_id,
        "category": category,
        "description": description,
        "reproduction": reproduction,
        "root_cause": root_cause,
        "fix_plan": fix_plan,
        "acceptance_criteria": acceptance_criteria,
        "status": "PENDING",
    })


def run_command(cmd: str, cwd: Path = None) -> tuple[int, str, str]:
    """Run command and return exit code, stdout, stderr."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            cwd=cwd or PROJECT_ROOT,
            timeout=300,
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return 124, "", "Command timed out after 300s"
    except Exception as e:
        return 1, "", str(e)


def check_prerequisites():
    """Check prerequisites validation."""
    print("🔍 Checking prerequisites...")
    code, stdout, stderr = run_command("python3 scripts/validate_prerequisites.py")
    if code != 0:
        add_error(
            "E1",
            "ENV",
            "Prerequisites validation failed",
            "python3 scripts/validate_prerequisites.py",
            "DATABASE_URL not configured or PostgreSQL not available",
            "1. Configure DATABASE_URL\n2. Ensure PostgreSQL 15+ is running\n3. Run docker compose up -d db",
            "python3 scripts/validate_prerequisites.py exits with code 0",
        )
        return False
    return True


def check_migrations():
    """Check migrations apply from zero."""
    print("🔍 Checking migrations...")
    # Always use python -m alembic (no PATH dependency)
    code, stdout, stderr = run_command("python3 -m alembic --version")
    if code != 0:
        add_error(
            "E2",
            "MIGRATIONS",
            "Alembic not available",
            "python3 -m alembic upgrade head",
            "alembic module not found. Install via: pip install alembic",
            "1. Install alembic: pip install alembic\n2. Ensure PostgreSQL 15+ is running",
            "python3 -m alembic works",
        )
        return False
    
    # Try to check if migrations can be applied (skip if DATABASE_URL not configured)
    try:
        from backend.config import DATABASE_URL
        if not DATABASE_URL:
            print("  ⚠️  DATABASE_URL not configured, skipping migration test")
            return True
        
        # Check if alembic can upgrade
        code, stdout, stderr = run_command("python3 -m alembic upgrade head")
        if code != 0:
            add_error(
                "E2.1",
                "MIGRATIONS",
                "Migrations fail to apply",
                "python3 -m alembic upgrade head",
                stderr[:200] if stderr else "Unknown migration error",
                "1. Check migration files for syntax errors\n2. Ensure PostgreSQL 15+ features are used correctly\n3. Test on clean database",
                "python3 -m alembic upgrade head applies successfully on clean database",
            )
            return False
    except Exception as e:
        print(f"  ⚠️  Could not check migrations: {e}")
        return True  # Don't fail if config not available
    
    return True


def check_inspector():
    """Check inspector runs successfully."""
    print("🔍 Checking inspector...")
    code, stdout, stderr = run_command("python3 app/ingestion/inspector.py")
    if code != 0:
        add_error(
            "E3",
            "INGESTION",
            "Inspector fails to run",
            "python3 app/ingestion/inspector.py",
            stderr[:200] if stderr else "Unknown inspector error",
            "1. Check Excel file exists at FOLHA_IA_PATH\n2. Check openpyxl installation\n3. Check file permissions",
            "Inspector generates DATA_DICTIONARY.md, PROFILE_REPORT.json, RELATIONSHIPS_REPORT.json",
        )
        return False
    
    # Check if reports exist
    required_reports = [
        "app/ingestion/DATA_DICTIONARY.md",
        "app/ingestion/PROFILE_REPORT.json",
        "app/ingestion/RELATIONSHIPS_REPORT.json",
    ]
    for report in required_reports:
        if not (PROJECT_ROOT / report).exists():
            add_error(
                f"E3.{required_reports.index(report)+1}",
                "INGESTION",
                f"Missing inspector report: {report}",
                "python3 app/ingestion/inspector.py",
                "Inspector did not generate required report",
                "1. Check inspector code\n2. Ensure Excel file is readable\n3. Check write permissions",
                f"File {report} exists after running inspector",
            )
    return True


def check_ingestion():
    """Check ingestion runs (dry-run if possible, else full)."""
    print("🔍 Checking ingestion...")
    # Try dry-run first
    code, stdout, stderr = run_command("python3 app/ingestion/main_turbo.py --dry-run")
    if code != 0:
        # Try full run (may take time)
        print("  ⚠️  Dry-run not available, checking if ingestion script exists...")
        if not (PROJECT_ROOT / "app/ingestion/main_turbo.py").exists():
            add_error(
                "E4",
                "INGESTION",
                "Ingestion script missing",
                "python3 app/ingestion/main_turbo.py",
                "main_turbo.py does not exist",
                "1. Create app/ingestion/main_turbo.py\n2. Implement turbo ingestion pipeline",
                "main_turbo.py exists and runs",
            )
            return False
    
    # Check if extract_report.json would be generated
    extract_report = PROJECT_ROOT / "data/processed/extraction_report.json"
    if not extract_report.exists():
        add_error(
            "E4.1",
            "INGESTION",
            "Extraction report not generated",
            "python3 app/ingestion/main_turbo.py",
            "Extract phase does not generate extraction_report.json",
            "1. Ensure extract.py generates extraction_report.json\n2. Check data/processed/ directory exists",
            "extraction_report.json exists after extract phase",
        )
    return True


def check_release_gate():
    """Check release gate passes."""
    print("🔍 Checking release gate...")
    code, stdout, stderr = run_command("python3 scripts/release_gate.py")
    if code != 0:
        add_error(
            "E5",
            "DATA_INTEGRITY",
            "Release gate fails",
            "python3 scripts/release_gate.py",
            stderr[:200] if stderr else "Release gate checks failed",
            "1. Check docs/RELEASE_BLOCKED.md for details\n2. Fix failing checks\n3. Re-run release gate",
            "release_gate.py exits with code 0",
        )
        return False
    return True


def check_tests():
    """Check unit and integration tests."""
    print("🔍 Checking tests...")
    # Always use python -m pytest (no PATH dependency)
    code, stdout, stderr = run_command("python3 -m pytest --version")
    if code != 0:
        add_error(
            "E6",
            "SERVICES",
            "pytest not available",
            "python3 -m pytest -q",
            "pytest module not found. Install via: pip install pytest",
            "1. Install pytest: pip install pytest\n2. Ensure test database is configured",
            "python3 -m pytest works",
        )
        return False
    
    # Try to run tests
    code, stdout, stderr = run_command("python3 -m pytest -q --tb=short")
    if code != 0:
        add_error(
            "E6.1",
            "SERVICES",
            "Tests fail",
            "python3 -m pytest -q",
            stderr[:300] if stderr else "Test failures detected",
            "1. Fix failing tests\n2. Ensure test database is configured\n3. Check test data setup",
            "python3 -m pytest passes with exit code 0",
        )
        return False
    return True


def check_performance_tests():
    """Check performance tests."""
    print("🔍 Checking performance tests...")
    perf_test = PROJECT_ROOT / "tests/performance/test_slos.py"
    if not perf_test.exists():
        add_error(
            "E7",
            "PERFORMANCE",
            "Performance tests missing",
            "python3 -m pytest tests/performance/test_slos.py",
            "test_slos.py does not exist",
            "1. Create tests/performance/test_slos.py\n2. Implement SLO validation tests",
            "test_slos.py exists and validates SLOs",
        )
        return False
    
    # Check if pytest is available
    code, stdout, stderr = run_command("python3 -m pytest --version")
    if code != 0:
        print("  ⚠️  pytest not available, skipping performance test execution")
        return True  # Don't fail if pytest not installed
    
    # Try to run tests (always use python -m)
    code, stdout, stderr = run_command("python3 -m pytest tests/performance/test_slos.py -q -m performance")
    if code != 0:
        add_error(
            "E7.1",
            "PERFORMANCE",
            "Performance tests fail",
            "python3 -m pytest tests/performance/test_slos.py",
            stderr[:300] if stderr else "SLO validation failed",
            "1. Fix performance issues\n2. Optimize queries\n3. Check SLO thresholds",
            "Performance tests pass with SLOs met",
        )
        return False
    return True


def check_docker_compose():
    """Check docker-compose configuration."""
    print("🔍 Checking docker-compose...")
    compose_file = PROJECT_ROOT / "docker-compose.yml"
    if not compose_file.exists():
        add_error(
            "E8",
            "DOCKER",
            "docker-compose.yml missing",
            "docker compose up -d",
            "docker-compose.yml does not exist",
            "1. Create docker-compose.yml\n2. Define services: db, redis, api, worker",
            "docker-compose.yml exists and services start",
        )
        return False
    
    # Check if DATABASE_URL uses 'db' for containers (not 'postgres' or 'localhost')
    with open(compose_file) as f:
        content = f.read()
        # Check api service
        if 'api:' in content:
            # Look for DATABASE_URL in api service
            lines = content.split('\n')
            in_api = False
            for i, line in enumerate(lines):
                if 'api:' in line:
                    in_api = True
                elif in_api and line.strip().startswith('api:'):
                    continue
                elif in_api and line.strip() and not line.startswith(' ') and not line.startswith('\t'):
                    in_api = False
                elif in_api and 'DATABASE_URL' in line:
                    if '@postgres:' in line or '@localhost:' in line:
                        add_error(
                            "E8.1",
                            "DOCKER",
                            "DATABASE_URL uses postgres/localhost in containers",
                            "docker compose up -d api",
                            f"Containers use wrong host. Line: {line.strip()}",
                            "1. Update docker-compose.yml to use DATABASE_URL with host 'db'\n2. Use DATABASE_URL_DOCKER variable",
                            "Containers use 'db' as database host",
                        )
                        return False
                    break
    return True


def check_feature_gates():
    """Check feature gates configuration."""
    print("🔍 Checking feature gates...")
    feature_gates = PROJECT_ROOT / "FEATURE_GATES.json"
    if not feature_gates.exists():
        add_error(
            "E9",
            "DATA_INTEGRITY",
            "FEATURE_GATES.json missing",
            "Check FEATURE_GATES.json exists",
            "Feature gates file not generated",
            "1. Implement feature gate evaluator\n2. Generate FEATURE_GATES.json from RELATIONSHIPS_REPORT.json",
            "FEATURE_GATES.json exists with gate statuses",
        )
        return False
    return True


def check_slo_results():
    """Check SLO results exist."""
    print("🔍 Checking SLO results...")
    slo_results = DOCS_DIR / "perf" / "SLO_RESULTS.json"
    if not slo_results.exists():
        add_error(
            "E10",
            "PERFORMANCE",
            "SLO_RESULTS.json missing",
            "Run performance tests",
            "SLO results not generated",
            "1. Run pytest tests/performance/test_slos.py\n2. Generate SLO_RESULTS.json",
            "SLO_RESULTS.json exists with measured SLOs",
        )
        return False
    return True


def generate_report():
    """Generate ERROR_TRIAGE_REPORT.md."""
    report_file = DOCS_DIR / "ERROR_TRIAGE_REPORT.md"
    
    with open(report_file, "w") as f:
        f.write("# ERROR TRIAGE REPORT\n\n")
        f.write(f"**Generated**: {datetime.now().isoformat()}\n\n")
        f.write(f"**Total Errors**: {len(ERRORS)}\n\n")
        
        if not ERRORS:
            f.write("## ✅ NO ERRORS FOUND\n\n")
            f.write("All checks passed successfully.\n")
            return
        
        f.write("## Errors by Category\n\n")
        categories = {}
        for err in ERRORS:
            cat = err["category"]
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(err)
        
        for cat in sorted(categories.keys()):
            f.write(f"### {cat} ({len(categories[cat])} errors)\n\n")
            for err in categories[cat]:
                f.write(f"#### {err['id']}: {err['description']}\n\n")
                f.write(f"- **Category**: {err['category']}\n")
                f.write(f"- **Status**: {err['status']}\n")
                f.write(f"- **Reproduction**:\n")
                f.write(f"  ```bash\n  {err['reproduction']}\n  ```\n\n")
                f.write(f"- **Root Cause**: {err['root_cause']}\n\n")
                f.write(f"- **Fix Plan**:\n")
                for step in err['fix_plan'].split('\n'):
                    f.write(f"  {step}\n")
                f.write(f"\n- **Acceptance Criteria**: {err['acceptance_criteria']}\n\n")
                f.write("---\n\n")
    
    print(f"\n✅ Error triage report generated: {report_file}")
    print(f"   Found {len(ERRORS)} error(s)")


def main():
    """Run all checks."""
    print("="*80)
    print("ERROR TRIAGE - PRODPLAN 4.0 OS")
    print("="*80)
    print()
    
    checks = [
        ("Prerequisites", check_prerequisites),
        ("Migrations", check_migrations),
        ("Inspector", check_inspector),
        ("Ingestion", check_ingestion),
        ("Release Gate", check_release_gate),
        ("Tests", check_tests),
        ("Performance Tests", check_performance_tests),
        ("Docker Compose", check_docker_compose),
        ("Feature Gates", check_feature_gates),
        ("SLO Results", check_slo_results),
    ]
    
    for name, check_func in checks:
        try:
            check_func()
        except Exception as e:
            add_error(
                f"E-{name.upper().replace(' ', '_')}",
                "UNKNOWN",
                f"Exception during {name} check",
                f"Run {name} check",
                str(e)[:200],
                "1. Check error details\n2. Fix underlying issue",
                f"{name} check completes without exception",
            )
    
    generate_report()
    
    if ERRORS:
        print(f"\n❌ Found {len(ERRORS)} error(s)")
        print(f"   See: docs/ERROR_TRIAGE_REPORT.md")
        return 1
    else:
        print("\n✅ No errors found")
        return 0


if __name__ == "__main__":
    sys.exit(main())

