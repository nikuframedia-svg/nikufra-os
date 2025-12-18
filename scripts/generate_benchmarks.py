#!/usr/bin/env python3
"""
Generate benchmark files for release gate A3.1.
Creates JSON files in docs/perf/ with benchmark results or NOT_MEASURED status.
"""
import sys
import json
import requests
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

PROJECT_ROOT = Path(__file__).parent.parent
DOCS_PERF_DIR = PROJECT_ROOT / "docs" / "perf"
DOCS_PERF_DIR.mkdir(parents=True, exist_ok=True)

# Critical endpoints to benchmark
ENDPOINTS = {
    "/api/prodplan/orders": {
        "method": "GET",
        "target_p95_ms": 400,
        "description": "List orders"
    },
    "/api/prodplan/orders/{id}": {
        "method": "GET",
        "target_p95_ms": 250,
        "description": "Get order by ID",
        "example_id": "OF001"  # Will be replaced if needed
    },
    "/api/prodplan/schedule/current": {
        "method": "GET",
        "target_p95_ms": 250,
        "description": "Current schedule"
    },
    "/api/kpis/overview": {
        "method": "GET",
        "target_p95_ms": 300,
        "description": "KPIs overview"
    },
    "/api/smartinventory/wip": {
        "method": "GET",
        "target_p95_ms": 300,
        "description": "WIP list"
    },
    "/api/quality/overview": {
        "method": "GET",
        "target_p95_ms": 300,
        "description": "Quality overview"
    }
}

BACKEND_URL = "http://localhost:8000"
TIMEOUT = 5  # seconds


def check_backend_available() -> bool:
    """Check if backend is running."""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=TIMEOUT)
        return response.status_code == 200
    except:
        return False


def measure_endpoint(endpoint: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """Measure endpoint performance."""
    method = config["method"]
    url = f"{BACKEND_URL}{endpoint}"
    
    # Replace placeholder IDs if needed
    if "{id}" in endpoint:
        # Try to get a real ID from /api/prodplan/orders first
        try:
            orders_resp = requests.get(f"{BACKEND_URL}/api/prodplan/orders", timeout=TIMEOUT)
            if orders_resp.status_code == 200:
                orders = orders_resp.json()
                if orders and len(orders) > 0:
                    first_id = orders[0].get("of_id") or orders[0].get("id")
                    if first_id:
                        url = url.replace("{id}", str(first_id))
        except:
            pass
    
    times = []
    errors = []
    
    # Run 10 requests to get p95
    for i in range(10):
        try:
            start = time.time()
            if method == "GET":
                response = requests.get(url, timeout=TIMEOUT, headers={
                    "X-API-Key": "dev-key"
                })
            else:
                response = requests.request(method, url, timeout=TIMEOUT, headers={
                    "X-API-Key": "dev-key"
                })
            
            elapsed_ms = (time.time() - start) * 1000
            times.append(elapsed_ms)
            
            if response.status_code >= 500:
                errors.append(f"HTTP {response.status_code}")
        except requests.exceptions.Timeout:
            errors.append("Timeout")
        except requests.exceptions.ConnectionError:
            errors.append("ConnectionError")
        except Exception as e:
            errors.append(str(e))
    
    if not times:
        return {
            "status": "NOT_MEASURED",
            "reason": f"All requests failed: {', '.join(set(errors))}",
            "errors": list(set(errors))
        }
    
    times.sort()
    p50_ms = times[len(times) // 2]
    p95_ms = times[int(len(times) * 0.95)]
    p99_ms = times[int(len(times) * 0.99)] if len(times) > 1 else times[-1]
    
    return {
        "status": "MEASURED",
        "p50_ms": round(p50_ms, 2),
        "p95_ms": round(p95_ms, 2),
        "p99_ms": round(p99_ms, 2),
        "target_p95_ms": config["target_p95_ms"],
        "meets_target": p95_ms <= config["target_p95_ms"],
        "min_ms": round(min(times), 2),
        "max_ms": round(max(times), 2),
        "avg_ms": round(sum(times) / len(times), 2),
        "errors": list(set(errors)) if errors else []
    }


def generate_benchmarks() -> Dict[str, Any]:
    """Generate benchmark results."""
    backend_available = check_backend_available()
    
    benchmarks = {
        "generated_at": datetime.now().isoformat(),
        "backend_available": backend_available,
        "backend_url": BACKEND_URL,
        "endpoints": {}
    }
    
    for endpoint, config in ENDPOINTS.items():
        if backend_available:
            print(f"📊 Measuring: {endpoint}...")
            result = measure_endpoint(endpoint, config)
            benchmarks["endpoints"][endpoint] = {
                **config,
                **result
            }
        else:
            benchmarks["endpoints"][endpoint] = {
                **config,
                "status": "NOT_MEASURED",
                "reason": "Backend not available. Start backend with: docker compose up -d api"
            }
    
    return benchmarks


def main():
    """Generate benchmark files."""
    print("="*80)
    print("GENERATE BENCHMARKS")
    print("="*80)
    print()
    
    backend_available = check_backend_available()
    if not backend_available:
        print(f"⚠️  Backend not available at {BACKEND_URL}")
        print(f"   Will generate benchmarks with NOT_MEASURED status")
        print()
    
    benchmarks = generate_benchmarks()
    
    # Write JSON file
    output_file = DOCS_PERF_DIR / "benchmarks.json"
    with open(output_file, 'w') as f:
        json.dump(benchmarks, f, indent=2)
    
    print(f"✅ Benchmarks generated: {output_file}")
    print()
    
    # Print summary
    print("Benchmark Summary:")
    for endpoint, data in benchmarks["endpoints"].items():
        status = data.get("status", "UNKNOWN")
        if status == "MEASURED":
            p95 = data.get("p95_ms", 0)
            target = data.get("target_p95_ms", 0)
            icon = "✅" if data.get("meets_target", False) else "❌"
            print(f"  {icon} {endpoint}: {p95}ms / {target}ms target")
        else:
            reason = data.get("reason", "Unknown")
            print(f"  ⏳ {endpoint}: {status} ({reason})")
    
    print()
    print("="*80)
    print("✅ BENCHMARKS GENERATED")
    print("="*80)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
