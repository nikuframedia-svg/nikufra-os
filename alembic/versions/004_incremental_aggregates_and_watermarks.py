"""Incremental aggregates and watermarks for performance

Revision ID: 004_aggregates
Revises: 003_corrected
Create Date: 2025-12-17 14:00:00

Cria tabelas de agregados incrementais e watermarks para refresh eficiente.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004_aggregates'
down_revision: Union[str, None] = '003_corrected'  # Usar 003 se existir, senão 002_mvs
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================================
    # WATERMARKS TABLE
    # ============================================================================
    # Note: analytics_watermarks já foi criada na migration 001 com estrutura diferente
    # (usa mv_name em vez de source_table/source_column)
    # Esta migration não recria a tabela, apenas garante que existe
    # Se precisar de alterar estrutura, fazer em migration futura
    
    op.execute("""
        DO $$
        BEGIN
            -- Verificar se tabela existe (já criada na migration 001)
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'analytics_watermarks'
            ) THEN
                -- Se não existir, criar com estrutura da migration 001
                CREATE TABLE analytics_watermarks (
                    watermark_id SERIAL NOT NULL,
                    mv_name VARCHAR(100) NOT NULL,
                    last_ts TIMESTAMP WITH TIME ZONE,
                    last_partition VARCHAR(100),
                    last_run_id INTEGER,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                    PRIMARY KEY (watermark_id),
                    UNIQUE (mv_name)
                );
            END IF;
        END $$;
    """)
    
    # ============================================================================
    # INCREMENTAL AGGREGATES TABLES
    # ============================================================================
    
    # 1. agg_phase_stats_daily
    op.create_table(
        'agg_phase_stats_daily',
        sa.Column('snapshot_date', sa.Date(), nullable=False),
        sa.Column('produto_id', sa.Integer(), nullable=False),  # CORRIGIDO: usar produto_id
        sa.Column('fase_id', sa.Integer(), nullable=False),
        sa.Column('n', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('sum_duration_seconds', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('sum_duration_sq', sa.Numeric(precision=20, scale=2), nullable=False, server_default='0'),
        sa.Column('min_duration_seconds', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('max_duration_seconds', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('snapshot_date', 'produto_id', 'fase_id'),
        sa.ForeignKeyConstraint(['produto_id'], ['modelos.produto_id'], deferrable=True, initially='DEFERRED'),
        sa.ForeignKeyConstraint(['fase_id'], ['fases_catalogo.fase_id'], deferrable=True, initially='DEFERRED'),
    )
    op.create_index('idx_agg_phase_date_produto', 'agg_phase_stats_daily', ['snapshot_date', 'produto_id'])
    op.create_index('idx_agg_phase_date_fase', 'agg_phase_stats_daily', ['snapshot_date', 'fase_id'])
    
    # 2. agg_order_stats_daily
    op.create_table(
        'agg_order_stats_daily',
        sa.Column('snapshot_date', sa.Date(), nullable=False),
        sa.Column('produto_id', sa.Integer(), nullable=False),  # CORRIGIDO: usar produto_id
        sa.Column('n', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('sum_leadtime_seconds', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('sum_leadtime_sq', sa.Numeric(precision=20, scale=2), nullable=False, server_default='0'),
        sa.Column('on_time_count', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('late_count', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('snapshot_date', 'produto_id'),
        sa.ForeignKeyConstraint(['produto_id'], ['modelos.produto_id'], deferrable=True, initially='DEFERRED'),
    )
    op.create_index('idx_agg_order_date_produto', 'agg_order_stats_daily', ['snapshot_date', 'produto_id'])
    
    # 3. agg_quality_daily
    # Nota: faseof_culpada é string no Excel, não pode ser FK direto
    op.create_table(
        'agg_quality_daily',
        sa.Column('snapshot_date', sa.Date(), nullable=False),
        sa.Column('produto_id', sa.Integer(), nullable=True),  # NULL = overall
        sa.Column('fase_avaliacao_id', sa.Integer(), nullable=True),  # NULL = overall
        sa.Column('faseof_culpada_str', sa.String(length=100), nullable=True),  # String, não FK
        sa.Column('n_errors', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('sum_gravidade', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'),
        sa.Column('affected_orders_count', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('snapshot_date', 'produto_id', 'fase_avaliacao_id', 'faseof_culpada_str'),
        sa.ForeignKeyConstraint(['produto_id'], ['modelos.produto_id'], deferrable=True, initially='DEFERRED'),
        sa.ForeignKeyConstraint(['fase_avaliacao_id'], ['fases_catalogo.fase_id'], deferrable=True, initially='DEFERRED'),
    )
    op.create_index('idx_agg_quality_date', 'agg_quality_daily', ['snapshot_date'])
    op.create_index('idx_agg_quality_produto', 'agg_quality_daily', ['snapshot_date', 'produto_id'])
    
    # 4. agg_wip_current (tabela materializada incremental)
    op.execute("""
        CREATE TABLE agg_wip_current (
            fase_id INTEGER NOT NULL,
            produto_id INTEGER,
            wip_count BIGINT NOT NULL DEFAULT 0,
            sum_age_seconds NUMERIC(15,2) NOT NULL DEFAULT 0,
            sum_age_sq NUMERIC(20,2) NOT NULL DEFAULT 0,
            min_age_seconds NUMERIC(10,2),
            max_age_seconds NUMERIC(10,2),
            oldest_event_time TIMESTAMP WITH TIME ZONE,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            PRIMARY KEY (fase_id, produto_id),
            FOREIGN KEY (fase_id) REFERENCES fases_catalogo(fase_id) DEFERRABLE INITIALLY DEFERRED,
            FOREIGN KEY (produto_id) REFERENCES modelos(produto_id) DEFERRABLE INITIALLY DEFERRED
        );
    """)
    op.create_index('idx_agg_wip_fase', 'agg_wip_current', ['fase_id'])
    op.create_index('idx_agg_wip_produto', 'agg_wip_current', ['produto_id'])
    
    # ============================================================================
    # CACHE VERSION TABLE
    # ============================================================================
    
    op.create_table(
        'ops_cache_version',
        sa.Column('cache_version', sa.BigInteger(), nullable=False, server_default='1'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('cache_version')
    )
    
    # Inserir versão inicial
    op.execute("INSERT INTO ops_cache_version (cache_version) VALUES (1) ON CONFLICT DO NOTHING")
    
    # ============================================================================
    # CORRIGIR MVs PARA USAR produto_id
    # ============================================================================
    
    # Dropar MVs antigas (se existirem)
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_phase_durations_by_model CASCADE")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_order_leadtime_by_model CASCADE")
    
    # Recriar com produto_id
    op.execute("""
        CREATE MATERIALIZED VIEW mv_phase_durations_by_model AS
        SELECT 
            m.produto_id,  -- CORRIGIDO
            fof.faseof_fase_id AS fase_id,
            COUNT(*) AS n,
            AVG(fof.faseof_duration_seconds) AS avg_real_duration_seconds,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY fof.faseof_duration_seconds) AS p50_duration_seconds,
            PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY fof.faseof_duration_seconds) AS p90_duration_seconds,
            STDDEV(fof.faseof_duration_seconds) AS std_duration_seconds
        FROM fases_ordem_fabrico fof
        JOIN ordens_fabrico of ON fof.faseof_of_id = of.of_id
        JOIN modelos m ON of.of_produto_id = m.produto_id  -- CORRIGIDO
        WHERE fof.faseof_duration_seconds IS NOT NULL
          AND fof.faseof_duration_seconds > 0
        GROUP BY m.produto_id, fof.faseof_fase_id;
    """)
    
    op.execute("""
        CREATE UNIQUE INDEX ON mv_phase_durations_by_model (produto_id, fase_id);
        CREATE INDEX ON mv_phase_durations_by_model (fase_id);
    """)
    
    op.execute("""
        CREATE MATERIALIZED VIEW mv_order_leadtime_by_model AS
        SELECT 
            m.produto_id,  -- CORRIGIDO
            COUNT(*) AS n,
            AVG(EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao))) AS avg_leadtime_seconds,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao))) AS p50_leadtime_seconds,
            PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (of.of_data_acabamento - of.of_data_criacao))) AS p90_leadtime_seconds,
            COUNT(CASE WHEN of.of_data_transporte IS NOT NULL 
                      AND of.of_data_acabamento <= of.of_data_transporte 
                 THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) AS on_time_rate
        FROM ordens_fabrico of
        JOIN modelos m ON of.of_produto_id = m.produto_id  -- CORRIGIDO
        WHERE of.of_data_criacao IS NOT NULL 
          AND of.of_data_acabamento IS NOT NULL
          AND of.of_data_acabamento >= of.of_data_criacao
        GROUP BY m.produto_id;
    """)
    
    op.execute("""
        CREATE UNIQUE INDEX ON mv_order_leadtime_by_model (produto_id);
    """)
    
    # Corrigir mv_quality_by_phase para usar ofch_*
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_quality_by_phase CASCADE")
    
    op.execute("""
        CREATE MATERIALIZED VIEW mv_quality_by_phase AS
        SELECT 
            e.ofch_fase_avaliacao AS fase_avaliacao_id,  -- CORRIGIDO
            e.ofch_faseof_culpada AS faseof_culpada_id,  -- CORRIGIDO: usar faseof_culpada (string)
            COUNT(*) AS error_count,
            AVG(e.ofch_gravidade) AS avg_gravidade,  -- CORRIGIDO
            COUNT(DISTINCT e.ofch_of_id) AS affected_orders_count  -- CORRIGIDO
        FROM erros_ordem_fabrico e
        WHERE e.ofch_fase_avaliacao IS NOT NULL
        GROUP BY e.ofch_fase_avaliacao, e.ofch_faseof_culpada;
    """)
    
    op.execute("""
        CREATE INDEX ON mv_quality_by_phase (fase_avaliacao_id);
        CREATE INDEX ON mv_quality_by_phase (faseof_culpada_id);
    """)
    
    # ============================================================================
    # ÍNDICES COMPOSTOS OBRIGATÓRIOS (performance)
    # ============================================================================
    
    # ordens_fabrico
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_of_produto_data_id 
        ON ordens_fabrico(of_produto_id, of_data_criacao DESC, of_id DESC);
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_of_fase_data_id 
        ON ordens_fabrico(of_fase_id, of_data_criacao DESC, of_id DESC);
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_of_transporte_id 
        ON ordens_fabrico(of_data_transporte DESC, of_id DESC) 
        WHERE of_data_transporte IS NOT NULL;
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_of_acabamento_id 
        ON ordens_fabrico(of_data_acabamento DESC, of_id DESC) 
        WHERE of_data_acabamento IS NOT NULL;
    """)
    
    # fases_ordem_fabrico (em cada partição, mas também no parent)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_faseof_faseid_open_event 
        ON fases_ordem_fabrico(faseof_fase_id, faseof_is_open, faseof_event_time DESC) 
        WHERE faseof_is_open = true;
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_faseof_faseid_event 
        ON fases_ordem_fabrico(faseof_fase_id, faseof_event_time DESC);
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_faseof_ofid_event 
        ON fases_ordem_fabrico(faseof_of_id, faseof_event_time DESC);
    """)
    
    # erros_ordem_fabrico
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_err_faseav_gravidade 
        ON erros_ordem_fabrico(ofch_fase_avaliacao, ofch_gravidade);
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_err_faseofculpada_gravidade 
        ON erros_ordem_fabrico(ofch_faseof_culpada, ofch_gravidade);
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_err_event_time 
        ON erros_ordem_fabrico(ofch_event_time DESC) 
        WHERE ofch_event_time IS NOT NULL;
    """)
    
    # fases_standard_modelos
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_fsm_produto_seq 
        ON fases_standard_modelos(produto_id, sequencia);
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_fsm_produto_fase 
        ON fases_standard_modelos(produto_id, fase_id);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS agg_wip_current CASCADE")
    op.execute("DROP TABLE IF EXISTS agg_quality_daily CASCADE")
    op.execute("DROP TABLE IF EXISTS agg_order_stats_daily CASCADE")
    op.execute("DROP TABLE IF EXISTS agg_phase_stats_daily CASCADE")
    op.execute("DROP TABLE IF EXISTS analytics_watermarks CASCADE")
    op.execute("DROP TABLE IF EXISTS ops_cache_version CASCADE")

