"""ML prediction API endpoints."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.ml.prediction.predictor import MLPredictor
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
predictor = MLPredictor(DATABASE_URL)


@router.get("/predict/leadtime")
def predict_leadtime(
    modelo_id: int = Query(..., description="Product model ID")
):
    """Predict lead time for an order."""
    try:
        return predictor.predict_leadtime(modelo_id=modelo_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/explain/leadtime")
def explain_leadtime(
    modelo_id: int = Query(..., description="Product model ID")
):
    """Explain lead time prediction."""
    try:
        prediction_result = predictor.predict_leadtime(modelo_id=modelo_id)
        explanation = predictor.explain_prediction(
            modelo_id=modelo_id,
            prediction=prediction_result["predicted_leadtime_hours"]
        )
        return explanation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train/leadtime")
def train_leadtime(api_key: str = require_api_key if HAS_AUTH else None):
    """Train lead time prediction model (protected)."""
    try:
        # TODO: Implement training
        return {
            "status": "ok",
            "message": "Training started",
            "model_version": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train/risk")
def train_risk(api_key: str = require_api_key if HAS_AUTH else None):
    """Train risk classification model (protected)."""
    try:
        # TODO: Implement training
        return {
            "status": "ok",
            "message": "Training started",
            "model_version": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

