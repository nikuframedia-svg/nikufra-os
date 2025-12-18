"""Bottlenecks router."""
from fastapi import APIRouter, HTTPException
from backend.models.database import get_session
from backend.services.bottleneck_service import BottleneckService

router = APIRouter()

@router.get("/")
def get_bottlenecks():
    """Get bottlenecks data."""
    try:
        session = get_session()
        try:
            service = BottleneckService(session)
            bottlenecks = service.get_current_bottlenecks(top_n=5)
            
            # Format for frontend
            formatted_bottlenecks = []
            for b in bottlenecks:
                formatted_bottlenecks.append({
                    "recurso": b.get("phase_code", "N/A"),
                    "utilizacao_pct": min(100.0, b.get("bottleneck_score", 0.0) * 100),
                    "fila_horas": b.get("avg_queue_minutes", 0.0) / 60.0,
                    "probabilidade": b.get("bottleneck_score", 0.0),
                    "drivers": [f"Phase: {b.get('phase_name', 'N/A')}"],
                    "acao": "Monitorizar e otimizar",
                    "impacto_otd": 5.0,
                    "impacto_horas": b.get("avg_queue_minutes", 0.0) / 60.0,
                })
            
            return {
                "bottlenecks": formatted_bottlenecks,
                "top_losses": formatted_bottlenecks[:5],
                "heatmap": [],
                "overlap_applied": {"transformacao": 0.0, "acabamentos": 0.0, "embalagem": 0.0},
                "lead_time_gain": 0.0,
            }
        finally:
            session.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

