"""What-If router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.models.database import get_session
from backend.services.whatif_service import WhatIfService

router = APIRouter()

class VIPRequest(BaseModel):
    sku: str
    quantidade: int
    prazo: str

class AvariaRequest(BaseModel):
    recurso: str
    de: str
    ate: str

@router.post("/vip")
def simulate_vip(request: VIPRequest):
    """Simulate VIP order."""
    try:
        session = get_session()
        try:
            service = WhatIfService(session)
            result = service.simulate_vip_order(request.sku, request.quantidade, request.prazo)
            return result
        finally:
            session.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/avaria")
def simulate_avaria(request: AvariaRequest):
    """Simulate machine breakdown."""
    try:
        session = get_session()
        try:
            service = WhatIfService(session)
            result = service.simulate_machine_breakdown(request.recurso, request.de, request.ate)
            return result
        finally:
            session.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


