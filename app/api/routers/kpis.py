"""
KPIs API endpoints.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.services.data_quality import get_data_quality_service

router = APIRouter()
_data_quality_service = None

def get_data_quality_service_instance():
    """Lazy initialization of service to avoid import errors."""
    global _data_quality_service
    if _data_quality_service is None:
        from backend.config import DATABASE_URL
        _data_quality_service = get_data_quality_service(DATABASE_URL)
    return _data_quality_service


@router.get("/overview")
def get_kpis_overview(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to")
):
    """Get KPIs overview."""
    # TODO: Implementar quando serviço de KPIs estiver pronto
    return {
        "message": "KPIs overview endpoint - to be implemented",
        "from_date": from_date,
        "to_date": to_date
    }


@router.get("/by-employee")
def get_kpis_by_employee(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    funcionario_id: Optional[int] = None
):
    """
    Get KPIs by employee.
    
    ⚠️ RETORNA NOT_SUPPORTED_BY_DATA
    Match rate FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id: 32.3%
    """
    # Verificar suporte de dados
    support_check = get_data_quality_service_instance().check_feature_support("employee_productivity")
    
    if support_check["status"] == "NOT_SUPPORTED_BY_DATA":
        return get_data_quality_service_instance().get_not_supported_response(
            "employee_productivity",
            support_check["reason"],
            match_rate=support_check.get("match_rate"),
            matches=support_check.get("matches"),
            total_from=support_check.get("total_from"),
            orphans_count=support_check.get("orphans_count"),
            suggestion=support_check.get("suggestion")
        )
    
    # Se suportado (não deveria chegar aqui com dados atuais)
    return {
        "status": "SUPPORTED",
        "message": "Employee productivity KPIs - to be implemented",
        "from_date": from_date,
        "to_date": to_date,
        "funcionario_id": funcionario_id
    }


@router.get("/by-phase")
def get_kpis_by_phase(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    fase_id: Optional[int] = None
):
    """Get KPIs by phase."""
    # TODO: Implementar quando serviço de KPIs estiver pronto
    return {
        "message": "KPIs by phase endpoint - to be implemented",
        "from_date": from_date,
        "to_date": to_date,
        "fase_id": fase_id
    }


@router.get("/by-product")
def get_kpis_by_product(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    produto_id: Optional[int] = None  # CORRIGIDO: usar produto_id
):
    """Get KPIs by product."""
    # TODO: Implementar quando serviço de KPIs estiver pronto
    return {
        "message": "KPIs by product endpoint - to be implemented",
        "from_date": from_date,
        "to_date": to_date,
        "produto_id": produto_id  # CORRIGIDO
    }

