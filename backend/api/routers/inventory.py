"""Inventory router."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.models.database import get_session
from backend.services.inventory_service import InventoryService

router = APIRouter()

@router.get("/")
def get_inventory(
    classe: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    """Get inventory data."""
    try:
        session = get_session()
        try:
            service = InventoryService(session)
            
            # Parse classe filter (e.g., "AX", "BY")
            class_filter = None
            xyz_filter = None
            if classe and len(classe) == 2:
                class_filter = classe[0]  # A, B, or C
                xyz_filter = classe[1]    # X, Y, or Z
            
            result = service.get_inventory_skus(class_filter=class_filter, xyz_filter=xyz_filter)
            
            # Filter by search if provided
            if search:
                search_lower = search.lower()
                result = [sku for sku in result if search_lower in sku.get("sku", "").lower()]
            
            matrix = service.get_inventory_matrix()
            return {
                "skus": result,
                "matrix": matrix,
            }
        finally:
            session.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

