"""Pydantic schemas for prediction requests and responses."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PredictOrderDurationRequest(BaseModel):
    """Request for order duration prediction."""
    product_id: Optional[int] = None
    product_code: Optional[str] = None
    phase_count: Optional[int] = None
    quantity: Optional[float] = None
    priority: Optional[int] = None
    creation_date: Optional[datetime] = None


class PredictOrderDurationResponse(BaseModel):
    """Response for order duration prediction."""
    predicted_duration_days: float = Field(..., description="Predicted duration in days")
    predicted_duration_hours: float = Field(..., description="Predicted duration in hours")
    confidence_interval_lower: Optional[float] = Field(None, description="Lower bound of confidence interval (days)")
    confidence_interval_upper: Optional[float] = Field(None, description="Upper bound of confidence interval (days)")
    confidence_level: float = Field(0.95, description="Confidence level (e.g., 0.95 for 95%)")
    model_version: Optional[str] = Field(None, description="Version of model used")
    method: str = Field(..., description="Method used (e.g., 'baseline_mean', 'ml_model')")


class PredictPhaseDurationRequest(BaseModel):
    """Request for phase duration prediction."""
    phase_id: Optional[int] = None
    phase_code: Optional[str] = None
    product_id: Optional[int] = None
    product_code: Optional[str] = None
    machine_id: Optional[str] = None
    worker_id: Optional[int] = None
    order_priority: Optional[int] = None


class PredictPhaseDurationResponse(BaseModel):
    """Response for phase duration prediction."""
    predicted_duration_minutes: float = Field(..., description="Predicted duration in minutes")
    predicted_duration_hours: float = Field(..., description="Predicted duration in hours")
    confidence_interval_lower: Optional[float] = Field(None, description="Lower bound (minutes)")
    confidence_interval_upper: Optional[float] = Field(None, description="Upper bound (minutes)")
    confidence_level: float = Field(0.95, description="Confidence level")
    model_version: Optional[str] = Field(None, description="Version of model used")
    method: str = Field(..., description="Method used")


class SuggestRouteRequest(BaseModel):
    """Request for route/sequence suggestion."""
    product_id: Optional[int] = None
    product_code: Optional[str] = None
    constraints: Optional[List[str]] = Field(None, description="List of constraints (e.g., 'machine_availability', 'worker_skills')")
    optimization_goal: Optional[str] = Field("minimize_time", description="Optimization goal: minimize_time, minimize_cost, etc.")


class PhaseSequence(BaseModel):
    """A phase in a suggested sequence."""
    phase_id: int
    phase_code: str
    phase_name: str
    sequence_order: int
    estimated_duration_minutes: float
    estimated_start: Optional[datetime] = None
    estimated_end: Optional[datetime] = None


class SuggestRouteResponse(BaseModel):
    """Response for route suggestion."""
    suggested_sequence: List[PhaseSequence] = Field(..., description="Suggested phase sequence")
    total_estimated_duration_minutes: float = Field(..., description="Total estimated duration")
    total_estimated_duration_hours: float = Field(..., description="Total estimated duration in hours")
    confidence_score: Optional[float] = Field(None, description="Confidence in the suggestion (0-1)")
    model_version: Optional[str] = Field(None, description="Version of model used")
    method: str = Field(..., description="Method used")


class SuggestSequenceRequest(BaseModel):
    """Request for sequence suggestion (alias for SuggestRouteRequest)."""
    product_id: Optional[int] = None
    product_code: Optional[str] = None
    constraints: Optional[List[str]] = None
    optimization_goal: Optional[str] = "minimize_time"


class SuggestSequenceResponse(BaseModel):
    """Response for sequence suggestion (alias for SuggestRouteResponse)."""
    suggested_sequence: List[PhaseSequence]
    total_estimated_duration_minutes: float
    total_estimated_duration_hours: float
    confidence_score: Optional[float] = None
    model_version: Optional[str] = None
    method: str



