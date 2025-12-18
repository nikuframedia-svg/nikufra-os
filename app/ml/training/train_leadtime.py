"""
Train lead time prediction models (baseline + sklearn + PyTorch).
"""
from typing import Dict, Any
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
import joblib
import json
import structlog

logger = structlog.get_logger()


def compute_baseline(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Compute baseline metrics."""
    mae = mean_absolute_error(y_true, y_pred)
    mape = mean_absolute_percentage_error(y_true, y_pred)
    p90_error = np.percentile(np.abs(y_true - y_pred), 90)
    
    return {
        "mae": float(mae),
        "mape": float(mape),
        "p90_error": float(p90_error)
    }


def train_leadtime_baseline(
    train_path: str,
    val_path: str,
    test_path: str,
    feature_cols: list
) -> Dict[str, Any]:
    """
    Train baseline model (deterministic: sum of p50 durations).
    
    Returns:
        Model metrics and artifact path
    """
    logger.info("training_baseline_leadtime")
    
    train_df = pd.read_parquet(train_path)
    val_df = pd.read_parquet(val_path)
    test_df = pd.read_parquet(test_path)
    
    # Baseline: use p50_duration_minutes if available, else avg
    if 'p50_duration_minutes' in train_df.columns:
        baseline_pred_train = train_df['p50_duration_minutes'].fillna(
            train_df['avg_real_duration_minutes']
        ).fillna(train_df['leadtime_hours'] * 60)  # Fallback to actual
        baseline_pred_val = val_df['p50_duration_minutes'].fillna(
            val_df['avg_real_duration_minutes']
        ).fillna(val_df['leadtime_hours'] * 60)
        baseline_pred_test = test_df['p50_duration_minutes'].fillna(
            test_df['avg_real_duration_minutes']
        ).fillna(test_df['leadtime_hours'] * 60)
    else:
        # Simple mean
        mean_leadtime = train_df['leadtime_hours'].mean()
        baseline_pred_train = np.full(len(train_df), mean_leadtime)
        baseline_pred_val = np.full(len(val_df), mean_leadtime)
        baseline_pred_test = np.full(len(test_df), mean_leadtime)
    
    # Convert to hours
    baseline_pred_train = baseline_pred_train / 60.0
    baseline_pred_val = baseline_pred_val / 60.0
    baseline_pred_test = baseline_pred_test / 60.0
    
    metrics = {
        "train": compute_baseline(train_df['leadtime_hours'].values, baseline_pred_train.values),
        "val": compute_baseline(val_df['leadtime_hours'].values, baseline_pred_val.values),
        "test": compute_baseline(test_df['leadtime_hours'].values, baseline_pred_test.values)
    }
    
    logger.info("baseline_trained", metrics=metrics)
    
    return {
        "model_type": "baseline",
        "metrics": metrics,
        "artifact_path": None  # No artifact for baseline
    }


def train_leadtime_sklearn(
    train_path: str,
    val_path: str,
    test_path: str,
    feature_cols: list,
    model_type: str = "gradient_boosting",
    output_dir: Path = None
) -> Dict[str, Any]:
    """
    Train sklearn model for lead time prediction.
    
    Args:
        train_path: Training data path
        val_path: Validation data path
        test_path: Test data path
        feature_cols: Feature column names
        model_type: "gradient_boosting" or "random_forest"
        output_dir: Output directory for artifacts
    
    Returns:
        Model metrics and artifact path
    """
    logger.info("training_sklearn_leadtime", model_type=model_type)
    
    train_df = pd.read_parquet(train_path)
    val_df = pd.read_parquet(val_path)
    test_df = pd.read_parquet(test_path)
    
    X_train = train_df[feature_cols].fillna(0)
    y_train = train_df['leadtime_hours']
    X_val = val_df[feature_cols].fillna(0)
    y_val = val_df['leadtime_hours']
    X_test = test_df[feature_cols].fillna(0)
    y_test = test_df['leadtime_hours']
    
    # Train model
    if model_type == "gradient_boosting":
        model = GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)
    else:
        model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred_train = model.predict(X_train)
    y_pred_val = model.predict(X_val)
    y_pred_test = model.predict(X_test)
    
    # Metrics
    metrics = {
        "train": compute_baseline(y_train.values, y_pred_train),
        "val": compute_baseline(y_val.values, y_pred_val),
        "test": compute_baseline(y_test.values, y_pred_test)
    }
    
    # Save artifact
    if output_dir:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        artifact_path = output_dir / f"leadtime_{model_type}.joblib"
        joblib.dump(model, artifact_path)
        
        # Save feature schema
        schema = {
            "feature_cols": feature_cols,
            "model_type": model_type
        }
        schema_path = output_dir / f"leadtime_{model_type}_schema.json"
        with open(schema_path, 'w') as f:
            json.dump(schema, f, indent=2)
    else:
        artifact_path = None
    
    logger.info("sklearn_trained", metrics=metrics, artifact_path=str(artifact_path) if artifact_path else None)
    
    return {
        "model_type": model_type,
        "metrics": metrics,
        "artifact_path": str(artifact_path) if artifact_path else None
    }

