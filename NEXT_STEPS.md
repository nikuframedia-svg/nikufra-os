# Próximos Passos - Implementação Completa

## ✅ COMPLETADO (Fases 1-3)

1. ✅ Inspector implementado e validado
2. ✅ Reports gerados (DATA_DICTIONARY, PROFILE_REPORT, RELATIONSHIPS_REPORT)
3. ✅ Migration 003 corrigida criada
4. ✅ Mappers corrigidos
5. ✅ Validators atualizados
6. ✅ Decisões críticas documentadas

## 🚧 PRÓXIMAS FASES (Ordem de Execução)

### FASE 4: Aplicar Migration e Corrigir Schema Core

**Objetivo**: Garantir que o schema DB está 100% alinhado com headers reais.

**Tarefas**:
1. Aplicar migration 003:
   ```bash
   alembic upgrade head
   ```

2. Verificar que todas as tabelas core usam nomes corretos:
   - `modelos.produto_id` (não `modelo_id`)
   - `modelos.produto_qtd_gel_deck` (não `qtd_gel_deck`)
   - `erros_ordem_fabrico.ofch_*` columns
   - `funcionarios_fases_aptos.funcionariofase_inicio`
   - `fases_catalogo.fase_sequencia`, `fase_de_producao`, `fase_automatica`

3. Verificar staging tables criadas (UNLOGGED)

### FASE 5: Ingestão Turbo (Extract → Load → Merge)

**Objetivo**: Ingestão rápida e idempotente com 3 fases.

**Implementar**:

1. **Extract Phase** (`app/ingestion/extract.py`):
   - Ler Excel com openpyxl read_only
   - Converter para CSV.gz por sheet
   - Calcular checksum (SHA256)
   - Salvar em `/data/processed/{sheet}.csv.gz`

2. **Load Phase** (`app/ingestion/load.py`):
   - PostgreSQL COPY FROM STDIN para staging.*_raw
   - Batches de 50k linhas
   - Config: `synchronous_commit=off`, `maintenance_work_mem` alto
   - Medir throughput

3. **Merge Phase** (`app/ingestion/merge.py`):
   - INSERT ... ON CONFLICT DO UPDATE de staging → core
   - Popular colunas derivadas
   - Popular rejects para inválidos
   - Idempotência por checksum

4. **Orchestrator** (`app/ingestion/orchestrator_turbo.py`):
   - Coordena Extract → Load → Merge
   - Tracking completo em `ingestion_runs`
   - Redis locks distribuídos

### FASE 6: Backfill Jobs

**Objetivo**: Popular colunas derivadas que requerem joins.

**Jobs**:

1. **Backfill `ofch_event_time`**:
   ```sql
   UPDATE erros_ordem_fabrico e
   SET ofch_event_time = COALESCE(
       (SELECT faseof_fim FROM fases_ordem_fabrico 
        WHERE faseof_id = e.ofch_faseof_avaliacao),
       (SELECT faseof_inicio FROM fases_ordem_fabrico 
        WHERE faseof_id = e.ofch_faseof_avaliacao),
       (SELECT of_data_criacao FROM ordens_fabrico 
        WHERE of_id = e.ofch_of_id)
   )
   WHERE ofch_event_time IS NULL;
   ```

2. **Backfill colunas derivadas em `fases_ordem_fabrico`**:
   - `faseof_event_time`
   - `faseof_duration_seconds`
   - `faseof_is_open`
   - `faseof_is_done`

### FASE 7: Endpoints Condicionais

**Objetivo**: Retornar `NOT_SUPPORTED_BY_DATA` onde match rates são baixos.

**Endpoints a atualizar**:

1. `/api/kpis/by-employee`:
   ```python
   # Verificar match rate
   match_rate = get_funcionariofaseof_match_rate()  # Esperado: 0.323
   if match_rate < 0.9:
       return {
           "status": "NOT_SUPPORTED_BY_DATA",
           "reason": f"Match rate FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id is {match_rate:.1%}, below 90% threshold",
           "match_rate": match_rate,
           "suggestion": "Data quality issue: most FuncionarioFaseOf_FaseOfId values do not match FaseOf_Id"
       }
   ```

2. Documentar limitações em todos os endpoints afetados

### FASE 8: Serviços Corrigidos

**Atualizar serviços para usar nomes corretos**:

1. **PRODPLAN Service**:
   - Usar `produto_id` (não `modelo_id`)
   - Usar `ofch_*` columns em queries de qualidade

2. **QUALITY Service**:
   - Usar `ofch_descricao_erro`, `ofch_fase_avaliacao`, etc.
   - Agregar por `ofch_faseof_culpada`

3. **SmartInventory Service**:
   - Usar `produto_qtd_gel_deck`, `produto_qtd_gel_casco`
   - Retornar `NOT_SUPPORTED_BY_DATA` com disclaimer

### FASE 9: Testes e Validação

**Testes obrigatórios**:

1. **Teste de integridade**:
   ```python
   def test_match_rates():
       assert get_match_rate("FuncionarioFaseOf_FaseOfId", "FaseOf_Id") < 0.4
       assert get_match_rate("Produto_Id", "Of_ProdutoId") > 0.7
   ```

2. **Teste de contagens**:
   ```python
   def test_row_counts():
       assert count("ordens_fabrico") == 27381
       assert count("fases_ordem_fabrico") == 519080
       # ... etc
   ```

3. **Teste de orphans**:
   ```python
   def test_orphans_logged():
       orphans = get_data_quality_issues("ORPHAN_FK")
       assert len(orphans) > 0  # Esperamos orphans
   ```

## 📋 Checklist Final

- [ ] Migration 003 aplicada
- [ ] Schema core corrigido
- [ ] Ingestão turbo implementada (Extract → Load → Merge)
- [ ] Backfill jobs implementados
- [ ] Endpoints condicionais implementados
- [ ] Serviços atualizados com nomes corretos
- [ ] Testes de integridade passando
- [ ] Contagens validadas
- [ ] Orphans reportados em `data_quality_issues`
- [ ] Documentação atualizada

## 🎯 Critérios de Aceitação

### M1) Ingestão
- [x] Inspector gera os 3 reports ✅
- [ ] Ingestão turbo funciona e é idempotente por checksum
- [ ] Rejects e issues existem, nada é "silencioso"

### M2) DB
- [ ] Migrations aplicam do zero
- [ ] Partições criadas e pruning funcional
- [ ] Índices compostos presentes
- [ ] Colunas derivadas populadas

### M3) Serviços
- [ ] PRODPLAN, QUALITY, WHAT-IF funcionam com dados reais
- [ ] Endpoints com validação e respostas auditáveis
- [ ] Employee KPIs retorna `NOT_SUPPORTED_BY_DATA` (match rate 32.3%)

### M4) ML
- [ ] Pipelines reproduzíveis com dataset_hash
- [ ] Baseline determinístico sempre disponível
- [ ] Registry ativo

### M5) Observabilidade
- [ ] Logs JSON, métricas Prometheus, healthchecks OK
- [ ] docker-compose sobe stack completa

---

**Status Atual**: Fases 1-3 completas, Fases 4-9 pendentes
**Próximo Passo**: Aplicar migration 003 e validar schema

