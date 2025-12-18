# UI CLEANUP REPORT - FASE D

**Data:** 2024-12-13  
**Objetivo:** Remover componentes não usados, mocks e garantir ligação a dados reais

---

## COMPONENTES REMOVIDOS

### Páginas Removidas
- ✅ `frontend/src/pages/WorkCentersListPage.tsx` - Não usada no protótipo (usa mocks)
- ✅ `frontend/src/pages/WorkCenterDetailsPage.tsx` - Não usada no protótipo (usa mocks)

### Ficheiros de Mock Removidos
- ✅ `frontend/src/data/mockData.ts` - Mock data completo removido

### Router Não Usado
- ⚠️ `frontend/src/router/AppRouter.tsx` - Router alternativo não usado (App.tsx é o router principal)

---

## PÁGINAS PRINCIPAIS (Ligadas a Backend Real)

### ✅ Planning (`/`)
**Status:** Ligado a backend real  
**API:** `/planning/v2/plano`  
**Features:**
- ✅ Usa `useQuery` para buscar dados
- ✅ Estados de loading/error/empty implementados
- ✅ Recalcular plano via mutation
- ✅ Chat de planeamento integrado

### ✅ Bottlenecks (`/bottlenecks`)
**Status:** Ligado a backend real  
**API:** `/bottlenecks/`  
**Features:**
- ✅ Usa `useQuery` para buscar dados
- ✅ Estados de loading/error implementados
- ✅ Heatmap e tabela de gargalos

### ✅ Inventory (`/inventory`)
**Status:** Ligado a backend real  
**API:** `/inventory/`  
**Features:**
- ✅ Usa `useQuery` para buscar dados
- ✅ Estados de loading/error/empty implementados
- ✅ Filtros por classe ABC/XYZ
- ✅ Pesquisa de SKUs
- ✅ Matriz ABC/XYZ

### ✅ What-If (`/whatif`)
**Status:** Ligado a backend real  
**API:** `/whatif/vip`, `/whatif/avaria`  
**Features:**
- ✅ Simulação VIP order via mutation
- ✅ Simulação machine breakdown via mutation
- ✅ Estados de loading/error implementados
- ✅ Aplicar plano após simulação

### ✅ Suggestions (`/suggestions`)
**Status:** Ligado a backend real  
**API:** `/suggestions`  
**Features:**
- ✅ Usa `useQuery` para buscar sugestões
- ✅ Estados de loading/error/empty implementados
- ✅ Navegação para What-If com sugestão

### ✅ Chat (`/chat`)
**Status:** Ligado a backend real  
**API:** `/chat`  
**Features:**
- ✅ Chat mutation para conversação
- ✅ Estados de loading/error implementados
- ✅ Histórico de mensagens

---

## COMPONENTES OVERVIEW (Status)

**Localização:** `frontend/src/components/overview/`

Estes componentes parecem ser de um módulo "Factory Overview" que não está ativo no protótipo atual. Se não forem usados, podem ser removidos:

- `ActivityByMachineCard.tsx`
- `EventsPanel.tsx`
- `FactoryActivityMapCard.tsx`
- `FactoryIndicatorsChart.tsx`
- `GlobalIndicatorsCard.tsx`
- `LayersPanel.tsx`
- `OperationCategoryCard.tsx`
- `SelectedWorkCenterCard.tsx`
- `SelectedWorkCenterPanel.tsx`

**Ação:** Verificar se são usados antes de remover.

---

## HOOKS E SERVIÇOS

### Hooks que podem não ser usados:
- ⚠️ `useWorkCenters.ts` - Usado apenas nas páginas removidas
- ⚠️ `useWorkCenter.ts` - Usado apenas nas páginas removidas
- ⚠️ `useFactoryOverview.ts` - Pode não ser usado

### Serviços API:
- ⚠️ `frontend/src/services/api.ts` - Define `ApiService` mas pode não ser usado (o código usa `utils/api.ts`)

---

## ROTAS ATIVAS

**Router Principal:** `frontend/src/App.tsx`

Rotas definidas:
- `/` - Planning
- `/bottlenecks` - Bottlenecks
- `/inventory` - Inventory
- `/suggestions` - Suggestions
- `/whatif` - What-If
- `/chat` - Chat Inteligente

**Todas as rotas estão ligadas a serviços backend reais.**

---

## ESTADOS DE UI

### Loading States
- ✅ Planning: Skeleton loaders
- ✅ Inventory: Skeleton loaders
- ✅ Bottlenecks: Skeleton loaders
- ✅ Suggestions: Skeleton loaders
- ✅ What-If: Loading indicators nas mutations
- ✅ Chat: Loading indicators

### Error States
- ✅ Planning: Mensagem de erro exibida
- ✅ Inventory: Mensagem de erro exibida
- ✅ Bottlenecks: Mensagem de erro exibida
- ✅ Suggestions: Mensagem de erro exibida
- ✅ What-If: Toast de erro
- ✅ Chat: Toast de erro

### Empty States
- ✅ Planning: "Sem dados — carregue Excel"
- ✅ Inventory: "Sem dados — carregue Excel"
- ✅ Suggestions: "Ainda não existem sugestões"

---

## PRÓXIMOS PASSOS

1. ✅ Remover páginas não usadas (WorkCentersListPage, WorkCenterDetailsPage)
2. ✅ Remover mockData.ts
3. ⚠️ Verificar e remover componentes overview não usados
4. ⚠️ Verificar e remover hooks não usados (useWorkCenters, useWorkCenter, useFactoryOverview)
5. ⚠️ Verificar se services/api.ts é usado ou pode ser removido
6. ⚠️ Remover AppRouter.tsx se não for usado

---

**Última Atualização:** 2024-12-13


