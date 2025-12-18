"""QUALITY API endpoints."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.services.quality import QualityService
from backend.config import DATABASE_URL

router = APIRouter()
service = QualityService(DATABASE_URL)


@router.get("/overview")
def get_quality_overview(
    fase_avaliacao_id: Optional[int] = Query(None),
    fase_culpada_id: Optional[int] = Query(None)
):
    """Get quality overview."""
    try:
        return service.get_overview(
            fase_avaliacao_id=fase_avaliacao_id,
            fase_culpada_id=fase_culpada_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk")
def get_quality_risk(
    modelo_id: Optional[int] = Query(None),
    fase_culpada_id: Optional[int] = Query(None)
):
    """Get defect risk prediction (baseline)."""
    try:
        return service.get_risk(
            modelo_id=modelo_id,
            fase_culpada_id=fase_culpada_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

