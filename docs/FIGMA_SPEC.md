# FIGMA SPEC - PRODPLAN 4.0 OS

**Data**: 2025-12-17  
**Versão**: 1.0  
**Status**: Adaptação de design visual para implementação funcional

## 1. ECRÃS/FRAMES

### 1.1 Overview (Dashboard)
- **Nome**: Overview / Dashboard
- **Descrição**: Visão geral com KPIs principais, bottlenecks ativos e fila de risco
- **Componentes principais**:
  - Grid de KPIs (4 cards: OTD, Lead Time, Gargalo, Setup)
  - Lista de bottlenecks (top 5 recursos críticos)
  - Risk Queue (ordens com risco de atraso)
  - Gráfico de tendências (opcional, se dados disponíveis)

### 1.2 Orders (Ordens de Fabrico)
- **Nome**: Orders / Ordens de Fabrico
- **Descrição**: Lista de ordens com filtros e detalhe individual
- **Componentes principais**:
  - Tabela de ordens (keyset pagination)
  - Filtros (status, produto, data)
  - Modal/Page de detalhe da ordem
  - Timeline de fases por ordem

### 1.3 Schedule (Agendamento)
- **Nome**: Schedule / Agendamento Atual
- **Descrição**: WIP (Work In Progress) por fase, visualização tipo Gantt
- **Componentes principais**:
  - Gantt chart ou timeline horizontal
  - Filtros por fase/produto
  - Legenda de cores por status

### 1.4 What-If (Simulação)
- **Nome**: What-If / Simulação de Cenários
- **Descrição**: Simulador determinístico de cenários
- **Componentes principais**:
  - Formulário de inputs (capacity_overrides, coef_overrides, priority_rule)
  - Resultados (baseline vs simulated KPIs, delta, top affected orders)
  - Comparação visual (gráficos lado a lado)

### 1.5 Quality (Qualidade)
- **Nome**: Quality / Qualidade e ZDM
- **Descrição**: Heatmap avaliação vs culpada, baseline risk
- **Componentes principais**:
  - Heatmap (matriz de contagens)
  - Gráfico de taxa por produto
  - Lista de baseline risk por fase

### 1.6 SmartInventory (Inventário Inteligente)
- **Nome**: SmartInventory / Inventário Inteligente
- **Descrição**: WIP counts, WIP mass, gelcoat teórico
- **Componentes principais**:
  - Cards de WIP por fase/produto
  - WIP mass (com disclaimer se low_confidence)
  - Gelcoat teórico (com disclaimer)

### 1.7 ML (Machine Learning)
- **Nome**: ML / Previsões e Explicações
- **Descrição**: Previsões de lead time e explicações (XAI)
- **Componentes principais**:
  - Formulário de input (produto_id, stats)
  - Resultado de previsão
  - Explicação (top 10 features com importâncias)

## 2. COMPONENTES REPETIDOS

### 2.1 Layout
- **PageShell**: Container principal com padding e max-width
- **Sidebar**: Navegação lateral fixa (80px width)
- **Topbar**: Barra superior (opcional, se necessário)

### 2.2 Cards
- **Card**: Container genérico com border, padding, background
- **KPICard**: Card específico para KPIs (valor grande + label + tooltip)
- **InsightCard**: Card para insights/banners

### 2.3 Formulários
- **Button**: Botão primário/secundário/terciário
- **Select**: Dropdown com opções
- **Input**: Campo de texto
- **Modal**: Overlay com conteúdo centralizado
- **Drawer**: Painel lateral (opcional)

### 2.4 Dados
- **Table**: Tabela com paginação keyset
- **Badge**: Tag para status/categorias
- **ChartContainer**: Wrapper para gráficos (Recharts)

### 2.5 Feedback
- **Toast**: Notificação temporária (react-hot-toast)
- **Loading**: Skeleton ou spinner
- **Empty**: Estado vazio com mensagem
- **Error**: Estado de erro com mensagem

## 3. ESTADOS

