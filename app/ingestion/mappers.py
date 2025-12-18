"""
Mappers to transform Excel rows to database rows.
Maps column names from Excel to database schema.
"""
from typing import Dict, Any, Optional
from datetime import datetime
from app.ingestion.validators import parse_date, parse_numeric, parse_integer


def map_ordens_fabrico(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map OrdensFabrico row to database schema.
    
    Args:
        row: Row dict with Excel column names
    
    Returns:
        Dict with database column names
    """
    return {
        'of_id': str(row.get('Of_Id', '')).strip(),
        'of_data_criacao': parse_date(row.get('Of_DataCriacao')),
        'of_data_acabamento': parse_date(row.get('Of_DataAcabamento')),
        'of_produto_id': parse_integer(row.get('Of_ProdutoId')),  # Mantém of_produto_id (FK para produtos)
        'of_fase_id': parse_integer(row.get('Of_FaseId')),
        'of_data_transporte': parse_date(row.get('Of_DataTransporte')),
    }


def map_fases_ordem_fabrico(row: Dict[str, Any]) -> Dict[str, Any]:
    """Map FasesOrdemFabrico row."""
    return {
        'faseof_id': str(row.get('FaseOf_Id', '')).strip(),
        'faseof_of_id': str(row.get('FaseOf_OfId', '')).strip(),
        'faseof_inicio': parse_date(row.get('FaseOf_Inicio')),
        'faseof_fim': parse_date(row.get('FaseOf_Fim')),
        'faseof_data_prevista': parse_date(row.get('FaseOf_DataPrevista')),
        'faseof_coeficiente': parse_numeric(row.get('FaseOf_Coeficiente')),
        'faseof_coeficiente_x': parse_numeric(row.get('FaseOf_CoeficienteX')),
        'faseof_fase_id': parse_integer(row.get('FaseOf_FaseId')),
        'faseof_peso': parse_numeric(row.get('FaseOf_Peso')),
        'faseof_retorno': parse_integer(row.get('FaseOf_Retorno')),
        'faseof_turno': parse_integer(row.get('FaseOf_Turno')),
        'faseof_sequencia': parse_integer(row.get('FaseOf_Sequencia')),
    }


def map_funcionarios_fase_ordem_fabrico(row: Dict[str, Any]) -> Dict[str, Any]:
    """Map FuncionariosFaseOrdemFabrico row - CORRIGIDO: usar FuncionarioFaseOf_FaseOfId."""
    return {
        'funcionariofaseof_faseof_id': str(row.get('FuncionarioFaseOf_FaseOfId', '')).strip(),
        'funcionariofaseof_funcionario_id': parse_integer(row.get('FuncionarioFaseOf_FuncionarioId')),
        'funcionariofaseof_chefe': parse_integer(row.get('FuncionarioFaseOf_Chefe')) or 0,
    }


def map_ordem_fabrico_erros(row: Dict[str, Any]) -> Dict[str, Any]:
    """Map OrdemFabricoErros row - CORRIGIDO para headers reais."""
    return {
        'ofch_descricao_erro': str(row.get('Erro_Descricao', '')).strip(),
        'ofch_of_id': str(row.get('Erro_OfId', '')).strip() if row.get('Erro_OfId') else None,
        'ofch_fase_avaliacao': parse_integer(row.get('Erro_FaseAvaliacao')),
        'ofch_gravidade': parse_integer(row.get('OFCH_GRAVIDADE')) or 1,
        'ofch_faseof_avaliacao': str(row.get('Erro_FaseOfAvaliacao', '')).strip() if row.get('Erro_FaseOfAvaliacao') else None,
        'ofch_faseof_culpada': str(row.get('Erro_FaseOfCulpada', '')).strip() if row.get('Erro_FaseOfCulpada') else None,
        # ofch_id será gerado automaticamente (SERIAL)
        # ofch_event_time será populado por backfill job
    }


def map_funcionarios(row: Dict[str, Any]) -> Dict[str, Any]:
    """Map Funcionarios row."""
    return {
        'funcionario_id': parse_integer(row.get('Funcionario_Id')),
        'funcionario_nome': str(row.get('Funcionario_Nome', '')).strip(),
        'funcionario_activo': parse_integer(row.get('Funcionario_Activo')) or 1,
    }


def map_fases(row: Dict[str, Any]) -> Dict[str, Any]:
    """Map Fases row - CORRIGIDO: incluir todas as colunas do Excel."""
    return {
        'fase_id': parse_integer(row.get('Fase_Id')),
        'fase_nome': str(row.get('Fase_Nome', '')).strip(),
        'fase_sequencia': parse_integer(row.get('Fase_Sequencia')),
        'fase_de_producao': parse_integer(row.get('Fase_DeProducao')) or 1,
        'fase_automatica': parse_integer(row.get('Fase_Automatica')) or 0,
    }


def map_modelos(row: Dict[str, Any]) -> Dict[str, Any]:
    """Map Modelos row - CORRIGIDO: usar nomes corretos das colunas."""
    return {
        'produto_id': parse_integer(row.get('Produto_Id')),  # Manter produto_id no DB
        'produto_nome': str(row.get('Produto_Nome', '')).strip(),
        'produto_peso_desmolde': parse_numeric(row.get('Produto_PesoDesmolde')),
        'produto_peso_acabamento': parse_numeric(row.get('Produto_PesoAcabamento')),
        'produto_qtd_gel_deck': parse_numeric(row.get('Produto_QtdGelDeck')),  # CORRIGIDO
        'produto_qtd_gel_casco': parse_numeric(row.get('Produto_QtdGelCasco')),  # CORRIGIDO
    }


def map_funcionarios_fases_aptos(row: Dict[str, Any]) -> Dict[str, Any]:
    """Map FuncionariosFasesAptos row - CORRIGIDO: usar FuncionarioFase_Inicio."""
    return {
        'funcionario_id': parse_integer(row.get('FuncionarioFase_FuncionarioId')),
        'fase_id': parse_integer(row.get('FuncionarioFase_FaseId')),
        'funcionariofase_inicio': parse_date(row.get('FuncionarioFase_Inicio')),  # CORRIGIDO
    }


def map_fases_standard_modelos(row: Dict[str, Any]) -> Dict[str, Any]:
    """Map FasesStandardModelos row - CORRIGIDO: usar produto_id."""
    return {
        'produto_id': parse_integer(row.get('ProdutoFase_ProdutoId')),  # CORRIGIDO
        'fase_id': parse_integer(row.get('ProdutoFase_FaseId')),
        'sequencia': parse_integer(row.get('ProdutoFase_Sequencia')) or 0,
        'coeficiente': parse_numeric(row.get('ProdutoFase_Coeficiente')),
        'coeficiente_x': parse_numeric(row.get('ProdutoFase_CoeficienteX')),
    }


# Mapper registry
MAPPERS = {
    'OrdensFabrico': map_ordens_fabrico,
    'FasesOrdemFabrico': map_fases_ordem_fabrico,
    'FuncionariosFaseOrdemFabrico': map_funcionarios_fase_ordem_fabrico,
    'OrdemFabricoErros': map_ordem_fabrico_erros,
    'Funcionarios': map_funcionarios,
    'FuncionariosFasesAptos': map_funcionarios_fases_aptos,
    'Fases': map_fases,
    'Modelos': map_modelos,
    'FasesStandardModelos': map_fases_standard_modelos,
}

# Table name mapping
SHEET_TO_TABLE = {
    'OrdensFabrico': 'ordens_fabrico',
    'FasesOrdemFabrico': 'fases_ordem_fabrico',
    'FuncionariosFaseOrdemFabrico': 'funcionarios_fase_ordem_fabrico',
    'OrdemFabricoErros': 'erros_ordem_fabrico',
    'Funcionarios': 'funcionarios',
    'FuncionariosFasesAptos': 'funcionarios_fases_aptos',
    'Fases': 'fases_catalogo',
    'Modelos': 'modelos',
    'FasesStandardModelos': 'fases_standard_modelos',
}

# Primary key columns for upsert (CORRIGIDO)
TABLE_PRIMARY_KEYS = {
    'ordens_fabrico': ['of_id'],
    'fases_ordem_fabrico': ['faseof_id', 'faseof_fim'],  # Composite with partition key
    'funcionarios_fase_ordem_fabrico': ['funcionariofaseof_faseof_id', 'funcionariofaseof_funcionario_id'],
    'erros_ordem_fabrico': ['ofch_id'],  # CORRIGIDO: PK artificial (SERIAL), usar ofch_of_id + ofch_faseof_culpada para dedup se necessário
    'funcionarios': ['funcionario_id'],
    'fases_catalogo': ['fase_id'],
    'modelos': ['produto_id'],  # CORRIGIDO: usar produto_id
    'funcionarios_fases_aptos': ['funcionario_id', 'fase_id'],
    'fases_standard_modelos': ['produto_id', 'fase_id', 'sequencia'],  # CORRIGIDO: usar produto_id
}

