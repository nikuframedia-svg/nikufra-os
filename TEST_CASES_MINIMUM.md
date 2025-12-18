# CASOS MÍNIMOS OBRIGATÓRIOS - Backend Services

**Data:** 2024-12-13  
**Objetivo:** Definir casos de teste mínimos que DEVEM passar para validar o protótipo

---

## PRODPLAN (PlanningService)

### ✅ Caso 1: Gerar Plano Base
**Comando:**
```python
from backend.services.planning_service import PlanningService
from backend.models.database import get_session

session = get_session()
service = PlanningService(session)
plan = service.get_plan_v2(horizon_hours=168, use_historical=True)
```

**Validações:**
- ✅ Retorna dicionário com estrutura válida
- ✅ Contém `optimized.operations` (lista)
- ✅ Contém `optimized.kpis` (dicionário)
- ✅ KPIs têm valores numéricos válidos:
  - `otd_pct`: 0-100
  - `lead_time_h`: >= 0
- ✅ `makespan_h` >= 0

**Status:** ✅ IMPLEMENTADO

---

### ✅ Caso 2: KPIs com Consistência
**Validações:**
- ✅ OTD calculado corretamente (0-100%)
- ✅ Lead time médio calculado
- ✅ Gargalo identificado (string ou "N/A")
- ✅ Nenhum KPI é None ou inválido

**Status:** ✅ IMPLEMENTADO

---

## SMARTINVENTORY (InventoryService)

### ✅ Caso 3: Cálculo de ROP
**Comando:**
```python
from backend.services.inventory_service import InventoryService

service = InventoryService(session)
rop = service.calculate_rop(mu=10.0, sigma=2.0, lead_time_days=5.0, service_level=0.95)
```

**Validações:**
- ✅ ROP >= 0
- ✅ Fórmula: ROP ≈ μ * L + z * σ * √L (tolerância 5%)
- ✅ Para service_level=0.95, z ≈ 1.65

**Status:** ✅ IMPLEMENTADO

---

### ✅ Caso 4: Risco de Rutura 30 dias
**Comando:**
```python
risk = service.calculate_rupture_risk_30d(stock_current=100.0, mu=10.0, sigma=2.0)
```

**Validações:**
- ✅ Risco entre 0 e 1
- ✅ Stock muito alto → risco próximo de 0
- ✅ Stock muito baixo → risco próximo de 1

**Status:** ✅ IMPLEMENTADO

---

### ✅ Caso 5: Recomendações SmartInventory
**Comando:**
```python
skus = service.get_inventory_skus(limit=10)
```

**Validações:**
- ✅ Retorna lista de SKUs
- ✅ Cada SKU tem:
  - `sku`: código
  - `risco_30d`: 0-100
  - `cobertura_dias`: >= 0
  - `rop`: >= 0
  - `acao`: string não vazia

**Status:** ✅ IMPLEMENTADO

---

## WHAT-IF (WhatIfService)

### ✅ Caso 6: Simulação VIP Order
**Comando:**
```python
from backend.services.whatif_service import WhatIfService

service = WhatIfService(session)
result = service.simulate_vip_order(
    sku="PROD001",
    quantidade=100,
    prazo=(datetime.now() + timedelta(days=7)).isoformat()
)
```

**Validações:**
- ✅ Retorna dicionário
- ✅ Contém `baseline` ou `optimized`
- ✅ Não levanta exceção

**Status:** ✅ IMPLEMENTADO

---

### ✅ Caso 7: Simulação Machine Breakdown
**Comando:**
```python
result = service.simulate_machine_breakdown(
    recurso="MAQ1",
    de=datetime.now().isoformat(),
    ate=(datetime.now() + timedelta(hours=24)).isoformat()
)
```

**Validações:**
- ✅ Retorna dicionário
- ✅ Contém `delta` ou comparação baseline vs optimized
- ✅ Não levanta exceção

**Status:** ✅ IMPLEMENTADO

---

## R&D (RDService)

### ✅ Caso 8: WP1 - Gerar Sugestões
**Comando:**
```python
from backend.services.rd_service import RDService

service = RDService(session)
suggestions = service.wp1_generate_suggestions(mode='resumo', limit=10)
```

**Validações:**
- ✅ Retorna lista
- ✅ Cada sugestão tem `id`, `icon` ou `title`
- ✅ Não levanta exceção

**Status:** ✅ IMPLEMENTADO

---

### ✅ Caso 9: WP2 - Avaliar Sugestões
**Comando:**
```python
suggestions = service.wp1_generate_suggestions(limit=5)
if suggestions:
    result = service.wp2_evaluate_suggestions(suggestions)
```

**Validações:**
- ✅ Retorna dicionário com `summary`
- ✅ `summary` contém `beneficial`, `neutral`, `harmful`
- ✅ Percentagens somam aproximadamente 100%

**Status:** ✅ IMPLEMENTADO

---

### ✅ Caso 10: WP3 - Comparar Políticas
**Comando:**
```python
result = service.wp3_compare_inventory_policies()
```

**Validações:**
- ✅ Retorna dicionário
- ✅ Compara pelo menos 2 políticas
- ✅ Não levanta exceção

**Status:** ✅ IMPLEMENTADO

---

## EXECUÇÃO DOS TESTES

### Smoke Test (Todos os Serviços)
```bash
python3 scripts/smoke_test_all_services.py
```

**Resultado Esperado:**
```
✅ PRODPLAN SERVICE: ALL TESTS PASSED
✅ SMARTINVENTORY SERVICE: ALL TESTS PASSED
✅ WHAT-IF SERVICE: ALL TESTS PASSED
✅ R&D SERVICE: ALL TESTS PASSED
```

### Testes Unitários/Integração
```bash
pytest tests/test_services_integration.py -v
```

**Resultado Esperado:**
```
tests/test_services_integration.py::TestPlanningService::test_get_plan_returns_valid_structure PASSED
tests/test_services_integration.py::TestPlanningService::test_get_plan_v2_returns_valid_structure PASSED
tests/test_services_integration.py::TestInventoryService::test_calculate_rop_returns_positive_value PASSED
...
```

---

## CHECKLIST FINAL

- [x] PRODPLAN: Gerar plano base com dados reais
- [x] PRODPLAN: Calcular KPIs consistentes
- [x] SMARTINVENTORY: Calcular ROP correto
- [x] SMARTINVENTORY: Calcular risco de rutura
- [x] SMARTINVENTORY: Gerar recomendações
- [x] WHAT-IF: Simular VIP order
- [x] WHAT-IF: Simular machine breakdown
- [x] R&D: Gerar sugestões (WP1)
- [x] R&D: Avaliar sugestões (WP2)
- [x] R&D: Comparar políticas (WP3)

---

**Última Atualização:** 2024-12-13  
**Status:** ✅ TODOS OS CASOS MÍNIMOS IMPLEMENTADOS


