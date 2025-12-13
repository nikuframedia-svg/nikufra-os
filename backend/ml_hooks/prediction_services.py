"""Prediction services (stub implementations using baseline methods)."""
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import statistics

from backend.ml_hooks.schemas import (
    PredictOrderDurationRequest,
    PredictOrderDurationResponse,
    PredictPhaseDurationRequest,
    PredictPhaseDurationResponse,
    SuggestRouteRequest,
    SuggestRouteResponse,
    PhaseSequence,
)
from backend.models import Order, OrderPhase, Phase, Product, ProductPhaseStandard
from backend.features.feature_tables import OrderFeature, PhaseFeature


class OrderDurationPredictionService:
    """Service for predicting order duration."""
    
    def __init__(self, session: Session):
        """
        Initialize service.
        
        Args:
            session: Database session.
        """
        self.session = session
    
    def predict(self, request: PredictOrderDurationRequest) -> PredictOrderDurationResponse:
        """
        Predict order duration (baseline: mean/median from historical data).
        
        Args:
            request: Prediction request.
        
        Returns:
            Prediction response.
        """
        # Baseline: use historical mean
        query = self.session.query(
            func.avg(OrderFeature.lead_time_days).label("avg_days"),
        )
        
        # Filter by product if provided
        if request.product_id:
            query = query.join(Order, OrderFeature.order_id == Order.id).filter(
                Order.product_id == request.product_id
            )
        elif request.product_code:
            product = self.session.query(Product).filter(
                Product.product_code == request.product_code
            ).first()
            if product:
                query = query.join(Order, OrderFeature.order_id == Order.id).filter(
                    Order.product_id == product.id
                )
        
        result = query.first()
        
        if result and result.avg_days:
            predicted_days = float(result.avg_days)
            
            # Simple confidence interval (using std dev if available)
            std_query = self.session.query(
                func.stddev(OrderFeature.lead_time_days)
            )
            if request.product_id:
                std_query = std_query.join(Order, OrderFeature.order_id == Order.id).filter(
                    Order.product_id == request.product_id
                )
            
            std_result = std_query.scalar()
            std_days = float(std_result) if std_result else predicted_days * 0.2  # Fallback: 20% of mean
            
            # 95% confidence interval (assuming normal distribution)
            confidence_interval_lower = predicted_days - 1.96 * std_days
            confidence_interval_upper = predicted_days + 1.96 * std_days
            
            return PredictOrderDurationResponse(
                predicted_duration_days=predicted_days,
                predicted_duration_hours=predicted_days * 24,
                confidence_interval_lower=max(0, confidence_interval_lower),
                confidence_interval_upper=confidence_interval_upper,
                confidence_level=0.95,
                method="baseline_mean",
            )
        else:
            # Fallback: use overall mean
            overall_mean = self.session.query(
                func.avg(OrderFeature.lead_time_days)
            ).scalar()
            
            if overall_mean:
                predicted_days = float(overall_mean)
            else:
                # Ultimate fallback
                predicted_days = 7.0  # 7 days default
            
            return PredictOrderDurationResponse(
                predicted_duration_days=predicted_days,
                predicted_duration_hours=predicted_days * 24,
                confidence_interval_lower=predicted_days * 0.5,
                confidence_interval_upper=predicted_days * 1.5,
                confidence_level=0.95,
                method="baseline_fallback",
            )


