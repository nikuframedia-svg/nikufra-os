"""Excel reader for Folha_IA.xlsx structure analysis."""
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional
from backend.config import FOLHA_IA_PATH


def read_excel_sheets(file_path: Optional[str] = None) -> Dict[str, pd.DataFrame]:
    """
    Read all sheets from Folha_IA.xlsx.
    
    Args:
        file_path: Path to Excel file. If None, uses default from config.
    
    Returns:
        Dictionary mapping sheet names to DataFrames.
    """
    if file_path is None:
        file_path = FOLHA_IA_PATH
    
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Excel file not found: {file_path}")
    
    # Read all sheets
    excel_file = pd.ExcelFile(path)
    sheets = {}
    
    for sheet_name in excel_file.sheet_names:
        sheets[sheet_name] = pd.read_excel(excel_file, sheet_name=sheet_name)
    
    return sheets


def get_sheet_structure(file_path: Optional[str] = None) -> Dict[str, Dict]:
    """
    Analyze structure of Excel sheets (column names, types, sample data).
    
    Args:
        file_path: Path to Excel file.
    
    Returns:
        Dictionary with sheet structure information.
    """
    sheets = read_excel_sheets(file_path)
    structure = {}
    
    for sheet_name, df in sheets.items():
        structure[sheet_name] = {
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "row_count": len(df),
            "sample_rows": df.head(3).to_dict("records") if len(df) > 0 else [],
            "null_counts": df.isnull().sum().to_dict(),
        }
    
    return structure


def infer_primary_keys(sheet_name: str, df: pd.DataFrame) -> List[str]:
    """
    Infer potential primary key columns from sheet name and data.
    
    Args:
        sheet_name: Name of the sheet.
        df: DataFrame with sheet data.
    
    Returns:
        List of potential PK column names.
    """
    pk_candidates = []
    
    # Common patterns
    if "OrdensFabrico" in sheet_name:
        pk_candidates = ["Of_Id", "of_id", "OF_ID"]
    elif "FasesOrdemFabrico" in sheet_name or "FasesOrdem" in sheet_name:
        pk_candidates = ["FaseOf_Id", "fase_of_id", "FASEOF_ID"]
    elif "Funcionarios" in sheet_name:
        if "FasesAptos" in sheet_name:
            # Composite key likely
            pk_candidates = ["Funcionario_Id", "Fase_Id"]
        else:
            pk_candidates = ["Funcionario_Id", "funcionario_id", "FUNCIONARIO_ID"]
    elif "Erros" in sheet_name:
        pk_candidates = ["Erro_Id", "erro_id", "ERRO_ID"]
    elif "Fases" in sheet_name:
        pk_candidates = ["Fase_Id", "fase_id", "FASE_ID"]
    elif "Modelos" in sheet_name:
        pk_candidates = ["Modelo_Id", "modelo_id", "MODELO_ID"]
    elif "FasesStandard" in sheet_name:
        # Composite key likely
        pk_candidates = ["Modelo_Id", "Fase_Id"]
    
    # Find actual columns that match
    found_pks = []
    for candidate in pk_candidates:
        if candidate in df.columns:
            found_pks.append(candidate)
    
    # Fallback: look for columns with "id" or "_id" that are unique
    if not found_pks:
        for col in df.columns:
            if "id" in col.lower() and df[col].notna().sum() == len(df):
                found_pks.append(col)
                break
    
    return found_pks


def normalize_column_name(col_name: str) -> str:
    """
    Normalize column name to snake_case.
    
    Args:
        col_name: Original column name.
    
    Returns:
        Normalized column name.
    """
    # Remove special characters, convert to lowercase, replace spaces with underscores
    normalized = str(col_name).strip().lower()
    normalized = normalized.replace(" ", "_")
    normalized = normalized.replace("-", "_")
    normalized = "".join(c if c.isalnum() or c == "_" else "" for c in normalized)
    return normalized



