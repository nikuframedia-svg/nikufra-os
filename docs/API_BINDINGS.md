# API BINDINGS - PRODPLAN 4.0 OS

**Data**: 2025-12-17  
**Versão**: 1.0

## Mapeamento Páginas → Endpoints

### 1. Overview (Dashboard)
**Página**: `/` → `pages/Overview.tsx`

**Endpoints**:
- `GET /api/kpis/overview` → KPIs principais (OTD, Lead Time, Gargalo, Setup)
- `GET /api/prodplan/bottlenecks?top_n=5` → Top 5 bottlenecks
- `GET /api/prodplan/risk_queue?top_n=10` → Top 10 ordens em risco

**Estados**:
- Loading: Skeleton para cada card
- Empty: Mensagem "Sem dados disponíveis"
- Error: Error component com mensagem
- NOT_SUPPORTED_BY_DATA: Error component com badge "NOT_SUPPORTED_BY_DATA"

### 2. Orders (Lista)
**Página**: `/orders` → `pages/Orders.tsx`

**Endpoints**:
- `GET /api/prodplan/orders?limit=100&cursor=...` → Lista de ordens (keyset pagination)
- Filtros: `of_id`, `produto_id`, `fase_id`, `data_criacao_from`, `data_criacao_to`

**Estados**:
- Loading: Table com skeleton rows
- Empty: Empty component "Nenhuma ordem encontrada"
- Error: Error component
- NOT_SUPPORTED_BY_DATA: Error component com badge

### 3. Order Detail
**Página**: `/orders/:ofId` → `pages/OrderDetail.tsx`

**Endpoints**:
- `GET /api/prodplan/orders/{ofId}` → Detalhe da ordem
- `GET /api/prodplan/orders/{ofId}/phases` → Timeline de fases

**Estados**:
- Loading: Skeleton para card de detalhe + timeline
- Empty: Empty component "Ordem não encontrada"
- Error: Error component
- NOT_SUPPORTED_BY_DATA: Error component com badge

### 4. Schedule
**Página**: `/schedule` → `pages/Schedule.tsx`

**Endpoints**:
- `GET /api/prodplan/schedule/current?fase_id=...` → WIP por fase

**Estados**:
- Loading: Skeleton para Gantt chart
- Empty: Empty component "Sem WIP no momento"
- Error: Error component
- NOT_SUPPORTED_BY_DATA: Error component com badge

### 5. What-If
**Página**: `/whatif` → `pages/WhatIf.tsx`

**Endpoints**:
- `POST /api/whatif/simulate` → Simular cenário

**Inputs**:
- `capacity_overrides`: Record<string, number> (opcional)
- `coef_overrides`: Record<string, number> (opcional)
- `priority_rule`: 'EDD' | 'SPT' | 'FIFO' (opcional)

**Outputs**:
- `baseline_kpis`: KPIs do cenário base
- `simulated_kpis`: KPIs do cenário simulado
- `delta_kpis`: Diferença entre baseline e simulated
- `top_affected_orders`: Top ordens afetadas

**Estados**:
- Loading: Skeleton para resultados
- Empty: Empty component "Execute uma simulação"
- Error: Error component
- NOT_SUPPORTED_BY_DATA: Error component com badge

### 6. Quality
**Página**: `/quality` → `pages/Quality.tsx`

**Endpoints**:
- `GET /api/quality/overview` → Heatmap avaliação vs culpada
- `GET /api/quality/risk` → Baseline risk por produto/fase

**Estados**:
- Loading: Skeleton para heatmap
- Empty: Empty component "Sem dados de qualidade"
- Error: Error component
- NOT_SUPPORTED_BY_DATA: Error component com badge

### 7. SmartInventory
**Página**: `/inventory` → `pages/Inventory.tsx`

**Endpoints**:
- `GET /api/smartinventory/wip?fase_id=...&produto_id=...` → WIP counts
- `GET /api/smartinventory/wip_mass?fase_id=...&produto_id=...` → WIP mass
- `GET /api/smartinventory/gelcoat_theoretical_usage` → Gelcoat teórico

**Estados**:
- Loading: Skeleton para cards
- Empty: Empty component "Sem WIP no momento"
- Error: Error component
- NOT_SUPPORTED_BY_DATA: Error component com badge
- **Disclaimers**: Sempre mostrar disclaimer se `low_confidence=true` ou para gelcoat teórico

### 8. ML
**Página**: `/ml` → `pages/ML.tsx`

**Endpoints**:
- `POST /api/ml/predict/leadtime` → Previsão de lead time
- `GET /api/ml/explain/leadtime?produto_id=...&stats=...` → Explicação (XAI)

**Inputs**:
- `produto_id`: number (obrigatório)
- `stats`: Record<string, number> (opcional)

**Outputs**:
- `predicted_lead_time_h`: number
- `confidence_interval`: [number, number] (opcional)
- `baseline_lead_time_h`: number (opcional)
- `features`: Array<{name: string, importance: number}> (para explain)

**Estados**:
- Loading: Skeleton para resultado
- Empty: Empty component "Execute uma previsão"
- Error: Error component
- NOT_SUPPORTED_BY_DATA: Error component com badge

## Tratamento de Erros

### NOT_SUPPORTED_BY_DATA
Quando um endpoint retorna `NOT_SUPPORTED_BY_DATA`:
1. Mostrar `Error` component com `isNotSupported={true}`
2. Exibir badge "NOT_SUPPORTED_BY_DATA"
3. Mostrar `reason` e `match_rate` (se disponível)
4. Não tentar fallback - mostrar estado explicitamente

### Erros de Validação
Se validação Zod falhar:
1. Logar erro no console (detalhado)
2. Mostrar toast de erro
3. Mostrar `Error` component na UI
4. Não renderizar dados inválidos

### Erros de Rede
1. Mostrar toast de erro
2. Mostrar `Error` component na UI
3. Permitir retry (se aplicável)

## Paginação

### Keyset Pagination
Endpoints que suportam keyset:
- `/api/prodplan/orders` → usar `cursor` e `next_cursor`

**Implementação**:
- Primeira página: `GET /api/prodplan/orders?limit=100`
- Próxima página: `GET /api/prodplan/orders?limit=100&cursor={next_cursor}`

## Cache

- Usar `@tanstack/react-query` para cache automático
- `staleTime`: 30s para endpoints quentes (schedule, kpis)
- `staleTime`: 5min para endpoints frios (orders, quality)
- Invalidar cache após mutations

---

**Nota**: Todos os endpoints devem ser validados com schemas Zod antes de serem usados na UI.

