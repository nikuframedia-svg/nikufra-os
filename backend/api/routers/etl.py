"""ETL status router."""
from fastapi import APIRouter, HTTPException
from backend.models.database import get_session

router = APIRouter()

@router.get("/status")
def get_etl_status():
    """Get ETL ingestion status."""
    try:
        session = get_session()
        try:
            # Check if database has data
            from backend.models import Order, Product, Phase, Worker
            order_count = session.query(Order).count()
            product_count = session.query(Product).count()
            phase_count = session.query(Phase).count()
            worker_count = session.query(Worker).count()
            
            return {
                "status": "ready" if order_count > 0 else "empty",
                "orders": order_count,
                "products": product_count,
                "phases": phase_count,
                "workers": worker_count,
            }
        finally:
            session.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


