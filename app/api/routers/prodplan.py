"""
PRODPLAN API endpoints.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.services.prodplan import ProdplanService

# Import auth if available
try:
    from app.auth.api_key import get_api_key_dependency
    HAS_AUTH = True
except ImportError:
    HAS_AUTH = False

router = APIRouter()
_service = None

def get_service():
    """Lazy initialization of service to avoid import errors."""
    global _service
    if _service is None:
        try:
            from backend.config import DATABASE_URL
            import os
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            _service = ProdplanService(DATABASE_URL, redis_url=redis_url)
        except Exception as e:
            import logging
            logging.error(f"Failed to initialize ProdplanService: {e}")
            raise HTTPException(status_code=500, detail=f"Service initialization failed: {str(e)}")
    return _service


@router.get("/orders")
def get_orders(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    of_id: Optional[str] = None,
    produto_id: Optional[int] = Query(None, description="Product ID (CORRIGIDO: usar produto_id)"),  # CORRIGIDO
    modelo_id: Optional[int] = Query(None, deprecated=True, description="Deprecated: use produto_id"),  # Mantido para compatibilidade
    fase_id: Optional[int] = None,
    data_criacao_from: Optional[datetime] = None,
    data_criacao_to: Optional[datetime] = None,
    cursor: Optional[str] = None
):
    """Get orders with pagination and filters."""
    try:
        # Usar produto_id se fornecido, senão modelo_id (compatibilidade)
        product_id = produto_id or modelo_id
        return get_service().get_orders(
            limit=limit,
            offset=offset,
            of_id=of_id,
            modelo_id=product_id,  # Service ainda usa modelo_id internamente, mas mapeia para produto_id
            fase_id=fase_id,
            data_criacao_from=data_criacao_from,
            data_criacao_to=data_criacao_to,
            cursor=cursor
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{of_id}")
def get_order(of_id: str):
    """Get single order by ID."""
    order = get_service().get_order(of_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/orders/{of_id}/phases")
def get_order_phases(of_id: str):
    """Get phases for an order."""
    try:
        return get_service().get_order_phases(of_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedule/current")
def get_schedule_current(fase_id: Optional[int] = None):
    """Get current schedule (WIP and queue)."""
    try:
        result = get_service().get_schedule_current(fase_id=fase_id)
        # Ensure result is always a valid dict
        if not isinstance(result, dict):
            return {
                'wip_by_phase': {},
                'queue_by_phase': {},
                'timestamp': None
            }
        return result
    except Exception as e:
        import traceback
        import logging
        logging.error(f"Error in get_schedule_current: {e}\n{traceback.format_exc()}")
        # Return empty schedule instead of error
        return {
            'wip_by_phase': {},
            'queue_by_phase': {},
            'timestamp': None,
            'error': str(e)
        }


@router.get("/bottlenecks")
def get_bottlenecks(top_n: int = Query(10, ge=1, le=50)):
    """Get bottlenecks: fases com maior WIP age p90 e maior queue size."""
    try:
        from app.services.bottlenecks import BottleneckService
        from backend.config import DATABASE_URL
        bottlenecks_service = BottleneckService(DATABASE_URL)
        bottlenecks = bottlenecks_service.get_bottlenecks(top_n=top_n)
        return {
            "bottlenecks": bottlenecks,
            "generated_at": None  # Would add timestamp
        }
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/risk_queue")
def get_risk_queue(top_n: int = Query(20, ge=1, le=100)):
    """Get risk queue: ordens com due date e ETA acima, rankeadas."""
    try:
        from app.services.bottlenecks import BottleneckService
        from backend.config import DATABASE_URL
        bottlenecks_service = BottleneckService(DATABASE_URL)
        at_risk_orders = bottlenecks_service.get_risk_queue(top_n=top_n)
        return {
            "at_risk_orders": at_risk_orders,
            "generated_at": None  # Would add timestamp
        }
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)

