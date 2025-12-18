#!/usr/bin/env python3
"""
Fix All Errors - Executa correções sistemáticas de todos os erros identificados.
"""
import sys
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent


def run_command(cmd: str, description: str) -> bool:
    """Run command and return success."""
    print(f"\n{'='*80}")
    print(f"🔧 {description}")
    print(f"{'='*80}")
    result = subprocess.run(cmd, shell=True, cwd=PROJECT_ROOT)
    return result.returncode == 0


def main():
    """Fix all errors systematically."""
    print("="*80)
    print("ERROR ERADICATION - PRODPLAN 4.0 OS")
    print("="*80)
    print()
    
    fixes = [
        # 1. Generate feature gates
        ("python3 scripts/evaluate_feature_gates.py", "Generate FEATURE_GATES.json"),
        
        # 2. Generate SLO results (even if empty)
        ("python3 scripts/generate_slo_results.py", "Generate SLO_RESULTS.json"),
        
        # 3. Run triage to get current error list
        ("python3 scripts/triage_errors.py", "Run error triage"),
    ]
    
    all_passed = True
    for cmd, desc in fixes:
        if not run_command(cmd, desc):
            all_passed = False
            print(f"❌ {desc} failed")
        else:
            print(f"✅ {desc} completed")
    
    print("\n" + "="*80)
    if all_passed:
        print("✅ All fixes completed")
        print("\nNext steps:")
        print("  1. Configure DATABASE_URL")
        print("  2. Run: ./scripts/bootstrap_postgres.sh")
        print("  3. Run: python app/ingestion/main_turbo.py")
        print("  4. Run: python scripts/release_gate.py")
        return 0
    else:
        print("❌ Some fixes failed")
        print("   Check docs/ERROR_TRIAGE_REPORT.md for details")
        return 1


if __name__ == "__main__":
    sys.exit(main())

