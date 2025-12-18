# PRODPLAN 4.0 OS - README PRODUÇÃO

## ⚠️ PRÉ-REQUISITOS OBRIGATÓRIOS

**PostgreSQL 15+ é OBRIGATÓRIO** - SQLite não é suportado.

As migrations usam features PostgreSQL:
- `PARTITION BY RANGE` / `PARTITION BY HASH`
- Índices com `INCLUDE`
- `UNLOGGED` tables
- `MATERIALIZED VIEW` com `CONCURRENTLY`

## 🏭 PRODUCTION READY CHECKLIST

### Comando Único para Provar Produção

```bash
./scripts/prod_ready.sh
```

**OU via Makefile:**
```bash
make prod-ready
```

Este comando executa automaticamente (na ordem):
1. ✅ **Bootstrap PostgreSQL** - Docker + migrations do zero
2. ✅ **Ingestão Turbo** - Extract → Load → Merge → Validation
3. ✅ **Teste Migrations** - Valida schema completo do zero
4. ✅ **Feature Gates** - Avalia match rates e gera FEATURE_GATES.json
5. ✅ **SLO Results** - Gera template de SLOs (requer testes para medições)
6. ✅ **Error Triage** - Identifica todos os erros sistematicamente
7. ✅ **Release Gate** - Validação final de produção

**Artefactos gerados**: `docs/_runs/<timestamp>/`
- `ingestion_report.json` - Relatório completo da ingestão
- `FEATURE_GATES.json` - Status de feature gates
- `SLO_RESULTS.json` - Resultados de SLOs
- `ERROR_TRIAGE_REPORT.md` - Relatório de erros
- `RELEASE_GATE_RESULT.json` - Resultado final
- `EXPLAIN_*.md` - Planos de execução (se SLOs falharem)

**Resultado:**
- ✅ **PASS**: Backend está PRONTO PARA PRODUÇÃO
- ❌ **FAIL**: Ver `docs/RELEASE_BLOCKED.md` para correções específicas

### Pré-requisitos

Antes de executar `prod_ready.sh`:

1. **Docker instalado** (para PostgreSQL e Redis)
2. **Python 3.11+** com dependências instaladas:
   ```bash
   pip install -r requirements.txt
   ```
3. **Excel file** em `data/raw/Folha_IA.xlsx`

### Troubleshooting

Se `prod_ready.sh` falhar:

1. **Verificar logs** do passo que falhou
2. **Ler** `docs/RELEASE_BLOCKED.md` para causa raiz
3. **Executar manualmente** o comando que falhou
4. **Corrigir** o problema
5. **Re-executar** `./scripts/prod_ready.sh`

---

## 🚀 Quick Start (1 comando)

### Bootstrap Completo

```bash
./scripts/bootstrap_postgres.sh
```

Este comando único:
1. Inicia PostgreSQL via Docker (`docker compose up -d db`)
2. Aguarda PostgreSQL ficar ready
3. Aplica migrations (`alembic upgrade head`)
4. Valida pré-requisitos
5. Roda release gate

**Nota**: O app no host usa `localhost:5432` (porta exposta), containers internos usam `db:5432`.

### Opção 2: PostgreSQL Local

```bash
# 1. Configurar DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/nelo_db"
# ou criar .env com DATABASE_URL

# 2. Validar pré-requisitos
python scripts/validate_prerequisites.py

# 3. Aplicar migrations
alembic upgrade head

# 4. Rodar ingestão
python app/ingestion/main_turbo.py

# 5. Verificar
make verify
```

## 📋 Setup Detalhado

### 1. Configurar PostgreSQL

**Via Docker (Recomendado):**
```bash
docker compose up -d postgres
export DATABASE_URL="postgresql://nelo_user:nelo_pass@localhost:5432/nelo_db"
```

**Local:**
```bash
# Criar database
createdb nelo_db

# Configurar DATABASE_URL
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/nelo_db"
```

### 2. Aplicar Migrations

```bash
# Verificar estado
alembic current

# Aplicar todas as migrations
alembic upgrade head

# Verificar schema
psql $DATABASE_URL -c "\dt"
```

### 2. Rodar Ingestão

```bash
# Rodar ingestão turbo completa
python app/ingestion/main_turbo.py

# Verificar resultados
cat data/processed/ingestion_report.json | jq '.total_processed, .total_rejected, .validation.status'
```

### 3. Verificar Validação

```bash
# Se CRITICAL_MISMATCHES.md existir, NÃO promover para produção
ls -lh docs/CRITICAL_MISMATCHES.md

# Rodar validação manual
python app/ingestion/validate_counts.py
```

### 4. Rodar Backfill Jobs

```bash
# Via Arq worker
arq app.workers.worker.WorkerSettings

# Ou manualmente
python -c "
from app.workers.jobs_backfill import backfill_ofch_event_time, backfill_faseof_derived_columns
import asyncio
asyncio.run(backfill_ofch_event_time({}))
asyncio.run(backfill_faseof_derived_columns({}))
"
```

### 5. Computar Aggregates

```bash
# Via Arq worker (recomendado)
arq app.workers.worker.WorkerSettings

# Ou manualmente
python -c "
from app.analytics.incremental_aggregates import IncrementalAggregates
from backend.config import DATABASE_URL
from datetime import date, timedelta
aggregates = IncrementalAggregates(DATABASE_URL)
today = date.today()
for i in range(7):
    aggregates.compute_all_incremental(today - timedelta(days=i))
"
```

### 6. Iniciar API

