# PRODPLAN 4.0 OS - CONTEXTO COMPLETO DO PROJETO

> **⚠️ IMPORTANTE**: Este documento foi atualizado após inspeção dos headers REAIS do Excel e implementação completa do backend PostgreSQL-only.
> Ver `CORRECTIONS_FROM_REAL_HEADERS.md`, `POSTGRES_BOOTSTRAP_FINAL.md`, `FINAL_POSTGRES_BOOTSTRAP.md` para detalhes das correções e implementações.

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [PostgreSQL-Only Architecture](#postgresql-only-architecture)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Modelo de Dados](#modelo-de-dados)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Ingestão Turbo](#ingestão-turbo)
7. [Componentes Principais](#componentes-principais)
8. [Stack Tecnológico](#stack-tecnológico)
9. [Princípios de Design](#princípios-de-design)
10. [Estrutura do Projeto](#estrutura-do-projeto)
11. [Endpoints da API](#endpoints-da-api)
12. [Jobs e Processos](#jobs-e-processos)
13. [Observabilidade](#observabilidade)
14. [Deployment e Bootstrap](#deployment-e-bootstrap)
15. [Validação e Testes](#validação-e-testes)
16. [Decisões Arquiteturais](#decisões-arquiteturais)
17. [Correções e Validações](#correções-e-validações)

---

## 🎯 VISÃO GERAL

**PRODPLAN 4.0 OS** é um sistema backend de produção para planeamento e otimização de fabrico industrial. O sistema processa dados reais de produção a partir de um ficheiro Excel (`Folha_IA.xlsx`) e fornece:

- **Visualização** de ordens de fabrico e fases
- **Simulação** de cenários (WHAT-IF)
- **Análise de qualidade** e risco de defeitos
- **Previsões ML** de lead time
- **Monitorização** de WIP (Work In Progress)
- **KPIs** e métricas de performance
- **Detecção de gargalos** e filas de risco

### Fonte de Dados

- **Ficheiro**: `Folha_IA.xlsx`
- **9 Sheets** com ~1.1M linhas totais:
  - OrdensFabrico: 27,380 ordens
  - FasesOrdemFabrico: 519,079 fases
  - FuncionariosFaseOrdemFabrico: 423,769 atribuições
  - OrdemFabricoErros: 89,836 erros
  - Funcionarios: 902 funcionários
  - FuncionariosFasesAptos: 902 aptidões
  - Fases: 71 fases
  - Modelos: 894 produtos
  - FasesStandardModelos: 15,348 rotas padrão

### Validação de Headers Reais

Todos os headers foram validados através do **Inspector** (`app/ingestion/inspector.py`), que gera:
- `DATA_DICTIONARY.md` - Schema completo com headers reais
- `PROFILE_REPORT.json` - Análise detalhada (null rates, cardinalidade, tipos)
- `RELATIONSHIPS_REPORT.json` - Match rates de relacionamentos FK

**Match Rates Críticos Identificados**:
- `FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id`: **32.3%** ❌ → NÃO suporta produtividade por funcionário
- `Produto_Id ↔ Of_ProdutoId`: **72.5%** ⚠️ → 339 orphans (reportar, não rejeitar)

---

## 🗄️ POSTGRESQL-ONLY ARCHITECTURE

### Requisitos Obrigatórios

**PostgreSQL 15+ é OBRIGATÓRIO** - SQLite não é suportado.

O sistema foi projetado para usar exclusivamente PostgreSQL devido a features específicas:
- `PARTITION BY RANGE` / `PARTITION BY HASH` - Particionamento declarativo
- Índices com `INCLUDE` - Para evitar heap fetches
- `UNLOGGED` tables - Para staging tables rápidas
- `MATERIALIZED VIEW CONCURRENTLY` - Refresh sem locks
- Features avançadas: JSONB, arrays, window functions

### Validações Fail-Fast

1. **backend/config.py**
   - RuntimeError se DATABASE_URL não existe
   - RuntimeError se DATABASE_URL é SQLite
   - RuntimeError se scheme não é postgresql/postgresql+psycopg2
   - Mensagens exatas: "DATABASE_URL is required. PostgreSQL 15+ only. SQLite is not supported."

2. **alembic/env.py**
   - Valida PostgreSQL antes de executar migrations
   - RuntimeError com mensagens exatas
   - Não permite SQLite "por acidente"

3. **tests/conftest.py**
   - PostgreSQL-only (não SQLite)
   - Skip com mensagem clara se PostgreSQL não disponível
   - Cleanup via transações (PostgreSQL-specific)

### Bootstrap Automatizado

**Comando único para setup completo**:
```bash
./scripts/bootstrap_postgres.sh
```

Este script:
1. Inicia PostgreSQL via Docker (`docker compose up -d db`)
2. Aguarda PostgreSQL ficar ready (pg_isready loop, timeout 120s)
3. Aplica migrations (`alembic upgrade head`)
4. Valida pré-requisitos (`python scripts/validate_prerequisites.py`)
5. Roda release gate (`python scripts/release_gate.py`)

**Validações**:
- `scripts/validate_prerequisites.py`: Valida versão PostgreSQL >= 15 (obrigatório)
- `scripts/release_gate.py`: Bloqueia release se falhar, escreve `docs/RELEASE_BLOCKED.md`

---

## 🏗️ ARQUITETURA DO SISTEMA

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                     │
│              (NÃO MODIFICADO - Backend Only)                │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────▼─────────────────────────────────────┐
│                    FASTAPI API SERVER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PRODPLAN    │  │   WHAT-IF    │  │   QUALITY    │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │SmartInventory│  │     ML       │  │   Ops        │     │
│  │   Service    │  │  Predictor   │  │ (Metrics)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │  Bottlenecks │  │     KPIs     │                       │
│  │   Service    │  │   Service    │                       │
│  └──────────────┘  └──────────────┘                       │
└───────────┬──────────────────────────────────────────────────┘
            │
    ┌───────┴───────┬──────────────┬──────────────┐
    │               │              │              │
┌───▼────┐   ┌─────▼─────┐  ┌─────▼─────┐  ┌────▼─────┐
│Postgres│   │   Redis   │  │  Prometheus│  │  Arq     │
│  15+   │   │  (Cache)  │  │ (Metrics)  │  │ (Worker) │
│        │   │  (Locks)  │  │            │  │          │
└────────┘   └───────────┘  └────────────┘  └──────────┘
    │
    ├─→ core.* (tabelas finais com constraints, partições)
    ├─→ staging.*_raw (UNLOGGED, sem FKs, para ingestão rápida)
    ├─→ agg_* (agregados incrementais)
    └─→ *_rejects (quarentena de dados inválidos)
```

### Fluxo de Dados Principal

```
Excel (Folha_IA.xlsx)
    ↓
[Inspector] → DATA_DICTIONARY.md, PROFILE_REPORT.json, RELATIONSHIPS_REPORT.json
    ↓
[Extract] → CSV.gz (streaming, openpyxl read_only=True)
    ↓
[Load] → staging.*_raw (COPY FROM STDIN, UNLOGGED)
    ↓
[Validate] → *_rejects (dados inválidos)
    ↓
[Merge] → core.* (INSERT ... ON CONFLICT DO UPDATE, idempotente)
    ↓
[Backfill] → Colunas derivadas (faseof_event_time, ofch_event_time, etc.)
    ↓
[Reconcile] → Resolver órfãos FK
    ↓
[Aggregates] → agg_phase_stats_daily, agg_order_stats_daily, etc.
    ↓
[MVs Refresh] → Materialized Views (incremental)
    ↓
[Cache Invalidation] → Redis cache version increment
```

---

## 📊 MODELO DE DADOS

### Tabelas Core (com constraints, partições, índices)

#### 1. `core.ordens_fabrico`
- **PK**: `of_id`
- **Colunas**: `of_data_criacao`, `of_data_acabamento`, `of_produto_id`, `of_fase_id`, `of_data_transporte`
- **Índices**:
  - `idx_of_produto_data`: `(of_produto_id, of_data_criacao DESC, of_id DESC)`
  - `idx_of_fase`: `(of_fase_id)`
  - `idx_of_datas`: `(of_data_criacao, of_data_acabamento)`
  - `idx_of_transporte`: `(of_data_transporte)` WHERE `of_data_transporte IS NOT NULL`

#### 2. `core.fases_ordem_fabrico` (PARTICIONADA)
- **PK**: `faseof_id`
- **Particionamento**: `PARTITION BY RANGE (faseof_event_time)` - Partições mensais
- **Colunas**:
  - Base: `faseof_of_id`, `faseof_inicio`, `faseof_fim`, `faseof_data_prevista`, `faseof_coeficiente`, `faseof_coeficiente_x`, `faseof_fase_id`, `faseof_turno`, `faseof_retorno`, `faseof_peso`, `faseof_sequencia`
  - Derivadas (governadas): `faseof_event_time`, `faseof_duration_seconds`, `faseof_is_open`, `faseof_is_done`
- **Índices**:
  - `idx_faseof_ofid_event`: `(faseof_of_id, faseof_event_time)`
  - `idx_faseof_faseid_event`: `(faseof_fase_id, faseof_event_time)`
  - `idx_faseof_open_by_fase`: `(faseof_fase_id, faseof_of_id)` WHERE `faseof_is_open = true`

#### 3. `core.funcionarios_fase_ordem_fabrico` (PARTICIONADA)
- **PK**: `(funcionariofaseof_id, funcionario_id)`
- **Particionamento**: `PARTITION BY HASH (funcionariofaseof_id)` - 32 partições
- **Colunas**: `funcionariofaseof_id`, `funcionario_id`, `chefe`
- **Nota**: Match rate baixo (32.3%) → não suporta KPIs por funcionário

#### 4. `core.erros_ordem_fabrico` (PARTICIONADA)
- **PK**: `ofch_id`
- **Particionamento**: `PARTITION BY HASH (ofch_of_id)` - 32 partições
- **Colunas**:
  - Base: `ofch_descricao_erro`, `ofch_of_id`, `ofch_fase_avaliacao`, `ofch_faseof_culpada`, `ofch_faseof_avaliacao`, `ofch_gravidade`
  - Derivada: `ofch_event_time` (backfill via join)

#### 5. Tabelas de Catálogo
- `core.fases_catalogo`: `fase_id`, `fase_nome`
- `core.modelos`: `produto_id`, `produto_nome`, `produto_peso_desmolde`, `produto_peso_acabamento`, `produto_qtd_gel_deck`, `produto_qtd_gel_casco`
- `core.fases_standard_modelos`: `produto_id`, `fase_id`, `sequencia`, `coeficiente`, `coeficiente_x`
- `core.funcionarios`: `funcionario_id`, `funcionario_nome`, `funcionario_activo`
- `core.funcionarios_fases_aptos`: `funcionario_id`, `fase_id`, `data_criacao`

### Tabelas Staging (UNLOGGED, sem FKs)

- `staging.ordens_fabrico_raw`
- `staging.fases_ordem_fabrico_raw`
- `staging.funcionarios_fase_ordem_fabrico_raw`
- `staging.erros_ordem_fabrico_raw`
- (e outras...)

### Tabelas de Agregados Incrementais

- `agg_phase_stats_daily`: Estatísticas diárias por fase/produto
- `agg_order_stats_daily`: Lead time e on-time rate
- `agg_quality_daily`: Qualidade por produto/fase
- `agg_wip_current`: WIP atual (tabela incremental)

### Tabelas de Suporte

- `ingestion_runs`: Auditoria de execuções
- `ingestion_sheet_runs`: Auditoria por sheet
- `*_rejects`: Quarentena de dados inválidos
- `data_quality_issues`: Anomalias/órfãos/duplicados
- `analytics_watermarks`: Rastreamento de última processamento
- `ops_cache_version`: Versão global de cache
- `whatif_runs`: Persistência de simulações
- `model_registry`: Versões de modelos ML

---

## 🔄 INGESTÃO TURBO

### Pipeline em 3 Fases

#### Fase 1: Extract
- **Script**: `app/ingestion/extract.py`
- **Processo**: 
  - Ler Excel com `openpyxl` (read_only=True, data_only=False)
  - Iterar por linhas (streaming)
  - Converter para CSV.gz por sheet
  - Normalizar datas (ISO-8601), decimais, preservar NULLs
  - Calcular checksum SHA256 por sheet

#### Fase 2: Load
- **Script**: `app/ingestion/load.py`
- **Processo**:
  - PostgreSQL `COPY FROM STDIN` para staging.*_raw
  - Batches de 50k linhas
  - Configuração de sessão:
    - `synchronous_commit=off`
    - `maintenance_work_mem=512MB`
    - `work_mem=64MB`
  - UNLOGGED tables para velocidade

#### Fase 3: Merge
- **Script**: `app/ingestion/merge.py`
- **Processo**:
  - `INSERT ... ON CONFLICT DO UPDATE` de staging para core
  - Deduplicação por chave natural
  - Popular colunas derivadas
  - Popular rejects para linhas inválidas

### Validação e Quarentena

- **Validators**: `app/ingestion/validators.py`
  - Validação de tipos, ranges, constraints
  - Rejeição de dados inválidos para `*_rejects`
- **Reconciliation**: Job pós-carga para resolver órfãos FK
- **Count Validation**: `app/ingestion/validate_counts.py`
  - Valida contagens vs Excel
  - Gera `docs/CRITICAL_MISMATCHES.md` se houver diferenças

### Idempotência

- `ingestion_runs` guarda:
  - `run_id`, `started_at`, `finished_at`
  - `excel_sha256`, `per_sheet_sha256`
  - `rows_extracted`, `rows_loaded`, `rows_merged`, `rows_rejected`
- Se `excel_sha256` não mudou → NO-OP (ou revalidação)
- `ON CONFLICT DO UPDATE` mantém consistência

---

## 🧩 COMPONENTES PRINCIPAIS

### Serviços de Negócio

#### 1. PRODPLAN Service (`app/services/prodplan.py`)
- Estado de OF (CREATED, IN_PROGRESS, DONE, LATE, AT_RISK)
- Timeline por OF (`/orders/{of_id}/phases`)
- Baseline de planeamento por produto (`/routes/{produto_id}`)
- KPIs: lead time, throughput, on-time rate, WIP aging
- **Bottlenecks**: Detecção de gargalos (`/api/prodplan/bottlenecks`)
- **Risk Queue**: Filas de risco operacional (`/api/prodplan/risk_queue`)

#### 2. WHAT-IF Service (`app/services/whatif.py`)
- Simulação determinística com seed fixa
- Inputs: priority_rule, capacity_overrides, coef_overrides
- Outputs: baseline_kpis, simulated_kpis, delta_kpis, top_affected_orders
- Persistência: `whatif_runs` com hash do cenário

#### 3. QUALITY/ZDM Service (`app/services/quality.py`)
- Overview: total_erros, erros_por_gravidade, erros_por_fase
- Taxa por produto: erro_rate_produto
- Heatmap: avaliação vs culpada
- Risco baseline: probabilidade histórica por produto/fase

#### 4. SmartInventory Service (`app/services/smartinventory.py`)
- WIP por fase e produto
- WIP mass: estimativa de massa em processo
- Gelcoat theoretical usage: consumo teórico (não real)
- Retorna `NOT_SUPPORTED_BY_DATA` quando dados insuficientes

#### 5. Bottlenecks Service (`app/services/bottlenecks.py`)
- Detecção de gargalos por fase
- WIP age p90, queue size
- Fases com maior risco operacional

### ML/PyTorch

#### Datasets
- `app/ml/datasets/build_leadtime.py`: Dataset para regressão de lead time
- `app/ml/datasets/build_defect_risk.py`: Dataset para classificação de risco

#### Training
- `app/ml/training/train_leadtime.py`: Treino de modelo de lead time
- Baseline determinístico obrigatório
- Splits temporais (treino/validação/teste)
- Métricas: MAE, MAPE, p90_error

#### Prediction
- `app/ml/prediction/predictor.py`: Inferência de modelos
- Fallback para baseline se modelo não disponível
- XAI: SHAP ou permutation importance

### Analytics

#### Incremental Aggregates (`app/analytics/incremental_aggregates.py`)
- Computação incremental usando watermarks
- Tabelas: `agg_phase_stats_daily`, `agg_order_stats_daily`, `agg_quality_daily`, `agg_wip_current`
- Refresh apenas janela "new data since watermark"

#### Materialized Views
- `mv_phase_durations_by_model`: Durações por modelo/fase
- `mv_order_leadtime_by_model`: Lead time por modelo
- `mv_quality_by_phase`: Qualidade por fase
- `mv_wip_by_phase_current`: WIP atual por fase

### Operations

#### Cache (`app/ops/cache.py`)
- Redis com versioning global (`ops_cache_version`)
- Singleflight: evita cache stampede
- Invalidação automática após ingestão/backfill/aggregate refresh
- TTL: schedule/current 20-30s, kpis/overview 60s

#### Metrics (`app/ops/metrics.py`)
- Prometheus metrics
- Instrumentação: ingestion, queries, cache, ML

#### Tracing (`app/ops/tracing.py`)
- OpenTelemetry tracing
- HTTP + DB instrumentation

#### Rate Limiting (`app/ops/rate_limit.py`)
- Redis-based rate limiting
- Por IP e API key
- Proteção de endpoints write/high-cost

#### Authentication (`app/auth/api_key.py`)
- API key authentication (`X-API-Key`)
- Proteção de endpoints: `/api/ingestion/run`, `/api/ml/train/*`, `/api/whatif/simulate`

---

## 🛠️ STACK TECNOLÓGICO

### Backend
- **Python 3.11+**
- **FastAPI**: Web framework
- **SQLAlchemy 2.x**: ORM
- **Alembic**: Migrations
- **PostgreSQL 15+**: Database (obrigatório, sem SQLite)
- **Redis**: Cache, locks distribuídos, rate limiting
- **Arq**: Async job queue
- **openpyxl**: Excel reading (read_only, streaming)

### Observabilidade
- **Prometheus**: Metrics
- **OpenTelemetry**: Tracing
- **structlog**: JSON logging

### ML
- **PyTorch**: Deep learning
- **scikit-learn**: Baseline models
- **SHAP**: Explainability
- **joblib**: Model serialization

### DevOps
- **Docker Compose**: Local deployment
- **PostgreSQL 15-alpine**: Database container
- **Redis 7-alpine**: Cache container

---

## 🎯 PRINCÍPIOS DE DESIGN

### P0. Data-First
- Cada feature mapeia explicitamente para colunas reais do Excel
- Sem mocks, sem placeholders, sem dados sintéticos

### P1. Streaming Everywhere
- Não carregar sheets enormes para RAM
- Iteração por linhas, batches controlados

### P2. Observável
- Logs estruturados (JSON)
- Métricas Prometheus
- Tracing OpenTelemetry

### P3. Idempotente
- Ingestão e jobs incrementais nunca duplicam
- `ON CONFLICT DO UPDATE` para merges

### P4. Determinístico
- KPIs e resultados replicáveis
- Seeds fixas para ML e simulações

### P5. Fail Fast + Quarantine
- Dados inválidos → `*_rejects` com motivo
- Não corrigir silenciosamente

### P6. Performance by Design
- Índices compostos, partições, MVs
- Caches, agregados incrementais
- Keyset pagination (não OFFSET)

### P7. PostgreSQL-Only
- Zero fallbacks SQLite
- Validações fail-fast
- RuntimeError se SQLite detectado

---

## 📁 ESTRUTURA DO PROJETO

```
nelo/
├── alembic/
│   ├── versions/
│   │   ├── 001_initial_schema_with_partitioning.py
│   │   ├── 002_materialized_views.py
│   │   ├── 003_corrected_schema_from_real_headers.py
│   │   ├── 004_incremental_aggregates_and_watermarks.py
│   │   └── 005_indexes_with_include.py
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── analytics/
│   │   └── incremental_aggregates.py
│   ├── api/
│   │   └── routers/
│   │       ├── bottlenecks.py
│   │       ├── ingestion.py
│   │       ├── kpis.py
│   │       ├── ml.py
│   │       ├── prodplan.py
│   │       ├── quality.py
│   │       ├── smartinventory.py
│   │       └── whatif.py
│   ├── auth/
│   │   └── api_key.py
│   ├── ingestion/
│   │   ├── batch_upsert.py
│   │   ├── extract.py
│   │   ├── inspector.py
│   │   ├── load.py
│   │   ├── main_turbo.py
│   │   ├── mappers.py
│   │   ├── merge.py
│   │   ├── orchestrator_turbo.py
│   │   ├── validate_counts.py
│   │   └── validators.py
│   ├── ml/
│   │   ├── datasets/
│   │   │   ├── build_defect_risk.py
│   │   │   └── build_leadtime.py
│   │   ├── prediction/
│   │   │   └── predictor.py
│   │   └── training/
│   │       └── train_leadtime.py
│   ├── ops/
│   │   ├── cache.py
│   │   ├── metrics.py
│   │   ├── rate_limit.py
│   │   └── tracing.py
│   ├── services/
│   │   ├── bottlenecks.py
│   │   ├── data_quality.py
│   │   ├── prodplan.py
│   │   ├── quality.py
│   │   ├── smartinventory.py
│   │   └── whatif.py
│   └── workers/
│       ├── jobs_aggregates.py
│       ├── jobs_backfill.py
│       ├── jobs_partitions.py
│       ├── jobs.py
│       └── worker.py
├── backend/
│   ├── api/
│   │   └── main.py
│   ├── config.py
│   └── models/
│       └── database.py
├── data/
│   ├── raw/
│   │   └── Folha_IA.xlsx
│   └── processed/
│       └── ingestion_report.json
├── docs/
│   ├── perf/
│   └── RELEASE_BLOCKED.md (se release gate falhar)
├── scripts/
│   ├── bootstrap_postgres.sh
│   ├── release_gate.py
│   └── validate_prerequisites.py
├── tests/
│   ├── performance/
│   │   └── test_slos.py
│   ├── test_data_quality.py
│   ├── test_integrity.py
│   └── test_services_corrected.py
├── docker-compose.yml
├── Makefile
├── requirements.txt
└── PROJECT_CONTEXT.md (este arquivo)
```

---

## 🌐 ENDPOINTS DA API

### Ingestion
- `POST /api/ingestion/run` - Rodar ingestão turbo (API key required)
- `GET /api/ingestion/status/{run_id}` - Status da ingestão
- `GET /api/ingestion/report/{run_id}` - Relatório da ingestão

### PRODPLAN
- `GET /api/prodplan/orders` - Lista de ordens (keyset pagination)
- `GET /api/prodplan/orders/{of_id}` - Detalhe de ordem
- `GET /api/prodplan/orders/{of_id}/phases` - Timeline de fases
- `GET /api/prodplan/routes/{produto_id}` - Roteiro padrão do produto
- `GET /api/prodplan/schedule/current` - Schedule atual (WIP)
- `GET /api/prodplan/bottlenecks` - Detecção de gargalos
- `GET /api/prodplan/risk_queue` - Filas de risco operacional

### KPIs
- `GET /api/kpis/overview` - Overview de KPIs
- `GET /api/kpis/by-phase` - KPIs por fase
- `GET /api/kpis/by-product` - KPIs por produto
- `GET /api/kpis/by-employee` - KPIs por funcionário (condicional, retorna NOT_SUPPORTED_BY_DATA se match rate < 90%)

### QUALITY
- `GET /api/quality/overview` - Overview de qualidade
- `GET /api/quality/by-phase` - Qualidade por fase
- `GET /api/quality/by-product` - Qualidade por produto
- `GET /api/quality/risk` - Risco de defeito

### WHAT-IF
- `POST /api/whatif/simulate` - Simular cenário (API key required)
- `GET /api/whatif/result/{whatif_id}` - Resultado da simulação

### SmartInventory
- `GET /api/smartinventory/wip` - WIP por fase/produto
- `GET /api/smartinventory/wip_mass` - Massa em processo
- `GET /api/smartinventory/gelcoat_theoretical_usage` - Uso teórico de gelcoat

### ML
- `POST /api/ml/train/leadtime` - Treinar modelo de lead time (API key required)
- `POST /api/ml/train/risk` - Treinar modelo de risco (API key required)
- `GET /api/ml/models` - Lista de modelos
- `POST /api/ml/predict/leadtime` - Prever lead time
- `POST /api/ml/predict/risk` - Prever risco
- `GET /api/ml/explain/leadtime` - Explicar previsão de lead time
- `GET /api/ml/explain/risk` - Explicar previsão de risco

### Ops
- `GET /api/health` - Health check
- `GET /metrics` - Prometheus metrics

---

## ⚙️ JOBS E PROCESSOS

### Jobs Incrementais (Arq)

#### Backfill Jobs (`app/workers/jobs_backfill.py`)
- `backfill_ofch_event_time`: Popular `ofch_event_time` via join
- `backfill_faseof_derived_columns`: Popular colunas derivadas de fases

#### Aggregate Jobs (`app/workers/jobs_aggregates.py`)
- `compute_aggregates_incremental`: Computar agregados incrementais
- `refresh_mvs_incremental`: Refresh materialized views incremental

#### Partition Jobs (`app/workers/jobs_partitions.py`)
- `ensure_partitions_ahead`: Criar partições futuras (6 meses)
- `partition_health_report`: Relatório de saúde de partições

### Jobs Principais (`app/workers/jobs.py`)
- `ingestion_run`: Executar ingestão
- `reconcile`: Reconciliação pós-carga
- `refresh_mvs_incremental`: Refresh MVs
- `compute_kpi_snapshots_incremental`: Computar snapshots de KPIs
- `ml_train_nightly`: Treino ML noturno (opcional)

### Watermarks

- `analytics_watermarks`: Rastreamento de última processamento
  - `last_processed_of_acabamento`
  - `last_processed_faseof_fim`
  - `last_processed_error_backfill`
  - `last_kpi_snapshot_date`
  - `last_model_train_cutoff`

---

## 📊 OBSERVABILIDADE

### Logs
- **Formato**: JSON (structlog)
- **Campos**: `run_id`, `sheet`, `entity`, `rows`, `duration_ms`, `error_code`, `correlation_id`

### Métricas Prometheus
- `ingestion_rows_total{sheet, status}`
- `ingestion_duration_seconds{sheet}`
- `db_query_duration_seconds{endpoint, query_name}`
- `cache_hits_total{endpoint}`
- `cache_misses_total{endpoint}`
- `whatif_runs_total`
- `ml_inference_duration_seconds{model}`
- `ml_train_duration_seconds{task}`

### Tracing
- OpenTelemetry instrumentation
- HTTP + DB spans
- Correlation IDs

---

## 🚀 DEPLOYMENT E BOOTSTRAP

### Bootstrap Automatizado

**Comando único**:
```bash
./scripts/bootstrap_postgres.sh
```

**Ou via Makefile**:
```bash
make bootstrap
```

### Docker Compose

**Serviços**:
- `db`: PostgreSQL 15-alpine (porta 5432)
- `redis`: Redis 7-alpine (porta 6379)
- `api`: FastAPI server (porta 8000)
- `worker`: Arq worker
- `prometheus`: Prometheus (porta 9090)
- `grafana`: Grafana (porta 3000)

**Healthchecks**:
- `db`: `pg_isready -U nelo_user -d nelo_db -h localhost` (interval: 2s, timeout: 2s, retries: 60)

### Variáveis de Ambiente

Criar `.env` a partir de `.env.example`:
```
DATABASE_URL=postgresql://nelo_user:nelo_pass@localhost:5432/nelo_db
REDIS_URL=redis://localhost:6379/0
FOLHA_IA_PATH=./data/raw/Folha_IA.xlsx
API_KEY=dev-key-change-in-production
REQUIRE_API_KEY=false
CORS_ORIGINS=http://localhost:5174,http://localhost:3000
```

### Validação de Pré-requisitos

```bash
python scripts/validate_prerequisites.py
```

Valida:
- DATABASE_URL existe e é PostgreSQL
- Versão PostgreSQL >= 15
- Conexão funciona
- Excel file existe

### Release Gate

```bash
python scripts/release_gate.py
```

Valida:
- Schema e migrations aplicadas
- Tabelas core existem
- Partições criadas
- Ingestão completa (se rodada)
- Performance benchmarks (se existirem)
- Feature gating

Se falhar, escreve `docs/RELEASE_BLOCKED.md` com razão e ação recomendada.

---

## ✅ VALIDAÇÃO E TESTES

### Testes de Integridade

- `tests/test_integrity.py`: Validações de integridade
  - Datas coerentes (faseof_fim >= faseof_inicio)
  - FKs válidas
  - Domínios (gravidade, etc.)

### Testes de Qualidade de Dados

- `tests/test_data_quality.py`: Validações de qualidade
  - Match rates
  - Feature gating
  - NOT_SUPPORTED_BY_DATA

### Testes de Serviços

- `tests/test_services_corrected.py`: Testes de serviços corrigidos
  - ProdplanService
  - QualityService
  - SmartInventoryService

### Testes de Performance

- `tests/performance/test_slos.py`: Validação de SLOs
  - `/orders` p95 < 400ms
  - `/orders/{id}` p95 < 250ms
  - `/schedule/current` p95 < 250ms
  - `/kpis/overview` p95 < 300ms

### EXPLAIN Plans

- Guardados em `docs/perf/EXPLAIN_{endpoint}.md`
- Gerados com `EXPLAIN (ANALYZE, BUFFERS)`

---

## 🎯 DECISÕES ARQUITETURAIS

### 1. PostgreSQL-Only (Sem SQLite)

**Decisão**: Remover completamente SQLite, usar apenas PostgreSQL 15+

**Razão**:
- Migrations usam features específicas (PARTITION BY, INCLUDE, UNLOGGED, MVs CONCURRENTLY)
- Performance e escalabilidade
- Consistência entre dev e produção

**Implementação**:
- RuntimeError se SQLite detectado
- Validação em `backend/config.py`, `alembic/env.py`, `tests/conftest.py`
- Bootstrap script valida PostgreSQL >= 15

### 2. Staging + Core Tables

**Decisão**: Separar staging (UNLOGGED, sem FKs) de core (com constraints)

**Razão**:
- Ingestão rápida via COPY em staging
- Validação antes de merge
- Idempotência via ON CONFLICT

### 3. Particionamento

**Decisão**: Particionar tabelas grandes (fases_ordem_fabrico, erros_ordem_fabrico, funcionarios_fase_ordem_fabrico)

**Razão**:
- Performance em queries por data
- Manutenção facilitada (DROP partição antiga)
- Pruning automático

### 4. Aggregados Incrementais

**Decisão**: Tabelas de agregados incrementais + watermarks, em vez de apenas MVs

**Razão**:
- Refresh incremental mais rápido
- Evita REFRESH MATERIALIZED VIEW full
- Watermarks permitem processar apenas novos dados

### 5. Cache Versionado

**Decisão**: Cache Redis com versioning global

**Razão**:
- Invalidação eficiente (incrementar versão)
- Singleflight evita cache stampede
- Consistência garantida

### 6. Feature Gating

**Decisão**: Desativar features dinamicamente baseado em match rates

**Razão**:
- Evitar resultados enganosos
- Transparência sobre limitações dos dados
- Exemplo: `by_employee` retorna NOT_SUPPORTED_BY_DATA se match rate < 90%

---

## 🔧 CORREÇÕES E VALIDAÇÕES

### Correções Baseadas em Headers Reais

1. **Colunas renomeadas**:
   - `modelo_id` → `produto_id` (consistência)
   - `ofch_*` columns (corrigidas de `erro_*`)

2. **Colunas adicionadas**:
   - `faseof_sequencia` (detectada no Excel)
   - `produto_qtd_gel_*` (corrigidas de `produto_gelcoat_*`)

3. **Match Rates Validados**:
   - `FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id`: 32.3% → NÃO suporta produtividade
   - `Produto_Id ↔ Of_ProdutoId`: 72.5% → 339 orphans (reportar)

### Validações Implementadas

1. **Count Validation**: Valida contagens vs Excel, gera `CRITICAL_MISMATCHES.md` se diferente
2. **Release Gate**: Validação completa antes de release
3. **Prerequisites**: Valida PostgreSQL, versão, conexão, Excel file

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- `README_PRODUCTION.md`: Guia operacional completo
- `POSTGRES_ONLY.md`: Documentação PostgreSQL-only
- `EXECUTION_GUIDE.md`: Guia de execução passo a passo
- `app/ingestion/DATA_DICTIONARY.md`: Schema completo gerado automaticamente
- `app/ingestion/INGESTION_GUIDE.md`: Guia de ingestão
- `docs/perf/README.md`: Documentação de performance

---

**Última atualização**: 2025-12-17
**Versão**: 4.0 OS (PostgreSQL-Only, Production-Ready)
