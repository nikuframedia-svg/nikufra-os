# ✅ RELEASE CHECKLIST - PRODPLAN 4.0 OS

## Pré-Release

### A1. Schema, migrations e arranque limpo

- [ ] `alembic upgrade head` num Postgres vazio, sem intervenções manuais
- [ ] `docker-compose up` levanta api, db, redis, worker, prometheus sem erros
- [ ] `make bootstrap` funciona completamente
- [ ] `make reset-db` funciona e é repetível

### A2. Ingestão e data contract

- [ ] Ingestão completa termina com contagens EXACTAS:
  - [ ] OrdensFabrico: 27,380
  - [ ] FasesOrdemFabrico: 519,079
  - [ ] FuncionariosFaseOrdemFabrico: 423,769
  - [ ] OrdemFabricoErros: 89,836
  - [ ] Funcionarios: 902
  - [ ] FuncionariosFasesAptos: 902
  - [ ] Fases: 71
  - [ ] Modelos: 894
  - [ ] FasesStandardModelos: 15,347
- [ ] Relatório final JSON em `data/processed/reports/ingestion_{run_id}.json`
- [ ] Se alguma contagem falhar, `docs/CRITICAL_MISMATCHES.md` criado

### A3. Performance e SLOs provados

- [ ] Benchmarks locais com dataset real
- [ ] Resultados guardados em `docs/perf/benchmarks_*.md`
- [ ] Se endpoint falhar SLO, `docs/perf/EXPLAIN_{endpoint}.md` criado com ação corretiva

### A4. Feature gating automático

- [ ] Features com match rate < limiar devolvem `NOT_SUPPORTED_BY_DATA`
- [ ] `by_employee` BLOQUEADO (match_rate < 0.90)
- [ ] Orphans de produto reportados mas permitidos

## Segurança

### B1. Autenticação

- [ ] Endpoints protegidos exigem API key:
  - [ ] `POST /api/ingestion/run`
  - [ ] `POST /api/ml/train/*`
  - [ ] `POST /api/whatif/simulate`
- [ ] `API_KEY` configurado em produção
- [ ] `REQUIRE_API_KEY=true` em produção

### B2. Proteções operacionais

- [ ] Rate limit por IP e por key em endpoints pesados
- [ ] Limites de payload e timeouts explícitos
- [ ] CORS estrito por env (sem wildcard em produção)

## Performance

### C1. Partições

- [ ] Job `ensure_partitions_ahead` cria partições futuras (6 meses)
- [ ] Job `partition_health_report` funciona
- [ ] Schedule e WIP não dependem de scan no default partition

### C2. Índices

- [ ] Índices com INCLUDE aplicados
- [ ] `EXPLAIN (ANALYZE, BUFFERS)` guardados
- [ ] Queries críticas usam índices

### C3. Agregados

- [ ] Aggregates incrementais implementados
- [ ] Watermarks funcionando
- [ ] Jobs incrementais atualizam apenas "desde watermark"

### C4. Cache

- [ ] Cache versionado funcionando
- [ ] Singleflight implementado
- [ ] Cache version incrementa após ingestão/backfill/aggregates

## Funcionalidades P0

### D1. ProdPlan Core

- [ ] Estado de OF determinístico
- [ ] ETA determinístico com fallback
- [ ] `/api/prodplan/bottlenecks` funciona
- [ ] `/api/prodplan/risk_queue` funciona

### D2. Quality

- [ ] Heatmap avaliacao vs culpada
- [ ] Top "hot phases"
- [ ] Baseline risk por produto/fase

### D3. SmartInventory

- [ ] WIP count e age por fase/produto
- [ ] WIP mass com regras claras
- [ ] Gelcoat teórico com disclaimer

### D4. What-IF

- [ ] Motor determinístico com seed fixa
- [ ] Outputs incluem delta_kpis e top_affected_orders
- [ ] Cada execução guardada com hash

### D5. ML

- [ ] Baseline determinístico sempre disponível
- [ ] Treino com splits temporais e seed fixa
- [ ] Modelos só entram se passarem métricas mínimas
- [ ] XAI obrigatório (SHAP ou permutation importance)

## Testes

### E1. Harness

- [ ] `make verify` corre migrations, ingestão parcial, backfills, aggregates
- [ ] Smoke tests para endpoints críticos com seed fixa

### E2. Performance

- [ ] `pytest-benchmark` para endpoints críticos
- [ ] `locust` ou `k6` com cenários mínimos
- [ ] Resultados guardados em `docs/perf`

### E3. Release Gate

- [ ] `scripts/release_gate.py` falha se:
  - [ ] Contagens falham
  - [ ] Reports não existem
  - [ ] SLO falha
  - [ ] Feature gating não está a bloquear
- [ ] `release_gate.py` imprime resumo e termina com exit code != 0 se falhar

## Execução Final

```bash
# 1. Aplicar migrations
alembic upgrade head

# 2. Rodar release gate
python scripts/release_gate.py

# 3. Se passar, bootstrap completo
make bootstrap

# 4. Verificar
make verify

# 5. Se tudo passar, backend está PRONTO
```

---

**Status**: ✅ Checklist completo
**Última atualização**: 2025-12-17

