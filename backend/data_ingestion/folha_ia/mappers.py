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
        # Default mapping (will be adjusted based on actual Excel structure)
        column_mapping = {
            "Of_Id": "of_id",
            "Of_DataCriacao": "creation_date",
            "Of_DataAcabamento": "completion_date",
            "Modelo_Id": "product_id",  # Will need lookup
            "Quantidade": "quantity",
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
            "FaseOf_OfId": "of_id",  # Will need lookup to get order.id
            "FaseOf_Inicio": "start_date",
            "FaseOf_Fim": "end_date",
            "Fase_Id": "phase_id",  # Will need lookup
            "Maquina": "machine_id",
            "Centro": "center",
        }
    
    mapped = {}
    
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            
            if "date" in model_field.lower() or any(x in excel_col.lower() for x in ["inicio", "fim", "data"]):
                mapped[model_field] = parse_date(value)
            else:
                mapped[model_field] = clean_string(value)
    
    # Calculate duration if both dates exist
    start_col = None
    end_col = None
    for col in row.index:
        if "inicio" in col.lower() or "start" in col.lower():
            start_col = col
        if "fim" in col.lower() or "end" in col.lower() or "fim" in col.lower():
            end_col = col
    
    if start_col and end_col:
        duration = calculate_duration_minutes(row[start_col], row[end_col])
        if duration is not None:
            mapped["duration_minutes"] = duration
    
    # Ensure fase_of_id is set
    if "fase_of_id" not in mapped or not mapped["fase_of_id"]:
        for col in row.index:
            if "faseof" in col.lower() and "id" in col.lower():
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
            "Nome": "name",
            "Departamento": "department",
            "Cargo": "position",
        }
    
    mapped = {}
    
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            mapped[model_field] = clean_string(row[excel_col])
    
    # Ensure worker_code is set
    if "worker_code" not in mapped or not mapped["worker_code"]:
        for col in row.index:
            if "id" in col.lower() and "funcionario" in col.lower():
                mapped["worker_code"] = clean_string(row[col])
                break
    
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
            "Nome": "name",
            "Descricao": "description",
            "DuracaoStandard": "standard_duration_minutes",
        }
    
    mapped = {}
    
    for excel_col, model_field in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            
            if "duration" in model_field.lower() or "duracao" in excel_col.lower():
                mapped[model_field] = parse_numeric(value)
            else:
                mapped[model_field] = clean_string(value)
    
    # Ensure phase_code is set
    if "phase_code" not in mapped or not mapped["phase_code"]:
        for col in row.index:
            if "id" in col.lower() and "fase" in col.lower():
                mapped["phase_code"] = clean_string(row[col])
                break
    
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
            "Modelo_Id": "product_code",
            "Nome": "name",
            "Descricao": "description",
            "Peso": "weight",
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
            if "id" in col.lower() and "modelo" in col.lower():
                mapped["product_code"] = clean_string(row[col])
                break
    
    return mapped

