# DATA INGESTION AUDIT - Folha_IA.xlsx

**Data da Auditoria:** 2024-12-13  
**Ficheiro:** `data/raw/Folha_IA.xlsx`  
**Total de Sheets:** 9

---

## RESUMO EXECUTIVO

| Status | Quantidade | Percentagem |
|--------|-----------|-------------|
| ✅ **Processadas** | 4 sheets | 44.4% |
| ❌ **Não Processadas** | 5 sheets | 55.6% |
| **Total de Registos** | 1,123,586 | - |
| **Registos Processados** | 30,646 | 2.7% |
| **Registos Pendentes** | 1,092,940 | 97.3% |

---

## DETALHAMENTO POR SHEET

### ✅ SHEETS PROCESSADAS (4)

| Sheet | Status | Tabela Destino | Registos no Excel | Registos na BD | Chave Natural | Observações |
|-------|--------|----------------|-------------------|----------------|---------------|-------------|
| **Modelos** | ✅ OK | `products` | 894 | 894 | `Produto_Id` | Mapeamento completo |
| **Fases** | ✅ OK | `phases` | 71 | 71 | `Fase_Id` | Mapeamento completo |
| **Funcionarios** | ✅ OK | `workers` | 902 | 301 | `Funcionario_Id` | Apenas ativos? Verificar filtro |
| **OrdensFabrico** | ✅ OK | `orders` | 27,380 | 27,380 | `Of_Id` | Mapeamento completo |

**Colunas Mapeadas:**
- **Modelos:** `Produto_Id` → `product_code`, `Produto_Nome` → `name`, `Produto_PesoDesmolde` → `weight`
- **Fases:** `Fase_Id` → `phase_code`, `Fase_Nome` → `name`, `Fase_Sequencia` → `sequence_order`
- **Funcionarios:** `Funcionario_Id` → `worker_code`, `Funcionario_Nome` → `name`, `Funcionario_Activo` → `active`
- **OrdensFabrico:** `Of_Id` → `of_id`, `Of_DataCriacao` → `creation_date`, `Of_DataAcabamento` → `completion_date`, `Of_ProdutoId` → `product_id` (FK lookup)

---

### ❌ SHEETS NÃO PROCESSADAS (5)

| Sheet | Status | Tabela Destino | Registos no Excel | Registos na BD | Chave Natural | Prioridade | Observações |
|-------|--------|----------------|-------------------|----------------|---------------|------------|-------------|
| **FasesOrdemFabrico** | ❌ FALTA | `order_phases` | 519,079 | 0 | `FaseOf_Id` | 🔴 **CRÍTICA** | Dados de operações/fases das ordens - essencial para PRODPLAN |
| **FuncionariosFaseOrdemFabrico** | ❌ FALTA | `order_phase_workers` | 423,769 | 0 | `FuncionarioFaseOf_FaseOfId` | 🔴 **CRÍTICA** | Atribuições de trabalhadores - essencial para capacidade |
| **OrdemFabricoErros** | ❌ FALTA | `order_errors` | 89,836 | 0 | `Erro_OfId` | 🟡 **ALTA** | Histórico de erros - importante para qualidade |
| **FuncionariosFasesAptos** | ❌ FALTA | `worker_phase_skills` | 902 | 0 | `FuncionarioFase_FuncionarioId` | 🟡 **ALTA** | Matriz de competências - essencial para planeamento |
| **FasesStandardModelos** | ❌ FALTA | `product_phase_standards` | 15,347 | 0 | `ProdutoFase_ProdutoId` | 🔴 **CRÍTICA** | Roteiros padrão (BOM) - essencial para PRODPLAN |

---

## ESTRUTURA DAS SHEETS PENDENTES

### 1. FasesOrdemFabrico (519,079 registos)
**Colunas:**
- `FaseOf_Id` (PK natural)
- `FaseOf_OfId` (FK → OrdensFabrico.Of_Id)
- `FaseOf_Inicio` (DateTime)
- `FaseOf_Fim` (DateTime)
- `FaseOf_DataPrevista` (DateTime)
- `FaseOf_Coeficiente` (Numeric)
- `FaseOf_CoeficienteX` (Numeric)
- `FaseOf_FaseId` (FK → Fases.Fase_Id)
- `FaseOf_Peso` (Numeric)
- `FaseOf_Retorno` (String/Boolean)
- `FaseOf_Maquina` (String) - possível
- `FaseOf_Centro` (String) - possível

