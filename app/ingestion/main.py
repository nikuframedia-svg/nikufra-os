"""
Main entry point for ingestion.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.ingestion.orchestrator import IngestionOrchestrator
import structlog

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger()


def main():
    """Run ingestion."""
    try:
        orchestrator = IngestionOrchestrator()
        results = orchestrator.run()
        
        print("\n" + "="*80)
        print("INGESTION COMPLETED")
        print("="*80)
        print(f"Run ID: {results['run_id']}")
        print(f"Total Processed: {results['total_processed']:,}")
        print(f"Total Rejected: {results['total_rejected']:,}")
        print("\nSheet Statistics:")
        for sheet, stats in results['sheet_stats'].items():
            print(f"  {sheet}:")
            print(f"    Processed: {stats.get('processed', 0):,}")
            print(f"    Rejected: {stats.get('rejected', 0):,}")
            if 'throughput' in stats:
                print(f"    Throughput: {stats['throughput']:.2f} rows/sec")
            if 'error' in stats:
                print(f"    Error: {stats['error']}")
        print("="*80)
        
        return 0
        
    except Exception as e:
        logger.error("ingestion_failed", error=str(e))
        print(f"\nERROR: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

