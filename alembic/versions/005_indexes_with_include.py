"""Create indexes with INCLUDE for performance

Revision ID: 005_indexes_include
Revises: 004_aggregates
Create Date: 2025-12-17 16:00:00

Cria índices com INCLUDE para evitar heap fetch.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '005_indexes_include'
down_revision: Union[str, None] = '004_aggregates'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================================
    # ÍNDICES COM INCLUDE (PostgreSQL 11+)
    # ============================================================================
    
    # ordens_fabrico: índice com INCLUDE para evitar heap fetch
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_of_produto_data_id_include
        ON ordens_fabrico(of_produto_id, of_data_criacao DESC, of_id DESC)
        INCLUDE (of_fase_id, of_data_transporte, of_data_acabamento);
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_of_fase_data_id_include
        ON ordens_fabrico(of_fase_id, of_data_criacao DESC, of_id DESC)
        INCLUDE (of_produto_id, of_data_transporte, of_data_acabamento);
    """)
    
    # fases_ordem_fabrico: índice para WIP com INCLUDE
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_faseof_faseid_event_include
        ON fases_ordem_fabrico(faseof_fase_id, faseof_event_time DESC)
        INCLUDE (faseof_of_id, faseof_sequencia, faseof_peso)
        WHERE faseof_is_open = true;
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_faseof_faseid_event_include_all
        ON fases_ordem_fabrico(faseof_fase_id, faseof_event_time DESC)
        INCLUDE (faseof_of_id, faseof_sequencia, faseof_peso, faseof_duration_seconds);
    """)
    
    # fases_ordem_fabrico: índice para schedule/current
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_faseof_open_schedule
        ON fases_ordem_fabrico(faseof_fase_id, faseof_inicio DESC)
        INCLUDE (faseof_of_id, faseof_sequencia, faseof_peso, faseof_event_time)
        WHERE faseof_is_open = true;
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_faseof_open_schedule")
    op.execute("DROP INDEX IF EXISTS idx_faseof_faseid_event_include_all")
    op.execute("DROP INDEX IF EXISTS idx_faseof_faseid_event_include")
    op.execute("DROP INDEX IF EXISTS idx_of_fase_data_id_include")
    op.execute("DROP INDEX IF EXISTS idx_of_produto_data_id_include")
