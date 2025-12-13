# ProdPlan 4.0 OS - Frontend

Frontend React + TypeScript para o sistema ProdPlan 4.0 OS.

## Estrutura

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # AppLayout, Sidebar
│   │   ├── workcenter/      # WorkCenterCard, BrainFunctionCard
│   │   ├── overview/        # OperationCategoryCard, FactoryIndicatorsChart, etc.
│   │   └── equipment/       # EquipmentSpecRow
│   ├── pages/
│   │   ├── WorkCentersListPage.tsx
│   │   ├── FactoryOverviewPage.tsx
│   │   └── WorkCenterDetailsPage.tsx
│   └── types/
│       └── prodplan.ts      # Type definitions
├── package.json
└── tsconfig.json
```

## Design System

- **Cores principais**: #9379FF, #5EC9FF, #32E6B7, #82D930
- **Background**: #212024 (dark sci-fi)
- **Bordas**: 15px radius
- **Estilo**: Gradientes, sombras, visual denso

## Componentes Principais

### Páginas
- `WorkCentersListPage` - Lista de centros de trabalho
- `FactoryOverviewPage` - Overview da fábrica (dashboard)
- `WorkCenterDetailsPage` - Detalhe de uma máquina

### Componentes Reutilizáveis
- `WorkCenterCard` - Card de centro de trabalho
- `BrainFunctionCard` - Card de distribuição de tempo
- `OperationCategoryCard` - Card de categoria de operação
- `FactoryIndicatorsChart` - Gráfico de indicadores globais
- `EventsPanel` - Painel de eventos ativos
- `SelectedWorkCenterPanel` - Painel de centro selecionado
- `EquipmentSpecRow` - Linha de especificação de equipamento

## Instalação

```bash
cd frontend
npm install
npm run dev
```

## Configuração

### Variáveis de Ambiente

A API está configurada para usar `http://localhost:8000/api` por padrão.

Para alterar, criar ficheiro `.env` na pasta `frontend`:
```
VITE_API_URL=http://localhost:8000/api
```

**Nota:** No Vite, as variáveis de ambiente devem começar com `VITE_` para serem expostas ao código do cliente.

## Notas

- Todos os componentes usam TypeScript com props tipadas
- Design mantém identidade visual sci-fi original
- Semântica adaptada para domínio industrial (ProdPlan 4.0 OS)
- Componentes prontos para integração com backend/API
- Navegação com React Router implementada
- API service layer com hooks customizados
- Gráficos funcionais integrados
- Responsividade básica implementada

## Status

Ver `IMPLEMENTATION_STATUS.md` para detalhes completos da implementação.