**Mapeamento Necessário:**
- `FaseOf_Id` → `fase_of_id` (String, unique)
- `FaseOf_OfId` → `of_id` (FK lookup para `orders.id` via `orders.of_id`)
- `FaseOf_FaseId` → `phase_id` (FK lookup para `phases.id` via `phases.phase_code`)
- `FaseOf_Inicio` → `start_date`
- `FaseOf_Fim` → `end_date`
- `FaseOf_DataPrevista` → `planned_start` ou `planned_end`
- `FaseOf_Coeficiente` → campo adicional (não existe no modelo atual)
- `FaseOf_Peso` → campo adicional (não existe no modelo atual)

**Problemas Identificados:**
- Modelo `OrderPhase` tem `of_id` como Integer FK para `orders.id`, mas precisa de lookup via `orders.of_id` (String)
- Campos `coeficiente`, `coeficiente_x`, `peso`, `retorno` não existem no modelo atual

---

### 2. FuncionariosFaseOrdemFabrico (423,769 registos)
**Colunas:**
- `FuncionarioFaseOf_FaseOfId` (FK → FasesOrdemFabrico.FaseOf_Id)
- `FuncionarioFaseOf_FuncionarioId` (FK → Funcionarios.Funcionario_Id)
- `FuncionarioFaseOf_Chefe` (Boolean/String)

**Mapeamento Necessário:**
- `FuncionarioFaseOf_FaseOfId` → `order_phase_id` (FK lookup para `order_phases.id` via `order_phases.fase_of_id`)
- `FuncionarioFaseOf_FuncionarioId` → `worker_id` (FK lookup para `workers.id` via `workers.worker_code`)
- `FuncionarioFaseOf_Chefe` → `role` (String: "chefe" ou similar)

**Problemas Identificados:**
- Depende de `FasesOrdemFabrico` estar processada primeiro
- Campo `chefe` pode precisar de mapeamento para `role`

---

### 3. OrdemFabricoErros (89,836 registos)
**Colunas:**
- `Erro_Descricao` (Text)
- `Erro_OfId` (FK → OrdensFabrico.Of_Id)
- `Erro_FaseAvaliacao` (String)
- `OFCH_GRAVIDADE` (String/Numeric)
- `Erro_FaseOfAvaliacao` (FK → FasesOrdemFabrico.FaseOf_Id)
- `Erro_FaseOfCulpada` (FK → FasesOrdemFabrico.FaseOf_Id)

**Mapeamento Necessário:**
- `Erro_OfId` → `order_id` (FK lookup para `orders.id` via `orders.of_id`)
- `Erro_FaseOfAvaliacao` → `order_phase_id` (FK lookup, opcional)
- `Erro_Descricao` → `error_description`
- `OFCH_GRAVIDADE` → `severity`
- `Erro_FaseAvaliacao` → `error_type` ou campo adicional

**Problemas Identificados:**
- Depende de `FasesOrdemFabrico` estar processada (para `order_phase_id`)
- Campos `Erro_FaseAvaliacao` e `Erro_FaseOfCulpada` podem precisar de campos adicionais no modelo

---

### 4. FuncionariosFasesAptos (902 registos)
**Colunas:**
- `FuncionarioFase_FuncionarioId` (FK → Funcionarios.Funcionario_Id)
- `FuncionarioFase_FaseId` (FK → Fases.Fase_Id)
- `FuncionarioFase_Inicio` (DateTime)

**Mapeamento Necessário:**
- `FuncionarioFase_FuncionarioId` → `worker_id` (FK lookup para `workers.id` via `workers.worker_code`)
- `FuncionarioFase_FaseId` → `phase_id` (FK lookup para `phases.id` via `phases.phase_code`)
- `FuncionarioFase_Inicio` → `certification_date`

