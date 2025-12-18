"""
Turbo Ingestion Orchestrator: Extract → Load → Merge pipeline.
Idempotent by checksum, ultra-fast with staging tables.
"""
from typing import Dict, Any, Optional
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import redis
import json
import structlog
import time

from app.ingestion.extract import ExcelExtractor
from app.ingestion.load import StagingLoader
from app.ingestion.merge import CoreMerger
from backend.config import DATABASE_URL, FOLHA_IA_PATH

logger = structlog.get_logger()

REDIS_URL = "redis://localhost:6379/0"
redis_client = None

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
    redis_client.ping()  # Test connection
except Exception as e:
    redis_client = None
    logger.warning(f"Redis not available (optional), skipping distributed locks: {str(e)}")


class TurboIngestionOrchestrator:
    """Orchestrates turbo ingestion pipeline."""
    
    def __init__(
        self,
        excel_path: Optional[str] = None,
        db_url: Optional[str] = None,
        processed_dir: Optional[Path] = None
    ):
        """
        Initialize orchestrator.
        
        Args:
            excel_path: Path to Excel file
            db_url: Database URL
            processed_dir: Directory for processed files
        """
        self.excel_path = excel_path or FOLHA_IA_PATH
        self.db_url = db_url or DATABASE_URL
        self.engine = create_engine(self.db_url)
        self.processed_dir = processed_dir or Path(__file__).parent.parent.parent / "data" / "processed"
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        self.redis_client = redis_client
        
        # Ingestion order (master data first)
        self.ingestion_order = [
            'Fases',
            'Modelos',
            'Funcionarios',
            'FuncionariosFasesAptos',
            'FasesStandardModelos',
            'OrdensFabrico',
            'FasesOrdemFabrico',
            'FuncionariosFaseOrdemFabrico',
            'OrdemFabricoErros',
        ]
    
    def create_ingestion_run(self, excel_checksum: str) -> int:
        """Create ingestion run record."""
        with Session(self.engine) as session:
            # Check if run with same checksum exists
            result = session.execute(
                text("""
                    SELECT run_id, status
                    FROM ingestion_runs
                    WHERE excel_sha256 = :checksum
                    ORDER BY run_id DESC
                    LIMIT 1
                """),
                {'checksum': excel_checksum}
            )
            existing = result.fetchone()
            
            if existing and existing[1] == 'completed':
                logger.info("Idempotent run detected", run_id=existing[0], checksum=excel_checksum)
                return existing[0]
            
            # Create new run
            result = session.execute(
                text("""
                    INSERT INTO ingestion_runs 
                    (status, total_sheets, excel_sha256)
                    VALUES ('running', :total_sheets, :checksum)
                    RETURNING run_id
                """),
                {'total_sheets': len(self.ingestion_order), 'checksum': excel_checksum}
            )
            run_id = result.scalar()
            session.commit()
            return run_id
    
    def update_ingestion_run(
        self,
        run_id: int,
        status: str = None,
        processed_rows: int = None,
        rejected_rows: int = None,
        error_message: str = None
    ):
        """Update ingestion run."""
        updates = []
        params = {'run_id': run_id}
        
        if status:
            updates.append("status = :status")
            params['status'] = status
        if processed_rows is not None:
            updates.append("processed_rows = processed_rows + :processed_rows")
            params['processed_rows'] = processed_rows
        if rejected_rows is not None:
            updates.append("rejected_rows = rejected_rows + :rejected_rows")
            params['rejected_rows'] = rejected_rows
        if error_message:
            updates.append("error_message = :error_message")
            params['error_message'] = error_message
        if status == 'completed':
            updates.append("completed_at = now()")
        
        if updates:
            with Session(self.engine) as session:
                session.execute(
                    text(f"UPDATE ingestion_runs SET {', '.join(updates)} WHERE run_id = :run_id"),
                    params
                )
                session.commit()
    
    def run(self) -> Dict[str, Any]:
        """
        Run full turbo ingestion pipeline.
        
        Returns:
            Final results
        """
        # Acquire lock
        lock_key = "ingestion:run"
        lock_acquired = False
        
        if self.redis_client:
            lock_acquired = self.redis_client.set(lock_key, "1", nx=True, ex=3600)
            if not lock_acquired:
                raise RuntimeError("Another ingestion process is already running")
        
        try:
            start_time = time.time()
            
            # PHASE 1: EXTRACT
            logger.info("Starting EXTRACT phase")
            with ExcelExtractor(self.excel_path, self.processed_dir) as extractor:
                extraction_results = extractor.extract_all()
            
            excel_checksum = extraction_results['excel_checksum']
            run_id = self.create_ingestion_run(excel_checksum)
            logger.info("Ingestion run created", run_id=run_id, checksum=excel_checksum)
            
            # Save extraction report
            extraction_report_path = self.processed_dir / "extraction_report.json"
            with open(extraction_report_path, 'w') as f:
                json.dump(extraction_results, f, indent=2)
            
            # PHASE 2: LOAD
            logger.info("Starting LOAD phase")
            loader = StagingLoader(self.db_url, self.processed_dir)
            load_results = loader.load_all(extraction_results)
            
            # Save load report
            load_report_path = self.processed_dir / "load_report.json"
            with open(load_report_path, 'w') as f:
                json.dump(load_results, f, indent=2)
            
            # PHASE 3: MERGE
            logger.info("Starting MERGE phase")
            merger = CoreMerger(self.db_url, run_id)
            merge_results = merger.merge_all(load_results)
            
            # Populate derived columns
            merger.populate_derived_columns()
            
            # Save merge report
            merge_report_path = self.processed_dir / "merge_report.json"
            with open(merge_report_path, 'w') as f:
                json.dump(merge_results, f, indent=2)
            logger.info("Merge report saved", path=str(merge_report_path))
            
            # Calculate totals
            total_processed = merge_results.get('total_processed', 0)
            total_rejected = merge_results.get('total_rejected', 0)
            
            # Update run
            self.update_ingestion_run(
                run_id,
                status='completed',
                processed_rows=total_processed,
                rejected_rows=total_rejected
            )
            
            elapsed = time.time() - start_time
            
            final_results = {
                'run_id': run_id,
                'excel_checksum': excel_checksum,
                'total_processed': total_processed,
                'total_rejected': total_rejected,
                'elapsed_seconds': round(elapsed, 2),
                'extraction': extraction_results,
                'load': load_results,
                'merge': merge_results
            }
            
            # PHASE 4: VALIDATE COUNTS
            logger.info("Starting VALIDATION phase")
            from app.ingestion.validate_counts import CountValidator
            validator = CountValidator(self.db_url)
            validation_results = validator.validate_all()
            
            # Generate CRITICAL_MISMATCHES.md if needed
            docs_dir = Path(__file__).parent.parent.parent / "docs"
            docs_dir.mkdir(parents=True, exist_ok=True)
            has_mismatches = validator.generate_critical_mismatches_report(
                docs_dir / "CRITICAL_MISMATCHES.md"
            )
            
            if has_mismatches:
                logger.error("critical_mismatches_found", count=len(validator.mismatches))
                final_results['validation'] = {
                    'status': 'FAILED',
                    'mismatches': validator.mismatches,
                    'message': 'Contagens não bateram com Excel - ver docs/CRITICAL_MISMATCHES.md'
                }
            else:
                logger.info("validation_passed", message="Todas as contagens batem com Excel")
                final_results['validation'] = {
                    'status': 'PASSED',
                    'message': 'Todas as contagens batem com Excel'
                }
            
            # PHASE 5: INCREMENT CACHE VERSION
            logger.info("Incrementing cache version")
            from app.ops.cache import get_cache
            cache = get_cache(self.db_url)
            cache.increment_cache_version()
            
            # PHASE 6: COMPUTE INITIAL AGGREGATES (async, não bloqueia)
            logger.info("Computing initial aggregates")
            try:
                from app.analytics.incremental_aggregates import IncrementalAggregates
                aggregates = IncrementalAggregates(self.db_url)
                # Compute for today and last 7 days
                from datetime import date, timedelta
                today = date.today()
                for i in range(7):
                    snapshot_date = today - timedelta(days=i)
                    aggregates.compute_all_incremental(snapshot_date, run_id)
                logger.info("initial_aggregates_computed")
            except Exception as e:
                logger.warning("aggregates_computation_failed", error=str(e))
            
            # Save final report in reports/ directory
            reports_dir = self.processed_dir / "reports"
            reports_dir.mkdir(parents=True, exist_ok=True)
            final_report_path = reports_dir / f"ingestion_{run_id}.json"
            with open(final_report_path, 'w') as f:
                json.dump(final_results, f, indent=2, default=str)
            
            # Also save in root for backwards compatibility
            legacy_report_path = self.processed_dir / "ingestion_report.json"
            with open(legacy_report_path, 'w') as f:
                json.dump(final_results, f, indent=2, default=str)
            
            logger.info(
                "Ingestion completed",
                run_id=run_id,
                total_processed=total_processed,
                total_rejected=total_rejected,
                elapsed_seconds=round(elapsed, 2),
                validation_passed=not has_mismatches
            )
            
            return final_results
            
        finally:
            if lock_acquired and self.redis_client:
                self.redis_client.delete(lock_key)


def main():
    """CLI entry point."""
    import sys
    
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
        ]
    )
    
    try:
        orchestrator = TurboIngestionOrchestrator()
        results = orchestrator.run()
        
        print("\n" + "="*80)
        print("TURBO INGESTION COMPLETED")
        print("="*80)
        print(f"Run ID: {results['run_id']}")
        print(f"Excel Checksum: {results['excel_checksum']}")
        print(f"Total Processed: {results['total_processed']:,}")
        print(f"Total Rejected: {results['total_rejected']:,}")
        print(f"Elapsed: {results['elapsed_seconds']:.2f}s")
        print("\nSheet Statistics:")
        for sheet, merge_result in results['merge']['results'].items():
            print(f"  {sheet}:")
            print(f"    Processed: {merge_result.get('processed', 0):,}")
            print(f"    Rejected: {merge_result.get('rejected', 0):,}")
            if 'throughput_rows_per_sec' in merge_result:
                print(f"    Throughput: {merge_result['throughput_rows_per_sec']:.0f} rows/sec")
        print("="*80)
        
        return 0
        
    except Exception as e:
        logger.error("Ingestion failed", error=str(e))
        print(f"\nERROR: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

