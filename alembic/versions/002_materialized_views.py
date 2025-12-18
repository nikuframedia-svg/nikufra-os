"""Create materialized views for KPIs and analytics

Revision ID: 002_mvs
Revises: 001_initial
Create Date: 2025-12-17 11:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_mvs'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Materialized View: Phase durations by model
    op.execute("""
        CREATE MATERIALIZED VIEW mv_phase_durations_by_model AS
        SELECT 
            m.produto_id AS modelo_id,
            fof.faseof_fase_id AS fase_id,
            COUNT(*) AS n,
            AVG(EXTRACT(EPOCH FROM (fof.faseof_fim - fof.faseof_inicio)) / 60.0) AS avg_real_duration_minutes,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (fof.faseof_fim - fof.faseof_inicio)) / 60.0) AS p50_duration_minutes,
            PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (fof.faseof_fim - fof.faseof_inicio)) / 60.0) AS p90_duration_minutes,
            STDDEV(EXTRACT(EPOCH FROM (fof.faseof_fim - fof.faseof_inicio)) / 60.0) AS std_duration_minutes
        FROM fases_ordem_fabrico fof
        JOIN ordens_fabrico of ON fof.faseof_of_id = of.of_id
        JOIN modelos m ON of.of_produto_id = m.produto_id
        WHERE fof.faseof_inicio IS NOT NULL 
          AND fof.faseof_fim IS NOT NULL
          AND fof.faseof_fim >= fof.faseof_inicio
        GROUP BY m.produto_id, fof.faseof_fase_id;
    """)
    
    op.execute("""
        CREATE UNIQUE INDEX ON mv_phase_durations_by_model (modelo_id, fase_id);
        CREATE INDEX ON mv_phase_durations_by_model (fase_id);
    """)
    
    # Materialized View: Order leadtime by model
    op.execute("""
        CREATE MATERIALIZED VIEW mv_order_leadtime_by_model AS
        SELECT 
            m.produto_id AS modelo_id,
            COUNT(*) AS n,
            AVG(EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao)) / 3600.0) AS avg_leadtime_hours,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao)) / 3600.0) AS p50_leadtime_hours,
            PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao)) / 3600.0) AS p90_leadtime_hours,
            COUNT(CASE WHEN of.of_data_acabamento <= COALESCE(
                (SELECT MAX(fof.faseof_data_prevista) 
                 FROM fases_ordem_fabrico fof 
                 WHERE fof.faseof_of_id = of.of_id), 
                of.of_data_acabamento)
            THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) AS on_time_rate
        FROM ordens_fabrico of
        JOIN modelos m ON of.of_produto_id = m.produto_id
        WHERE of.of_data_criacao IS NOT NULL 
          AND of.of_data_acabamento IS NOT NULL
          AND of.of_data_acabamento >= of.of_data_criacao
        GROUP BY m.produto_id;
    """)
    
    op.execute("""
        CREATE UNIQUE INDEX ON mv_order_leadtime_by_model (modelo_id);
    """)
    
    # Materialized View: Quality by phase
    op.execute("""
        CREATE MATERIALIZED VIEW mv_quality_by_phase AS
        SELECT 
            e.erro_fase_avaliacao AS fase_avaliacao_id,
            e.erro_faseof_culpada AS fase_culpada_id,
            COUNT(*) AS error_count,
            AVG(e.erro_gravidade) AS avg_gravidade,
            COUNT(DISTINCT e.erro_of_id) AS affected_orders_count
        FROM erros_ordem_fabrico e
        WHERE e.erro_fase_avaliacao IS NOT NULL
        GROUP BY e.erro_fase_avaliacao, e.erro_faseof_culpada;
    """)
    
    op.execute("""
        CREATE INDEX ON mv_quality_by_phase (fase_avaliacao_id);
        CREATE INDEX ON mv_quality_by_phase (fase_culpada_id);
    """)
    
    # Materialized View: WIP by phase (current)
    op.execute("""
        CREATE MATERIALIZED VIEW mv_wip_by_phase_current AS
        SELECT 
            fof.faseof_fase_id AS fase_id,
            COUNT(*) AS wip_count,
            AVG(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio)) / 3600.0) AS avg_wip_age_hours,
            MIN(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio)) / 3600.0) AS min_wip_age_hours,
            MAX(EXTRACT(EPOCH FROM (NOW() - fof.faseof_inicio)) / 3600.0) AS max_wip_age_hours
        FROM fases_ordem_fabrico fof
        WHERE fof.faseof_inicio IS NOT NULL 
          AND fof.faseof_fim IS NULL
        GROUP BY fof.faseof_fase_id;
    """)
    
    op.execute("""
        CREATE UNIQUE INDEX ON mv_wip_by_phase_current (fase_id);
    """)
    
    # Create refresh function for incremental updates
    op.execute("""
        CREATE OR REPLACE FUNCTION refresh_mv_incremental(mv_name TEXT, last_watermark TIMESTAMP WITH TIME ZONE)
        RETURNS VOID AS $$
        BEGIN
            IF mv_name = 'mv_phase_durations_by_model' THEN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_phase_durations_by_model;
            ELSIF mv_name = 'mv_order_leadtime_by_model' THEN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_order_leadtime_by_model;
            ELSIF mv_name = 'mv_quality_by_phase' THEN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_quality_by_phase;
            ELSIF mv_name = 'mv_wip_by_phase_current' THEN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_wip_by_phase_current;
            END IF;
        END;
        $$ LANGUAGE plpgsql;
    """)


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS refresh_mv_incremental(TEXT, TIMESTAMP WITH TIME ZONE)")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_wip_by_phase_current")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_quality_by_phase")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_order_leadtime_by_model")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_phase_durations_by_model")

