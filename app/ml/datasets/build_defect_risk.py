"""
Build dataset for defect risk prediction (T3).
Label: has_error (binary classification)
"""
from typing import Dict, Any
from pathlib import Path
from sqlalchemy import create_engine, text
import pandas as pd
import hashlib
import json
import structlog

logger = structlog.get_logger()


def build_defect_risk_dataset(
    db_url: str,
    output_dir: Path,
    train_split_date: str = "2023-01-01",
    val_split_date: str = "2024-01-01"
) -> Dict[str, Any]:
    """
    Build defect risk prediction dataset.
    
    Args:
        db_url: Database URL
        output_dir: Output directory
        train_split_date: Split date for train/val
        val_split_date: Split date for val/test
    
    Returns:
        Dataset metadata
    """
    logger.info("building_defect_risk_dataset")
    
    engine = create_engine(db_url)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Query orders with error indicators
    query = text("""
        SELECT 
            of.of_id,
            of.of_produto_id as modelo_id,
            of.of_data_criacao,
            -- Label: has error
            CASE WHEN e.erro_id IS NOT NULL THEN 1 ELSE 0 END as has_error,
            -- Error severity if exists
            MAX(e.erro_gravidade) as max_gravidade,
            -- Features
            (SELECT COUNT(*) 
             FROM fases_standard_modelos fsm 
             WHERE fsm.modelo_id = of.of_produto_id) as n_phases_standard,
            m.peso_desmolde,
            m.peso_acabamento,
            -- Historical error rate for this model
            (SELECT COUNT(DISTINCT e2.erro_of_id)::FLOAT / NULLIF(COUNT(DISTINCT of2.of_id), 0)
             FROM ordens_fabrico of2
             LEFT JOIN erros_ordem_fabrico e2 ON e2.erro_of_id = of2.of_id
             WHERE of2.of_produto_id = of.of_produto_id
               AND of2.of_data_criacao < of.of_data_criacao) as historical_error_rate
        FROM ordens_fabrico of
        JOIN modelos m ON of.of_produto_id = m.modelo_id
        LEFT JOIN erros_ordem_fabrico e ON e.erro_of_id = of.of_id
        WHERE of.of_data_criacao IS NOT NULL
        GROUP BY of.of_id, of.of_produto_id, of.of_data_criacao, m.peso_desmolde, m.peso_acabamento
    """)
    
    with engine.connect() as conn:
        df = pd.read_sql(query, conn)
    
    logger.info("dataset_loaded", n_rows=len(df))
    
    # Feature engineering
    df['modelo_id_encoded'] = df['modelo_id'].astype('category').cat.codes
    df['peso_total'] = (df['peso_desmolde'].fillna(0) + df['peso_acabamento'].fillna(0))
    df['historical_error_rate'] = df['historical_error_rate'].fillna(0.0)
    df['max_gravidade'] = df['max_gravidade'].fillna(0)
    
    feature_cols = [
        'modelo_id_encoded',
        'n_phases_standard',
        'peso_total',
        'historical_error_rate'
    ]
    
    # Remove missing
    df_clean = df.dropna(subset=feature_cols)
    
    # Split temporally
    df_clean['of_data_criacao'] = pd.to_datetime(df_clean['of_data_criacao'])
    
    train_df = df_clean[df_clean['of_data_criacao'] < train_split_date].copy()
    val_df = df_clean[
        (df_clean['of_data_criacao'] >= train_split_date) & 
        (df_clean['of_data_criacao'] < val_split_date)
    ].copy()
    test_df = df_clean[df_clean['of_data_criacao'] >= val_split_date].copy()
    
    logger.info("dataset_split", train=len(train_df), val=len(val_df), test=len(test_df))
    
    # Save
    train_path = output_dir / "defect_risk_train.parquet"
    val_path = output_dir / "defect_risk_val.parquet"
    test_path = output_dir / "defect_risk_test.parquet"
    
    train_df[feature_cols + ['has_error', 'max_gravidade', 'of_id']].to_parquet(train_path)
    val_df[feature_cols + ['has_error', 'max_gravidade', 'of_id']].to_parquet(val_path)
    test_df[feature_cols + ['has_error', 'max_gravidade', 'of_id']].to_parquet(test_path)
    
    # Metadata
    dataset_hash = hashlib.sha256(
        json.dumps({
            "n_train": len(train_df),
            "n_val": len(val_df),
            "n_test": len(test_df),
            "features": feature_cols
        }, sort_keys=True).encode()
    ).hexdigest()[:16]
    
    metadata = {
        "dataset_name": "defect_risk",
        "version_hash": dataset_hash,
        "train_path": str(train_path),
        "val_path": str(val_path),
        "test_path": str(test_path),
        "feature_cols": feature_cols,
        "label_col": "has_error",
        "n_train": len(train_df),
        "n_val": len(val_df),
        "n_test": len(test_df)
    }
    
    metadata_path = output_dir / f"defect_risk_metadata_{dataset_hash}.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return metadata

