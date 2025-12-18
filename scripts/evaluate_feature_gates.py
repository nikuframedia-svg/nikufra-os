#!/usr/bin/env python3
"""
Feature Gate Evaluator - Gera FEATURE_GATES.json baseado em RELATIONSHIPS_REPORT.json
"""
import sys
import json
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

PROJECT_ROOT = Path(__file__).parent.parent
RELATIONSHIPS_REPORT = PROJECT_ROOT / "app" / "ingestion" / "RELATIONSHIPS_REPORT.json"
FEATURE_GATES_FILE = PROJECT_ROOT / "FEATURE_GATES.json"


def load_relationships_report() -> Dict[str, Any]:
    """Load RELATIONSHIPS_REPORT.json."""
    if not RELATIONSHIPS_REPORT.exists():
        print(f"⚠️  RELATIONSHIPS_REPORT.json not found: {RELATIONSHIPS_REPORT}")
        print(f"   This is expected if ingestion has not run yet.")
        print(f"   Generating FEATURE_GATES.json with default (disabled) gates.")
        # Return default structure with all gates disabled
        return {
            "generated_at": datetime.now().isoformat(),
            "relationships": {
                "FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id": {"match_rate": 0.0},
                "Produto_Id ↔ Of_ProdutoId": {"match_rate": 0.0}
            }
        }
    
    with open(RELATIONSHIPS_REPORT) as f:
        return json.load(f)


def evaluate_feature_gates(relationships: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluate feature gates based on match rates."""
    gates = {
        "generated_at": relationships.get("generated_at", ""),
        "gates": {}
    }
    
    # Gate 1: employee_productivity
    func_faseof_key = "FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id"
    func_faseof_data = relationships.get("relationships", {}).get(func_faseof_key, {})
    func_match_rate = func_faseof_data.get("match_rate", 0.0)
    
    gates["gates"]["employee_productivity"] = {
        "enabled": func_match_rate >= 0.90,
        "match_rate": func_match_rate,
        "threshold": 0.90,
        "reason": f"Match rate {func_match_rate:.1%} {'meets' if func_match_rate >= 0.90 else 'below'} threshold",
        "relationship": func_faseof_key
    }
    
    # Gate 2: produto_join (degraded but allowed)
    produto_key = "Produto_Id ↔ Of_ProdutoId"
    produto_data = relationships.get("relationships", {}).get(produto_key, {})
    produto_match_rate = produto_data.get("match_rate", 0.0)
    
    gates["gates"]["produto_join"] = {
        "enabled": True,  # Always enabled, but marked as degraded
        "degraded": produto_match_rate < 0.95,
        "match_rate": produto_match_rate,
        "threshold": 0.95,
        "reason": f"Match rate {produto_match_rate:.1%} {'meets' if produto_match_rate >= 0.95 else 'below'} threshold (degraded mode)",
        "orphans_count": produto_data.get("orphan_count", 0),
        "relationship": produto_key
    }
    
    return gates


def main():
    """Generate FEATURE_GATES.json."""
    print("🔍 Evaluating feature gates...")
    
    relationships = load_relationships_report()
    gates = evaluate_feature_gates(relationships)
    
    with open(FEATURE_GATES_FILE, 'w') as f:
        json.dump(gates, f, indent=2)
    
    print(f"✅ Feature gates generated: {FEATURE_GATES_FILE}")
    print(f"\nGate Status:")
    for gate_name, gate_data in gates["gates"].items():
        status = "✅ ENABLED" if gate_data.get("enabled") else "❌ DISABLED"
        if gate_data.get("degraded"):
            status += " (DEGRADED)"
        print(f"  {gate_name}: {status} (match_rate: {gate_data.get('match_rate', 0):.1%})")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

