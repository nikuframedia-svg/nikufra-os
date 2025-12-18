# Design Reference - Dashboard Model

Este documento captura as observações do design de referência fornecido pelo usuário.

## Imagem 1: Dashboard com Categories e Cortical Activity Map

### Layout Geral
- **Estrutura**: Layout em duas colunas principais
- **Coluna Esquerda**: Seções verticais com títulos e conteúdo
- **Coluna Direita**: Painel lateral (#2C2D30) com visualizações

### Cores Observadas
- **Background Principal**: `#212024`
- **Background Card/Painel**: `#2C2D30`
- **Background Card com Opacidade**: `rgba(199, 207, 214, 0.18)`
- **Acento Verde**: `#82D930`
- **Texto Principal**: `white` / `#FFFFFF`
- **Texto Secundário**: `#C7CFD6`
- **Bordas/Outlines**: `#212024` (usado em outlines de 6px)

### Tipografia
- **Fonte**: `Ubuntu`
- **Tamanhos**:
  - Labels: `12px` (font-weight: 400)
  - Títulos de Cards: `12px` (font-weight: 500, uppercase)
  - Percentagens: `12px` (font-weight: 400, uppercase)
- **Transformações**: `text-transform: uppercase` em vários elementos
- **Letter Spacing**: `0.1em` (observado em alguns labels)

### Componentes Observados

#### 1. Categories Section
- **Container**: Grid de cards pequenos (147x124px)
- **Card Background**: 
  - Ativo: `rgba(199, 207, 214, 0.18)`
  - Inativo: `#212024`
- **Conteúdo**:
  - Título: texto branco, uppercase, 12px, font-weight 500
  - Percentagem: `#C7CFD6`, 12px, uppercase
- **Barra de Progresso**:
  - Container: `rgba(199, 207, 214, 0.08)` ou `rgba(199, 207, 214, 0.18)`
  - Preenchimento: `#82D930`
  - Altura: 7px
  - Border radius: 15px
  - Rotação: 90deg (vertical)

#### 2. Cortical Activity Map
- **Container**: Card com padding 20px, background `#212024`, border-radius 15px
- **Grid**: Matriz de pontos/círculos
- **Pontos**:
  - Tamanho: 12x12px
  - Border radius: 10px (círculos)
  - Background padrão: `#2C2D30`
  - Background destacado: `white` ou `rgba(255, 255, 255, 0.10)`
  - Outline: 6px solid `#212024`, offset -3px
- **Layout**: Grid responsivo de pontos

### Espaçamento
- **Gap entre cards**: 18px
- **Gap entre linhas**: 15px
- **Padding interno**: 19px (top/left), 20px (geral)
- **Margens**: 26px (left), 36px (top)

### Border Radius
- **Cards**: `15px`
- **Pontos/Círculos**: `10px`
- **Barras de Progresso**: `15px`

### Observações Importantes
1. **Design Escuro**: Paleta muito escura com acentos verdes vibrantes
2. **Tipografia Ubuntu**: Diferente do Inter atual
3. **Cards Compactos**: Cards pequenos e densos (147x124px)
4. **Visualizações de Grid**: Uso extensivo de grids de pontos/círculos
5. **Barras de Progresso Verticais**: Rotacionadas 90deg
6. **Opacidades**: Uso de rgba para backgrounds semi-transparentes

## Imagem 2: Lista de Dispositivos (RoboDoc)

### Layout Geral
- **Estrutura**: Sidebar esquerda fixa (#2C2D30) + área principal (#212024)
- **Sidebar**: 270px de largura, background #2C2D30
- **Área Principal**: Restante da largura, background #212024

### Header da Página
- **Título**: "Artificial intelligence for robots" - 32px, Ubuntu, font-weight 400, cor branca
- **Checkbox**: "show unavailable devices" - 15px, Ubuntu, cor branca
- **Barra de Pesquisa**: 
  - Background: `rgba(199, 207, 214, 0.08)`
  - Border radius: 15px
  - Placeholder: "Search" - 15px, cor #E5E5E5
  - Ícone de lupa à direita

### Lista de Cards de Dispositivos
- **Card Structure**:
  - Background: `rgba(199, 207, 214, 0.08)`
  - Border radius: 15px
  - Altura: 82px
  - Gap entre cards: 15px
  - Padding interno: 29px (left), 13.39px (top)

- **Barra de Status Vertical**:
  - Largura: 7px
  - Altura: 46px
  - Border radius: 10px
  - Posição: left: 0, top: 18px
  - Cores:
    - Verde (disponível): `#32E6B7`
    - Vermelho (indisponível): `#D9506B`

- **Ícone do Dispositivo**:
  - Tamanho: 50x50px
  - Border radius: 30px (ou variável dependendo do ícone)
  - Outline: 2px #E5E5E5 solid

- **Informações do Dispositivo**:
  - Nome: "RoboDoc" - 16px, Ubuntu, font-weight 400, cor branca
  - Localização: "Floor 3rd, Physiotherapy department" - 12px, Ubuntu, font-weight 400, cor branca
  - ID: "ID 12345" - 12px, Ubuntu, font-weight 400, uppercase, cor #C7CFD6
  - Gap entre linhas: 5px

- **Botão de Ação**:
  - **Connect** (disponível):
    - Background: `#32E6B7`
    - Texto: `#2C2D30` (cor escura)
    - Tamanho: 13px, Ubuntu, font-weight 500, capitalize
    - Padding: 24px (left/right), 10px (top/bottom)
    - Border radius: 15px
  - **Request** (indisponível):
    - Background: transparente
    - Outline: `2px #32E6B7 solid`, offset -2px
    - Texto: branco
    - Tamanho: 13px, Ubuntu, font-weight 500, capitalize
    - Padding: 23px (left/right), 10px (top/bottom)
    - Border radius: 15px

- **Menu de Opções**:
  - Ícone de três pontos (25x25px)
  - Posição: right, top: 53.89px

### Sidebar
- **Logo**:
  - Tamanho: 50x50px
  - Background: gradient linear (225deg, #9379FF 0%, #5EC9FF 100%)
  - Border radius: 15px
  - Posição: top: 15px, left: 15px

- **Navegação**:
  - Item ativo: background `rgba(199, 207, 214, 0.08)`, border radius 15px
  - Texto ativo: branco
  - Texto inativo: #C7CFD6
  - Tamanho: 15px, Ubuntu, font-weight 400
  - Gap entre ícone e texto: 20px
  - Items: "devices" (ativo), "information", "support"

### Cores Adicionais Observadas
- **Verde de Ação**: `#32E6B7` (diferente do #82D930 anterior)
- **Vermelho de Status**: `#D9506B` (para indisponível)
- **Background Card Lista**: `rgba(199, 207, 214, 0.08)` (mais transparente que o anterior)
- **Texto de Botão Connect**: `#2C2D30` (texto escuro sobre fundo verde claro)

### Padrões de Lista
1. **Cards Horizontais**: Cards alongados (997x82px) com informações lado a lado
2. **Status Visual**: Barra vertical colorida à esquerda indica status
3. **Ações Contextuais**: Botões diferentes baseados no status (Connect vs Request)
4. **Hierarquia de Informação**: Nome > Localização > ID (tamanhos e cores diferentes)

## Consolidação de Padrões

### Cores Finais
- Background principal: `#212024`
- Background sidebar/card elevated: `#2C2D30`
- Background card lista: `rgba(199, 207, 214, 0.08)`
- Verde primário: `#82D930` (dashboard) / `#32E6B7` (ações)
- Vermelho status: `#D9506B`
- Texto: branco / `#C7CFD6`

### Tipografia
- Fonte: Ubuntu
- Tamanhos: 12px, 13px, 15px, 16px, 32px
- Transformações: uppercase, capitalize conforme contexto

### Componentes Identificados
1. **ListCard**: Card horizontal com status bar, ícone, info e ação
2. **StatusBar**: Barra vertical colorida (7px width)
3. **ActionButton**: Botão com variantes Connect/Request
4. **SearchBar**: Input com background semi-transparente
5. **Checkbox**: Checkbox customizado com label

## Imagem 3: Página de Detalhes do Dispositivo

### Layout Geral
- **Estrutura**: Sidebar esquerda (80px) + área principal com múltiplas seções
- **Sidebar**: 80px de largura, background #2C2D30
- **Área Principal**: Seções organizadas verticalmente

### Header
- **Título**: "Artificial intelligence for robots" - 32px, Ubuntu, font-weight 400, cor branca
- **Card de Identificação do Dispositivo**: 
  - Mesma estrutura do ListCard (82px altura)
  - Botões: "Connected" (outline verde #32E6B7) e "Disconnect" (fundo vermelho #D9506B)
  - Status bar verde à esquerda

### Device Details Section
- **Título**: "Device Details" - 12px, Ubuntu, cor #C7CFD6
- **Grid de Informações**: 2 linhas x 3 colunas
- **Estrutura de cada item**:
  - Valor: 20px, Ubuntu, font-weight 400, cor branca
  - Label: 12px, Ubuntu, font-weight 400, uppercase, cor #C7CFD6
  - Gap entre valor e label: 8px
- **Items**: Map Localization, Department, Floor, Firmware, Wade No., Battery
- **Gap entre colunas**: 160px
- **Padding**: 7px (left/right), 20px (top/bottom)

### Activity In The Brain Section
- **Título**: "Activity In The Brain" - 12px, Ubuntu, cor #C7CFD6
- **Grid**: 2 linhas x 3 colunas de cards
- **Card Structure** (196x181px):
  - Background: `rgba(199, 207, 214, 0.18)`
  - Border radius: 15px
  - Padding: 19px (left/top)
- **Conteúdo do Card**:
  - Título: 20px, Ubuntu, font-weight 400, capitalize, cor branca
  - Percentagem: 12px, Ubuntu, font-weight 400, uppercase, cor #C7CFD6
  - Gap entre título e percentagem: 10px
- **Ícone Colorido** (45x45px):
  - Posição: left: 19px, top: 120px
  - Background: cor específica por função
  - Border radius: 15px
  - Cores observadas:
    - Executive Function: `#D98425` (laranja)
    - Association Function: `#D9CF25` (amarelo)
    - Motor Function: `#3BACD9` (azul)
    - Speech: `#CA50D9` (roxo)
    - Vision: `#82D930` (verde)
    - Other: `#9379FF` (roxo claro)
- **Barra de Progresso Vertical**:
  - Largura: 7px
  - Altura total: 121px (container) + altura variável (preenchimento)
  - Background container: `rgba(199, 207, 214, 0.08)`
  - Background preenchimento: mesma cor do ícone
  - Border radius: 15px
  - Posição: right (left: 169.51px)
  - Gap entre container e preenchimento: 5px
- **Gap entre cards**: 23px

### Robo Spec Section
- **Título**: "Robo Spec" - 12px, Ubuntu, cor #C7CFD6
- **Lista de Componentes**: Items verticais com gap de 25px
- **Item Structure** (337x45px):
  - Ícone (45x45px):
    - Background: `rgba(199, 207, 214, 0.08)`
    - Border radius: 15px
    - Ícone interno: 25x25px, outline branco
  - Informações (left: 60px):
    - Nome: 14px, Ubuntu, font-weight 500, cor branca
    - Tipo: 12px, Ubuntu, font-weight 400, uppercase, cor #C7CFD6
    - Gap: 8px
  - Quantidade (left: 285px):
    - Texto: 14px, Ubuntu, font-weight 500, cor branca, text-align right
    - Exemplo: "2 pcs.", "1 pcs."

### Botões de Conexão
- **Connected**:
  - Background: transparente
  - Outline: `2px #32E6B7 solid`, offset -2px
  - Texto: `#32E6B7`, 13px, Ubuntu, font-weight 500, capitalize
  - Padding: 24px (left/right), 10px (top/bottom)
- **Disconnect**:
  - Background: `#D9506B`
  - Texto: branco, 13px, Ubuntu, font-weight 500, capitalize
  - Padding: 24px (left/right), 10px (top/bottom)

### Cores de Activity Cards
- Executive Function: `#D98425` (laranja)
- Association Function: `#D9CF25` (amarelo)
- Motor Function: `#3BACD9` (azul)
- Speech: `#CA50D9` (roxo)
- Vision: `#82D930` (verde)
- Other: `#9379FF` (roxo claro)

## Consolidação Final de Padrões

### Componentes Identificados
1. **ListCard**: Card horizontal com status bar, ícone, info e ação ✅
2. **ActionButton**: Botão com variantes Connect/Request ✅
3. **ActivityCard**: Card com percentagem, ícone colorido e barra de progresso vertical
4. **DetailGrid**: Grid de informações chave-valor (2x3)
5. **SpecList**: Lista de especificações com ícones, tipos e quantidades
6. **ConnectedButton**: Botão "Connected" com outline verde
7. **DisconnectButton**: Botão "Disconnect" com fundo vermelho

### Padrões de Layout
- **Seções**: Título (12px, #C7CFD6) + conteúdo abaixo
- **Grids**: Gap de 23px (Activity) ou 160px (Details)
- **Cards**: Background semi-transparente, border radius 15px
- **Barras de Progresso**: Verticais, 7px de largura, altura variável

## Imagem 4: Dashboard Complexo (Vision & Brain Activity)

### Layout Geral
- **Estrutura**: Sidebar esquerda (80px) + área principal esquerda (728px) + painel direito (632px, background #2C2D30)
- **Sidebar**: 80px, background #2C2D30, ícones verticais com estados ativos/inativos
- **Painel Direito**: Background #2C2D30, padding 26px (left), 36px (top)

### Cortical Activity Grid
- **Título**: "Cortical Activity" - 12px, Ubuntu, cor #C7CFD6
- **Grid Structure**:
  - Quadrados: 48x48px
  - Background: #212024 (padrão), rgba(255,255,255,0.10), white, rgba(255,255,255,0.50)
  - Border radius: 15px
  - Outline: 11px #2C2D30 solid, offset -5.50px
  - Gap entre quadrados: implícito (background #2C2D30 entre eles)
- **Estados dos Quadrados**:
  - Inativo: background #212024
  - Semi-ativo: rgba(255,255,255,0.10)
  - Ativo: white
  - Muito ativo: rgba(255,255,255,0.50)
- **Seleção**: Quadrado destacado com outline verde (#82D930) de 11px

### Selected HyperColumn Section
- **Título**: "Selected HyperColumn" - 12px, Ubuntu, cor #C7CFD6
- **Grid de Informações**: Similar ao DetailGrid, mas com 2 colunas principais e 4 colunas secundárias
- **Estrutura**:
  - Primeira linha: 2 colunas (gap 228px)
  - Segunda linha: 2 colunas (gap 228px)
  - Terceira linha: 4 colunas (gap 64px)
- **Valores**: 20px, Ubuntu, font-weight 400, cor branca
- **Labels**: 12px, Ubuntu, uppercase, cor #C7CFD6

### Layers Section
- **Título**: "Layers" - 12px, Ubuntu, cor #C7CFD6
- **Lista Vertical**: Items com gap de 15px
- **Item Structure** (305x65px):
  - Background: `rgba(199, 207, 214, 0.08)`
  - Border radius: 15px
  - Ícone: 45x45px, background rgba(199, 207, 214, 0.08), border radius 15px
  - Informações: left: 67px
    - Nome: 14px, Ubuntu, font-weight 500, cor branca
    - Tipo: 12px, Ubuntu, uppercase, cor #C7CFD6
    - Gap: 5px

### Casual Model Section
- **Título**: "Casual Model" - 12px, Ubuntu, cor #C7CFD6
- **Grid de Formas 3D**: 3 linhas x 4 colunas
- **Item Structure** (65x65px):
  - Background: `rgba(199, 207, 214, 0.08)`
  - Border radius: 15px
  - Imagem interna: tamanhos variáveis (49x49, 52x48, etc.)
  - Gap: 15px

### Categories Section (Painel Direito)
- **Título**: "Categories" - 12px, Ubuntu, cor #C7CFD6
- **Grid**: 2 linhas x 5 colunas (147x124px cada card)
- **Card Structure**:
  - Background: `rgba(199, 207, 214, 0.18)` (ativo) ou `#212024` (inativo)
  - Border radius: 15px
  - Padding: 19px (left), 18px (top)
- **Conteúdo**:
  - Título: 12px, Ubuntu, font-weight 500, uppercase, cor branca
  - Percentagem: 12px, Ubuntu, font-weight 400, uppercase, cor #C7CFD6
  - Gap: 11px
- **Barra de Progresso Horizontal** (rotacionada 90deg):
  - Largura total: 101px (container + preenchimento)
  - Altura: 7px
  - Container: rgba(199, 207, 214, 0.08) ou rgba(199, 207, 214, 0.18)
  - Preenchimento: #82D930
  - Border radius: 15px
  - Posição: left: 126.50px, top: 99px
  - Gap: 5px
- **Gap entre cards**: 18px

### Cortical Activity Map (Painel Direito)
- **Título**: "Cortical Activity Map" - 12px, Ubuntu, cor #C7CFD6
- **Container**: Card com padding 20px, background #212024, border radius 15px
- **Grid de Pontos**:
  - Tamanho: 12x12px
  - Border radius: 10px
  - Background: #2C2D30 (padrão), white (ativo), rgba(255,255,255,0.10) (semi-ativo)
  - Outline: 6px #212024 solid, offset -3px
  - Gap: implícito (grid)
- **Seleção**: Retângulo branco (84x60px) com border radius 5px, border 2px white solid

### Neuromodulators Activity (Painel Direito)
- **Título**: "Neuromodulatorors Activity" - 12px, Ubuntu, cor #C7CFD6
- **Container**: Background rgba(199, 207, 214, 0.08), border radius 15px, padding 20px
- **Categorias (Botões)**:
  - Background: transparente (inativo) ou gradient (ativo)
  - Outline: 1px #C7CFD6 solid (inativo)
  - Border radius: 20px
  - Padding: 20px (left/right), 5px (top/bottom)
  - Texto: 12px, Ubuntu, uppercase
  - Gap: 15px
  - Cores ativas:
    - SER: gradient linear(225deg, #9379FF 0%, #5EC9FF 100%), texto #2C2D30
    - DOP: gradient linear(180deg, #32E6B7 0%, #82D930 100%), texto #2C2D30
- **Gráfico de Linhas**:
  - Eixo Y: 0-100 (incrementos de 25), 12px, Ubuntu, cor #C7CFD6
  - Eixo X: Tempo (12:00 a 13:10, incrementos de 5min), 12px, Ubuntu, cor #C7CFD6
  - Linhas: Cores variadas (azul #32E6B7, verde, roxo #9379FF)
  - Grid lines: rgba(199, 207, 214, 0.50)
  - Altura: 158px

### Active Interference (Flowchart)
- **Título**: "Active Interference" - 12px, Ubuntu, cor #C7CFD6
- **Container**: Background rgba(199, 207, 214, 0.08), border radius 15px
- **Nós**:
  - Background: transparente
  - Outline: 1px [cor] solid
  - Border radius: 15px
  - Padding: 10px
  - Texto: 12px, Ubuntu, capitalize, cor #C7CFD6
  - Cores de outline:
    - Perceptual/Casual: #3255E6 (azul)
    - Obstacle Avoidance/Path Update: #9379FF (roxo)
    - Predictive: #32E6B7 (verde)
    - Notification/Release Package: #32E6B7 (verde)
- **Conexões**:
  - Linhas: 1px white solid
  - Border radius: 20px
  - Pontos de conexão: 6x6px, background white, border radius 9999

### Sidebar Navigation
- **Ícones**: 50x50px
- **Estados**:
  - Ativo: background rgba(199, 207, 214, 0.08), border radius 15px
  - Inativo: transparente
  - Destaque: border 1px [cor] solid (ex: #D98425, #D9CF25, #3BACD9, #CA50D9, #82D930, #9379FF)
- **Mini Activity Cards**: Alguns ícones têm mini cards de atividade dentro

## Consolidação Final de Padrões

### Componentes Identificados
1. **ListCard**: Card horizontal com status bar, ícone, info e ação ✅
2. **ActionButton**: Botão com variantes Connect/Request ✅
3. **ActivityCard**: Card com percentagem, ícone colorido e barra de progresso vertical ✅
4. **DetailGrid**: Grid de informações chave-valor ✅
5. **SpecList**: Lista de especificações com ícones, tipos e quantidades ✅
6. **CategoryCard**: Card pequeno com percentagem e barra de progresso horizontal (147x124px)
7. **CorticalActivityGrid**: Grid de quadrados com estados (48x48px)
8. **CategoryButton**: Botão de categoria com estados ativo/inativo
9. **LineChart**: Gráfico de linhas com eixos (já existe, pode precisar ajustes)
10. **Flowchart**: Diagrama de fluxo com nós e conexões

### Padrões de Visualização
- **Grids de Atividade**: Quadrados/círculos com múltiplos estados de intensidade
- **Barras de Progresso**: Horizontais (rotacionadas) e verticais
- **Gráficos**: Linhas com múltiplas séries coloridas
- **Flowcharts**: Nós com outlines coloridos e conexões brancas
- **Seleção Visual**: Outlines coloridos ou retângulos brancos

## Próximos Passos
- Criar componentes CategoryCard, CorticalActivityGrid, CategoryButton, Flowchart
- Verificar e ajustar LineChart se necessário
- Consolidar todos os padrões em componentes reutilizáveis

