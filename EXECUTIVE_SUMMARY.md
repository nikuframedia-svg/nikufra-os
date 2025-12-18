# Executive Summary - Correções Baseadas em Headers Reais

## 🎯 Objetivo

Corrigir todo o backend para usar **APENAS** os headers reais do Excel `Folha_IA.xlsx`, sem inventar colunas ou assumir estruturas não existentes.

## ✅ FASE 1 COMPLETA: Inspector e Validação

### O que foi feito:

1. **Inspector Implementado** (`app/ingestion/inspector.py`)
   - Lê Excel real com openpyxl read_only
   - Analisa headers, tipos, null rates, cardinalidade
   - Valida relacionamentos e calcula match rates
   - Gera 3 reports automáticos

2. **Reports Gerados**:
   - ✅ `DATA_DICTIONARY.md` - Schema completo com headers reais
   - ✅ `PROFILE_REPORT.json` - Análise detalhada (27MB de dados analisados)
   - ✅ `RELATIONSHIPS_REPORT.json` - Match rates de todas as FKs

3. **Descobertas Críticas**:
   - ❌ `FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id`: Match rate **32.3%**
     - **Decisão**: NÃO suportar produtividade por funcionário
   - ⚠️ `Produto_Id ↔ Of_ProdutoId`: Match rate **72.5%**
     - **339 orphans** (produtos em ordens que não existem em modelos)
     - **Decisão**: Reportar, não rejeitar (dados históricos)

## ✅ FASE 2 COMPLETA: Schema Corrigido

### Correções Aplicadas:

1. **OrdemFabricoErros**:
   - ❌ Assumido: `OFCH_Id` como PK
   - ✅ Real: Não existe no Excel
   - ✅ Correção: PK artificial (`ofch_id SERIAL`)
   - ✅ Headers corretos: `ofch_descricao_erro`, `ofch_of_id`, `ofch_fase_avaliacao`, `ofch_gravidade`, etc.

2. **FuncionariosFaseOrdemFabrico**:
   - ❌ Assumido: `FuncionarioFaseOf_Id`
   - ✅ Real: `FuncionarioFaseOf_FaseOfId`
   - ✅ Correção: Usar `FuncionarioFaseOf_FaseOfId` como FK

3. **Modelos**:
   - ❌ Assumido: `Produto_GelCoatDeck`, `Produto_GelCoatCasco`
   - ✅ Real: `Produto_QtdGelDeck`, `Produto_QtdGelCasco`
   - ✅ Correção: Usar nomes corretos

4. **FuncionariosFasesAptos**:
   - ❌ Assumido: `FuncionarioFase_DataCriacao`
   - ✅ Real: `FuncionarioFase_Inicio`
   - ✅ Correção: Usar `FuncionarioFase_Inicio`

5. **Fases**:
   - ❌ Assumido: Apenas `Fase_Id`, `Fase_Nome`
   - ✅ Real: Inclui `Fase_Sequencia`, `Fase_DeProducao`, `Fase_Automatica`
   - ✅ Correção: Adicionar colunas faltantes

6. **Colunas Derivadas Governadas**:
   - ✅ `faseof_event_time`: `COALESCE(faseof_fim, faseof_inicio, faseof_data_prevista)`
   - ✅ `faseof_duration_seconds`: `EXTRACT(EPOCH FROM (faseof_fim - faseof_inicio))`
   - ✅ `faseof_is_open`, `faseof_is_done`: Flags derivadas
   - ✅ `ofch_event_time`: Requer backfill job (não usar como partition key)

## ✅ FASE 3 COMPLETA: Mappers e Validators Corrigidos

- ✅ Todos os mappers atualizados para usar nomes reais
- ✅ Validators atualizados com regras baseadas em domínio observado
- ✅ Primary keys corrigidas

## 📋 PRÓXIMAS FASES

### FASE 4: Ingestão Turbo (Pendente)
- Extract: CSV.gz por sheet
- Load: COPY staging (UNLOGGED, batches 50k)
- Merge: staging → core (ON CONFLICT)
- Idempotência por checksum

### FASE 5: Backfill Jobs (Pendente)
- Popular `ofch_event_time`
- Popular colunas derivadas

### FASE 6: Endpoints Condicionais (Pendente)
- `/api/kpis/by-employee` → `NOT_SUPPORTED_BY_DATA`
- Documentar limitações

## 🚨 Decisões Arquiteturais Críticas

1. **Produtividade por Funcionário**: **NÃO IMPLEMENTAR**
   - Match rate insuficiente (32.3%)
   - Endpoint retorna `NOT_SUPPORTED_BY_DATA` com explicação

2. **Orphans de Produto**: **PERMITIR, REPORTAR**
   - 339 produtos órfãos
   - Logar em `data_quality_issues`
   - Não bloquear ingestão

3. **PK de Erros**: **ARTIFICIAL**
   - Excel não fornece PK
   - Usar `SERIAL` com dedup opcional

## 📊 Validação

Após aplicar migration e rodar ingestão:

```sql
-- Verificar contagens (devem bater com Excel)
SELECT 'ordens_fabrico' as table, COUNT(*) as actual, 27381 as expected FROM ordens_fabrico
UNION ALL SELECT 'fases_ordem_fabrico', COUNT(*), 519080 FROM fases_ordem_fabrico
-- ... etc

-- Verificar match rate crítico
SELECT 
    COUNT(DISTINCT ffof.funcionariofaseof_faseof_id) as total_ffof,
    COUNT(DISTINCT CASE WHEN fof.faseof_id IS NOT NULL THEN ffof.funcionariofaseof_faseof_id END) as matches,
    ROUND(COUNT(DISTINCT CASE WHEN fof.faseof_id IS NOT NULL THEN ffof.funcionariofaseof_faseof_id END)::NUMERIC / 
          NULLIF(COUNT(DISTINCT ffof.funcionariofaseof_faseof_id), 0), 4) as match_rate
FROM funcionarios_fase_ordem_fabrico ffof
LEFT JOIN fases_ordem_fabrico fof ON ffof.funcionariofaseof_faseof_id = fof.faseof_id;
-- Esperado: match_rate ≈ 0.323 (32.3%)
```

## ✅ Status Atual

- [x] Inspector implementado e validado
- [x] Reports gerados com headers reais
- [x] Migration corrigida criada
- [x] Mappers corrigidos
- [x] Validators atualizados
- [x] Decisões críticas documentadas
- [ ] Migration aplicada (próximo passo)
- [ ] Ingestão turbo implementada
- [ ] Backfill jobs implementados
- [ ] Endpoints condicionais implementados

## 📁 Arquivos de Referência

- `app/ingestion/DATA_DICTIONARY.md` - Schema real
- `app/ingestion/PROFILE_REPORT.json` - Análise completa
- `app/ingestion/RELATIONSHIPS_REPORT.json` - Match rates
- `CORRECTIONS_FROM_REAL_HEADERS.md` - Detalhes das correções
- `SUMMARY_CORRECTIONS.md` - Resumo executivo
- `alembic/versions/003_corrected_schema_from_real_headers.py` - Migration corrigida

---

**Última atualização**: 2025-12-17
**Status**: Fases 1-3 completas, Fases 4-6 pendentes