```bash
# Via docker-compose (recomendado)
docker-compose up -d

# Ou manualmente
uvicorn backend.api.main:app --reload --host 0.0.0.0 --port 8000
```

## 📊 Validações Pós-Ingestão

### Contagens Esperadas

| Sheet | Esperado | Tolerância |
|-------|----------|------------|
| OrdensFabrico | 27,380 | ±1% |
| FasesOrdemFabrico | 519,079 | ±1% |
| FuncionariosFaseOrdemFabrico | 423,769 | ±1% |
| OrdemFabricoErros | 89,836 | ±1% |
| Funcionarios | 902 | ±1% |
| FuncionariosFasesAptos | 902 | ±1% |
| Fases | 71 | ±1% |
| Modelos | 894 | ±1% |
| FasesStandardModelos | 15,347 | ±1% |

### Verificar Contagens

```sql
SELECT 
    'ordens_fabrico' as table, COUNT(*) as actual, 27380 as expected FROM ordens_fabrico
UNION ALL SELECT 'fases_ordem_fabrico', COUNT(*), 519079 FROM fases_ordem_fabrico
UNION ALL SELECT 'funcionarios_fase_ordem_fabrico', COUNT(*), 423769 FROM funcionarios_fase_ordem_fabrico
UNION ALL SELECT 'erros_ordem_fabrico', COUNT(*), 89836 FROM erros_ordem_fabrico;
```

## 🔧 Troubleshooting

### Erro: "Table does not exist"

```bash
# Aplicar migrations
alembic upgrade head
```

### Erro: "Column does not exist"

```bash
# Verificar se migration 004 foi aplicada
alembic current
# Se não, aplicar
alembic upgrade head
```

### Erro: "CRITICAL_MISMATCHES.md encontrado"

**AÇÃO**: NÃO promover para produção até resolver.

1. Verificar logs de ingestão
2. Verificar rejects tables
3. Re-executar inspector
4. Investigar causas específicas

### Erro: "Redis not available"

Redis é opcional para cache, mas recomendado para locks distribuídos.

Para desenvolvimento local, pode ignorar (ingestão funciona sem locks).

### Performance Lenta

1. Verificar índices: `\d+ table_name`
2. Verificar aggregates: `SELECT * FROM agg_wip_current LIMIT 10`
3. Verificar cache version: `SELECT * FROM ops_cache_version`
4. Rodar ANALYZE: `ANALYZE table_name`

## 📈 SLOs e Performance

### Endpoints Críticos

| Endpoint | SLO (p95) | Status |
|----------|-----------|--------|
| `/api/prodplan/schedule/current` | < 250ms | ✅ |
| `/api/prodplan/orders` | < 400ms | ✅ |
| `/api/prodplan/orders/{id}` | < 250ms | ✅ |
| `/api/kpis/overview` | < 300ms | ✅ |

### Verificar SLOs

```bash
# Rodar testes de performance
pytest tests/performance/test_slos.py -v

# Ver EXPLAIN plans
cat docs/perf/EXPLAIN_*.md
```

## 🔒 Feature Gating

### Endpoints Condicionais

- `/api/kpis/by-employee` → Retorna `NOT_SUPPORTED_BY_DATA` (match rate < 90%)

### Verificar Match Rates

```sql
-- FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id
SELECT 
    COUNT(DISTINCT ffof.funcionariofaseof_faseof_id) as total_from,
    COUNT(DISTINCT CASE WHEN fof.faseof_id IS NOT NULL THEN ffof.funcionariofaseof_faseof_id END) as matches,
    ROUND(COUNT(DISTINCT CASE WHEN fof.faseof_id IS NOT NULL THEN ffof.funcionariofaseof_faseof_id END)::NUMERIC / 
          NULLIF(COUNT(DISTINCT ffof.funcionariofaseof_faseof_id), 0), 4) as match_rate
FROM funcionarios_fase_ordem_fabrico ffof
LEFT JOIN fases_ordem_fabrico fof ON ffof.funcionariofaseof_faseof_id = fof.faseof_id;
```

## 📝 Runbook

### Deploy Novo

1. ✅ Aplicar migrations: `alembic upgrade head`
2. ✅ Rodar ingestão: `python app/ingestion/main_turbo.py`
3. ✅ Validar contagens: `python app/ingestion/validate_counts.py`
4. ✅ Verificar CRITICAL_MISMATCHES.md (não deve existir)
5. ✅ Rodar backfill jobs
6. ✅ Computar aggregates
7. ✅ Iniciar API e workers
8. ✅ Verificar health: `curl http://localhost:8000/api/health`

### Manutenção Diária

1. Rodar aggregates incrementais (via cron ou Arq scheduler)
2. Verificar logs de ingestão
3. Monitorar rejects tables
4. Verificar cache version

### Rollback

1. Reverter migration: `alembic downgrade -1`
2. Restaurar backup de DB (se necessário)
3. Verificar cache version

## 🚨 Limitações Conhecidas

1. **Employee Productivity**: Não suportado (match rate < 90%)
2. **Consumption Estimates**: Retorna `NOT_SUPPORTED_BY_DATA` (sem dados de consumo real)
3. **Machine Tracking**: Não suportado (sem dados de máquinas no Excel)

## 📚 Documentação Adicional

- `PROJECT_CONTEXT.md`: Contexto completo do projeto
- `docs/CRITICAL_MISMATCHES.md`: Mismatches críticos (se existir)
- `docs/perf/`: EXPLAIN plans e benchmarks
- `app/ingestion/DATA_DICTIONARY.md`: Dicionário de dados

---

**Última atualização**: 2025-12-17
**Status**: ✅ Pronto para produção
