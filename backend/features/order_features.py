"""Order-level feature engineering."""
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
import pandas as pd

from backend.models import Order, OrderPhase, Product


def compute_order_lead_times(session: Session, product_id: Optional[int] = None, year: Optional[int] = None) -> pd.DataFrame:
    """
    Compute lead times for orders.
    
    Lead time = Of_DataAcabamento - Of_DataCriacao
    
    Args:
        session: Database session.
        product_id: Optional filter by product.
        year: Optional filter by year.
    
    Returns:
        DataFrame with order_id, lead_time_days, product_id, creation_date, completion_date.
    """
    query = session.query(
        Order.id,
        Order.of_id,
        Order.product_id,
        Order.creation_date,
        Order.completion_date,
        Product.product_code,
        Product.name.label("product_name"),
    ).join(Product, Order.product_id == Product.id, isouter=True)
    
    if product_id:
        query = query.filter(Order.product_id == product_id)
    
    if year:
        query = query.filter(extract("year", Order.creation_date) == year)
    
    # Only orders with both dates
    query = query.filter(
        Order.creation_date.isnot(None),
        Order.completion_date.isnot(None)
    )
    
    results = query.all()
    
    data = []
    for row in results:
        if row.creation_date and row.completion_date:
            delta = row.completion_date - row.creation_date
            lead_time_days = delta.total_seconds() / (24 * 3600)
            
            data.append({
                "order_id": row.id,
                "of_id": row.of_id,
                "product_id": row.product_id,
                "product_code": row.product_code,
                "product_name": row.product_name,
                "creation_date": row.creation_date,
                "completion_date": row.completion_date,
                "lead_time_days": lead_time_days,
                "lead_time_hours": lead_time_days * 24,
            })
    
    return pd.DataFrame(data)


def compute_order_statistics(session: Session) -> Dict:
    """
    Compute aggregate statistics for orders.
    
    Returns:
        Dictionary with statistics.
    """
    total_orders = session.query(func.count(Order.id)).scalar()
    
    completed_orders = session.query(func.count(Order.id)).filter(
        Order.completion_date.isnot(None)
    ).scalar()
    
    # Average lead time
    avg_lead_time = session.query(
        func.avg(
            func.extract("epoch", Order.completion_date - Order.creation_date) / 86400
        )
    ).filter(
        Order.creation_date.isnot(None),
        Order.completion_date.isnot(None)
    ).scalar()
    
    # Orders by product
    orders_by_product = session.query(
        Product.product_code,
        Product.name,
        func.count(Order.id).label("count")
    ).join(Order, Product.id == Order.product_id, isouter=True).group_by(
        Product.id, Product.product_code, Product.name
    ).all()
    
    return {
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "completion_rate": completed_orders / total_orders if total_orders > 0 else 0,
        "average_lead_time_days": avg_lead_time,
        "orders_by_product": [
            {"product_code": row.product_code, "name": row.name, "count": row.count}
            for row in orders_by_product
        ],
    }


