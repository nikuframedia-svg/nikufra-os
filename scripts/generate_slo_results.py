#!/usr/bin/env python3
"""
Generate SLO_RESULTS.json from performance tests.
"""
import sys
import subprocess
import json
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).parent.parent
DOCS_PERF_DIR = PROJECT_ROOT / "docs" / "perf"
DOCS_PERF_DIR.mkdir(parents=True, exist_ok=True)
SLO_RESULTS_FILE = DOCS_PERF_DIR / "SLO_RESULTS.json"


def run_performance_tests():
    """Run performance tests and extract results."""
    print("⚡ Running performance tests...")
    
    # Always use python -m pytest (no PATH dependency)
    result = subprocess.run(
        ["python3", "-m", "pytest", "tests/performance/test_slos.py", "-v", "-m", "performance"],
        capture_output=True,
        text=True,
        cwd=PROJECT_ROOT,
        timeout=300
    )
    
    if result.returncode != 0:
        print(f"⚠️  Performance tests failed or not available")
        print(f"   Error: {result.stderr[:200] if result.stderr else result.stdout[:200]}")
        return None
    
    # Extract timing information from output (basic parsing)
    # This is a simplified version - full implementation would parse pytest-benchmark JSON
    return {"raw_output": result.stdout}


def generate_slo_results(benchmark_data=None):
    """Generate SLO_RESULTS.json."""
    slo_results = {
        "generated_at": datetime.now().isoformat(),
        "slos": {
            "/api/prodplan/orders": {
                "target_p95_ms": 400,
                "measured_p95_ms": None,
                "status": "NOT_MEASURED",
                "note": "Run pytest tests/performance/test_slos.py to measure"
            },
            "/api/prodplan/orders/{id}": {
                "target_p95_ms": 250,
                "measured_p95_ms": None,
                "status": "NOT_MEASURED",
                "note": "Run pytest tests/performance/test_slos.py to measure"
            },
            "/api/prodplan/schedule/current": {
                "target_p95_ms": 250,
                "measured_p95_ms": None,
                "status": "NOT_MEASURED",
                "note": "Run pytest tests/performance/test_slos.py to measure"
            },
            "/api/kpis/overview": {
                "target_p95_ms": 300,
                "measured_p95_ms": None,
                "status": "NOT_MEASURED",
                "note": "Run pytest tests/performance/test_slos.py to measure"
            }
        },
        "benchmark_data": benchmark_data
    }
    
    # If benchmark data available, update measured values
    if benchmark_data:
        # Extract p95 from benchmark data (structure depends on pytest-benchmark)
        # This is a placeholder - actual extraction depends on benchmark format
        pass
    
    with open(SLO_RESULTS_FILE, 'w') as f:
        json.dump(slo_results, f, indent=2)
    
    print(f"✅ SLO results generated: {SLO_RESULTS_FILE}")
    return slo_results


def main():
    """Generate SLO_RESULTS.json."""
    print("="*80)
    print("GENERATE SLO RESULTS")
    print("="*80)
    print()
    
    benchmark_data = run_performance_tests()
    slo_results = generate_slo_results(benchmark_data)
    
    print("\nSLO Status:")
    for endpoint, slo in slo_results["slos"].items():
        status = slo["status"]
        target = slo["target_p95_ms"]
        measured = slo.get("measured_p95_ms")
        if measured:
            status_icon = "✅" if measured <= target else "❌"
            print(f"  {status_icon} {endpoint}: {measured}ms / {target}ms target")
        else:
            print(f"  ⏳ {endpoint}: {status} (target: {target}ms)")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

