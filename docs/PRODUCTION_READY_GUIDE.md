# PRODUCTION READY GUIDE - PRODPLAN 4.0 OS

## 🎯 Objetivo

Este guia documenta como provar que o backend está **PRONTO PARA PRODUÇÃO** através de um único comando.

## 🚀 Comando Único

```bash
./scripts/prod_ready.sh
```

**OU:**

```bash
make prod-ready
```

## 📋 O que o comando faz

O `prod_ready.sh` executa **7 passos críticos** na ordem:

### 1. Bootstrap PostgreSQL
- Inicia PostgreSQL via Docker (`docker compose up -d db`)
- Aguarda PostgreSQL ficar ready (`pg_isready`)
- Aplica migrations (`python3 -m alembic upgrade head`)
- Valida pré-requisitos (`python3 scripts/validate_prerequisites.py`)
- Roda release gate inicial (`python3 scripts/release_gate.py`)

### 2. Turbo Ingestion
- **EXTRACT**: Excel → CSV.gz (streaming, checksums)
- **LOAD**: CSV.gz → staging.*_raw (COPY, UNLOGGED)
- **MERGE**: staging → core.* (ON CONFLICT, idempotente)
- **VALIDATION**: Valida contagens vs Excel
- Gera `extraction_report.json`, `load_report.json`, `merge_report.json`

### 3. Test Migrations from Zero
- Drop e recreate schema
- Aplica todas as migrations
- Valida tabelas core, staging, aggregates existem
- Valida partições criadas

### 4. Evaluate Feature Gates
- Lê `RELATIONSHIPS_REPORT.json`
- Calcula match rates
- Gera `FEATURE_GATES.json` com status de gates
- Exemplo: `employee_productivity` = DISABLED se match_rate < 90%

### 5. Generate SLO Results
- Executa testes de performance (se disponíveis)
- Gera `docs/perf/SLO_RESULTS.json` com SLOs medidos
- Se testes não disponíveis: gera template com status NOT_MEASURED

### 6. Error Triage
- Identifica todos os erros sistematicamente
- Gera `docs/ERROR_TRIAGE_REPORT.md` com lista completa
- Categoriza: ENV, MIGRATIONS, DOCKER, INGESTION, DATA_INTEGRITY, SERVICES, PERFORMANCE

### 7. Release Gate
- Valida schema e migrations
- Valida contagens vs Excel
- Valida feature gating
- Valida SLOs (se medidos)
- Gera `docs/RELEASE_BLOCKED.md` se falhar

## 📁 Artefactos Gerados

Todos os artefactos são salvos em `docs/_runs/<timestamp>/`:

- `ingestion_report.json` - Relatório completo da ingestão
- `extraction_report.json` - Contagens por sheet (fonte de verdade)
- `RELATIONSHIPS_REPORT.json` - Match rates de relacionamentos
- `FEATURE_GATES.json` - Status de feature gates
- `SLO_RESULTS.json` - Resultados de SLOs
- `ERROR_TRIAGE_REPORT.md` - Relatório de erros
- `RELEASE_GATE_RESULT.json` - Resultado final
- `EXPLAIN_*.md` - Planos de execução (se SLOs falharem)

## ✅ Critérios de Sucesso

O comando **PASSA** se:

1. ✅ Bootstrap completa sem erros
2. ✅ Ingestão completa com contagens corretas
3. ✅ Migrations aplicam do zero
4. ✅ Feature gates gerados
5. ✅ SLO results gerados (mesmo que NOT_MEASURED)
6. ✅ Error triage completa (mesmo que encontre erros)
7. ✅ Release gate **PASSA** (todos os checks críticos)

## ❌ Critérios de Falha

O comando **FALHA** se:

- ❌ Bootstrap falha (PostgreSQL não inicia, migrations falham)
- ❌ Ingestão falha (erros críticos, contagens não batem)
- ❌ Release gate **FALHA** (checks críticos não passam)

**Quando falha**: `docs/RELEASE_BLOCKED.md` é gerado com:
- Causa raiz
- Passos copy/paste para corrigir
- Links para reports gerados

## 🔧 Pré-requisitos

Antes de executar:

1. **Docker instalado** e rodando
2. **Python 3.11+** instalado
3. **Dependências instaladas**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Excel file** em `data/raw/Folha_IA.xlsx`

## 🐛 Troubleshooting

### Erro: "DATABASE_URL not configured"

**Solução:**
```bash
export DATABASE_URL="postgresql://nelo_user:nelo_pass@localhost:5432/nelo_db"
```

Ou criar `.env`:
```
DATABASE_URL=postgresql://nelo_user:nelo_pass@localhost:5432/nelo_db
```

### Erro: "PostgreSQL not running"

**Solução:**
```bash
docker compose up -d db
```

### Erro: "alembic: command not found"

**Solução:**
```bash
pip install alembic
# O script usa python3 -m alembic, então não precisa estar no PATH
```

### Erro: "pytest: command not found"

**Solução:**
```bash
pip install pytest pytest-benchmark
# O script usa python3 -m pytest, então não precisa estar no PATH
```

### Erro: "Ingestion failed"

**Verificar:**
1. Excel file existe: `data/raw/Folha_IA.xlsx`
2. PostgreSQL está rodando
3. Migrations aplicadas: `python3 -m alembic upgrade head`
4. Logs: `data/processed/ingestion_report.json`

### Erro: "Release gate failed"

**Verificar:**
1. `docs/RELEASE_BLOCKED.md` para causa específica
2. Contagens: `python3 app/ingestion/validate_counts.py`
3. Feature gates: `python3 scripts/evaluate_feature_gates.py`
4. Schema: `python3 scripts/migrate_from_zero.py`

## 📊 Interpretando Resultados

### ✅ PASS

Se `prod_ready.sh` termina com:
```
✅ PRODUCTION PROOF COMPLETE
✅ Backend is PRODUCTION READY
```

**Significa:**
- Backend está pronto para produção
- Todos os checks críticos passaram
- Artefactos gerados em `docs/_runs/<timestamp>/`

### ❌ FAIL

Se `prod_ready.sh` termina com erro:

1. **Ler** `docs/RELEASE_BLOCKED.md`
2. **Verificar** logs do passo que falhou
3. **Corrigir** o problema
4. **Re-executar** `./scripts/prod_ready.sh`

## 🔄 Re-executar

O comando é **idempotente**:
- Se `excel_sha256` não mudou, ingestão é NO-OP
- Migrations são idempotentes (ON CONFLICT)
- Feature gates são recalculados a cada execução

## 📝 Notas Importantes

1. **Zero dependência de PATH**: Todos os scripts usam `python3 -m` ou caminhos absolutos
2. **Fail-fast**: Qualquer passo crítico que falha aborta imediatamente
3. **Artefactos versionados**: Cada run tem timestamp único
4. **Auditável**: Todos os passos são rastreáveis por run_id e excel_sha256

---

**Última atualização**: 2025-12-17  
**Versão**: 4.0 OS (Wozniak-Grade)

