"""Suggestions router."""
from fastapi import APIRouter, HTTPException, Query
from backend.models.database import get_session
from backend.services.rd_service import RDService

router = APIRouter()

@router.get("")
def get_suggestions(mode: str = Query("resumo")):
    """Get R&D suggestions."""
    try:
        session = get_session()
        try:
            service = RDService(session)
            result = service.wp1_generate_suggestions()
            return {
                "count": len(result) if result else 0,
                "items": result or [],
            }
        finally:
            session.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


