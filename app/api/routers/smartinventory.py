"""SmartInventory API endpoints."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.services.smartinventory import SmartInventoryService

router = APIRouter()
_service = None

def get_service():
    """Lazy initialization of service to avoid import errors."""
    global _service
    if _service is None:
        from backend.config import DATABASE_URL
        _service = SmartInventoryService(DATABASE_URL)
    return _service


def is_db_connection_error(error: Exception) -> bool:
    """Check if error is a database connection error."""
    error_str = str(error).lower()
    return any(keyword in error_str for keyword in [
        "connection refused",
        "connection to server",
        "could not connect",
        "operationalerror",
        "psycopg2.operationalerror",
        "database",
        "postgresql",
    ])


def handle_db_error(error: Exception, endpoint: str):
    """Handle database errors by returning 503 with actionable message."""
    if is_db_connection_error(error):
        raise HTTPException(
            status_code=503,
            detail={
                "status": "BACKEND_DEPENDENCY_DOWN",
                "dependency": "postgres",
                "suggestion": "start db + set DATABASE_URL correctly",
                "endpoint": endpoint,
            }
        )
    raise error


@router.get("/wip")
def get_wip(
    fase_id: Optional[int] = Query(None),
    produto_id: Optional[int] = Query(None, description="Product ID (CORRIGIDO: usar produto_id)"),
    modelo_id: Optional[int] = Query(None, deprecated=True, description="Deprecated: use produto_id")
):
    """Get WIP (Work In Progress) by phase and optionally by product."""
    try:
        # Usar produto_id se fornecido, senão modelo_id (compatibilidade)
        product_id = produto_id or modelo_id
        return get_service().get_wip(fase_id=fase_id, produto_id=product_id)
    except HTTPException:
        raise
    except Exception as e:
        handle_db_error(e, "/api/smartinventory/wip")


@router.get("/wip_mass")
def get_wip_mass(
    fase_id: Optional[int] = Query(None),
    produto_id: Optional[int] = Query(None, description="Product ID"),
    modelo_id: Optional[int] = Query(None, deprecated=True, description="Deprecated: use produto_id")
):
    """Get estimated WIP mass by phase and product."""
    try:
        product_id = produto_id or modelo_id
        return get_service().get_wip_mass(fase_id=fase_id, produto_id=product_id)
    except HTTPException:
        raise
    except Exception as e:
        handle_db_error(e, "/api/smartinventory/wip_mass")


@router.get("/consumption_estimate")
def get_consumption_estimate(
    produto_id: Optional[int] = Query(None, description="Product ID (CORRIGIDO: usar produto_id)"),
    modelo_id: Optional[int] = Query(None, deprecated=True, description="Deprecated: use produto_id"),
    fase_id: Optional[int] = Query(None)
):
    """Get consumption estimates. Returns NOT_SUPPORTED_BY_DATA if not supported."""
    try:
        # Usar produto_id se fornecido, senão modelo_id (compatibilidade)
        product_id = produto_id or modelo_id
        return get_service().get_consumption_estimate(produto_id=product_id, fase_id=fase_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/gelcoat_theoretical_usage")
def get_gelcoat_theoretical_usage(
    produto_id: Optional[int] = Query(None, description="Product ID"),
    from_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get theoretical gelcoat usage (NOT real consumption)."""
    try:
        return get_service().get_gelcoat_theoretical_usage(
            produto_id=produto_id,
            from_date=from_date,
            to_date=to_date
        )
    except HTTPException:
        raise
    except Exception as e:
        handle_db_error(e, "/api/smartinventory/gelcoat_theoretical_usage")
