"""Initial schema with partitioning and indexes

Revision ID: 001_initial
Revises: 
Create Date: 2025-12-17 11:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================================
    # MASTER DATA TABLES (no partitioning needed - small tables)
    # ============================================================================
    
    # Funcionarios (Workers)
    op.create_table(
        'funcionarios',
        sa.Column('funcionario_id', sa.Integer(), nullable=False),
        sa.Column('funcionario_nome', sa.String(length=255), nullable=False),
        sa.Column('funcionario_activo', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('atualizado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('funcionario_id'),
    )
    op.create_index('idx_funcionarios_activo', 'funcionarios', ['funcionario_activo'])
    
    # Fases (Phases Catalog)
    op.create_table(
        'fases_catalogo',
        sa.Column('fase_id', sa.Integer(), nullable=False),
        sa.Column('fase_nome', sa.String(length=255), nullable=False),
        sa.Column('fase_sequencia', sa.Integer(), nullable=True),
        sa.Column('fase_de_producao', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('fase_automatica', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('atualizado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('fase_id'),
    )
    op.create_index('idx_fases_nome', 'fases_catalogo', ['fase_nome'], unique=True)
    op.create_index('idx_fases_sequencia', 'fases_catalogo', ['fase_sequencia'])
    
    # Modelos (Products) - CORRIGIDO: usar produto_id e nomes corretos
    op.create_table(
        'modelos',
        sa.Column('produto_id', sa.Integer(), nullable=False),  # CORRIGIDO
        sa.Column('produto_nome', sa.String(length=255), nullable=False),  # CORRIGIDO
        sa.Column('produto_peso_desmolde', sa.Numeric(precision=10, scale=2), nullable=True),  # CORRIGIDO
        sa.Column('produto_peso_acabamento', sa.Numeric(precision=10, scale=2), nullable=True),  # CORRIGIDO
        sa.Column('produto_qtd_gel_deck', sa.Numeric(precision=10, scale=4), nullable=True),  # CORRIGIDO
        sa.Column('produto_qtd_gel_casco', sa.Numeric(precision=10, scale=4), nullable=True),  # CORRIGIDO
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('atualizado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('produto_id'),  # CORRIGIDO
    )
    op.create_index('idx_modelos_nome', 'modelos', ['produto_nome'], unique=True)  # CORRIGIDO
    
    # FuncionariosFasesAptos (Worker Phase Skills) - CORRIGIDO
    op.create_table(
        'funcionarios_fases_aptos',
        sa.Column('funcionario_id', sa.Integer(), nullable=False),
        sa.Column('fase_id', sa.Integer(), nullable=False),
        sa.Column('funcionariofase_inicio', sa.Date(), nullable=False),  # CORRIGIDO
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('funcionario_id', 'fase_id'),
        sa.ForeignKeyConstraint(['funcionario_id'], ['funcionarios.funcionario_id'], deferrable=True, initially='DEFERRED'),
        sa.ForeignKeyConstraint(['fase_id'], ['fases_catalogo.fase_id'], deferrable=True, initially='DEFERRED'),
    )
    op.create_index('idx_ffa_fase', 'funcionarios_fases_aptos', ['fase_id'])
    op.create_index('idx_ffa_func_fase', 'funcionarios_fases_aptos', ['funcionario_id', 'fase_id'])
    
    # FasesStandardModelos (Product Phase Standards) - CORRIGIDO: usar produto_id
    op.create_table(
        'fases_standard_modelos',
        sa.Column('produto_id', sa.Integer(), nullable=False),  # CORRIGIDO
        sa.Column('fase_id', sa.Integer(), nullable=False),
        sa.Column('sequencia', sa.Integer(), nullable=False),
        sa.Column('coeficiente', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('coeficiente_x', sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('produto_id', 'fase_id', 'sequencia'),  # CORRIGIDO
        sa.ForeignKeyConstraint(['produto_id'], ['modelos.produto_id'], deferrable=True, initially='DEFERRED'),  # CORRIGIDO
        sa.ForeignKeyConstraint(['fase_id'], ['fases_catalogo.fase_id'], deferrable=True, initially='DEFERRED'),
    )
    op.create_index('idx_fsm_modelo_seq', 'fases_standard_modelos', ['produto_id', 'sequencia'])  # CORRIGIDO
    op.create_index('idx_fsm_modelo_fase', 'fases_standard_modelos', ['produto_id', 'fase_id'])  # CORRIGIDO
    
    # ============================================================================
    # TRANSACTION TABLES (with partitioning)
    # ============================================================================
    
    # OrdensFabrico (Orders) - no partitioning (27k rows)
    op.create_table(
        'ordens_fabrico',
        sa.Column('of_id', sa.String(length=50), nullable=False),
        sa.Column('of_data_criacao', sa.DateTime(timezone=True), nullable=False),
        sa.Column('of_data_acabamento', sa.DateTime(timezone=True), nullable=True),
        sa.Column('of_produto_id', sa.Integer(), nullable=True),
        sa.Column('of_fase_id', sa.Integer(), nullable=True),
        sa.Column('of_data_transporte', sa.DateTime(timezone=True), nullable=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('atualizado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('of_id'),
        sa.ForeignKeyConstraint(['of_produto_id'], ['modelos.produto_id'], deferrable=True, initially='DEFERRED'),  # CORRIGIDO
        sa.ForeignKeyConstraint(['of_fase_id'], ['fases_catalogo.fase_id'], deferrable=True, initially='DEFERRED'),
    )
    op.create_index('idx_of_modelo', 'ordens_fabrico', ['of_produto_id'])
    op.create_index('idx_of_datas', 'ordens_fabrico', ['of_data_criacao', 'of_data_acabamento', 'of_data_transporte'])
    op.create_index('idx_of_fase', 'ordens_fabrico', ['of_fase_id'])
    op.create_index('idx_of_data_criacao', 'ordens_fabrico', ['of_data_criacao'])
    
    # FasesOrdemFabrico (Order Phases) - PARTITIONED by date range
    # Create parent table - CORRIGIDO: adicionar colunas derivadas governadas
    op.execute("""
        CREATE TABLE fases_ordem_fabrico (
            faseof_id VARCHAR(50) NOT NULL,
            faseof_of_id VARCHAR(50) NOT NULL,
            faseof_inicio TIMESTAMP WITH TIME ZONE,
            faseof_fim TIMESTAMP WITH TIME ZONE,
            faseof_data_prevista DATE,
            faseof_coeficiente NUMERIC(10,4),
            faseof_coeficiente_x NUMERIC(10,4),
            faseof_fase_id INTEGER,
            faseof_peso NUMERIC(10,2),
            faseof_retorno INTEGER,
            faseof_turno INTEGER,
            faseof_sequencia INTEGER,
            -- Colunas derivadas governadas
            faseof_event_time TIMESTAMP WITH TIME ZONE,
            faseof_duration_seconds NUMERIC(10,2),
            faseof_is_open BOOLEAN DEFAULT false,
            faseof_is_done BOOLEAN DEFAULT false,
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            PRIMARY KEY (faseof_id, faseof_fim),
            CONSTRAINT fk_faseof_of FOREIGN KEY (faseof_of_id) 
                REFERENCES ordens_fabrico(of_id) DEFERRABLE INITIALLY DEFERRED,
            CONSTRAINT fk_faseof_fase FOREIGN KEY (faseof_fase_id) 
                REFERENCES fases_catalogo(fase_id) DEFERRABLE INITIALLY DEFERRED,
            CONSTRAINT chk_faseof_fim_after_inicio CHECK (faseof_fim IS NULL OR faseof_inicio IS NULL OR faseof_fim >= faseof_inicio)
        ) PARTITION BY RANGE (faseof_fim);
    """)
    
    # Create default partition for NULL dates
    op.execute("""
        CREATE TABLE fases_ordem_fabrico_default PARTITION OF fases_ordem_fabrico
        DEFAULT;
    """)
    
    # Create monthly partitions for last 5 years (2020-2025)
    # We'll create them dynamically, but for now create a few key ones
    for year in range(2020, 2026):
        for month in range(1, 13):
            start_date = f"{year}-{month:02d}-01"
            if month == 12:
                end_date = f"{year+1}-01-01"
            else:
                end_date = f"{year}-{month+1:02d}-01"
            
            partition_name = f"fases_ordem_fabrico_p_{year}_{month:02d}"
            op.execute(f"""
                CREATE TABLE IF NOT EXISTS {partition_name} PARTITION OF fases_ordem_fabrico
                FOR VALUES FROM ('{start_date}') TO ('{end_date}');
            """)
    
    # Create indexes on partitioned table - CORRIGIDO: adicionar índices para colunas derivadas
    op.execute("""
        CREATE INDEX idx_faseof_ofid_seq ON fases_ordem_fabrico(faseof_of_id, faseof_sequencia);
        CREATE INDEX idx_faseof_ofid_faseid ON fases_ordem_fabrico(faseof_of_id, faseof_fase_id);
        CREATE INDEX idx_faseof_faseid_fim ON fases_ordem_fabrico(faseof_fase_id, faseof_fim);
        CREATE INDEX idx_faseof_previsto ON fases_ordem_fabrico(faseof_data_prevista);
        CREATE INDEX idx_faseof_inicio_fim ON fases_ordem_fabrico(faseof_inicio, faseof_fim);
        CREATE INDEX idx_faseof_inicio ON fases_ordem_fabrico(faseof_inicio);
        CREATE INDEX idx_faseof_event_time ON fases_ordem_fabrico(faseof_event_time) WHERE faseof_event_time IS NOT NULL;
        CREATE INDEX idx_faseof_open_by_fase ON fases_ordem_fabrico(faseof_fase_id, faseof_of_id) WHERE faseof_is_open = true;
    """)
    
    # FuncionariosFaseOrdemFabrico (Order Phase Workers) - PARTITIONED by hash
    op.execute("""
        CREATE TABLE funcionarios_fase_ordem_fabrico (
            funcionariofaseof_faseof_id VARCHAR(50) NOT NULL,
            funcionariofaseof_funcionario_id INTEGER NOT NULL,
            funcionariofaseof_chefe INTEGER NOT NULL DEFAULT 0,
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            PRIMARY KEY (funcionariofaseof_faseof_id, funcionariofaseof_funcionario_id),
            CONSTRAINT fk_ffof_func FOREIGN KEY (funcionariofaseof_funcionario_id) 
                REFERENCES funcionarios(funcionario_id) DEFERRABLE INITIALLY DEFERRED
        ) PARTITION BY HASH (funcionariofaseof_faseof_id);
    """)
    
    # Create 16 hash partitions
    for i in range(16):
        partition_name = f"funcionarios_fase_ordem_fabrico_p_{i}"
        op.execute(f"""
            CREATE TABLE {partition_name} PARTITION OF funcionarios_fase_ordem_fabrico
            FOR VALUES WITH (modulus 16, remainder {i});
        """)
    
    # Create indexes
    op.execute("""
        CREATE INDEX idx_ffof_funcid ON funcionarios_fase_ordem_fabrico(funcionariofaseof_funcionario_id);
        CREATE INDEX idx_ffof_func_fase ON funcionarios_fase_ordem_fabrico(funcionariofaseof_funcionario_id, funcionariofaseof_chefe);
    """)
    
    # OrdemFabricoErros (Order Errors) - PARTITIONED by HASH (ofch_of_id)
    # CORRIGIDO: usar PARTITION BY HASH em vez de RANGE
    op.execute("""
        CREATE TABLE erros_ordem_fabrico (
            erro_id SERIAL,
            erro_descricao TEXT NOT NULL,
            erro_of_id VARCHAR(50),
            erro_fase_avaliacao INTEGER,
            erro_gravidade INTEGER NOT NULL,
            erro_faseof_avaliacao VARCHAR(50),
            erro_faseof_culpada VARCHAR(50),
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            PRIMARY KEY (erro_id, erro_of_id),
            CONSTRAINT fk_erro_of FOREIGN KEY (erro_of_id) 
                REFERENCES ordens_fabrico(of_id) DEFERRABLE INITIALLY DEFERRED,
            CONSTRAINT fk_erro_fase_av FOREIGN KEY (erro_fase_avaliacao) 
                REFERENCES fases_catalogo(fase_id) DEFERRABLE INITIALLY DEFERRED,
            CONSTRAINT chk_gravidade CHECK (erro_gravidade >= 1 AND erro_gravidade <= 3)
        ) PARTITION BY HASH (erro_of_id);
    """)
    
    # Create hash partitions for errors (32 partitions)
    for i in range(32):
        partition_name = f"erros_ordem_fabrico_p_{i}"
        op.execute(f"""
            CREATE TABLE {partition_name} PARTITION OF erros_ordem_fabrico
            FOR VALUES WITH (modulus 32, remainder {i});
        """)
    
    # Create indexes - CORRIGIDO: usar nomes de colunas corretos (erro_* até migration 003 renomear)
    op.execute("""
        CREATE INDEX idx_err_ofid ON erros_ordem_fabrico(erro_of_id);
        CREATE INDEX idx_err_faseof_culpada ON erros_ordem_fabrico(erro_faseof_culpada, erro_gravidade);
        CREATE INDEX idx_err_fase_av ON erros_ordem_fabrico(erro_fase_avaliacao, erro_gravidade);
        CREATE INDEX idx_err_gravidade ON erros_ordem_fabrico(erro_gravidade);
    """)
    
    # ============================================================================
    # INGESTION TRACKING TABLES
    # ============================================================================
    
    op.create_table(
        'ingestion_runs',
        sa.Column('run_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='running'),
        sa.Column('total_sheets', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('processed_sheets', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_rows', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('processed_rows', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('rejected_rows', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('excel_sha256', sa.String(length=64), nullable=True),  # Para idempotência
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('run_id'),
    )
    op.create_index('idx_ingestion_runs_status', 'ingestion_runs', ['status'])
    op.create_index('idx_ingestion_runs_started', 'ingestion_runs', ['started_at'])
    op.create_index('idx_ingestion_runs_checksum', 'ingestion_runs', ['excel_sha256'])  # Para idempotência
    
    op.create_table(
        'ingestion_sheet_runs',
        sa.Column('sheet_run_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('run_id', sa.Integer(), nullable=False),
        sa.Column('sheet_name', sa.String(length=100), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='running'),
        sa.Column('total_rows', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('processed_rows', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('rejected_rows', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('throughput_rows_per_sec', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['run_id'], ['ingestion_runs.run_id']),
        sa.PrimaryKeyConstraint('sheet_run_id'),
    )
    op.create_index('idx_sheet_runs_run', 'ingestion_sheet_runs', ['run_id'])
    op.create_index('idx_sheet_runs_sheet', 'ingestion_sheet_runs', ['sheet_name'])
    
    # ============================================================================
    # REJECTS TABLES (one per main entity)
    # ============================================================================
    
    for table_name in ['ordens_fabrico', 'fases_ordem_fabrico', 'funcionarios_fase_ordem_fabrico', 
                       'erros_ordem_fabrico', 'funcionarios', 'fases_catalogo', 'modelos',
                       'funcionarios_fases_aptos', 'fases_standard_modelos']:
        reject_table = f"{table_name}_rejects"
        op.create_table(
            reject_table,
            sa.Column('reject_id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('ingestion_run_id', sa.Integer(), nullable=False),
            sa.Column('sheet_name', sa.String(length=100), nullable=False),
            sa.Column('row_number', sa.Integer(), nullable=False),
            sa.Column('reason_code', sa.String(length=50), nullable=False),
            sa.Column('reason_detail', sa.Text(), nullable=True),
            sa.Column('raw_json', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['ingestion_run_id'], ['ingestion_runs.run_id']),
            sa.PrimaryKeyConstraint('reject_id'),
        )
        op.create_index(f'idx_{reject_table}_run', reject_table, ['ingestion_run_id'])
        op.create_index(f'idx_{reject_table}_reason', reject_table, ['reason_code'])
    
    # ============================================================================
    # STAGING TABLES (UNLOGGED for fast ingestion)
    # ============================================================================
    
    op.execute("CREATE SCHEMA IF NOT EXISTS staging")
    
    # Create staging tables (structure only, no constraints)
    staging_tables = {
        'ordens_fabrico_raw': ['of_id VARCHAR(50)', 'of_data_criacao TEXT', 'of_data_acabamento TEXT',
                              'of_produto_id TEXT', 'of_fase_id TEXT', 'of_data_transporte TEXT'],
        'fases_ordem_fabrico_raw': ['faseof_id VARCHAR(50)', 'faseof_of_id VARCHAR(50)', 'faseof_inicio TEXT',
                                   'faseof_fim TEXT', 'faseof_data_prevista TEXT', 'faseof_coeficiente TEXT',
                                   'faseof_coeficiente_x TEXT', 'faseof_fase_id TEXT', 'faseof_turno TEXT',
                                   'faseof_retorno TEXT', 'faseof_peso TEXT', 'faseof_sequencia TEXT'],
        'funcionarios_fase_ordem_fabrico_raw': ['funcionariofaseof_faseof_id VARCHAR(50)',
                                               'funcionariofaseof_funcionario_id TEXT',
                                               'funcionariofaseof_chefe TEXT'],
        'erros_ordem_fabrico_raw': ['ofch_descricao_erro TEXT', 'ofch_of_id TEXT', 'ofch_fase_avaliacao TEXT',
                                   'ofch_gravidade TEXT', 'ofch_faseof_avaliacao TEXT', 'ofch_faseof_culpada TEXT'],
        'funcionarios_raw': ['funcionario_id TEXT', 'funcionario_nome TEXT', 'funcionario_activo TEXT'],
        'funcionarios_fases_aptos_raw': ['funcionario_id TEXT', 'fase_id TEXT', 'funcionariofase_inicio TEXT'],
        'fases_catalogo_raw': ['fase_id TEXT', 'fase_nome TEXT', 'fase_sequencia TEXT',
                              'fase_de_producao TEXT', 'fase_automatica TEXT'],
        'modelos_raw': ['produto_id TEXT', 'produto_nome TEXT', 'produto_peso_desmolde TEXT',
                       'produto_peso_acabamento TEXT', 'produto_qtd_gel_deck TEXT', 'produto_qtd_gel_casco TEXT'],
        'fases_standard_modelos_raw': ['produto_id TEXT', 'fase_id TEXT', 'sequencia TEXT',
                                      'coeficiente TEXT', 'coeficiente_x TEXT']
    }
    
    for table_name, columns in staging_tables.items():
        op.execute(f"""
            CREATE UNLOGGED TABLE IF NOT EXISTS staging.{table_name} (
                {', '.join(columns)}
            );
        """)
    
    # ============================================================================
    # DATA QUALITY ISSUES
    # ============================================================================
    
    op.create_table(
        'data_quality_issues',
        sa.Column('issue_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('issue_type', sa.String(length=50), nullable=False),
        sa.Column('entity', sa.String(length=100), nullable=False),
        sa.Column('entity_key', sa.String(length=255), nullable=True),
        sa.Column('details_json', sa.JSON(), nullable=True),
        sa.Column('detected_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('issue_id'),
    )
    op.create_index('idx_dq_issues_type', 'data_quality_issues', ['issue_type'])
    op.create_index('idx_dq_issues_entity', 'data_quality_issues', ['entity', 'entity_key'])
    op.create_index('idx_dq_issues_resolved', 'data_quality_issues', ['resolved_at'])
    
    # ============================================================================
    # KPI SNAPSHOTS
    # ============================================================================
    
    op.create_table(
        'kpi_snapshots_daily',
        sa.Column('snapshot_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('snapshot_date', sa.Date(), nullable=False),
        sa.Column('modelo_id', sa.Integer(), nullable=True),
        sa.Column('fase_id', sa.Integer(), nullable=True),
        sa.Column('order_count', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('phase_count', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('avg_duration_minutes', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('p50_duration_minutes', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('p90_duration_minutes', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('on_time_rate', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['modelo_id'], ['modelos.produto_id']),  # CORRIGIDO: usar produto_id
        sa.ForeignKeyConstraint(['fase_id'], ['fases_catalogo.fase_id']),
        sa.PrimaryKeyConstraint('snapshot_id'),
    )
    op.create_index('idx_kpi_daily_date', 'kpi_snapshots_daily', ['snapshot_date'])
    op.create_index('idx_kpi_daily_modelo', 'kpi_snapshots_daily', ['modelo_id', 'snapshot_date'])  # modelo_id mantido para compatibilidade
    op.create_index('idx_kpi_daily_fase', 'kpi_snapshots_daily', ['fase_id', 'snapshot_date'])
    
    op.create_table(
        'kpi_snapshots_monthly',
        sa.Column('snapshot_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('snapshot_month', sa.Date(), nullable=False),
        sa.Column('modelo_id', sa.Integer(), nullable=True),
        sa.Column('fase_id', sa.Integer(), nullable=True),
        sa.Column('order_count', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('phase_count', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('avg_duration_minutes', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('p50_duration_minutes', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('p90_duration_minutes', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('on_time_rate', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['modelo_id'], ['modelos.produto_id']),  # CORRIGIDO: usar produto_id
        sa.ForeignKeyConstraint(['fase_id'], ['fases_catalogo.fase_id']),
        sa.PrimaryKeyConstraint('snapshot_id'),
    )
    op.create_index('idx_kpi_monthly_month', 'kpi_snapshots_monthly', ['snapshot_month'])
    
    op.create_table(
        'quality_snapshots',
        sa.Column('snapshot_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('snapshot_date', sa.Date(), nullable=False),
        sa.Column('fase_avaliacao_id', sa.Integer(), nullable=True),
        sa.Column('fase_culpada_id', sa.Integer(), nullable=True),
        sa.Column('error_count', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('avg_gravidade', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['fase_avaliacao_id'], ['fases_catalogo.fase_id']),
        sa.ForeignKeyConstraint(['fase_culpada_id'], ['fases_catalogo.fase_id']),
        sa.PrimaryKeyConstraint('snapshot_id'),
    )
    op.create_index('idx_quality_date', 'quality_snapshots', ['snapshot_date'])
    
    op.create_table(
        'wip_snapshots',
        sa.Column('snapshot_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('snapshot_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('fase_id', sa.Integer(), nullable=True),
        sa.Column('wip_count', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('avg_wip_age_hours', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['fase_id'], ['fases_catalogo.fase_id']),
        sa.PrimaryKeyConstraint('snapshot_id'),
    )
    op.create_index('idx_wip_timestamp', 'wip_snapshots', ['snapshot_timestamp'])
    op.create_index('idx_wip_fase', 'wip_snapshots', ['fase_id', 'snapshot_timestamp'])
    
    # ============================================================================
    # ANALYTICS WATERMARKS
    # ============================================================================
    
    op.create_table(
        'analytics_watermarks',
        sa.Column('watermark_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('mv_name', sa.String(length=100), nullable=False),
        sa.Column('last_ts', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_partition', sa.String(length=100), nullable=True),
        sa.Column('last_run_id', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('watermark_id'),
        sa.UniqueConstraint('mv_name'),
    )
    
    # ============================================================================
    # WHAT-IF RUNS
    # ============================================================================
    
    op.create_table(
        'whatif_runs',
        sa.Column('run_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('input_json', sa.JSON(), nullable=False),
        sa.Column('output_json', sa.JSON(), nullable=True),
        sa.Column('version_hash', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('run_id'),
    )
    op.create_index('idx_whatif_created', 'whatif_runs', ['created_at'])
    
    # ============================================================================
    # MODEL REGISTRY
    # ============================================================================
    
    op.create_table(
        'model_registry',
        sa.Column('model_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('train_window_start', sa.Date(), nullable=True),
        sa.Column('train_window_end', sa.Date(), nullable=True),
        sa.Column('features_hash', sa.String(length=64), nullable=True),
        sa.Column('metrics_json', sa.JSON(), nullable=True),
        sa.Column('artifact_path', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('model_id'),
    )
    op.create_index('idx_model_name_version', 'model_registry', ['model_name', 'version'], unique=True)
    op.create_index('idx_model_active', 'model_registry', ['model_name', 'is_active'])


def downgrade() -> None:
    # Drop in reverse order
    op.drop_table('model_registry')
    op.drop_table('whatif_runs')
    op.drop_table('analytics_watermarks')
    op.drop_table('wip_snapshots')
    op.drop_table('quality_snapshots')
    op.drop_table('kpi_snapshots_monthly')
    op.drop_table('kpi_snapshots_daily')
    op.drop_table('data_quality_issues')
    
    # Drop rejects tables
    for table_name in ['ordens_fabrico', 'fases_ordem_fabrico', 'funcionarios_fase_ordem_fabrico',
                       'erros_ordem_fabrico', 'funcionarios', 'fases_catalogo', 'modelos',
                       'funcionarios_fases_aptos', 'fases_standard_modelos']:
        op.drop_table(f"{table_name}_rejects")
    
    op.drop_table('ingestion_sheet_runs')
    op.drop_table('ingestion_runs')
    
    # Drop partitioned tables (cascades to partitions)
    op.execute('DROP TABLE IF EXISTS erros_ordem_fabrico CASCADE')
    op.execute('DROP TABLE IF EXISTS funcionarios_fase_ordem_fabrico CASCADE')
    op.execute('DROP TABLE IF EXISTS fases_ordem_fabrico CASCADE')
    
    op.drop_table('ordens_fabrico')
    op.drop_table('fases_standard_modelos')
    op.drop_table('funcionarios_fases_aptos')
    op.drop_table('modelos')
    op.drop_table('fases_catalogo')
    op.drop_table('funcionarios')
    
    # Drop staging schema
    op.execute("DROP SCHEMA IF EXISTS staging CASCADE")

