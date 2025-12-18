# Resumo das Correções Baseadas nos Headers Reais

## ✅ COMPLETADO

### 1. Inspector Implementado
- ✅ `app/ingestion/inspector.py` criado
- ✅ Gera 3 reports baseados em headers reais:
  - `DATA_DICTIONARY.md` - Schema completo
  - `PROFILE_REPORT.json` - Análise detalhada
  - `RELATIONSHIPS_REPORT.json` - Match rates de FKs

### 2. Headers Reais Validados

#### ✅ Correto (sem mudanças)
- OrdensFabrico: `Of_Id`, `Of_DataCriacao`, `Of_DataAcabamento`, `Of_ProdutoId`, `Of_FaseId`, `Of_DataTransporte`
- FasesOrdemFabrico: Todos os headers confirmados
- Funcionarios: `Funcionario_Id`, `Funcionario_Nome`, `Funcionario_Activo`

#### ⚠️ Corrigido
- **OrdemFabricoErros**: 
  - Real: `Erro_Descricao`, `Erro_OfId`, `Erro_FaseAvaliacao`, `OFCH_GRAVIDADE`, `Erro_FaseOfAvaliacao`, `Erro_FaseOfCulpada`
  - **NÃO existe `OFCH_Id`** → Criar PK artificial (`ofch_id SERIAL`)
  
- **FuncionariosFaseOrdemFabrico**:
  - Real: `FuncionarioFaseOf_FaseOfId` (não `FuncionarioFaseOf_Id`)
  - **Match rate com FaseOf_Id: 32.3%** ❌ → NÃO suporta produtividade
  
- **Modelos**:
  - Real: `Produto_QtdGelDeck`, `Produto_QtdGelCasco` (não `GelCoat`)
  
- **FuncionariosFasesAptos**:
  - Real: `FuncionarioFase_Inicio` (não `DataCriacao`)
  
- **Fases**:
  - Real: Inclui `Fase_Sequencia`, `Fase_DeProducao`, `Fase_Automatica`

### 3. Migration Corrigida
- ✅ `003_corrected_schema_from_real_headers.py` criada
- ✅ Corrige todos os nomes de colunas
- ✅ Adiciona colunas faltantes
- ✅ Cria staging tables (UNLOGGED)
- ✅ Adiciona colunas derivadas governadas

### 4. Mappers Corrigidos
- ✅ Todos os mappers atualizados para usar nomes reais
- ✅ `map_ordem_fabrico_erros`: Usa `ofch_*` columns
- ✅ `map_modelos`: Usa `produto_qtd_gel_deck/casco`
- ✅ `map_funcionarios_fases_aptos`: Usa `funcionariofase_inicio`
- ✅ `map_fases_standard_modelos`: Usa `produto_id`

### 5. Validators Atualizados
- ✅ `validate_ordem_fabrico_erros`: Usa `ofch_*` columns
- ✅ Validação de gravidade baseada em domínio observado

## 🚨 DECISÕES CRÍTICAS DOCUMENTADAS

1. **Produtividade por Funcionário**: **NÃO SUPORTADO**
   - Match rate `FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id`: 32.3%
   - Endpoint `/api/kpis/by-employee` retorna `NOT_SUPPORTED_BY_DATA`

2. **Orphans de Produto_Id**: **REPORTAR, NÃO REJEITAR**
   - 339 produtos em OrdensFabrico não existem em Modelos (match rate 72.5%)
   - Logar em `data_quality_issues`
   - Permitir ingestão (dados históricos possíveis)

3. **PK de Erros**: **ARTIFICIAL**
   - Excel não tem `OFCH_Id`
   - Usar `ofch_id SERIAL`
   - Coluna derivada `ofch_event_time` requer backfill job

## 📋 PRÓXIMOS PASSOS

1. **Aplicar Migration 003**
   ```bash
   alembic upgrade head
   ```

2. **Atualizar PROJECT_CONTEXT.md**
   - Documentar headers reais
   - Documentar match rates críticos
   - Documentar decisões de não-suporte

3. **Implementar Ingestão Turbo**
   - Extract → CSV.gz
   - Load → COPY staging
   - Merge → staging → core

4. **Implementar Backfill Jobs**
   - Popular `ofch_event_time`
   - Popular colunas derivadas

5. **Atualizar Endpoints**
   - Retornar `NOT_SUPPORTED_BY_DATA` onde apropriado
   - Documentar limitações

## 📊 Arquivos Gerados

- ✅ `app/ingestion/DATA_DICTIONARY.md`
- ✅ `app/ingestion/PROFILE_REPORT.json`
- ✅ `app/ingestion/RELATIONSHIPS_REPORT.json`
- ✅ `alembic/versions/003_corrected_schema_from_real_headers.py`
- ✅ `CORRECTIONS_FROM_REAL_HEADERS.md`
- ✅ `IMPLEMENTATION_STATUS_CORRECTED.md`

## ✅ Critério de Aceitação Fase C1

- [x] Inspector gera os 3 reports
- [x] Reports baseados apenas no Excel (sem invenção)
- [x] Headers batem com especificação A1
- [x] Match rates calculados e documentados
- [x] Orphans identificados

**STATUS: FASE C1 COMPLETA** ✅