### 3.1 Hover
- **Cards**: Escala leve (scale: 1.02) + shadow aumentada
- **Buttons**: Background mais claro/escuro
- **Links**: Underline ou cor alterada

### 3.2 Active
- **Buttons**: Background invertido (primary → background, text → primary)
- **Tabs**: Border bottom + cor primária
- **Sidebar items**: Background highlight + cor primária

### 3.3 Disabled
- **Buttons**: Opacity 0.5 + cursor not-allowed
- **Inputs**: Opacity 0.5 + cursor not-allowed
- **Cards**: Opacity 0.6 (se aplicável)

### 3.4 Empty
- **Tabelas**: Mensagem centralizada "Nenhum dado disponível"
- **Gráficos**: Mensagem "Sem dados para exibir"
- **Listas**: Mensagem contextual

### 3.5 Error
- **API errors**: Toast vermelho + mensagem no componente
- **Validation errors**: Mensagem abaixo do campo
- **NOT_SUPPORTED_BY_DATA**: Banner amarelo com explicação

## 4. REGRAS DE LAYOUT

### 4.1 Grid
- **Sistema**: 12 colunas
- **Gutter**: 24px
- **Breakpoints**:
  - Mobile: < 768px (1 coluna)
  - Tablet: 768px - 1199px (2-3 colunas)
  - Desktop: ≥ 1200px (4 colunas para KPIs)

### 4.2 Spacing
- **xs**: 8px
- **sm**: 12px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

### 4.3 Tipografia
- **Font Family**: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Títulos**:
  - xl: 28px (bold)
  - lg: 24px (bold)
  - md: 20px (semibold)
- **Body**:
  - md: 16px (regular)
  - sm: 14px (regular)
- **Labels**: 12px (semibold, uppercase, tracking)

### 4.4 Cores (Design Tokens)
- **Background**: #0B0B0B (preto)
- **Card**: #121212 (cinza escuro)
- **Card Elevated**: #161616 (cinza médio)
- **Primary**: #00E676 (verde)
- **Primary Hover**: #00C767 (verde escuro)
- **Text Title**: #EAEAEA (branco suave)
- **Text Body**: #CFCFCF (cinza claro)
- **Text Secondary**: #9A9A9A (cinza)
- **Danger**: #EF4444 (vermelho)
- **Warning**: #F59E0B (laranja)
- **Border**: #262626 (cinza escuro)

### 4.5 Radius
- **Card**: 16px
- **Input**: 16px
- **Button**: 16px
- **Highlight**: 24px (para elementos especiais)

## 5. REGRAS DE RESPONSIVO

### 5.1 Mobile (< 768px)
- Sidebar: Oculto ou drawer
- Grid: 1 coluna
- Cards: Full width
- Tabelas: Scroll horizontal ou cards

### 5.2 Tablet (768px - 1199px)
- Sidebar: Visível (80px)
- Grid: 2-3 colunas
- Cards: Responsivos
- Tabelas: Scroll horizontal se necessário

### 5.3 Desktop (≥ 1200px)
- Sidebar: Visível (80px)
- Grid: 4 colunas (KPIs)
- Cards: Otimizados
- Tabelas: Full width com paginação

## 6. ANIMAÇÕES

### 6.1 Transições
- **Hover**: 150ms ease-in-out
- **Click**: 100ms ease-in-out
- **Page transitions**: 200ms ease-in-out (framer-motion)

### 6.2 Loading
- **Skeleton**: Pulse animation
- **Spinner**: Rotate animation

## 7. ACESSIBILIDADE

### 7.1 Contraste
- Texto sobre background: mínimo 4.5:1
- Texto sobre primary: mínimo 4.5:1

### 7.2 Foco
- Outline visível em todos os elementos interativos
- Tab order lógico

### 7.3 Screen Readers
- Labels descritivos
- ARIA attributes quando necessário

---

**Nota**: Este documento é uma especificação baseada nos endpoints disponíveis e nas melhores práticas de UI. O design visual do Figma deve ser adaptado mantendo estas regras funcionais.

