"""
Build dataset for lead time prediction (T1).
Label: data_acabamento - data_criacao
"""
from typing import Dict, Any, List
from pathlib import Path
from sqlalchemy import create_engine, text
import pandas as pd
import hashlib
import json
import structlog

logger = structlog.get_logger()


def build_leadtime_dataset(
    db_url: str,
    output_dir: Path,
    train_split_date: str = "2023-01-01",
    val_split_date: str = "2024-01-01"
) -> Dict[str, Any]:
    """
    Build lead time prediction dataset.
    
    Args:
        db_url: Database URL
        output_dir: Output directory for datasets
        train_split_date: Split date for train/val
        val_split_date: Split date for val/test
    
    Returns:
        Dataset metadata with paths and hashes
    """
    logger.info("building_leadtime_dataset", train_split=train_split_date, val_split=val_split_date)
    
    engine = create_engine(db_url)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Query orders with completed dates
    query = text("""
        SELECT 
            of.of_id,
            of.of_produto_id as modelo_id,
            of.of_data_criacao,
            of.of_data_acabamento,
            EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao)) / 3600.0 as leadtime_hours,
            -- Features from materialized view
            mv.avg_real_duration_minutes,
            mv.p50_duration_minutes,
            mv.p90_duration_minutes,
            -- Number of phases in standard route
            (SELECT COUNT(*) 
             FROM fases_standard_modelos fsm 
             WHERE fsm.modelo_id = of.of_produto_id) as n_phases_standard,
            -- Product features
            m.peso_desmolde,
            m.peso_acabamento,
            m.qtd_gel_deck,
            m.qtd_gel_casco
        FROM ordens_fabrico of
        JOIN modelos m ON of.of_produto_id = m.modelo_id
        LEFT JOIN mv_phase_durations_by_model mv ON 
            mv.modelo_id = of.of_produto_id
        WHERE of.of_data_criacao IS NOT NULL
          AND of.of_data_acabamento IS NOT NULL
          AND of.of_data_acabamento >= of.of_data_criacao
          AND EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao)) / 3600.0 > 0
          AND EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao)) / 3600.0 < 10000  -- Sanity check
    """)
    
    with engine.connect() as conn:
        df = pd.read_sql(query, conn)
    
    logger.info("dataset_loaded", n_rows=len(df))
    
    # Feature engineering
    df['modelo_id_encoded'] = df['modelo_id'].astype('category').cat.codes
    df['has_peso'] = (df['peso_desmolde'].notna() | df['peso_acabamento'].notna()).astype(int)
    df['peso_total'] = (df['peso_desmolde'].fillna(0) + df['peso_acabamento'].fillna(0))
    
    # Select features
    feature_cols = [
        'modelo_id_encoded',
        'n_phases_standard',
        'avg_real_duration_minutes',
        'p50_duration_minutes',
        'p90_duration_minutes',
        'peso_total',
        'qtd_gel_deck',
        'qtd_gel_casco',
        'has_peso'
    ]
    
    # Remove rows with missing critical features
    df_clean = df.dropna(subset=['leadtime_hours'] + [c for c in feature_cols if c in df.columns])
    
    # Split temporally
    df_clean['of_data_criacao'] = pd.to_datetime(df_clean['of_data_criacao'])
    
    train_df = df_clean[df_clean['of_data_criacao'] < train_split_date].copy()
    val_df = df_clean[
        (df_clean['of_data_criacao'] >= train_split_date) & 
        (df_clean['of_data_criacao'] < val_split_date)
    ].copy()
    test_df = df_clean[df_clean['of_data_criacao'] >= val_split_date].copy()
    
    logger.info(
        "dataset_split",
        train=len(train_df),
        val=len(val_df),
        test=len(test_df)
    )
    
    # Save datasets
    train_path = output_dir / "leadtime_train.parquet"
    val_path = output_dir / "leadtime_val.parquet"
    test_path = output_dir / "leadtime_test.parquet"
    
    train_df[feature_cols + ['leadtime_hours', 'of_id']].to_parquet(train_path)
    val_df[feature_cols + ['leadtime_hours', 'of_id']].to_parquet(val_path)
    test_df[feature_cols + ['leadtime_hours', 'of_id']].to_parquet(test_path)
    
    # Compute hash for versioning
    dataset_hash = hashlib.sha256(
        json.dumps({
            "n_train": len(train_df),
            "n_val": len(val_df),
            "n_test": len(test_df),
            "features": feature_cols,
            "train_split": train_split_date,
            "val_split": val_split_date
        }, sort_keys=True).encode()
    ).hexdigest()[:16]
    
    metadata = {
        "dataset_name": "leadtime_prediction",
        "version_hash": dataset_hash,
        "train_path": str(train_path),
        "val_path": str(val_path),
        "test_path": str(test_path),
        "feature_cols": feature_cols,
        "label_col": "leadtime_hours",
        "n_train": len(train_df),
        "n_val": len(val_df),
        "n_test": len(test_df),
        "train_split_date": train_split_date,
        "val_split_date": val_split_date
    }
    
    # Save metadata
    metadata_path = output_dir / f"leadtime_metadata_{dataset_hash}.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    logger.info("dataset_built", metadata_path=str(metadata_path))
    
    return metadata

