"""Bottleneck detection API endpoints."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.services.bottlenecks import BottleneckService
from backend.config import DATABASE_URL

router = APIRouter()
service = BottleneckService(DATABASE_URL)


@router.get("/bottlenecks")
def get_bottlenecks(
    top_n: int = Query(10, ge=1, le=50, description="Number of bottlenecks to return")
):
    """Get top bottlenecks by WIP age and queue size."""
    try:
        return {
            "bottlenecks": service.get_bottlenecks(top_n=top_n),
            "timestamp": None  # Would add current timestamp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk_queue")
def get_risk_queue(
    top_n: int = Query(20, ge=1, le=100, description="Number of at-risk orders to return")
):
    """Get orders at risk (due date < ETA)."""
    try:
        return {
            "at_risk_orders": service.get_risk_queue(top_n=top_n),
            "timestamp": None  # Would add current timestamp
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

