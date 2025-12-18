# UI IMPORT MAP - PRODPLAN 4.0 OS

**Data**: 2025-12-17  
**Versão**: 1.0  
**Status**: Mapeamento de blocos do design importado para widgets PRODPLAN industriais

## REGRA FUNDAMENTAL
**Cada bloco do design tem de corresponder a uma feature do PRODPLAN OS. Se não corresponder, apaga. UI industrial não tem decoração.**

---

## MAPEAMENTO: DESIGN → WIDGET PRODPLAN

### 1. Categories Section (Grid de Cards Pequenos)
**Design Original**: Grid de cards 147x124px com percentagem e barra de progresso vertical

**Mapeamento PRODPLAN**:
- **Widget**: `PhaseCriticalityGrid` ou `OperationTypeGrid`
- **Dados**: Top fases por risco (bottlenecks) OU tipos de operação (se endpoint existir)
- **Endpoint**: `/api/prodplan/bottlenecks?top_n=10`
- **Estado NOT_SUPPORTED**: Se endpoint não existir, remover widget

**Componente Industrial**:
- Cards compactos (120x100px)
- Sem border-radius > 4px
- Barra de progresso horizontal (não vertical)
- Densidade alta: mostrar 6-10 cards por linha

---

### 2. Cortical Activity Map (Dot Grid)
**Design Original**: Matriz de pontos/círculos representando atividade

**Mapeamento PRODPLAN**:
- **Widget**: `WIPActivityMap` ou `PhaseDensityMap`
- **Dados**: WIP por fase (densidade = wip_count, destaque = p90_age)
- **Endpoint**: `/api/prodplan/schedule/current`
- **Interação**: Click num ponto → filtrar tabelas e atualizar detalhe contextual

**Componente Industrial**:
- Grid de pontos 8x8 ou 10x10
- Estados: inativo (cinza), ativo (verde), crítico (vermelho)
- Sem outlines exagerados
- Tooltip com: fase_nome, wip_count, p90_age_hours

---

### 3. Neuromodulators Activity Chart (Line Chart)
**Design Original**: Gráfico de linhas com múltiplas séries coloridas

**Mapeamento PRODPLAN**:
- **Widget**: `KPITrendingChart`
- **Dados**: Throughput/Lead Time/Erro Rate ao longo do tempo
- **Endpoint**: `/api/kpis/overview?from=&to=` (se suportar histórico) OU remover se não existir
- **Estado NOT_SUPPORTED**: Se endpoint não suportar histórico, remover widget

**Componente Industrial**:
- Time series simples (linha)
- Eixos claros com unidades
- Tooltip com valor + janela temporal + contagem n
- Sem animações show-off

---

### 4. Selected HyperColumn / Detail Panel
**Design Original**: Painel de detalhe contextual com informações do item selecionado

**Mapeamento PRODPLAN**:
- **Widget**: `ContextualDetailPanel`
- **Dados Contextuais**:
  - Se selecionar fase: stats fase (wip, age, p90, backlog, risco)
  - Se selecionar OF: detalhe OF (estado, due_date, ETA, fases)
  - Se selecionar produto: rota padrão e KPIs por produto
- **Endpoints**:
  - Fase: `/api/prodplan/schedule/current?fase_id={id}`
  - OF: `/api/prodplan/orders/{ofId}`
  - Produto: `/api/prodplan/routes/{produtoId}` (se existir)

**Componente Industrial**:
- Painel direito fixo (SplitPane)
- Grid de informações chave-valor (2x3 ou 3x3)
- Sem decoração, apenas dados

---

### 5. Layers Section (Lista Vertical)
**Design Original**: Lista de items com ícones e informações

**Mapeamento PRODPLAN**:
- **Widget**: `PhaseList` ou `OrderList`
- **Dados**: Lista de fases OU lista de ordens (depende do contexto)
- **Endpoint**: `/api/prodplan/orders` ou `/api/prodplan/schedule/current`
- **Interação**: Click num item → selecionar e atualizar detalhe contextual

**Componente Industrial**:
- Lista densa (altura mínima 40px por item)
- Sticky header
- Scroll virtual se > 100 items

---

### 6. Casual Model Section (Grid de Formas)
**Design Original**: Grid de formas 3D decorativas

**Mapeamento PRODPLAN**:
- **Widget**: **REMOVIDO** (não corresponde a feature real)
- **Ação**: Apagar do design final

---

### 7. Device List (Lista de Cards Horizontais)
**Design Original**: Cards horizontais com status bar, ícone, info e ação

**Mapeamento PRODPLAN**:
- **Widget**: `OrderListCard` ou `PhaseListCard`
- **Dados**: Ordens ou fases com status visual
- **Endpoint**: `/api/prodplan/orders`
- **Interação**: Click → abrir detalhe

**Componente Industrial**:
- Cards compactos (altura 60px)
- Status bar vertical (4px width)
- Sem ícones decorativos grandes
- Informação densa: of_id, produto, fase, status, due_date

---

### 8. Device Details Section (Grid de Informações)
**Design Original**: Grid 2x3 de informações chave-valor

**Mapeamento PRODPLAN**:
- **Widget**: `OrderDetailGrid` ou `PhaseDetailGrid`
- **Dados**: Detalhes da ordem ou fase selecionada
- **Endpoint**: `/api/prodplan/orders/{ofId}` ou `/api/prodplan/schedule/current?fase_id={id}`

