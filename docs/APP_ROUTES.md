# APP ROUTES - PRODPLAN 4.0 OS

**Data**: 2025-12-17  
**Versão**: 1.0

## Mapeamento de Rotas

### 1. Overview (Dashboard)
- **Rota**: `/`
- **Componente**: `pages/Overview.tsx`
- **Descrição**: Visão geral com KPIs, bottlenecks e risk queue
- **Layout**: PageShell + Sidebar

### 2. Orders (Ordens de Fabrico)
- **Rota**: `/orders`
- **Componente**: `pages/Orders.tsx`
- **Descrição**: Lista de ordens com filtros
- **Layout**: PageShell + Sidebar

### 3. Order Detail
- **Rota**: `/orders/:ofId`
- **Componente**: `pages/OrderDetail.tsx`
- **Descrição**: Detalhe de uma ordem com timeline de fases
- **Layout**: PageShell + Sidebar

### 4. Schedule (Agendamento)
- **Rota**: `/schedule`
- **Componente**: `pages/Schedule.tsx`
- **Descrição**: WIP por fase, visualização tipo Gantt
- **Layout**: PageShell + Sidebar

### 5. What-If (Simulação)
- **Rota**: `/whatif`
- **Componente**: `pages/WhatIf.tsx`
- **Descrição**: Simulador determinístico de cenários
- **Layout**: PageShell + Sidebar

### 6. Quality (Qualidade)
- **Rota**: `/quality`
- **Componente**: `pages/Quality.tsx`
- **Descrição**: Heatmap avaliação vs culpada, baseline risk
- **Layout**: PageShell + Sidebar

### 7. SmartInventory (Inventário)
- **Rota**: `/inventory`
- **Componente**: `pages/Inventory.tsx`
- **Descrição**: WIP counts, WIP mass, gelcoat teórico
- **Layout**: PageShell + Sidebar

### 8. ML (Machine Learning)
- **Rota**: `/ml`
- **Componente**: `pages/ML.tsx`
- **Descrição**: Previsões de lead time e explicações
- **Layout**: PageShell + Sidebar

## Estrutura de Navegação

```
Sidebar:
  - Overview (/)
  - Orders (/orders)
  - Schedule (/schedule)
  - What-If (/whatif)
  - Quality (/quality)
  - Inventory (/inventory)
  - ML (/ml)
```

## Notas

- Todas as rotas usam `PageShell` para padding consistente
- Sidebar fixa (80px width) em todas as páginas
- Topbar opcional (se necessário para ações globais)

