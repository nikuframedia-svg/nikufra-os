"""
Main entry point for turbo ingestion.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.ingestion.orchestrator_turbo import TurboIngestionOrchestrator
import structlog

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

if __name__ == "__main__":
    try:
        orchestrator = TurboIngestionOrchestrator()
        results = orchestrator.run()
        
        # Check validation status
        validation_status = results.get('validation', {}).get('status', 'UNKNOWN')
        if validation_status == 'FAILED':
            print("\n❌ VALIDATION FAILED - Contagens não bateram com Excel", file=sys.stderr)
            print("   Ver: docs/CRITICAL_MISMATCHES.md", file=sys.stderr)
            sys.exit(1)
        
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ INGESTION FAILED: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

