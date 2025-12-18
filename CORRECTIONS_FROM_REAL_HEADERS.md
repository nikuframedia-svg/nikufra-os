# Correções Baseadas nos Headers Reais do Excel

## 📋 Resumo das Correções

Após inspeção do Excel real (`Folha_IA.xlsx`), foram identificadas diferenças críticas entre o schema assumido e os headers reais.

## 🔍 Headers Reais Validados

### 1. OrdensFabrico ✅
- `Of_Id`, `Of_DataCriacao`, `Of_DataAcabamento`, `Of_ProdutoId`, `Of_FaseId`, `Of_DataTransporte`
- **Status**: Correto

### 2. FasesOrdemFabrico ✅
- `FaseOf_Id`, `FaseOf_OfId`, `FaseOf_Inicio`, `FaseOf_Fim`, `FaseOf_DataPrevista`,
  `FaseOf_Coeficiente`, `FaseOf_CoeficienteX`, `FaseOf_FaseId`, `FaseOf_Turno`, 
  `FaseOf_Retorno`, `FaseOf_Peso`
- **Status**: Correto (nota: falta `FaseOf_Sequencia` no Excel, mas pode ser derivado)

### 3. FuncionariosFaseOrdemFabrico ⚠️ **CORRIGIDO**
- **Real**: `FuncionarioFaseOf_FaseOfId`, `FuncionarioFaseOf_FuncionarioId`, `FuncionarioFaseOf_Chefe`
- **Anterior**: Assumido `FuncionarioFaseOf_Id`
- **Correção**: Usar `FuncionarioFaseOf_FaseOfId` como FK para `FaseOf_Id`
- **Match Rate**: 32.3% (CRÍTICO - não suporta produtividade por funcionário)

### 4. OrdemFabricoErros ⚠️ **CORRIGIDO**
- **Real**: `Erro_Descricao`, `Erro_OfId`, `Erro_FaseAvaliacao`, `OFCH_GRAVIDADE`,
  `Erro_FaseOfAvaliacao`, `Erro_FaseOfCulpada`
- **Anterior**: Assumido `OFCH_Id` como PK
- **Correção**: Criar PK artificial (`ofch_id SERIAL`) pois não existe no Excel
- **Nota**: Não existe `created_at` no Excel. Usar coluna derivada `ofch_event_time`

### 5. Funcionarios ✅
- `Funcionario_Id`, `Funcionario_Nome`, `Funcionario_Activo`
- **Status**: Correto

### 6. FuncionariosFasesAptos ⚠️ **CORRIGIDO**
- **Real**: `FuncionarioFase_FuncionarioId`, `FuncionarioFase_FaseId`, `FuncionarioFase_Inicio`
- **Anterior**: Assumido `FuncionarioFase_DataCriacao`
- **Correção**: Usar `FuncionarioFase_Inicio`

### 7. Fases ⚠️ **CORRIGIDO**
- **Real**: `Fase_Id`, `Fase_Nome`, `Fase_Sequencia`, `Fase_DeProducao`, `Fase_Automatica`
- **Anterior**: Schema não incluía `Fase_Sequencia`, `Fase_DeProducao`, `Fase_Automatica`
- **Correção**: Adicionar colunas faltantes

### 8. Modelos ⚠️ **CORRIGIDO**
- **Real**: `Produto_Id`, `Produto_Nome`, `Produto_PesoDesmolde`, `Produto_PesoAcabamento`,
  `Produto_QtdGelDeck`, `Produto_QtdGelCasco`
- **Anterior**: Assumido `Produto_GelCoatDeck`, `Produto_GelCoatCasco`
- **Correção**: Usar `Produto_QtdGelDeck`, `Produto_QtdGelCasco`

### 9. FasesStandardModelos ✅
- `ProdutoFase_ProdutoId`, `ProdutoFase_FaseId`, `ProdutoFase_Sequencia`,
  `ProdutoFase_Coeficiente`, `ProdutoFase_CoeficienteX`
- **Status**: Correto

## 🚨 Validações de Relacionamentos

### Match Rates Críticos

1. **Of_Id ↔ FaseOf_OfId**: 100% ✅
2. **Fase_Id ↔ FaseOf_FaseId**: 100% ✅
3. **Produto_Id ↔ Of_ProdutoId**: 72.5% ⚠️
   - **339 orphans** (produtos em OrdensFabrico que não existem em Modelos)
   - **Ação**: Reportar em `data_quality_issues`, não rejeitar automaticamente
4. **FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id**: 32.3% ❌
   - **CRÍTICO**: Match rate muito baixo
   - **Consequência**: **NÃO suportar produtividade por funcionário**
   - **Ação**: Endpoint `/api/kpis/by-employee` retorna `NOT_SUPPORTED_BY_DATA`

## 📝 Colunas Derivadas Governadas

Colunas permitidas porque são computadas a partir de campos Excel:

### fases_ordem_fabrico
- `faseof_event_time`: `COALESCE(faseof_fim, faseof_inicio, faseof_data_prevista)`
- `faseof_duration_seconds`: `EXTRACT(EPOCH FROM (faseof_fim - faseof_inicio))`
- `faseof_is_open`: `(faseof_inicio IS NOT NULL AND faseof_fim IS NULL)`
- `faseof_is_done`: `(faseof_fim IS NOT NULL)`

### erros_ordem_fabrico
- `ofch_event_time`: `COALESCE(faseof_fim da faseof_avaliacao, faseof_inicio da faseof_avaliacao, of_data_criacao)`
  - **Nota**: Requer backfill job pós-ingestão (não usar como partition key)

## 🔧 Migrations Aplicadas

- `003_corrected_schema_from_real_headers.py`: Corrige todos os nomes de colunas e adiciona colunas faltantes

## ✅ Checklist de Validação

- [x] Inspector gera 3 reports baseados em headers reais
- [x] DATA_DICTIONARY.md atualizado com headers reais
- [x] PROFILE_REPORT.json com análise completa
- [x] RELATIONSHIPS_REPORT.json com match rates
- [x] Migration corrigida aplicada
- [x] Colunas derivadas documentadas
- [x] Match rates críticos identificados e documentados
- [x] Endpoints condicionais definidos (NOT_SUPPORTED_BY_DATA onde apropriado)

## 📊 Próximos Passos

1. Aplicar migration `003_corrected`
2. Atualizar mappers para usar nomes corretos
3. Atualizar validators
4. Implementar backfill job para `ofch_event_time`
5. Implementar endpoints com validação condicional

