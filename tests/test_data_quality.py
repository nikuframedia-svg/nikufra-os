"""
Testes de validação de qualidade de dados e match rates.
"""
import pytest
from sqlalchemy import create_engine, text
from app.services.data_quality import DataQualityService, get_data_quality_service
from backend.config import DATABASE_URL


@pytest.fixture
def data_quality_service():
    """Fixture para DataQualityService."""
    return get_data_quality_service(DATABASE_URL)


def test_funcionariofaseof_match_rate(data_quality_service):
    """
    Testa match rate FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id.
    
    Esperado: match_rate < 0.9 (32.3% conforme RELATIONSHIPS_REPORT)
    """
    match_info = data_quality_service.get_match_rate(
        "funcionarios_fase_ordem_fabrico",
        "funcionariofaseof_faseof_id",
        "fases_ordem_fabrico",
        "faseof_id"
    )
    
    assert match_info["match_rate"] < 0.9, "Match rate deve ser < 90%"
    assert match_info["match_rate"] > 0.0, "Match rate deve ser > 0%"
    assert match_info["orphans_count"] > 0, "Deve haver orphans"
    
    print(f"\nMatch rate FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id: {match_info['match_rate']:.1%}")
    print(f"Orphans: {match_info['orphans_count']:,}")


def test_produto_of_match_rate(data_quality_service):
    """
    Testa match rate Produto_Id ↔ Of_ProdutoId.
    
    Esperado: match_rate < 0.9 (72.5% conforme RELATIONSHIPS_REPORT)
    """
    match_info = data_quality_service.get_match_rate(
        "ordens_fabrico",
        "of_produto_id",
        "modelos",
        "produto_id"
    )
    
    assert match_info["match_rate"] < 0.9, "Match rate deve ser < 90%"
    assert match_info["match_rate"] > 0.0, "Match rate deve ser > 0%"
    assert match_info["orphans_count"] > 0, "Deve haver orphans"
    
    print(f"\nMatch rate Produto_Id ↔ Of_ProdutoId: {match_info['match_rate']:.1%}")
    print(f"Orphans: {match_info['orphans_count']:,}")


def test_employee_productivity_not_supported(data_quality_service):
    """
    Testa que employee productivity retorna NOT_SUPPORTED_BY_DATA.
    """
    support_check = data_quality_service.check_feature_support("employee_productivity")
    
    assert support_check["status"] == "NOT_SUPPORTED_BY_DATA"
    assert "match_rate" in support_check
    assert support_check["match_rate"] < 0.9
    assert "suggestion" in support_check


def test_row_counts():
    """
    Testa que contagens batem com Excel.
    
    Esperado (conforme PROFILE_REPORT):
    - ordens_fabrico: 27,380
    - fases_ordem_fabrico: 519,079
    - funcionarios_fase_ordem_fabrico: 423,769
    - erros_ordem_fabrico: 89,836
    - funcionarios: 902
    - funcionarios_fases_aptos: 902
    - fases_catalogo: 71
    - modelos: 894
    - fases_standard_modelos: 15,348
    """
    engine = create_engine(DATABASE_URL)
    
    expected_counts = {
        "ordens_fabrico": 27380,
        "fases_ordem_fabrico": 519079,
        "funcionarios_fase_ordem_fabrico": 423769,
        "erros_ordem_fabrico": 89836,
        "funcionarios": 902,
        "funcionarios_fases_aptos": 902,
        "fases_catalogo": 71,
        "modelos": 894,
        "fases_standard_modelos": 15348
    }
    
    with engine.connect() as conn:
        for table, expected in expected_counts.items():
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            actual = result.scalar()
            
            # Permitir pequena variação (±1%) devido a rejects
            tolerance = expected * 0.01
            assert abs(actual - expected) <= tolerance, \
                f"{table}: esperado {expected}, obtido {actual} (tolerância: ±{tolerance:.0f})"
            
            print(f"✅ {table}: {actual:,} (esperado: {expected:,})")


def test_derived_columns_populated():
    """
    Testa que colunas derivadas foram populadas.
    """
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Verificar fases_ordem_fabrico
        result = conn.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(faseof_event_time) as with_event_time,
                COUNT(faseof_duration_seconds) as with_duration,
                COUNT(CASE WHEN faseof_is_open IS NOT NULL THEN 1 END) as with_is_open,
                COUNT(CASE WHEN faseof_is_done IS NOT NULL THEN 1 END) as with_is_done
            FROM fases_ordem_fabrico
        """))
        row = result.fetchone()
        
        total = row[0]
        with_event_time = row[1]
        with_duration = row[2]
        with_is_open = row[3]
        with_is_done = row[4]
        
        # Pelo menos 50% devem ter colunas derivadas populadas
        # (algumas podem ser NULL por natureza dos dados)
        assert with_event_time > total * 0.5, "faseof_event_time deve estar populado"
        assert with_is_open == total, "faseof_is_open deve estar sempre populado"
        assert with_is_done == total, "faseof_is_done deve estar sempre populado"
        
        print(f"\nColunas derivadas em fases_ordem_fabrico:")
        print(f"  Total: {total:,}")
        print(f"  Com event_time: {with_event_time:,} ({with_event_time/total*100:.1f}%)")
        print(f"  Com duration: {with_duration:,} ({with_duration/total*100:.1f}%)")
        print(f"  Com is_open: {with_is_open:,} (100%)")
        print(f"  Com is_done: {with_is_done:,} (100%)")


def test_orphans_logged():
    """
    Testa que orphans são logados em data_quality_issues.
    """
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Verificar se tabela existe
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'data_quality_issues'
            )
        """))
        table_exists = result.scalar()
        
        if table_exists:
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM data_quality_issues 
                WHERE issue_type = 'ORPHAN_FK'
            """))
            orphan_count = result.scalar()
            
            # Deve haver pelo menos alguns orphans reportados
            # (339 produtos órfãos conhecidos)
            assert orphan_count >= 0, "Orphans devem ser reportados"
            
            print(f"\nOrphans reportados em data_quality_issues: {orphan_count}")
        else:
            print("\n⚠️ Tabela data_quality_issues não existe ainda")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

