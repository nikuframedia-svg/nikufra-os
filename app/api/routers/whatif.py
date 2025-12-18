"""WHAT-IF API endpoints."""
from fastapi import APIRouter, HTTPException, Body
from typing import Optional, Dict, Any
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.services.whatif import WhatIfService
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
service = WhatIfService(DATABASE_URL)


@router.post("/simulate")
def simulate(
    capacity_overrides: Optional[Dict[int, Dict[str, Any]]] = Body(None),
    coeficiente_overrides: Optional[Dict[str, Dict[str, float]]] = Body(None),
    priority_rule: str = Body("FIFO"),
    order_filter: Optional[Dict[str, Any]] = Body(None),
    api_key: str = require_api_key if HAS_AUTH else None
):
    """Run WHAT-IF simulation."""
    try:
        return service.simulate(
            capacity_overrides=capacity_overrides,
            coeficiente_overrides=coeficiente_overrides,
            priority_rule=priority_rule,
            order_filter=order_filter
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

