"""Ingestion API endpoints (protected)."""
from fastapi import APIRouter, HTTPException, Security
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.ingestion.orchestrator_turbo import TurboIngestionOrchestrator
from backend.config import DATABASE_URL

# Import auth
try:
    from app.auth.api_key import get_api_key_dependency
    require_api_key = get_api_key_dependency(required=True)
    HAS_AUTH = True
except ImportError:
    require_api_key = None
    HAS_AUTH = False

router = APIRouter()


@router.post("/run")
def run_ingestion(api_key: str = require_api_key if HAS_AUTH else None):
    """
    Run turbo ingestion (protected endpoint).
    
    Requires API key.
    """
    try:
        orchestrator = TurboIngestionOrchestrator()
        results = orchestrator.run()
        return {
            "status": "ok",
            "run_id": results.get("run_id"),
            "total_processed": results.get("total_processed"),
            "total_rejected": results.get("total_rejected"),
            "validation": results.get("validation", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{run_id}")
def get_ingestion_status(run_id: int):
    """Get ingestion run status."""
    from sqlalchemy import create_engine, text
    
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM ingestion_runs WHERE run_id = :run_id"),
            {"run_id": run_id}
        )
        row = result.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Run not found")
        
        return {
            "run_id": row[0],
            "status": row[1],
            "total_sheets": row[2],
            "processed_rows": row[3],
            "rejected_rows": row[4],
            "started_at": row[5].isoformat() if row[5] else None,
            "completed_at": row[6].isoformat() if row[6] else None,
        }