**Componente Industrial**:
- Grid responsivo (2-3 colunas)
- Labels explícitas com unidades
- Valores grandes (20px) + labels pequenos (12px)

---

### 9. Activity In The Brain Section (Grid de Cards com Progresso)
**Design Original**: Grid 2x3 de cards com percentagem, ícone colorido e barra de progresso vertical

**Mapeamento PRODPLAN**:
- **Widget**: `PhaseActivityGrid` ou `OperationTypeGrid`
- **Dados**: Atividade por fase (percentagem de utilização, WIP, etc.)
- **Endpoint**: `/api/prodplan/schedule/current` + cálculos de utilização
- **Estado NOT_SUPPORTED**: Se não houver dados de utilização, remover ou simplificar

**Componente Industrial**:
- Cards compactos (180x140px)
- Barra de progresso horizontal (não vertical)
- Sem ícones decorativos grandes
- Foco em métricas: utilização %, WIP count, avg age

---

### 10. Robo Spec Section (Lista de Especificações)
**Design Original**: Lista vertical de componentes com ícones, tipos e quantidades

**Mapeamento PRODPLAN**:
- **Widget**: `OrderPhasesList` ou `ProductRouteList`
- **Dados**: Fases de uma ordem OU rota padrão de um produto
- **Endpoint**: `/api/prodplan/orders/{ofId}/phases` ou `/api/prodplan/routes/{produtoId}`
- **Estado NOT_SUPPORTED**: Se endpoint não existir, remover widget

**Componente Industrial**:
- Lista densa (altura 45px por item)
- Sem ícones decorativos
- Informação: fase_nome, sequencia, coeficiente, status

---

### 11. Active Interference (Flowchart)
**Design Original**: Diagrama de fluxo com nós e conexões coloridas

**Mapeamento PRODPLAN**:
- **Widget**: `ProductionRouteFlowchart` ou `PhaseSequenceFlowchart`
- **Dados**: Rota padrão de um produto (sequência de fases)
- **Endpoint**: `/api/prodplan/routes/{produtoId}` (se existir)
- **Estado NOT_SUPPORTED**: Se endpoint não existir, remover widget

**Componente Industrial**:
- Flowchart simples (nós retangulares, conexões retas)
- Sem cores exageradas
- Tooltip com: fase_nome, coeficiente, tempo estimado

---

## COMPONENTES INDUSTRIAIS OBRIGATÓRIOS

### Panel (Surface + Border)
- Background: `--surface`
- Border: `1px solid --border`
- Border-radius: `4px` (máximo)
- Padding: `12px` ou `16px`
- Sem sombras pesadas

### SectionHeader (Título + Actions)
- Título: `14px semibold`
- Actions: botões pequenos (altura 32px)
- Border-bottom: `1px solid --border`

### KPIStat (Label + Value + Delta)
- Label: `12px muted`
- Value: `20px bold`
- Delta: badge pequeno (verde/vermelho)
- Sem decoração

### DenseTable (Tabela Compacta)
- Altura linha: `40px` (mínimo)
- Font-size: `13px`
- Sticky header
- Sem zebra stripes (opcional)
- Hover: background sutil

### Badge (Severity)
- Tamanho: `20px altura`
- Border-radius: `4px`
- Cores: info/warn/error/success apenas
- Sem gradients

### SplitPane (Resizable)
- Painel esquerdo: listas/tabelas + filtros
- Painel direito: detalhe contextual + gráficos
- Resizable handle: `4px width`
- Min-width: `300px` cada painel

### FiltersBar (Chips + Selects + Search)
- Altura: `48px`
- Chips pequenos (altura 28px)
- Selects compactos (altura 32px)
- Search: `200px width`

### EmptyState / ErrorState / NotSupportedState
- Mensagem clara
- Ação sugerida (se aplicável)
- Sem ilustrações decorativas

---

## LAYOUT INDUSTRIAL OBRIGATÓRIO

### Estrutura Base
```
AppShell
  ├── Sidebar (fixa, 80px width)
  └── Content (flex)
      ├── Left Pane (resizable, min 300px)
      │   ├── FiltersBar (sticky top)
      │   ├── List/Table (scroll)
      │   └── Pagination (sticky bottom)
      └── Right Pane (resizable, min 300px)
          ├── Detail Panel (contextual)
          └── Charts/Visualizations
```

### Grid System
- 12 colunas
- Gutter: `16px`
- Breakpoints:
  - md: `768px` (1 coluna)
  - lg: `1200px` (2 colunas)
  - xl: `1440px` (3-4 colunas)

### Spacing
- `4px` (xs)
- `8px` (sm)
- `12px` (md)
- `16px` (lg)
- `24px` (xl)
- `32px` (2xl)

---

## REGRAS DE REMOÇÃO

### Remover se:
1. Bloco não corresponde a endpoint real
2. Bloco é apenas decorativo (sem dados)
3. Bloco não tem interação útil
4. Bloco duplica informação já visível noutro lugar

### Manter se:
1. Bloco mostra dados reais de endpoint
2. Bloco tem interação útil (click, hover, filter)
3. Bloco adiciona contexto operacional

---

## PRÓXIMOS PASSOS

1. ✅ Mapeamento completo (este documento)
2. ⏳ Atualizar tokens para UI industrial
3. ⏳ Criar componentes industriais
4. ⏳ Recriar layout com grid + SplitPane
5. ⏳ Implementar widgets mapeados
6. ⏳ Remover código importado não utilizado

---

**Última atualização**: 2025-12-17

