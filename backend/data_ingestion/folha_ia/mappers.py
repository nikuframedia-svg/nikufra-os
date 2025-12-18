"""Mappers from Excel columns to database models."""
from typing import Dict, Any, Optional
import pandas as pd
from backend.data_ingestion.folha_ia.data_cleaner import (
    parse_date,
    parse_numeric,
    clean_string,
    calculate_duration_minutes,
)


def map_order_row(row: pd.Series, column_mapping: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Map a row from OrdensFabrico sheet to Order model.
    
    Args:
        row: DataFrame row.
        column_mapping: Optional mapping from Excel columns to model fields.
    
    Returns:
        Dictionary with model fields.
    """
    if column_mapping is None:
        # Default mapping based on actual Excel structure
        column_mapping = {
            "Of_Id": "of_id",
            "Of_DataCriacao": "creation_date",
            "Of_DataAcabamento": "completion_date",
            "Of_ProdutoId": "product_id",  # Will need lookup
        }
    
    mapped = {}
    
    # Map each field
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            
            if "date" in model_field.lower() or "data" in excel_col.lower():
                mapped[model_field] = parse_date(value)
            elif "quantity" in model_field.lower() or "quantidade" in excel_col.lower():
                mapped[model_field] = parse_numeric(value)
            else:
                mapped[model_field] = clean_string(value)
    
    # Ensure of_id is set (primary identifier)
    if "of_id" not in mapped or not mapped["of_id"]:
        # Try to find any ID column
        for col in row.index:
            if "id" in col.lower() and "of" in col.lower():
                mapped["of_id"] = clean_string(row[col])
                break
    
    return mapped


def map_order_phase_row(row: pd.Series, column_mapping: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Map a row from FasesOrdemFabrico sheet to OrderPhase model.
    
    Args:
        row: DataFrame row.
        column_mapping: Optional mapping from Excel columns to model fields.
    
    Returns:
        Dictionary with model fields.
    """
    if column_mapping is None:
        column_mapping = {
            "FaseOf_Id": "fase_of_id",
            "FaseOf_OfId": "of_id",  # Will need lookup
            "FaseOf_Inicio": "start_date",
            "FaseOf_Fim": "end_date",
            "FaseOf_DataPrevista": "planned_start",
            "FaseOf_Coeficiente": "coeficiente",
            "FaseOf_CoeficienteX": "coeficiente_x",
            "FaseOf_FaseId": "phase_code",  # Will need lookup
            "FaseOf_Peso": "peso",
            "FaseOf_Retorno": "retorno",
            "FaseOf_Turno": "turno",
            "FaseOf_Sequencia": "sequence_order",
        }
    
    mapped = {}
    
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            
            if "date" in model_field.lower() or any(x in excel_col.lower() for x in ["inicio", "fim", "data", "prevista"]):
                mapped[model_field] = parse_date(value)
            elif model_field in ["coeficiente", "coeficiente_x", "peso", "turno"]:
                mapped[model_field] = parse_numeric(value)
            elif model_field == "sequence_order":
                mapped[model_field] = parse_numeric(value)
                if mapped[model_field] is not None:
                    mapped[model_field] = int(mapped[model_field])
            else:
                mapped[model_field] = clean_string(value)
    
    # Calculate duration if both dates exist
    if "start_date" in mapped and "end_date" in mapped:
        duration = calculate_duration_minutes(mapped["start_date"], mapped["end_date"])
        if duration is not None:
            mapped["duration_minutes"] = duration
    
    # Ensure fase_of_id is set
    if "fase_of_id" not in mapped or not mapped["fase_of_id"]:
        for col in row.index:
            if "faseof" in col.lower() and "id" in col.lower() and "ofid" not in col.lower():
                mapped["fase_of_id"] = clean_string(row[col])
                break
    
    return mapped


def map_worker_row(row: pd.Series, column_mapping: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Map a row from Funcionarios sheet to Worker model.
    
    Args:
        row: DataFrame row.
        column_mapping: Optional mapping from Excel columns to model fields.
    
    Returns:
        Dictionary with model fields.
    """
    if column_mapping is None:
        column_mapping = {
            "Funcionario_Id": "worker_code",
            "Funcionario_Nome": "name",
            "Funcionario_Activo": "active",
        }
    
    mapped = {}
    
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            # Convert active field to boolean
            if model_field == "active":
                if isinstance(value, (int, float)):
                    mapped[model_field] = bool(value)
                elif isinstance(value, str):
                    mapped[model_field] = value.lower() in ('1', 'true', 'yes', 'sim', 's')
                else:
                    mapped[model_field] = bool(value)
            else:
                mapped[model_field] = clean_string(value)
    
    # Ensure worker_code is set
    if "worker_code" not in mapped or not mapped["worker_code"]:
        for col in row.index:
            if "id" in col.lower() and "funcionario" in col.lower():
                mapped["worker_code"] = clean_string(row[col])
                break
    
    # Ensure name is set - use worker_code as fallback
    if "name" not in mapped or not mapped["name"]:
        if "Funcionario_Nome" in row.index:
            mapped["name"] = clean_string(row["Funcionario_Nome"])
        else:
            mapped["name"] = mapped.get("worker_code", "Funcionário Sem Nome")
    
    return mapped


def map_phase_row(row: pd.Series, column_mapping: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Map a row from Fases sheet to Phase model.
    
    Args:
        row: DataFrame row.
        column_mapping: Optional mapping from Excel columns to model fields.
    
    Returns:
        Dictionary with model fields.
    """
    if column_mapping is None:
        column_mapping = {
            "Fase_Id": "phase_code",
            "Fase_Nome": "name",
            "Fase_Sequencia": "sequence_order",
        }
    
    mapped = {}
    
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            
            if "sequence" in model_field.lower() or "sequencia" in excel_col.lower():
                mapped[model_field] = parse_numeric(value)
            else:
                mapped[model_field] = clean_string(value)
    
    # Ensure phase_code is set
    if "phase_code" not in mapped or not mapped["phase_code"]:
        for col in row.index:
            if "id" in col.lower() and "fase" in col.lower():
                mapped["phase_code"] = clean_string(row[col])
                break
    
    # Ensure name is set (required field) - use phase_code as fallback
    if "name" not in mapped or not mapped["name"]:
        if "Fase_Nome" in row.index:
            mapped["name"] = clean_string(row["Fase_Nome"])
        else:
            # Fallback: use phase_code as name if name is missing
            mapped["name"] = mapped.get("phase_code", "Fase Sem Nome")
    
    return mapped


def map_product_row(row: pd.Series, column_mapping: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Map a row from Modelos sheet to Product model.
    
    Args:
        row: DataFrame row.
        column_mapping: Optional mapping from Excel columns to model fields.
    
    Returns:
        Dictionary with model fields.
    """
    if column_mapping is None:
        column_mapping = {
            "Produto_Id": "product_code",
            "Produto_Nome": "name",
            "Produto_PesoDesmolde": "weight",  # Use weight field for demold weight
        }
    
    mapped = {}
    
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            
            if "weight" in model_field.lower() or "peso" in excel_col.lower():
                mapped[model_field] = parse_numeric(value)
            else:
                mapped[model_field] = clean_string(value)
    
    # Ensure product_code is set
    if "product_code" not in mapped or not mapped["product_code"]:
        for col in row.index:
            if "id" in col.lower() and ("modelo" in col.lower() or "produto" in col.lower()):
                mapped["product_code"] = clean_string(row[col])
                break
    
    # Ensure name is set (required field) - use product_code as fallback
    if "name" not in mapped or not mapped["name"]:
        if "Produto_Nome" in row.index:
            mapped["name"] = clean_string(row["Produto_Nome"])
        else:
            # Fallback: use product_code as name if name is missing
            mapped["name"] = mapped.get("product_code", "Produto Sem Nome")
    
    return mapped


def map_order_phase_worker_row(row: pd.Series, column_mapping: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Map a row from FuncionariosFaseOrdemFabrico sheet to OrderPhaseWorker model.
    
    Args:
        row: DataFrame row.
        column_mapping: Optional mapping from Excel columns to model fields.
    
    Returns:
        Dictionary with model fields.
    """
    if column_mapping is None:
        column_mapping = {
            "FuncionarioFaseOf_FaseOfId": "fase_of_id",  # Will need lookup to order_phase_id
            "FuncionarioFaseOf_FuncionarioId": "worker_code",  # Will need lookup
            "FuncionarioFaseOf_Chefe": "is_chefe",
        }
    
    mapped = {}
    
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            
            if model_field == "is_chefe":
                # Convert to string representation
                if isinstance(value, (int, float)):
                    mapped[model_field] = "1" if value else "0"
                elif isinstance(value, str):
                    mapped[model_field] = value
                else:
                    mapped[model_field] = str(value) if value else None
                # Also set role
                if mapped[model_field] == "1" or (isinstance(value, str) and value.lower() in ("1", "sim", "yes", "true")):
                    mapped["role"] = "chefe"
                else:
                    mapped["role"] = "trabalhador"
            else:
                mapped[model_field] = clean_string(value)
    
    return mapped


def map_order_error_row(row: pd.Series, column_mapping: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Map a row from OrdemFabricoErros sheet to OrderError model.
    
    Args:
        row: DataFrame row.
        column_mapping: Optional mapping from Excel columns to model fields.
    
    Returns:
        Dictionary with model fields.
    """
    if column_mapping is None:
        column_mapping = {
            "Erro_Descricao": "error_description",
            "Erro_OfId": "of_id",  # Will need lookup
            "Erro_FaseAvaliacao": "fase_avaliacao",
            "OFCH_GRAVIDADE": "severity",
            "Erro_FaseOfAvaliacao": "fase_of_avaliacao_id",
            "Erro_FaseOfCulpada": "fase_of_culpada_id",
        }
    
    mapped = {}
    
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            
            if model_field == "severity":
                # Convert severity to string
                mapped[model_field] = clean_string(value)
            else:
                mapped[model_field] = clean_string(value)
    
    # Set error_type from fase_avaliacao if available
    if "fase_avaliacao" in mapped and mapped["fase_avaliacao"]:
        mapped["error_type"] = mapped["fase_avaliacao"]
    
    return mapped


def map_worker_phase_skill_row(row: pd.Series, column_mapping: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Map a row from FuncionariosFasesAptos sheet to WorkerPhaseSkill model.
    
    Args:
        row: DataFrame row.
        column_mapping: Optional mapping from Excel columns to model fields.
    
    Returns:
        Dictionary with model fields.
    """
    if column_mapping is None:
        column_mapping = {
            "FuncionarioFase_FuncionarioId": "worker_code",  # Will need lookup
            "FuncionarioFase_FaseId": "phase_code",  # Will need lookup
            "FuncionarioFase_Inicio": "certification_date",
        }
    
    mapped = {}
    
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            
            if "date" in model_field.lower() or "inicio" in excel_col.lower():
                mapped[model_field] = parse_date(value)
            else:
                mapped[model_field] = clean_string(value)
    
    # If certification_date exists, assume certified = True
    if "certification_date" in mapped and mapped["certification_date"]:
        mapped["certified"] = True
    
    return mapped


def map_product_phase_standard_row(row: pd.Series, column_mapping: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Map a row from FasesStandardModelos sheet to ProductPhaseStandard model.
    
    Args:
        row: DataFrame row.
        column_mapping: Optional mapping from Excel columns to model fields.
    
    Returns:
        Dictionary with model fields.
    """
    if column_mapping is None:
        column_mapping = {
            "ProdutoFase_ProdutoId": "product_code",  # Will need lookup
            "ProdutoFase_FaseId": "phase_code",  # Will need lookup
            "ProdutoFase_Sequencia": "sequence_order",
            "ProdutoFase_Coeficiente": "coeficiente",
            "ProdutoFase_CoeficienteX": "coeficiente_x",
        }
    
    mapped = {}
    
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            
            if model_field == "sequence_order":
                mapped[model_field] = parse_numeric(value)
                if mapped[model_field] is not None:
                    mapped[model_field] = int(mapped[model_field])
            elif model_field in ["coeficiente", "coeficiente_x"]:
                mapped[model_field] = parse_numeric(value)
            else:
                mapped[model_field] = clean_string(value)
    
    return mapped

