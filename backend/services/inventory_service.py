"""Service for smart inventory management (SMARTINVENTORY)."""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import math
import pandas as pd

from backend.models import Order, OrderPhase, Product


class InventoryService:
    """Service for inventory management, MRP, ROP calculations."""
    
    def __init__(self, session: Session):
        """
        Initialize service.
        
        Args:
            session: Database session.
        """
        self.session = session
    
    def calculate_rop(
        self,
        mu: float,
        sigma: float,
        lead_time_days: float,
        service_level: float = 0.95
    ) -> float:
        """
        Calculate Reorder Point (ROP) using classical formula.
        
        ROP = μ * L + z * σ * √L
        
        Args:
            mu: Average daily consumption.
            sigma: Standard deviation of daily consumption.
            lead_time_days: Lead time in days.
            service_level: Service level (0-1), default 0.95.
        
        Returns:
            Reorder point quantity.
        """
        # Z-score for service level (approximation)
        z_scores = {
            0.90: 1.28,
            0.95: 1.65,
            0.99: 2.33,
        }
        z = z_scores.get(service_level, 1.65)
        
        rop = mu * lead_time_days + z * sigma * math.sqrt(lead_time_days)
        return max(0.0, rop)
    
    def calculate_rupture_risk_30d(
        self,
        stock_current: float,
        mu: float,
        sigma: float,
        lead_time_days: float = 5.0
    ) -> float:
        """
        Calculate probability of stockout in next 30 days.
        
        Args:
            stock_current: Current stock level.
            mu: Average daily consumption.
            sigma: Standard deviation of daily consumption.
            lead_time_days: Lead time in days.
        
        Returns:
            Risk value between 0 and 1.
        """
        if stock_current <= 0:
            return 1.0
        
        # Expected consumption in 30 days
        expected_30d = mu * 30
        
        # Safety margin
        safety_margin = 1.65 * sigma * math.sqrt(30)  # 95% confidence
        
        # If stock is much higher than expected + safety, risk is low
        if stock_current >= expected_30d + safety_margin * 2:
            return 0.0
        
        # If stock is much lower than expected, risk is high
        if stock_current <= expected_30d - safety_margin:
            return 1.0
        
        # Linear interpolation (simplified - would use proper statistical model)
        risk = max(0.0, min(1.0, 1.0 - (stock_current / (expected_30d + safety_margin))))
        return risk
    
    def calculate_mrp(
        self,
        product_id: int,
        horizon_days: int = 90,
        moq: Optional[float] = None,
        multiple: Optional[float] = None
    ) -> List[Dict]:
        """
        Calculate Material Requirements Planning (MRP).
        
        Args:
            product_id: Product identifier.
            horizon_days: Planning horizon in days.
            moq: Minimum Order Quantity.
            multiple: Order quantity multiple.
        
        Returns:
            List of planned orders.
        """
        # Get orders for this product
        orders = self.session.query(Order).filter(
            Order.product_id == product_id,
            Order.creation_date >= datetime.now() - timedelta(days=horizon_days)
        ).all()
        
        # Calculate net requirements per period
        planned_orders = []
        
        # Group by week (simplified)
        current_date = datetime.now()
        for week in range(horizon_days // 7):
            week_start = current_date + timedelta(days=week * 7)
            week_end = week_start + timedelta(days=7)
            
            # Get orders in this week
            week_orders = [
                o for o in orders
                if o.creation_date and week_start <= o.creation_date < week_end
            ]
            
            # Calculate net requirement
            net_requirement = sum(float(o.quantity or 0) for o in week_orders)
            
            if net_requirement > 0:
                # Apply MOQ and multiples
                order_qty = net_requirement
                
                if moq and order_qty < moq:
                    order_qty = moq
                
                if multiple:
                    order_qty = math.ceil(order_qty / multiple) * multiple
                
                planned_orders.append({
                    'product_id': product_id,
                    'period_start': week_start.isoformat(),
                    'period_end': week_end.isoformat(),
                    'net_requirement': net_requirement,
                    'planned_order_qty': order_qty,
                    'moq_applied': moq is not None and net_requirement < moq,
                    'multiple_applied': multiple is not None,
                })
        
        return planned_orders
    
    def get_inventory_matrix(self) -> Dict:
        """
        Get ABC/XYZ classification matrix.
        
        Returns:
            Dictionary with matrix counts.
        """
        # Get all products with orders
        products = self.session.query(Product).join(Order).distinct().all()
        
        matrix = {
            'A': {'X': 0, 'Y': 0, 'Z': 0},
            'B': {'X': 0, 'Y': 0, 'Z': 0},
            'C': {'X': 0, 'Y': 0, 'Z': 0},
        }
        
        # Simplified classification (would use proper ABC/XYZ analysis)
        for product in products:
            # Get total value (simplified)
            orders = self.session.query(Order).filter(
                Order.product_id == product.id
            ).all()
            
            total_qty = sum(float(o.quantity or 0) for o in orders)
            
            # ABC classification (by quantity - simplified)
            if total_qty > 1000:
                abc = 'A'
            elif total_qty > 100:
                abc = 'B'
            else:
                abc = 'C'
            
            # XYZ classification (by variability - simplified)
            if len(orders) > 10:
                xyz = 'X'  # Stable
            elif len(orders) > 5:
                xyz = 'Y'  # Moderate
            else:
                xyz = 'Z'  # Erratic
            
            matrix[abc][xyz] = matrix[abc][xyz] + 1
        
        return matrix
    
    def get_inventory_skus(
        self,
        class_filter: Optional[str] = None,
        xyz_filter: Optional[str] = None
    ) -> List[Dict]:
        """
        Get inventory SKU data with classifications.
        
        Args:
            class_filter: Filter by ABC class (A, B, C).
            xyz_filter: Filter by XYZ class (X, Y, Z).
        
        Returns:
            List of SKU dictionaries with inventory metrics.
        """
        # Get all products - we'll match by product_code since product_id in orders may be product_code
        products = self.session.query(Product).all()
        
        skus = []
        
        for product in products:
            # Get orders for this product - try both id and product_code match
            orders = self.session.query(Order).filter(
                or_(
                    Order.product_id == product.id,
                    Order.product_id == int(product.product_code) if product.product_code and product.product_code.isdigit() else None
                )
            ).all()
            
            # Also try matching by product_code as string
            if not orders and product.product_code:
                try:
                    product_code_int = int(product.product_code)
                    orders = self.session.query(Order).filter(
                        Order.product_id == product_code_int
                    ).all()
                except (ValueError, TypeError):
                    pass
            
            if not orders:
                continue
            
            # Calculate metrics - use order count if quantity is not available
            total_qty = sum(float(o.quantity or 1) for o in orders)  # Default to 1 if None
            # Use number of orders as proxy for demand if quantity is missing
            if total_qty == len(orders):  # All quantities were None/defaulted
                total_qty = len(orders) * 10  # Estimate: 10 units per order
            avg_daily = total_qty / 180.0 if total_qty > 0 else len(orders) / 18.0  # 180 days average
            
            # ABC classification
            if total_qty > 1000:
                classe = 'A'
            elif total_qty > 100:
                classe = 'B'
            else:
                classe = 'C'
            
            # XYZ classification
            if len(orders) > 10:
                xyz = 'X'
            elif len(orders) > 5:
                xyz = 'Y'
            else:
                xyz = 'Z'
            
            # Apply filters
            if class_filter and classe != class_filter:
                continue
            if xyz_filter and xyz != xyz_filter:
                continue
            
            # Calculate ROP
            rop = self.calculate_rop(
                mu=avg_daily,
                sigma=avg_daily * 0.2,  # 20% variability
                lead_time_days=5.0
            )
            
            # Calculate risk
            stock_atual = total_qty * 0.3  # Simplified current stock
            risco_30d = self.calculate_rupture_risk_30d(
                stock_current=stock_atual,
                mu=avg_daily,
                sigma=avg_daily * 0.2
            )
            
            # Coverage days
            cobertura_dias = stock_atual / avg_daily if avg_daily > 0 else 0
            
            # Action recommendation
            if risco_30d > 0.7:
                acao = 'URGENTE - Repor stock'
            elif risco_30d > 0.4:
                acao = 'Monitorizar - Considerar reposição'
            elif stock_atual < rop:
                acao = 'Repor até ROP'
            else:
                acao = 'OK'
            
            skus.append({
                'sku': product.product_code or f"SKU{product.id}",
                'classe': classe,
                'xyz': xyz,
                'stock_atual': round(stock_atual, 2),
                'ads_180': round(avg_daily, 2),
                'cobertura_dias': round(cobertura_dias, 1),
                'risco_30d': round(risco_30d * 100, 1),  # As percentage
                'rop': round(rop, 2),
                'acao': acao,
            })
        
        return skus

