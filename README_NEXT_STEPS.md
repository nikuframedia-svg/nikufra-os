# Próximos Passos - Guia de Execução

## 🚀 Execução Rápida

### 1. Aplicar Migrations

```bash
# Verificar estado atual
alembic current

# Aplicar todas as migrations
alembic upgrade head

# Verificar schema criado
psql $DATABASE_URL -c "\dt"  # Listar tabelas
psql $DATABASE_URL -c "\d+ erros_ordem_fabrico"  # Ver estrutura
```

### 2. Rodar Inspector (Opcional - já foi rodado)

```bash
python app/ingestion/inspector.py

# Verificar reports
cat app/ingestion/DATA_DICTIONARY.md | head -50
cat app/ingestion/PROFILE_REPORT.json | jq '.sheets.OrdensFabrico.row_count_real'
cat app/ingestion/RELATIONSHIPS_REPORT.json | jq '.relationships."FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id".match_rate'
```

### 3. Rodar Ingestão Turbo

```bash
# Rodar ingestão completa
python app/ingestion/main_turbo.py

# Verificar resultados
cat data/processed/ingestion_report.json | jq '{
  run_id,
  total_processed,
  total_rejected,
  elapsed_seconds
}'

# Verificar contagens
psql $DATABASE_URL -c "SELECT 'ordens_fabrico' as table, COUNT(*) FROM ordens_fabrico UNION ALL SELECT 'fases_ordem_fabrico', COUNT(*) FROM fases_ordem_fabrico;"
```

### 4. Rodar Backfill Jobs

```bash
# Via Python direto
python -c "
from app.workers.jobs_backfill import backfill_ofch_event_time, backfill_faseof_derived_columns
import asyncio
print('Backfilling ofch_event_time...')
asyncio.run(backfill_ofch_event_time({}))
print('Backfilling faseof derived columns...')
asyncio.run(backfill_faseof_derived_columns({}))
print('Done!')
"
```

### 5. Rodar Testes

```bash
# Todos os testes
pytest tests/ -v

# Testes específicos
pytest tests/test_data_quality.py -v -s
pytest tests/test_integrity.py -v -s
pytest tests/test_services_corrected.py -v -s

# Via script
./tests/run_all_validation.sh
```

### 6. Iniciar API e Testar Endpoints

```bash
# Iniciar API (se docker-compose não estiver rodando)
uvicorn backend.api.main:app --reload --host 0.0.0.0 --port 8000

# Em outro terminal, testar endpoints
curl http://localhost:8000/api/health | jq

# Testar endpoint condicional
curl http://localhost:8000/api/kpis/by-employee | jq

# Testar PRODPLAN com produto_id
curl "http://localhost:8000/api/prodplan/orders?produto_id=22031&limit=5" | jq

# Testar QUALITY
curl http://localhost:8000/api/quality/overview | jq
```

## 📊 Validações Pós-Execução

### Verificar Contagens

```sql
-- Deve bater com Excel (tolerância ±1% devido a rejects)
SELECT 
    'ordens_fabrico' as table_name, 
    COUNT(*) as actual, 
    27380 as expected,
    ROUND(ABS(COUNT(*) - 27380)::NUMERIC / 27380 * 100, 2) as diff_pct
FROM ordens_fabrico
UNION ALL 
SELECT 'fases_ordem_fabrico', COUNT(*), 519079, ROUND(ABS(COUNT(*) - 519079)::NUMERIC / 519079 * 100, 2)
FROM fases_ordem_fabrico
UNION ALL
SELECT 'erros_ordem_fabrico', COUNT(*), 89836, ROUND(ABS(COUNT(*) - 89836)::NUMERIC / 89836 * 100, 2)
FROM erros_ordem_fabrico;
```

### Verificar Match Rates

```sql
-- FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id (esperado: ~32.3%)
SELECT 
    'FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id' as relationship,
    COUNT(DISTINCT ffof.funcionariofaseof_faseof_id) as total_from,
    COUNT(DISTINCT fof.faseof_id) as total_to,
    COUNT(DISTINCT CASE WHEN fof.faseof_id IS NOT NULL THEN ffof.funcionariofaseof_faseof_id END) as matches,
    ROUND(COUNT(DISTINCT CASE WHEN fof.faseof_id IS NOT NULL THEN ffof.funcionariofaseof_faseof_id END)::NUMERIC / 
          NULLIF(COUNT(DISTINCT ffof.funcionariofaseof_faseof_id), 0), 4) as match_rate
FROM funcionarios_fase_ordem_fabrico ffof
LEFT JOIN fases_ordem_fabrico fof ON ffof.funcionariofaseof_faseof_id = fof.faseof_id;
```

### Verificar Colunas Derivadas

```sql
-- Verificar que colunas derivadas foram populadas
SELECT 
    COUNT(*) as total,
    COUNT(faseof_event_time) as with_event_time,
    COUNT(faseof_duration_seconds) as with_duration,
    COUNT(CASE WHEN faseof_is_open IS NOT NULL THEN 1 END) as with_is_open,
    COUNT(CASE WHEN faseof_is_done IS NOT NULL THEN 1 END) as with_is_done
FROM fases_ordem_fabrico;

-- Verificar ofch_event_time (pode ser NULL se backfill não rodou)
SELECT 
    COUNT(*) as total,
    COUNT(ofch_event_time) as with_event_time
FROM erros_ordem_fabrico;
```

## 🐛 Troubleshooting

### Erro: "Table does not exist"

```bash
# Aplicar migrations
alembic upgrade head
```

### Erro: "Column does not exist"

```bash
# Verificar se migration 003 foi aplicada
alembic current
# Se não, aplicar
alembic upgrade head
```

### Erro: "Redis not available"

```bash
# Redis é opcional para cache, mas necessário para locks
# Se não disponível, ingestão ainda funciona (sem locks distribuídos)
# Para desenvolvimento local, pode ignorar
```

### Erro: "Module not found"

```bash
# Instalar dependências
pip install -r requirements.txt
```

## ✅ Checklist de Validação

Após executar todos os passos:

- [ ] Migrations aplicadas (`alembic current` mostra versão mais recente)
- [ ] Inspector gerou 3 reports
- [ ] Ingestão turbo completou sem erros
- [ ] Contagens batem com Excel (±1% tolerância)
- [ ] Backfill jobs rodaram
- [ ] Colunas derivadas populadas
- [ ] Testes passam
- [ ] Endpoints respondem corretamente
- [ ] `/api/kpis/by-employee` retorna `NOT_SUPPORTED_BY_DATA`
- [ ] `/api/prodplan/orders?produto_id=...` funciona
- [ ] `/api/quality/overview` funciona

---

**Status**: ✅ Pronto para execução
**Última atualização**: 2025-12-17

