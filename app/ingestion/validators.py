"""
Data validators for ingestion.
Validates data types, constraints, and business rules.
"""
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
import structlog

logger = structlog.get_logger()


class ValidationError(Exception):
    """Raised when validation fails."""
    pass


def parse_date(value: Any) -> Optional[datetime]:
    """
    Parse date from various formats.
    
    Args:
        value: Date value (string, datetime, or None)
    
    Returns:
        Parsed datetime or None
    """
    if value is None:
        return None
    
    if isinstance(value, datetime):
        return value
    
    if isinstance(value, str):
        value = value.strip()
        if not value or value.lower() in ('null', 'none', ''):
            return None
        
        # Try common formats
        formats = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d',
            '%d/%m/%Y %H:%M:%S',
            '%d/%m/%Y',
            '%Y/%m/%d',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        
        # Try parsing with dateutil as fallback
        try:
            from dateutil import parser
            return parser.parse(value)
        except:
            pass
    
    return None


def parse_numeric(value: Any) -> Optional[float]:
    """
    Parse numeric value.
    
    Args:
        value: Numeric value
    
    Returns:
        Parsed float or None
    """
    if value is None:
        return None
    
    if isinstance(value, (int, float)):
        return float(value)
    
    if isinstance(value, str):
        value = value.strip().replace(',', '').replace(' ', '')
        if not value or value.lower() in ('null', 'none', ''):
            return None
        try:
            return float(value)
        except ValueError:
            return None
    
    return None


def parse_integer(value: Any) -> Optional[int]:
    """
    Parse integer value.
    
    Args:
        value: Integer value
    
    Returns:
        Parsed int or None
    """
    if value is None:
        return None
    
    if isinstance(value, int):
        return value
    
    if isinstance(value, float):
        return int(value)
    
    if isinstance(value, str):
        value = value.strip().replace(',', '').replace(' ', '')
        if not value or value.lower() in ('null', 'none', ''):
            return None
        try:
            return int(float(value))  # Allow "1.0" -> 1
        except ValueError:
            return None
    
    return None


def validate_ordens_fabrico(row: Dict[str, Any], row_num: int) -> Tuple[bool, Optional[str]]:
    """
    Validate OrdensFabrico row.
    
    Args:
        row: Row data as dict
        row_num: Row number (for error messages)
    
    Returns:
        (is_valid, error_message)
    """
    # Required fields
    if not row.get('of_id'):
        return False, "Missing required field: of_id"
    
    if not row.get('of_data_criacao'):
        return False, "Missing required field: of_data_criacao"
    
    # Validate dates
    data_criacao = parse_date(row.get('of_data_criacao'))
    if not data_criacao:
        return False, f"Invalid date format for of_data_criacao: {row.get('of_data_criacao')}"
    
    data_acabamento = parse_date(row.get('of_data_acabamento'))
    if data_acabamento and data_acabamento < data_criacao:
        return False, f"of_data_acabamento ({data_acabamento}) before of_data_criacao ({data_criacao})"
    
    return True, None


def validate_fases_ordem_fabrico(row: Dict[str, Any], row_num: int) -> Tuple[bool, Optional[str]]:
    """
    Validate FasesOrdemFabrico row.
    
    Args:
        row: Row data as dict
        row_num: Row number
    
    Returns:
        (is_valid, error_message)
    """
    if not row.get('faseof_id'):
        return False, "Missing required field: faseof_id"
    
    if not row.get('faseof_of_id'):
        return False, "Missing required field: faseof_of_id"
    
    # Validate dates
    inicio = parse_date(row.get('faseof_inicio'))
    fim = parse_date(row.get('faseof_fim'))
    
    if inicio and fim and fim < inicio:
        return False, f"faseof_fim ({fim}) before faseof_inicio ({inicio})"
    
    return True, None


def validate_funcionarios_fase_ordem_fabrico(row: Dict[str, Any], row_num: int) -> Tuple[bool, Optional[str]]:
    """Validate FuncionariosFaseOrdemFabrico row."""
    if not row.get('funcionariofaseof_faseof_id'):
        return False, "Missing required field: funcionariofaseof_faseof_id"
    
    if not row.get('funcionariofaseof_funcionario_id'):
        return False, "Missing required field: funcionariofaseof_funcionario_id"
    
    return True, None


def validate_ordem_fabrico_erros(row: Dict[str, Any], row_num: int) -> Tuple[bool, Optional[str]]:
    """Validate OrdemFabricoErros row - CORRIGIDO para usar ofch_* columns."""
    if not row.get('ofch_descricao_erro'):
        return False, "Missing required field: ofch_descricao_erro"
    
    # Validar gravidade baseado no domínio observado (não assumir 1-3)
    # O inspector reporta os valores reais, validar contra eles
    gravidade = parse_integer(row.get('ofch_gravidade'))
    if gravidade and gravidade not in [1, 2, 3]:  # Baseado no PROFILE_REPORT
        return False, f"Invalid gravidade: {gravidade} (observed domain: 1, 2, 3)"
    
    return True, None


def validate_funcionarios(row: Dict[str, Any], row_num: int) -> Tuple[bool, Optional[str]]:
    """Validate Funcionarios row."""
    if not row.get('funcionario_id'):
        return False, "Missing required field: funcionario_id"
    
    if not row.get('funcionario_nome'):
        return False, "Missing required field: funcionario_nome"
    
    return True, None


def validate_fases(row: Dict[str, Any], row_num: int) -> Tuple[bool, Optional[str]]:
    """Validate Fases row."""
    if not row.get('fase_id'):
        return False, "Missing required field: fase_id"
    
    if not row.get('fase_nome'):
        return False, "Missing required field: fase_nome"
    
    return True, None


def validate_modelos(row: Dict[str, Any], row_num: int) -> Tuple[bool, Optional[str]]:
    """Validate Modelos row."""
    if not row.get('modelo_id') and not row.get('produto_id'):
        return False, "Missing required field: modelo_id or produto_id"
    
    return True, None


def validate_funcionarios_fases_aptos(row: Dict[str, Any], row_num: int) -> Tuple[bool, Optional[str]]:
    """Validate FuncionariosFasesAptos row."""
    if not row.get('funcionariofase_funcionario_id'):
        return False, "Missing required field: funcionariofase_funcionario_id"
    
    if not row.get('funcionariofase_fase_id'):
        return False, "Missing required field: funcionariofase_fase_id"
    
    return True, None


def validate_fases_standard_modelos(row: Dict[str, Any], row_num: int) -> Tuple[bool, Optional[str]]:
    """Validate FasesStandardModelos row."""
    if not row.get('produtofase_produto_id') and not row.get('modelo_id'):
        return False, "Missing required field: produto_id or modelo_id"
    
    if not row.get('produtofase_fase_id') and not row.get('fase_id'):
        return False, "Missing required field: fase_id"
    
    return True, None


# Validator registry
VALIDATORS = {
    'OrdensFabrico': validate_ordens_fabrico,
    'FasesOrdemFabrico': validate_fases_ordem_fabrico,
    'FuncionariosFaseOrdemFabrico': validate_funcionarios_fase_ordem_fabrico,
    'OrdemFabricoErros': validate_ordem_fabrico_erros,
    'Funcionarios': validate_funcionarios,
    'FuncionariosFasesAptos': validate_funcionarios_fases_aptos,
    'Fases': validate_fases,
    'Modelos': validate_modelos,
    'FasesStandardModelos': validate_fases_standard_modelos,
}