class PhaseDurationPredictionService:
    """Service for predicting phase duration."""
    
    def __init__(self, session: Session):
        """
        Initialize service.
        
        Args:
            session: Database session.
        """
        self.session = session
    
    def predict(self, request: PredictPhaseDurationRequest) -> PredictPhaseDurationResponse:
        """
        Predict phase duration (baseline: mean from historical data).
        
        Args:
            request: Prediction request.
        
        Returns:
            Prediction response.
        """
        query = self.session.query(
            func.avg(PhaseFeature.real_duration_minutes).label("avg_minutes"),
        )
        
        # Filter by phase if provided
        if request.phase_id:
            query = query.join(OrderPhase, PhaseFeature.order_phase_id == OrderPhase.id).filter(
                OrderPhase.phase_id == request.phase_id
            )
        elif request.phase_code:
            phase = self.session.query(Phase).filter(
                Phase.phase_code == request.phase_code
            ).first()
            if phase:
                query = query.join(OrderPhase, PhaseFeature.order_phase_id == OrderPhase.id).filter(
                    OrderPhase.phase_id == phase.id
                )
        
        # Filter by product if provided
        if request.product_id or request.product_code:
            query = query.join(OrderPhase, PhaseFeature.order_phase_id == OrderPhase.id).join(
                Order, OrderPhase.of_id == Order.id
            )
            if request.product_id:
                query = query.filter(Order.product_id == request.product_id)
            elif request.product_code:
                product = self.session.query(Product).filter(
                    Product.product_code == request.product_code
                ).first()
                if product:
                    query = query.filter(Order.product_id == product.id)
        
        result = query.first()
        
        if result and result.avg_minutes:
            predicted_minutes = float(result.avg_minutes)
            
            # Simple confidence interval
            std_query = self.session.query(
                func.stddev(PhaseFeature.real_duration_minutes)
            )
            std_result = std_query.scalar()
            std_minutes = float(std_result) if std_result else predicted_minutes * 0.2
            
            confidence_interval_lower = predicted_minutes - 1.96 * std_minutes
            confidence_interval_upper = predicted_minutes + 1.96 * std_minutes
            
            return PredictPhaseDurationResponse(
                predicted_duration_minutes=predicted_minutes,
                predicted_duration_hours=predicted_minutes / 60.0,
                confidence_interval_lower=max(0, confidence_interval_lower),
                confidence_interval_upper=confidence_interval_upper,
                confidence_level=0.95,
                method="baseline_mean",
            )
        else:
            # Fallback: use standard duration from phase catalog
            if request.phase_id:
                phase = self.session.query(Phase).filter(Phase.id == request.phase_id).first()
            elif request.phase_code:
                phase = self.session.query(Phase).filter(Phase.phase_code == request.phase_code).first()
            else:
                phase = None
            
            if phase and phase.standard_duration_minutes:
                predicted_minutes = float(phase.standard_duration_minutes)
            else:
                predicted_minutes = 60.0  # 1 hour default
            
            return PredictPhaseDurationResponse(
                predicted_duration_minutes=predicted_minutes,
                predicted_duration_hours=predicted_minutes / 60.0,
                confidence_interval_lower=predicted_minutes * 0.5,
                confidence_interval_upper=predicted_minutes * 1.5,
                confidence_level=0.95,
                method="baseline_standard",
            )


class RouteSuggestionService:
    """Service for suggesting production routes/sequences."""
    
    def __init__(self, session: Session):
        """
        Initialize service.
        
        Args:
            session: Database session.
        """
        self.session = session
    
    def suggest(self, request: SuggestRouteRequest) -> SuggestRouteResponse:
        """
        Suggest production route/sequence (baseline: use standard route from ProductPhaseStandard).
        
        Args:
            request: Suggestion request.
        
        Returns:
            Suggestion response.
        """
        # Get product
        product = None
        if request.product_id:
            product = self.session.query(Product).filter(Product.id == request.product_id).first()
        elif request.product_code:
            product = self.session.query(Product).filter(Product.product_code == request.product_code).first()
        
        if not product:
            # Return empty sequence
            return SuggestRouteResponse(
                suggested_sequence=[],
                total_estimated_duration_minutes=0.0,
                total_estimated_duration_hours=0.0,
                method="baseline_standard_not_found",
            )
        
        # Get standard route
        standard_phases = self.session.query(
            ProductPhaseStandard,
            Phase
        ).join(
            Phase, ProductPhaseStandard.phase_id == Phase.id
        ).filter(
            ProductPhaseStandard.product_id == product.id
        ).order_by(
            ProductPhaseStandard.sequence_order
        ).all()
        
        if not standard_phases:
            return SuggestRouteResponse(
                suggested_sequence=[],
                total_estimated_duration_minutes=0.0,
                total_estimated_duration_hours=0.0,
                method="baseline_standard_no_route",
            )
        
        # Build sequence
        sequence = []
        total_minutes = 0.0
        
        for std_phase, phase in standard_phases:
            # Get estimated duration (use standard or historical average)
            duration = float(std_phase.standard_duration_minutes) if std_phase.standard_duration_minutes else None
            
            if not duration:
                # Try to get from phase catalog
                duration = float(phase.standard_duration_minutes) if phase.standard_duration_minutes else 60.0
            
            sequence.append(PhaseSequence(
                phase_id=phase.id,
                phase_code=phase.phase_code,
                phase_name=phase.name,
                sequence_order=std_phase.sequence_order,
                estimated_duration_minutes=duration,
            ))
            
            total_minutes += duration
        
        return SuggestRouteResponse(
            suggested_sequence=sequence,
            total_estimated_duration_minutes=total_minutes,
            total_estimated_duration_hours=total_minutes / 60.0,
            confidence_score=0.8,  # Baseline confidence
            method="baseline_standard_route",
        )

