# Status de Implementação - CORRIGIDO COM HEADERS REAIS

## ✅ FASE 1: INSPECTOR E VALIDAÇÃO - COMPLETA

- [x] Inspector implementado (`app/ingestion/inspector.py`)
- [x] `DATA_DICTIONARY.md` gerado com headers reais
- [x] `PROFILE_REPORT.json` gerado
- [x] `RELATIONSHIPS_REPORT.json` gerado com match rates
- [x] Match rates críticos identificados:
  - `FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id`: 32.3% ❌ (NÃO suporta produtividade)
  - `Produto_Id ↔ Of_ProdutoId`: 72.5% ⚠️ (339 orphans)

## ✅ FASE 2: SCHEMA CORRIGIDO - COMPLETA

- [x] Migration `003_corrected_schema_from_real_headers.py` criada
- [x] Correções aplicadas:
  - OrdemFabricoErros: PK artificial (`ofch_id SERIAL`)
  - FuncionariosFaseOrdemFabrico: `FuncionarioFaseOf_FaseOfId` (não `FuncionarioFaseOf_Id`)
  - Modelos: `produto_qtd_gel_deck`, `produto_qtd_gel_casco`
  - FuncionariosFasesAptos: `funcionariofase_inicio`
  - Fases: Adicionadas `fase_sequencia`, `fase_de_producao`, `fase_automatica`
- [x] Colunas derivadas governadas adicionadas
- [x] Staging tables criadas (UNLOGGED)

## 🚧 FASE 3: MAPPERS E VALIDATORS - EM PROGRESSO

- [x] Mappers corrigidos para usar nomes reais
- [ ] Validators atualizados com regras baseadas em headers reais
- [ ] Validação de match rates baixos

## 📋 PRÓXIMAS FASES

### FASE 4: Ingestão Turbo
- [ ] Extract: CSV.gz por sheet
- [ ] Load: COPY staging (UNLOGGED, batches 50k)
- [ ] Merge: staging → core (ON CONFLICT)
- [ ] Idempotência por checksum

### FASE 5: Backfill Jobs
- [ ] Job para popular `ofch_event_time`
- [ ] Job para popular colunas derivadas em `fases_ordem_fabrico`

### FASE 6: Endpoints Condicionais
- [ ] `/api/kpis/by-employee` → `NOT_SUPPORTED_BY_DATA` (match rate 32.3%)
- [ ] Documentar orphans em `data_quality_issues`

### FASE 7: Serviços Corrigidos
- [ ] PRODPLAN com nomes corretos
- [ ] QUALITY com `ofch_*` columns
- [ ] WHAT-IF validado
- [ ] SmartInventory limitado

## 🚨 DECISÕES CRÍTICAS

1. **Produtividade por Funcionário**: **NÃO SUPORTADO**
   - Match rate: 32.3%
   - Endpoint retorna: `NOT_SUPPORTED_BY_DATA`

2. **Orphans de Produto_Id**: **REPORTAR, NÃO REJEITAR**
   - 339 produtos em OrdensFabrico não existem em Modelos
   - Logar em `data_quality_issues`
   - Permitir ingestão (pode ser dados históricos)

3. **PK de Erros**: **ARTIFICIAL**
   - Excel não tem `OFCH_Id`
   - Usar `ofch_id SERIAL`
   - Dedup opcional por `(ofch_of_id, ofch_faseof_culpada)`

## 📊 VALIDAÇÃO FINAL NECESSÁRIA

Após aplicar migration e rodar ingestão:

```sql
-- Verificar contagens
SELECT 'ordens_fabrico' as table, COUNT(*) as actual, 27381 as expected FROM ordens_fabrico
UNION ALL SELECT 'fases_ordem_fabrico', COUNT(*), 519080 FROM fases_ordem_fabrico
-- ... etc

-- Verificar match rates
SELECT 
    'FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id' as relationship,
    COUNT(DISTINCT ffof.funcionariofaseof_faseof_id) as total_ffof,
    COUNT(DISTINCT fof.faseof_id) as total_fof,
    COUNT(DISTINCT CASE WHEN fof.faseof_id IS NOT NULL THEN ffof.funcionariofaseof_faseof_id END) as matches,
    ROUND(COUNT(DISTINCT CASE WHEN fof.faseof_id IS NOT NULL THEN ffof.funcionariofaseof_faseof_id END)::NUMERIC / 
          NULLIF(COUNT(DISTINCT ffof.funcionariofaseof_faseof_id), 0), 4) as match_rate
FROM funcionarios_fase_ordem_fabrico ffof
LEFT JOIN fases_ordem_fabrico fof ON ffof.funcionariofaseof_faseof_id = fof.faseof_id;
```

