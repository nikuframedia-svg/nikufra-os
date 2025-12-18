"""Planning router."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.models.database import get_session
from backend.services.planning_service import PlanningService

router = APIRouter()

@router.get("/v2/plano")
def get_plan_v2(
    batch_id: Optional[str] = Query(None),
    horizon_hours: int = Query(168, ge=1, le=720),
):
    """Get production plan v2 using real Excel data."""
    try:
        session = get_session()
        try:
            service = PlanningService(session)
            result = service.get_plan_v2(
                batch_id=batch_id,
                horizon_hours=horizon_hours,
                use_historical=True  # Use real historical data from Excel
            )
            if not result or not result.get('optimized') or not result['optimized'].get('operations'):
                raise HTTPException(status_code=404, detail="Plan not found. Please recalculate.")
            return result
        finally:
            session.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/v2/recalculate")
def recalculate_plan_v2(
    batch_id: Optional[str] = None,
    horizon_hours: int = 168,
):
    """Recalculate production plan v2."""
    try:
        session = get_session()
        try:
            service = PlanningService(session)
            result = service.get_plan_v2(batch_id=batch_id, horizon_hours=horizon_hours, force_recalculate=True)
            return result
        finally:
            session.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

