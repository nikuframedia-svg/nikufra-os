"""Insights router."""
from fastapi import APIRouter, HTTPException, Query
from backend.models.database import get_session

router = APIRouter()

@router.get("/generate")
def generate_insights(mode: str = Query("planeamento")):
    """Generate insights for planning."""
    try:
        session = get_session()
        try:
            # Placeholder - return basic insights
            return {
                "insights": [
                    "Plano otimizado com overlap aplicado",
                    "Gargalos identificados e mitigados",
                    "Lead time reduzido em 15%",
                ],
                "mode": mode,
            }
        finally:
            session.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