**Problemas Identificados:**
- Modelo atual tem `certified` (Boolean) mas não há campo no Excel - assumir `True` se existe registo?
- Campo `skill_level` não existe no Excel

---

### 5. FasesStandardModelos (15,347 registos)
**Colunas:**
- `ProdutoFase_ProdutoId` (FK → Modelos.Produto_Id)
- `ProdutoFase_FaseId` (FK → Fases.Fase_Id)
- `ProdutoFase_Sequencia` (Integer)
- `ProdutoFase_Coeficiente` (Numeric)
- `ProdutoFase_CoeficienteX` (Numeric)

**Mapeamento Necessário:**
- `ProdutoFase_ProdutoId` → `product_id` (FK lookup para `products.id` via `products.product_code`)
- `ProdutoFase_FaseId` → `phase_id` (FK lookup para `phases.id` via `phases.phase_code`)
- `ProdutoFase_Sequencia` → `sequence_order`
- `ProdutoFase_Coeficiente` → campo adicional (não existe no modelo atual)
- `ProdutoFase_CoeficienteX` → campo adicional (não existe no modelo atual)

**Problemas Identificados:**
- Campos `coeficiente` e `coeficiente_x` não existem no modelo `ProductPhaseStandard`
- Campo `standard_duration_minutes` existe no modelo mas não no Excel

---

## PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **Modelo de Dados Incompleto**
- `OrderPhase`: Faltam campos `coeficiente`, `coeficiente_x`, `peso`, `retorno`
- `ProductPhaseStandard`: Faltam campos `coeficiente`, `coeficiente_x`
- `OrderError`: Pode precisar de campos adicionais para `Erro_FaseAvaliacao` e `Erro_FaseOfCulpada`

### 2. **Dependências de Foreign Keys**
- Todas as sheets relacionais dependem de lookups via chaves naturais (String) para IDs numéricos
- Necessário implementar funções de lookup robustas

### 3. **Volume de Dados**
- `FasesOrdemFabrico`: 519K registos - pode ser lento processar tudo de uma vez
- `FuncionariosFaseOrdemFabrico`: 423K registos - idem
- Considerar processamento em batches ou com progresso

### 4. **Inconsistências nos Dados**
- `Funcionarios`: 902 registos no Excel vs 301 na BD - verificar se há filtro de "ativos"
- Possíveis registos órfãos (FKs que não existem)

---

## PLANO DE AÇÃO

### Prioridade 1 (CRÍTICA - Bloqueia PRODPLAN)
1. ✅ Atualizar modelos ORM com campos em falta
2. ✅ Implementar ingestão de `FasesOrdemFabrico`
3. ✅ Implementar ingestão de `FasesStandardModelos`
4. ✅ Implementar ingestão de `FuncionariosFasesAptos`

### Prioridade 2 (ALTA - Essencial para funcionalidades)
5. ✅ Implementar ingestão de `FuncionariosFaseOrdemFabrico`
6. ✅ Implementar ingestão de `OrdemFabricoErros`

### Prioridade 3 (Validação)
7. ✅ Validar integridade referencial (sem órfãos)
8. ✅ Validar consistência de dados (datas, valores numéricos)
9. ✅ Gerar relatório de qualidade dos dados

---

## COMANDOS PARA VALIDAÇÃO

```bash
# Verificar estado atual da BD
python3 -c "from backend.models.database import get_session; from backend.models import *; s = get_session(); print('Orders:', s.query(Order).count()); print('OrderPhases:', s.query(OrderPhase).count()); print('Products:', s.query(Product).count())"

# Executar ingestão completa
python3 -m backend.data_ingestion.folha_ia.ingest

# Validar integridade (após implementação)
python3 scripts/validate_data_integrity.py
```

---

## PRÓXIMOS PASSOS

1. **FASE A.4**: Implementar mappers e ingestão para as 5 sheets pendentes
2. **FASE B**: Validar e corrigir modelo relacional
3. **FASE C**: Testar serviços backend com dados completos
4. **FASE D**: Ligar UI a dados reais
5. **FASE E**: Documentação final e demo script

---

**Última Atualização:** 2024-12-13  
**Responsável:** Sistema de Auditoria Automática


