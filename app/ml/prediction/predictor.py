"""
ML prediction service with model registry integration.
"""
from typing import Dict, Any, Optional, List
from pathlib import Path
from sqlalchemy import create_engine, text
import pandas as pd
import joblib
import json
import structlog

logger = structlog.get_logger()


class MLPredictor:
    """ML prediction service."""
    
    def __init__(self, db_url: str, model_dir: Path = None):
        """
        Initialize predictor.
        
        Args:
            db_url: Database URL
            model_dir: Directory containing model artifacts
        """
        self.engine = create_engine(db_url)
        self.model_dir = Path(model_dir) if model_dir else Path("data/models")
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self._models = {}  # Cache loaded models
    
    def get_active_model(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get active model from registry."""
        query = text("""
            SELECT 
                model_id,
                model_name,
                version,
                artifact_path,
                metrics_json,
                features_hash
            FROM model_registry
            WHERE model_name = :model_name
              AND is_active = true
            ORDER BY created_at DESC
            LIMIT 1
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {"model_name": model_name})
            row = result.fetchone()
            
            if row:
                return {
                    "model_id": row[0],
                    "model_name": row[1],
                    "version": row[2],
                    "artifact_path": row[3],
                    "metrics": json.loads(row[4]) if row[4] else {},
                    "features_hash": row[5]
                }
        
        return None
    
    def predict_leadtime(
        self,
        modelo_id: int,
        features: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Predict lead time for an order.
        
        Args:
            modelo_id: Product model ID
            features: Optional feature overrides
        
        Returns:
            Prediction with baseline fallback
        """
        # Get active model
        model_info = self.get_active_model("leadtime_prediction")
        
        if not model_info:
            logger.warning("no_active_model", model_name="leadtime_prediction")
            # Fallback to baseline
            return self._predict_leadtime_baseline(modelo_id)
        
        # Load model if not cached
        if model_info["artifact_path"] not in self._models:
            model_path = self.model_dir / Path(model_info["artifact_path"]).name
            if not model_path.exists():
                logger.error("model_artifact_not_found", path=str(model_path))
                return self._predict_leadtime_baseline(modelo_id)
            
            self._models[model_info["artifact_path"]] = joblib.load(model_path)
        
        model = self._models[model_info["artifact_path"]]
        
        # Build features
        feature_vector = self._build_leadtime_features(modelo_id, features)
        
        # Predict
        prediction = model.predict([feature_vector])[0]
        
        return {
            "predicted_leadtime_hours": float(prediction),
            "model_name": model_info["model_name"],
            "model_version": model_info["version"],
            "prediction_method": "ml_model"
        }
    
    def _predict_leadtime_baseline(self, modelo_id: int) -> Dict[str, Any]:
        """Baseline prediction: sum of p50 durations."""
        query = text("""
            SELECT 
                AVG(p50_duration_minutes) as avg_p50,
                AVG(avg_real_duration_minutes) as avg_duration
            FROM mv_phase_durations_by_model
            WHERE modelo_id = :modelo_id
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {"modelo_id": modelo_id})
            row = result.fetchone()
            
            if row and row[0]:
                # Sum of average durations (simplified baseline)
                baseline_hours = (float(row[0]) or float(row[1]) or 0) / 60.0
            else:
                baseline_hours = 120.0  # Default fallback
        
        return {
            "predicted_leadtime_hours": baseline_hours,
            "model_name": "baseline",
            "model_version": "1.0",
            "prediction_method": "baseline_deterministic"
        }
    
    def _build_leadtime_features(
        self,
        modelo_id: int,
        feature_overrides: Optional[Dict[str, Any]]
    ) -> List[float]:
        """Build feature vector for lead time prediction."""
        # Query features from DB
        query = text("""
            SELECT 
                modelo_id,
                (SELECT COUNT(*) 
                 FROM fases_standard_modelos fsm 
                 WHERE fsm.modelo_id = :modelo_id) as n_phases_standard,
                AVG(avg_real_duration_minutes) as avg_duration,
                AVG(p50_duration_minutes) as p50_duration,
                AVG(p90_duration_minutes) as p90_duration
            FROM mv_phase_durations_by_model
            WHERE modelo_id = :modelo_id
            GROUP BY modelo_id
        """)
        
        with self.engine.connect() as conn:
            result = conn.execute(query, {"modelo_id": modelo_id})
            row = result.fetchone()
        
        # Build feature vector (simplified - would need to match training schema)
        features = [
            float(modelo_id) if modelo_id else 0.0,
            float(row[1]) if row and row[1] else 0.0,  # n_phases_standard
            float(row[2]) if row and row[2] else 0.0,  # avg_duration
            float(row[3]) if row and row[3] else 0.0,  # p50_duration
            float(row[4]) if row and row[4] else 0.0,  # p90_duration
        ]
        
        # Apply overrides
        if feature_overrides:
            # Would map overrides to feature positions
            pass
        
        return features
    
    def explain_prediction(
        self,
        modelo_id: int,
        prediction: float
    ) -> Dict[str, Any]:
        """
        Explain prediction (simplified - would use SHAP in production).
        
        Args:
            modelo_id: Product model ID
            prediction: Predicted value
        
        Returns:
            Explanation with top features
        """
        # Simplified explanation (would use SHAP in production)
        features = self._build_leadtime_features(modelo_id, None)
        
        return {
            "prediction": prediction,
            "top_features": [
                {"name": "modelo_id", "value": features[0], "contribution": 0.3},
                {"name": "n_phases_standard", "value": features[1], "contribution": 0.25},
                {"name": "avg_duration", "value": features[2], "contribution": 0.2},
            ],
            "explanation_method": "simplified"  # Would be "shap" in production
        }

