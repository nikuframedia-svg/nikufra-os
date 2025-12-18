"""
Main ingestion orchestrator.
Coordinates streaming loader, validators, mappers, and batch upserts.
"""
import time
from typing import Dict, Any, Optional, List
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import structlog
import redis
import json

from app.ingestion.streaming_loader import StreamingExcelLoader, normalize_column_name
from app.ingestion.validators import VALIDATORS
from app.ingestion.mappers import MAPPERS, SHEET_TO_TABLE, TABLE_PRIMARY_KEYS
from app.ingestion.batch_upsert import batch_upsert, batch_insert_rejects
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from backend.config import DATABASE_URL, FOLHA_IA_PATH

logger = structlog.get_logger()

# Redis connection (optional, for distributed locks)
REDIS_URL = "redis://localhost:6379/0"
redis_client = None

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
    redis_client.ping()  # Test connection
except Exception as e:
    redis_client = None
    logger.warning("redis_not_available", message=f"Redis not available (optional), skipping distributed locks: {str(e)}")


class IngestionOrchestrator:
    """Orchestrates the entire ingestion process."""
    
    def __init__(
        self,
        file_path: Optional[str] = None,
        db_url: Optional[str] = None,
        batch_size: int = 5000
    ):
        """
        Initialize orchestrator.
        
        Args:
            file_path: Path to Excel file
            db_url: Database URL
            batch_size: Batch size for processing
        """
        self.file_path = file_path or FOLHA_IA_PATH
        self.db_url = db_url or DATABASE_URL
        self.engine = create_engine(self.db_url)
        self.batch_size = batch_size
        self.redis_client = redis_client
        
        # Ingestion order (master data first, then transactions)
        self.ingestion_order = [
            'Fases',           # Master: phases catalog
            'Modelos',         # Master: products
            'Funcionarios',    # Master: workers
            'FuncionariosFasesAptos',  # Master: worker skills
            'FasesStandardModelos',   # Master: product-phase standards
            'OrdensFabrico',   # Transaction: orders
            'FasesOrdemFabrico',  # Transaction: order phases
            'FuncionariosFaseOrdemFabrico',  # Transaction: phase workers
            'OrdemFabricoErros',  # Transaction: errors
        ]
    
    def create_ingestion_run(self) -> int:
        """
        Create a new ingestion run record.
        
        Returns:
            Run ID
        """
        with Session(self.engine) as session:
            result = session.execute(
                text("""
                    INSERT INTO ingestion_runs (status, total_sheets)
                    VALUES ('running', :total_sheets)
                    RETURNING run_id
                """),
                {'total_sheets': len(self.ingestion_order)}
            )
            run_id = result.scalar()
            session.commit()
            return run_id
    
    def update_ingestion_run(
        self,
        run_id: int,
        status: str = None,
        processed_sheets: int = None,
        processed_rows: int = None,
        rejected_rows: int = None,
        error_message: str = None
    ):
        """Update ingestion run status."""
        updates = []
        params = {'run_id': run_id}
        
        if status:
            updates.append("status = :status")
            params['status'] = status
        if processed_sheets is not None:
            updates.append("processed_sheets = :processed_sheets")
            params['processed_sheets'] = processed_sheets
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
    
    def create_sheet_run(
        self,
        run_id: int,
        sheet_name: str
    ) -> int:
        """Create sheet run record."""
        with Session(self.engine) as session:
            result = session.execute(
                text("""
                    INSERT INTO ingestion_sheet_runs 
                    (run_id, sheet_name, status, total_rows)
                    VALUES (:run_id, :sheet_name, 'running', 0)
                    RETURNING sheet_run_id
                """),
                {'run_id': run_id, 'sheet_name': sheet_name}
            )
            sheet_run_id = result.scalar()
            session.commit()
            return sheet_run_id
    
    def update_sheet_run(
        self,
        sheet_run_id: int,
        status: str = None,
        total_rows: int = None,
        processed_rows: int = None,
        rejected_rows: int = None,
        throughput: float = None,
        error_message: str = None
    ):
        """Update sheet run status."""
        updates = []
        params = {'sheet_run_id': sheet_run_id}
        
        if status:
            updates.append("status = :status")
            params['status'] = status
        if total_rows is not None:
            updates.append("total_rows = :total_rows")
            params['total_rows'] = total_rows
        if processed_rows is not None:
            updates.append("processed_rows = :processed_rows")
            params['processed_rows'] = processed_rows
        if rejected_rows is not None:
            updates.append("rejected_rows = :rejected_rows")
            params['rejected_rows'] = rejected_rows
        if throughput is not None:
            updates.append("throughput_rows_per_sec = :throughput")
            params['throughput'] = throughput
        if error_message:
            updates.append("error_message = :error_message")
            params['error_message'] = error_message
        if status in ('completed', 'failed'):
            updates.append("completed_at = now()")
        
        if updates:
            with Session(self.engine) as session:
                session.execute(
                    text(f"UPDATE ingestion_sheet_runs SET {', '.join(updates)} WHERE sheet_run_id = :sheet_run_id"),
                    params
                )
                session.commit()
    
    def ingest_sheet(
        self,
        run_id: int,
        sheet_name: str,
        loader: StreamingExcelLoader
    ) -> Dict[str, Any]:
        """
        Ingest a single sheet.
        
        Args:
            run_id: Ingestion run ID
            sheet_name: Sheet name
            loader: StreamingExcelLoader instance
        
        Returns:
            Stats dict
        """
        logger.info("ingesting_sheet", sheet=sheet_name, run_id=run_id)
        
        sheet_run_id = self.create_sheet_run(run_id, sheet_name)
        
        # Get mapper and validator
        mapper = MAPPERS.get(sheet_name)
        validator = VALIDATORS.get(sheet_name)
        table_name = SHEET_TO_TABLE.get(sheet_name)
        primary_keys = TABLE_PRIMARY_KEYS.get(table_name, [])
        
        if not mapper or not table_name:
            error_msg = f"No mapper or table mapping for sheet: {sheet_name}"
            logger.error("ingest_sheet_error", sheet=sheet_name, error=error_msg)
            self.update_sheet_run(sheet_run_id, status='failed', error_message=error_msg)
            return {'processed': 0, 'rejected': 0, 'error': error_msg}
        
        # Get header
        header = loader.get_header(sheet_name)
        header_normalized = [normalize_column_name(col) for col in header]
        
        # Prepare batches
        batch = []
        rejects = []
        total_processed = 0
        total_rejected = 0
        start_time = time.time()
        
        try:
            # Iterate rows
            for row_num, row_values in enumerate(loader.iter_rows(sheet_name), start=2):
                # Build row dict
                row_dict = dict(zip(header_normalized, row_values))
                
                # Map to database schema
                try:
                    mapped_row = mapper(row_dict)
                except Exception as e:
                    rejects.append({
                        'sheet_name': sheet_name,
                        'row_number': row_num,
                        'reason_code': 'MAPPING_ERROR',
                        'reason_detail': str(e),
                        'raw_json': json.dumps(row_dict, default=str)
                    })
                    total_rejected += 1
                    continue
                
                # Validate
                if validator:
                    is_valid, error_msg = validator(mapped_row, row_num)
                    if not is_valid:
                        rejects.append({
                            'sheet_name': sheet_name,
                            'row_number': row_num,
                            'reason_code': 'VALIDATION_ERROR',
                            'reason_detail': error_msg,
                            'raw_json': json.dumps(mapped_row, default=str)
                        })
                        total_rejected += 1
                        continue
                
                # Add to batch
                batch.append(mapped_row)
                
                # Process batch when full
                if len(batch) >= self.batch_size:
                    try:
                        batch_upsert(self.engine, table_name, batch, primary_keys, run_id)
                        total_processed += len(batch)
                        batch = []
                    except Exception as e:
                        logger.error("batch_upsert_error", sheet=sheet_name, error=str(e))
                        # Reject entire batch
                        for i, row in enumerate(batch):
                            rejects.append({
                                'sheet_name': sheet_name,
                                'row_number': row_num - len(batch) + i + 1,
                                'reason_code': 'UPSERT_ERROR',
                                'reason_detail': str(e),
                                'raw_json': json.dumps(row, default=str)
                            })
                        total_rejected += len(batch)
                        batch = []
            
            # Process remaining batch
            if batch:
                try:
                    batch_upsert(self.engine, table_name, batch, primary_keys, run_id)
                    total_processed += len(batch)
                except Exception as e:
                    logger.error("final_batch_upsert_error", sheet=sheet_name, error=str(e))
                    for i, row in enumerate(batch):
                        rejects.append({
                            'sheet_name': sheet_name,
                            'row_number': 0,  # Unknown row number
                            'reason_code': 'UPSERT_ERROR',
                            'reason_detail': str(e),
                            'raw_json': json.dumps(row, default=str)
                        })
                    total_rejected += len(batch)
            
            # Insert rejects
            if rejects:
                batch_insert_rejects(self.engine, table_name, rejects, run_id)
            
            # Calculate throughput
            elapsed = time.time() - start_time
            throughput = total_processed / elapsed if elapsed > 0 else 0
            
            # Update sheet run
            self.update_sheet_run(
                sheet_run_id,
                status='completed',
                total_rows=total_processed + total_rejected,
                processed_rows=total_processed,
                rejected_rows=total_rejected,
                throughput=throughput
            )
            
            logger.info(
                "sheet_ingested",
                sheet=sheet_name,
                processed=total_processed,
                rejected=total_rejected,
                throughput=throughput
            )
            
            return {
                'processed': total_processed,
                'rejected': total_rejected,
                'throughput': throughput
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error("ingest_sheet_exception", sheet=sheet_name, error=error_msg)
            self.update_sheet_run(sheet_run_id, status='failed', error_message=error_msg)
            return {'processed': total_processed, 'rejected': total_rejected, 'error': error_msg}
    
    def run(self) -> Dict[str, Any]:
        """
        Run full ingestion process.
        
        Returns:
            Final stats dict
        """
        # Acquire distributed lock
        lock_key = "ingestion:run"
        lock_acquired = False
        
        if self.redis_client:
            lock_acquired = self.redis_client.set(lock_key, "1", nx=True, ex=3600)  # 1 hour timeout
            if not lock_acquired:
                raise RuntimeError("Another ingestion process is already running")
        
        try:
            run_id = self.create_ingestion_run()
            logger.info("ingestion_started", run_id=run_id)
            
            total_processed = 0
            total_rejected = 0
            sheet_stats = {}
            
            with StreamingExcelLoader(self.file_path) as loader:
                for sheet_name in self.ingestion_order:
                    if sheet_name not in loader.get_sheet_names():
                        logger.warning("sheet_not_found", sheet=sheet_name)
                        continue
                    
                    stats = self.ingest_sheet(run_id, sheet_name, loader)
                    sheet_stats[sheet_name] = stats
                    total_processed += stats.get('processed', 0)
                    total_rejected += stats.get('rejected', 0)
                    
                    # Update main run
                    self.update_ingestion_run(
                        run_id,
                        processed_sheets=len([s for s in sheet_stats.values() if 'error' not in s]),
                        processed_rows=total_processed,
                        rejected_rows=total_rejected
                    )
            
            # Mark as completed
            self.update_ingestion_run(run_id, status='completed')
            
            logger.info(
                "ingestion_completed",
                run_id=run_id,
                total_processed=total_processed,
                total_rejected=total_rejected
            )
            
            return {
                'run_id': run_id,
                'total_processed': total_processed,
                'total_rejected': total_rejected,
                'sheet_stats': sheet_stats
            }
            
        finally:
            if lock_acquired and self.redis_client:
                self.redis_client.delete(lock_key)

