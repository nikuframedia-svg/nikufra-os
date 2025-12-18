"""
Testes de integridade de dados.
"""
import pytest
from sqlalchemy import create_engine, text
from backend.config import DATABASE_URL


@pytest.fixture
def engine():
    """Fixture para engine."""
    return create_engine(DATABASE_URL)


def test_faseof_dates_coherence(engine):
    """
    Testa que faseof_fim >= faseof_inicio quando ambos existem.
    """
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM fases_ordem_fabrico
            WHERE faseof_fim IS NOT NULL 
              AND faseof_inicio IS NOT NULL
              AND faseof_fim < faseof_inicio
        """))
        invalid_count = result.scalar()
        
        assert invalid_count == 0, f"Encontradas {invalid_count} fases com fim < inicio"
        print(f"\n✅ Todas as fases têm faseof_fim >= faseof_inicio")


def test_of_dates_coherence(engine):
    """
    Testa que of_data_acabamento >= of_data_criacao quando ambos existem.
    """
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM ordens_fabrico
            WHERE of_data_acabamento IS NOT NULL 
              AND of_data_criacao IS NOT NULL
              AND of_data_acabamento < of_data_criacao
        """))
        invalid_count = result.scalar()
        
        assert invalid_count == 0, f"Encontradas {invalid_count} ordens com acabamento < criacao"
        print(f"\n✅ Todas as ordens têm of_data_acabamento >= of_data_criacao")


def test_faseof_ofid_exists(engine):
    """
    Testa que faseof_of_id existe em ordens_fabrico.
    """
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                COUNT(DISTINCT faseof_of_id) as total_faseof,
                COUNT(DISTINCT CASE WHEN of.of_id IS NOT NULL THEN faseof_of_id END) as matching
            FROM fases_ordem_fabrico fof
            LEFT JOIN ordens_fabrico of ON fof.faseof_of_id = of.of_id
        """))
        row = result.fetchone()
        
        total = row[0]
        matching = row[1]
        match_rate = matching / total if total > 0 else 0
        
        # Deve ser > 99.9% (conforme RELATIONSHIPS_REPORT: 100%)
        assert match_rate > 0.999, f"Match rate faseof_of_id: {match_rate:.1%} (esperado > 99.9%)"
        print(f"\n✅ Match rate faseof_of_id ↔ of_id: {match_rate:.1%}")


def test_faseof_faseid_exists(engine):
    """
    Testa que faseof_fase_id existe em fases_catalogo.
    """
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                COUNT(DISTINCT faseof_fase_id) as total_faseof,
                COUNT(DISTINCT CASE WHEN f.fase_id IS NOT NULL THEN faseof_fase_id END) as matching
            FROM fases_ordem_fabrico fof
            LEFT JOIN fases_catalogo f ON fof.faseof_fase_id = f.fase_id
            WHERE faseof_fase_id IS NOT NULL
        """))
        row = result.fetchone()
        
        total = row[0]
        matching = row[1]
        match_rate = matching / total if total > 0 else 0
        
        # Deve ser > 99.9% (conforme RELATIONSHIPS_REPORT: 100%)
        assert match_rate > 0.999, f"Match rate faseof_fase_id: {match_rate:.1%} (esperado > 99.9%)"
        print(f"\n✅ Match rate faseof_fase_id ↔ fase_id: {match_rate:.1%}")


def test_ofch_gravidade_domain(engine):
    """
    Testa que ofch_gravidade está no domínio observado (1, 2, 3).
    """
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM erros_ordem_fabrico
            WHERE ofch_gravidade NOT IN (1, 2, 3)
        """))
        invalid_count = result.scalar()
        
        assert invalid_count == 0, f"Encontrados {invalid_count} erros com gravidade inválida"
        print(f"\n✅ Todos os erros têm ofch_gravidade em {1, 2, 3}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

