"""Corrected schema based on REAL Excel headers

Revision ID: 003_corrected
Revises: 002_mvs
Create Date: 2025-12-17 12:30:00

CORREÇÕES BASEADAS NOS HEADERS REAIS DO EXCEL:
- OrdemFabricoErros: Sem OFCH_Id, usar PK artificial
- FuncionariosFaseOrdemFabrico: FuncionarioFaseOf_FaseOfId (não FuncionarioFaseOf_Id)
- Modelos: Produto_QtdGelDeck, Produto_QtdGelCasco (não GelCoat)
- FuncionariosFasesAptos: FuncionarioFase_Inicio (não DataCriacao)
- Fases: Incluir Fase_Sequencia, Fase_DeProducao, Fase_Automatica
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003_corrected'
down_revision: Union[str, None] = '002_mvs'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================================================
    # CORRIGIR TABELAS BASEADAS NOS HEADERS REAIS
    # ============================================================================
    
    # 1. Fases - Adicionar colunas que existem no Excel
    op.execute("""
        ALTER TABLE fases_catalogo 
        ADD COLUMN IF NOT EXISTS fase_sequencia INTEGER,
        ADD COLUMN IF NOT EXISTS fase_de_producao INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS fase_automatica INTEGER DEFAULT 0;
    """)
    
    # 2. Modelos - Corrigir nomes das colunas de gelcoat (se existirem com nomes antigos)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'modelos' 
                AND column_name = 'qtd_gel_deck'
            ) THEN
                ALTER TABLE modelos RENAME COLUMN qtd_gel_deck TO produto_qtd_gel_deck;
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'modelos' 
                AND column_name = 'qtd_gel_casco'
            ) THEN
                ALTER TABLE modelos RENAME COLUMN qtd_gel_casco TO produto_qtd_gel_casco;
            END IF;
        END $$;
    """)
    
    # 3. FuncionariosFasesAptos - Corrigir nome da coluna (se existir com nome antigo)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'funcionarios_fases_aptos' 
                AND column_name = 'inicio'
            ) THEN
                ALTER TABLE funcionarios_fases_aptos RENAME COLUMN inicio TO funcionariofase_inicio;
            END IF;
        END $$;
    """)
    
    # 4. FuncionariosFaseOrdemFabrico - Coluna já está correta na migration 001
    # Nota: A coluna funcionariofaseof_faseof_id já existe e é a partition key,
    # não pode ser renomeada. A migration 001 já criou com o nome correto.
    
    # 5. OrdemFabricoErros - Corrigir estrutura baseada nos headers reais
    # Headers reais: Erro_Descricao, Erro_OfId, Erro_FaseAvaliacao, OFCH_GRAVIDADE,
    #                Erro_FaseOfAvaliacao, Erro_FaseOfCulpada
    # NÃO existe OFCH_Id no Excel, criar PK artificial
    op.execute("""
        -- Se a tabela já existe, adicionar coluna se não existir
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'erros_ordem_fabrico' 
                AND column_name = 'ofch_id'
            ) THEN
                ALTER TABLE erros_ordem_fabrico ADD COLUMN ofch_id SERIAL;
            END IF;
        END $$;
    """)
    
    # Renomear colunas para match com Excel
    op.execute("""
        ALTER TABLE erros_ordem_fabrico
        RENAME COLUMN erro_descricao TO ofch_descricao_erro;
    """)
    op.execute("""
        ALTER TABLE erros_ordem_fabrico
        RENAME COLUMN erro_of_id TO ofch_of_id;
    """)
    op.execute("""
        ALTER TABLE erros_ordem_fabrico
        RENAME COLUMN erro_fase_avaliacao TO ofch_fase_avaliacao;
    """)
    op.execute("""
        ALTER TABLE erros_ordem_fabrico
        RENAME COLUMN erro_gravidade TO ofch_gravidade;
    """)
    op.execute("""
        ALTER TABLE erros_ordem_fabrico
        RENAME COLUMN erro_faseof_avaliacao TO ofch_faseof_avaliacao;
    """)
    op.execute("""
        ALTER TABLE erros_ordem_fabrico
        RENAME COLUMN erro_faseof_culpada TO ofch_faseof_culpada;
    """)
    
    # Adicionar coluna derivada para event_time (governada)
    op.execute("""
        ALTER TABLE erros_ordem_fabrico
        ADD COLUMN IF NOT EXISTS ofch_event_time TIMESTAMP WITH TIME ZONE;
    """)
    
    # Comentário sobre a coluna derivada
    op.execute("""
        COMMENT ON COLUMN erros_ordem_fabrico.ofch_event_time IS 
        'Derived: COALESCE(faseof_fim da faseof_avaliacao, faseof_inicio da faseof_avaliacao, of_data_criacao). Populated by backfill job.';
    """)
    
    # Recriar índices com nomes de colunas corretos (após renomeação)
    op.execute("""
        DROP INDEX IF EXISTS idx_err_ofid;
        DROP INDEX IF EXISTS idx_err_faseof_culpada;
        DROP INDEX IF EXISTS idx_err_fase_av;
        DROP INDEX IF EXISTS idx_err_gravidade;
    """)
    op.execute("""
        CREATE INDEX idx_err_ofid ON erros_ordem_fabrico(ofch_of_id);
        CREATE INDEX idx_err_faseof_culpada ON erros_ordem_fabrico(ofch_faseof_culpada, ofch_gravidade);
        CREATE INDEX idx_err_fase_av ON erros_ordem_fabrico(ofch_fase_avaliacao, ofch_gravidade);
        CREATE INDEX idx_err_gravidade ON erros_ordem_fabrico(ofch_gravidade);
    """)
    
    # 6. FasesOrdemFabrico - Adicionar colunas derivadas governadas
    op.execute("""
        ALTER TABLE fases_ordem_fabrico
        ADD COLUMN IF NOT EXISTS faseof_event_time TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS faseof_duration_seconds NUMERIC(10,2),
        ADD COLUMN IF NOT EXISTS faseof_is_open BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS faseof_is_done BOOLEAN DEFAULT false;
    """)
    
    # Popular colunas derivadas
    op.execute("""
        UPDATE fases_ordem_fabrico
        SET 
            faseof_event_time = COALESCE(faseof_fim, faseof_inicio, faseof_data_prevista),
            faseof_duration_seconds = CASE 
                WHEN faseof_fim IS NOT NULL AND faseof_inicio IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (faseof_fim - faseof_inicio))
                ELSE NULL
            END,
            faseof_is_open = (faseof_inicio IS NOT NULL AND faseof_fim IS NULL),
            faseof_is_done = (faseof_fim IS NOT NULL);
    """)
    
    # Comentários
    op.execute("""
        COMMENT ON COLUMN fases_ordem_fabrico.faseof_event_time IS 
        'Derived: COALESCE(faseof_fim, faseof_inicio, faseof_data_prevista)';
        COMMENT ON COLUMN fases_ordem_fabrico.faseof_duration_seconds IS 
        'Derived: EXTRACT(EPOCH FROM (faseof_fim - faseof_inicio)) when both exist';
        COMMENT ON COLUMN fases_ordem_fabrico.faseof_is_open IS 
        'Derived: faseof_inicio IS NOT NULL AND faseof_fim IS NULL';
        COMMENT ON COLUMN fases_ordem_fabrico.faseof_is_done IS 
        'Derived: faseof_fim IS NOT NULL';
    """)
    
    # 7. Criar índices adicionais baseados nos headers reais
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_faseof_event_time 
        ON fases_ordem_fabrico(faseof_event_time) 
        WHERE faseof_event_time IS NOT NULL;
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_faseof_open_by_fase 
        ON fases_ordem_fabrico(faseof_fase_id, faseof_of_id) 
        WHERE faseof_is_open = true;
    """)
    
    # 8. Atualizar FK constraints para usar nomes corretos
    op.execute("""
        -- Atualizar constraint de erros_ordem_fabrico
        ALTER TABLE erros_ordem_fabrico
        DROP CONSTRAINT IF EXISTS fk_erro_of;
        
        ALTER TABLE erros_ordem_fabrico
        ADD CONSTRAINT fk_erro_of 
        FOREIGN KEY (ofch_of_id) 
        REFERENCES ordens_fabrico(of_id) 
        DEFERRABLE INITIALLY DEFERRED;
    """)
    
    op.execute("""
        ALTER TABLE erros_ordem_fabrico
        DROP CONSTRAINT IF EXISTS fk_erro_fase_av;
        
        ALTER TABLE erros_ordem_fabrico
        ADD CONSTRAINT fk_erro_fase_av 
        FOREIGN KEY (ofch_fase_avaliacao) 
        REFERENCES fases_catalogo(fase_id) 
        DEFERRABLE INITIALLY DEFERRED;
    """)
    
    # 9. Criar tabela de staging (UNLOGGED) para ingestão rápida
    op.execute("CREATE SCHEMA IF NOT EXISTS staging")
    
    # Staging tables (UNLOGGED, sem FKs)
    for table_name in ['ordens_fabrico', 'fases_ordem_fabrico', 'funcionarios_fase_ordem_fabrico', 
                       'erros_ordem_fabrico', 'funcionarios', 'fases_catalogo', 'modelos',
                       'funcionarios_fases_aptos', 'fases_standard_modelos']:
        core_table = f"core.{table_name}" if 'core' not in table_name else table_name
        staging_table = f"staging.{table_name}_raw"
        
        # Criar staging table como cópia da estrutura core (sem constraints)
        op.execute(f"""
            CREATE UNLOGGED TABLE IF NOT EXISTS {staging_table} 
            (LIKE {core_table} INCLUDING ALL);
        """)
        
        # Remover constraints da staging
        op.execute(f"""
            ALTER TABLE {staging_table} 
            DROP CONSTRAINT IF EXISTS {table_name}_pkey CASCADE;
        """)


def downgrade() -> None:
    # Reverter alterações
    op.execute("DROP SCHEMA IF EXISTS staging CASCADE")
    
    # Reverter renomeações
    op.execute("""
        ALTER TABLE erros_ordem_fabrico
        RENAME COLUMN ofch_descricao_erro TO erro_descricao;
    """)
    # ... (outras reversões)
    
    op.execute("""
        ALTER TABLE fases_ordem_fabrico
        DROP COLUMN IF EXISTS faseof_event_time,
        DROP COLUMN IF EXISTS faseof_duration_seconds,
        DROP COLUMN IF EXISTS faseof_is_open,
        DROP COLUMN IF EXISTS faseof_is_done;
    """)

