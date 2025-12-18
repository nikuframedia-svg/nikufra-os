# UI CONTRACTS - PRODPLAN 4.0 OS

**Data**: 2025-12-17  
**Versão**: 1.0  
**Status**: Contrato rigoroso página → endpoints → componentes

## REGRA FUNDAMENTAL
**Zero mock. Zero gráficos fake. UI só mostra funcionalidades que o backend suporta.**

---

## MÓDULO 1: PRODPLAN

### 1.1 `/prodplan/overview`
**Endpoints**:
- `GET /api/kpis/overview?from=&to=` → KPIs principais
- `GET /api/prodplan/bottlenecks?top_n=5` → Top bottlenecks
- `GET /api/prodplan/risk_queue?top_n=10` → Risk queue
- `GET /api/prodplan/schedule/current` → WIP atual

**UI Components**:
- KPI Cards (4): OTD%, Lead Time (p50/p90), Throughput, WIP Total
- Bottleneck List (top 5 fases)
- Risk Queue List (top 10 OFs)
- DotGridMap "Mapa de Atividade" (WIP por fase → densidade)

**States**:
- `loading`: Skeleton para cada seção
- `empty`: "Sem dados no intervalo selecionado"
- `error`: Error component
- `not_supported_by_data`: NotSupportedState com reason + suggestion

**Contrato de Dados**:
```typescript
// KPIs Overview (pode retornar message se não implementado)
KPIsOverviewResponse = {
  kpis?: {
    otd_pct: number;
    lead_time_h: number;
    gargalo_ativo: string | null;
    horas_setup_semana?: number;
  };
  message?: string; // Se endpoint não implementado
  from_date?: string;
  to_date?: string;
}

// Bottlenecks
BottlenecksResponse = {
  bottlenecks: Array<{
    fase_id?: number;
    fase_nome?: string | null;
    wip_count: number;
    p90_age_hours: number;
    bottleneck_score?: number;
    utilizacao_pct?: number;
    fila_horas?: number;
  }>;
  generated_at?: string;
}

// Risk Queue
RiskQueueResponse = {
  at_risk_orders?: Array<{
    of_id: string;
    produto_id: number | null;
    due_date: string | null;
    eta: string | null;
    risk_score: number;
    days_behind: number | null;
  }>;
  risk_queue?: Array<...>; // Alias
  generated_at?: string;
}

// Schedule Current
ScheduleCurrentResponse = {
  schedule: Array<{
    fase_id: number;
    fase_nome: string | null;
    wip_count: number;
    p50_age_hours: number | null;
    p90_age_hours: number | null;
    oldest_event_time: string | null;
  }>;
  generated_at?: string;
}
```

---

### 1.2 `/prodplan/orders`
**Endpoints**:
- `GET /api/prodplan/orders?limit=100&cursor=...&of_id=&produto_id=&fase_id=&data_criacao_from=&data_criacao_to=` → Lista de ordens (keyset pagination)

**UI Components**:
- Table com colunas: `of_id`, `produto_id` (e nome se existir), `fase_id` (e nome), `status`, `created_at`, `due_date`, `eta`
- Filtros: date range, status, produto_id, fase_id, search of_id
- Paginação keyset (cursor-based)

**States**:
- `loading`: Table skeleton
- `empty`: "Nenhuma ordem encontrada"
- `error`: Error component
- `not_supported_by_data`: NotSupportedState

**Regras**:
- Proibir offset pagination (só keyset)
- Mostrar "data contract warnings" se orphans produto existirem (badge)

**Contrato de Dados**:
```typescript
OrdersResponse = {
  orders: Array<{
    of_id: string;
    of_data_criacao: string | null;
    of_data_acabamento: string | null;
    of_data_transporte: string | null;
    of_produto_id: number | null;
    of_fase_id: number | null;
    status?: 'CREATED' | 'IN_PROGRESS' | 'DONE' | 'LATE' | 'AT_RISK';
    eta?: string | null;
    due_date?: string | null;
  }>;
  total?: number;
  next_cursor?: string | null;
}
```

---

### 1.3 `/prodplan/orders/:ofId`
**Endpoints**:
- `GET /api/prodplan/orders/{ofId}` → Detalhe da ordem
- `GET /api/prodplan/orders/{ofId}/phases` → Timeline de fases

**UI Components**:
- Header: estado, datas, produto, due_date
- KPI Strip: lead time real, atraso em horas/dias, nº fases concluídas vs total
- Timeline vertical (phases) + tabela

**States**:
- `loading`: Skeleton
- `empty`: "Ordem não encontrada" (404)
- `error`: Error component
- `not_supported_by_data`: NotSupportedState

**Regras**:
- Se phases vazias: EmptyState "Sem fases associadas"
- Se produto orphan: mostrar "Produto não encontrado no catálogo" (warning badge)

**Contrato de Dados**:
```typescript
Order = {
  of_id: string;
  of_data_criacao: string | null;
  of_data_acabamento: string | null;
  of_data_transporte: string | null;
  of_produto_id: number | null;
  of_fase_id: number | null;
  status?: 'CREATED' | 'IN_PROGRESS' | 'DONE' | 'LATE' | 'AT_RISK';
  eta?: string | null;
  due_date?: string | null;
}

OrderPhasesResponse = {
  phases: Array<{
    faseof_id: string;
    faseof_of_id: string;
    faseof_fase_id: number | null;
    faseof_inicio: string | null;
    faseof_fim: string | null;
    faseof_data_prevista: string | null;
    faseof_sequencia: number | null;
    faseof_peso: number | null;
    faseof_coeficiente: number | null;
    faseof_coeficiente_x: number | null;
  }>;
}
```

---

### 1.4 `/prodplan/schedule`
**Endpoints**:
- `GET /api/prodplan/schedule/current?fase_id=` → WIP por fase

**UI Components**:
- Tabela por fase: wip_count, avg_age, p90_age, oldest
- DotGridMap "fila" por fase
- Drill-down: clique numa fase → lista de OFs (se endpoint existir; caso não, não inventar)

**States**:
- `loading`: Skeleton minimalista
- `empty`: "Sem WIP no momento"
- `error`: Error component
- `not_supported_by_data`: NotSupportedState

**Performance**:
- Cache 20-30s
- Skeleton minimalista

**Contrato de Dados**: Ver `ScheduleCurrentResponse` acima.

---

### 1.5 `/prodplan/bottlenecks`
**Endpoints**:
- `GET /api/prodplan/bottlenecks?top_n=10` → Top bottlenecks

**UI Components**:
- Ranking de fases por risco (p90 age + queue size)
- Explicação: "porque esta fase é gargalo" (vindo do backend)

**States**: Padrão (loading, empty, error, not_supported)

**Contrato de Dados**: Ver `BottlenecksResponse` acima.

---

### 1.6 `/prodplan/risk-queue`
**Endpoints**:
- `GET /api/prodplan/risk_queue?top_n=20` → Risk queue

**UI Components**:
- Lista de OFs com risco (late / at_risk)
- Colunas: of_id, produto, due_date, ETA, delta (ETA - due_date), fase atual

**States**: Padrão

**Contrato de Dados**: Ver `RiskQueueResponse` acima.

---

### 1.7 `/prodplan/routes/:produtoId`
**Endpoints**:
- `GET /api/prodplan/routes/{produtoId}` → Roteiro padrão (se existir)

**UI Components**:
- "Roteiro padrão": fases_standard_modelos ordenadas por sequencia
- Mostrar coeficiente e coeficiente_x por fase (sem inventar unidade)

**States**: Padrão

**Contrato de Dados**:
```typescript
// A definir quando endpoint existir
RoutesResponse = {
  routes: Array<{
    fase_id: number;
    fase_nome: string | null;
    sequencia: number;
    coeficiente: number | null;
    coeficiente_x: number | null;
  }>;
}
```

**Nota**: Se endpoint não existir, página não deve ser criada.

---

## MÓDULO 2: SMARTINVENTORY

### 2.1 `/smartinventory/overview`
**Endpoints**:
- `GET /api/smartinventory/wip` → WIP counts
- `GET /api/smartinventory/wip_mass` → WIP mass

**UI Components**:
- Cards resumo: WIP total, massa total
- Links para páginas detalhadas

**States**: Padrão

---

### 2.2 `/smartinventory/wip`
**Endpoints**:
- `GET /api/smartinventory/wip?fase_id=&produto_id=` → WIP counts

**UI Components**:
- WIP por fase e por produto (tabs)
- Dot-grid como visão "densidade WIP"

**States**: Padrão + `low_confidence` se interpolado

**Regra**: Se backend devolver NOT_SUPPORTED_BY_DATA, UI mostra NotSupportedState e não tenta adivinhar.

**Contrato de Dados**:
```typescript
WIPResponse = {
  wip: Array<{
    fase_id: number;
    produto_id: number | null;
    wip_count: number;
    p50_age_hours: number | null;
    p90_age_hours: number | null;
  }>;
  generated_at?: string;
}
```

---

### 2.3 `/smartinventory/wip-mass`
**Endpoints**:
- `GET /api/smartinventory/wip_mass?fase_id=&produto_id=` → WIP mass

**UI Components**:
- Cards: massa total em processo, top produtos por massa
- `low_confidence` badges quando interpolado

**States**: Padrão + `low_confidence`

**Contrato de Dados**:
```typescript
WIPMassResponse = {
  wip_mass: Array<{
    fase_id: number;
    produto_id: number | null;
    wip_mass_kg: number;
    low_confidence?: boolean;
  }>;
  generated_at?: string;
}
```

---

### 2.4 `/smartinventory/gelcoat`
**Endpoints**:
- `GET /api/smartinventory/gelcoat_theoretical_usage?produto_id=&from_date=&to_date=` → Gelcoat teórico

**UI Components**:
- Sempre mostrar disclaimer fixo: "consumo teórico, não consumo real"
- Tabela por produto: deck, casco, total teórico

**States**: Padrão

**Contrato de Dados**:
```typescript
GelcoatTheoreticalUsageResponse = {
  gelcoat_usage: Array<{
    produto_id: number;
    produto_nome: string | null;
    qtd_gel_deck: number | null;
    qtd_gel_casco: number | null;
    ofs_in_progress: number;
    theoretical_usage_deck: number;
    theoretical_usage_casco: number;
    disclaimer: string;
  }>;
  generated_at?: string;
}
```

---

## MÓDULO 3: WHAT-IF

### 3.1 `/whatif/simulate`
**Endpoints**:
- `POST /api/whatif/simulate` → Simular cenário (requer API key se configurado)

**Inputs**:
- `capacity_overrides`: `Record<string, Record<string, number>>` (opcional)
- `coeficiente_overrides`: `Record<string, Record<string, number>>` (opcional)
- `priority_rule`: `'FIFO' | 'EDD' | 'SPT'` (opcional, default: 'FIFO')
- `order_filter`: `Record<string, any>` (opcional)

**UI Components**:
- Form rigoroso com validação Zod
- Resultado: baseline_kpis, simulated_kpis, delta_kpis, top_affected_orders
- Mostrar "hash do cenário" e "engine_version" se existir

**States**: Padrão

**Contrato de Dados**:
```typescript
WhatIfRequest = {
  capacity_overrides?: Record<string, Record<string, number>>;
  coeficiente_overrides?: Record<string, Record<string, number>>;
  priority_rule?: 'FIFO' | 'EDD' | 'SPT';
  order_filter?: Record<string, any>;
}

WhatIfResponse = {
  baseline_kpis: {
    otd_pct: number;
    lead_time_h: number;
    makespan_h?: number;
  };
  simulated_kpis: {
    otd_pct: number;
    lead_time_h: number;
    makespan_h?: number;
  };
  delta_kpis: {
    otd_pct: number;
    lead_time_h: number;
    makespan_h?: number;
  };
  top_affected_orders: Array<{
    of_id: string;
    delta_lead_time_h: number;
    new_status?: string;
  }>;
  scenario_hash?: string;
  engine_version?: string;
}
```

---

### 3.2 `/whatif/runs`
**Endpoints**:
- `GET /api/whatif/runs` → Lista de runs (se existir)

**UI Components**:
- Lista de runs com hash, timestamp, engine_version

**States**: Padrão

**Nota**: Se endpoint não existir, página não deve ser criada.

---

### 3.3 `/whatif/runs/:whatifId`
**Endpoints**:
- `GET /api/whatif/result/{id}` → Detalhe de run (se existir)

**UI Components**:
- Detalhe completo do resultado

**States**: Padrão

**Nota**: Se endpoint não existir, página não deve ser criada.

---

## MÓDULO 4: QUALITY/ZDM

### 4.1 `/quality/overview`
**Endpoints**:
- `GET /api/quality/overview?fase_avaliacao_id=&fase_culpada_id=` → Overview

**UI Components**:
- Total erros, distribuição por gravidade, trending (se suportado)
- Cards + bar chart

**States**: Padrão

**Contrato de Dados**:
```typescript
QualityOverviewResponse = {
  heatmap: Array<{
    fase_avaliacao: string | null;
    fase_culpada: string | null;
    count: number;
    gravidade_avg: number | null;
  }>;
  generated_at?: string;
}
```

---

### 4.2 `/quality/by-phase`
**Endpoints**:
- `GET /api/quality/overview?fase_avaliacao_id=&fase_culpada_id=` → Heatmap por fase

**UI Components**:
- Heatmap avaliação vs culpada (se backend fornecer matriz; caso não, tabela pivot)
- Top fases culpadas por gravidade

**States**: Padrão

**Contrato de Dados**: Ver `QualityOverviewResponse` acima.

---

### 4.3 `/quality/by-product`
**Endpoints**:
- `GET /api/quality/by-product?from=&to=` → Por produto (se existir)

**UI Components**:
- Ranking de produtos com maior erro_rate
- Tabela com count, rate, avg gravidade

**States**: Padrão

**Nota**: Se endpoint não existir, página não deve ser criada.

---

### 4.4 `/quality/risk`
**Endpoints**:
- `GET /api/quality/risk?modelo_id=&fase_culpada_id=` → Baseline risk

**UI Components**:
- "Risco baseline" por produto/fase
- Se ML existir, mostrar "baseline vs ML" (dois cards, sem inventar)

**States**: Padrão

**Contrato de Dados**:
```typescript
QualityRiskResponse = {
  risks: Array<{
    produto_id: number;
    fase_id: number;
    risk_score: number;
    historical_rate: number | null;
  }>;
  generated_at?: string;
}
```

---

## MÓDULO 5: ML/R&D

### 5.1 `/ml/models`
**Endpoints**:
- `GET /api/ml/models` → Registry (se existir)

**UI Components**:
- Registry: versões, métricas, dataset_cutoff, created_at, status

**States**: Padrão

**Nota**: Se endpoint não existir, página não deve ser criada.

---

### 5.2 `/ml/predict/leadtime`
**Endpoints**:
- `GET /api/ml/predict/leadtime?modelo_id=` → Previsão

**UI Components**:
- Input: modelo_id (obrigatório)
- Output: predicted_leadtime_hours + confidence + fallback_used

**States**: Padrão

**Contrato de Dados**:
```typescript
MLPredictResponse = {
  predicted_leadtime_hours: number;
  confidence_interval?: [number, number];
  baseline_leadtime_hours?: number;
  model_version?: string;
}
```

---

### 5.3 `/ml/explain/leadtime`
**Endpoints**:
- `GET /api/ml/explain/leadtime?modelo_id=` → Explicação

**UI Components**:
- Top features (nome, valor, contribuição)
- Proibir "texto genérico"

**States**: Padrão

**Contrato de Dados**:
```typescript
MLExplainResponse = {
  features: Array<{
    name: string;
    importance: number;
    value?: number;
  }>;
  model_version?: string;
}
```

---

### 5.4 `/ml/predict/risk`
**Endpoints**:
- `POST /api/ml/predict/risk` → Previsão de risco (se existir)

**UI Components**:
- Probabilidade + limiares + top drivers

**States**: Padrão

**Nota**: Se endpoint não existir, página não deve ser criada.

---

### 5.5 `/ml/explain/risk`
**Endpoints**:
- `GET /api/ml/explain/risk?of_id=` → Explicação de risco (se existir)

**UI Components**:
- Top drivers

**States**: Padrão

**Nota**: Se endpoint não existir, página não deve ser criada.

---

### 5.6 `/ml/train`
**Endpoints**:
- `POST /api/ml/train/leadtime` → Treinar modelo leadtime (protegido)
- `POST /api/ml/train/risk` → Treinar modelo risk (protegido)

**UI Components**:
- Gated por API key
- Mostrar logs do job se backend expuser; se não, mostrar apenas status

**States**: Padrão

---

## MÓDULO 6: OPS

### 6.1 `/ops/ingestion`
**Endpoints**:
- `POST /api/ingestion/run` → Executar ingestão (protegido)
- `GET /api/ingestion/status/{run_id}` → Status do run

**UI Components**:
- Botão "Run ingestion"
- Progresso por fases: extract/load/merge
- Report: counts por sheet, rejects, orphans

**States**: Padrão

**Contrato de Dados**:
```typescript
IngestionRunResponse = {
  status: string;
  run_id: number;
  total_processed: number;
  total_rejected: number;
  validation: Record<string, any>;
}

IngestionStatusResponse = {
  run_id: number;
  status: string;
  total_sheets: number;
  processed_rows: number;
  rejected_rows: number;
  started_at: string | null;
  completed_at: string | null;
}
```

---

### 6.2 `/ops/data-contract`
**Fontes**:
- `docs/DATA_DICTIONARY.md` (gerado)
- `docs/PROFILE_REPORT.json` (gerado)
- `docs/RELATIONSHIPS_REPORT.json` (gerado)
- Endpoint de report se existir

**UI Components**:
- Tabela "match rates"
- Tabela "orphan counts"
- Link para docs locais

**States**: Padrão

---

### 6.3 `/ops/feature-gates`
**Fonte**:
- `FEATURE_GATES.json` (gerado) + endpoint se existir

**UI Components**:
- Lista de features ON/OFF com razão

**States**: Padrão

---

### 6.4 `/ops/performance`
**Fonte**:
- `docs/perf/SLO_RESULTS.json` (gerado) + endpoints se existirem

**UI Components**:
- SLO scoreboard e links para EXPLAIN docs

**States**: Padrão

---

### 6.5 `/ops/health`
**Endpoints**:
- `GET /api/health` → Health check (se existir)
- `GET /metrics` → Métricas (link)

**UI Components**:
- Status DB/Redis + uptime

**States**: Padrão

**Nota**: Se endpoint não existir, página não deve ser criada.

---

## FEATURE GATES OBRIGATÓRIOS

### Gates Mínimos
- `kpis.by_employee`: OFF quando match_rate < 0.90
- `inventory.real_stock`: OFF sempre (sem dados)
- `machines.*`: OFF sempre (sem dados)
- `ml.risk`: ON apenas se `/api/ml/models` indicar modelo ativo
- `ml.explain`: ON apenas se endpoint responder

### Comportamento UI
- **OFF**: Esconder item de menu OU mostrar "bloqueado" com reason
- **ON**: Mostrar página normalmente

---

## ESTADOS UNIVERSAIS

Todos os ecrãs devem implementar:
1. `loading`: Skeleton ou spinner
2. `empty`: EmptyState com mensagem contextual
3. `error`: ErrorState com mensagem e retry
4. `not_supported_by_data`: NotSupportedState com reason + suggestion
5. `low_confidence`: Badge de warning quando há interpolação/estimativas fracas

---

## VALIDAÇÃO ZOD

Para cada endpoint:
1. Schema Zod em `src/api/schemas.ts`
2. Hook em `src/api/hooks.ts`
3. Adapter por módulo: `src/app/modules/<mod>/adapters/*`
4. Se schema falhar: render ErrorState com endpoint + request_id + "schema mismatch"

---

## CRITÉRIOS DE ACEITAÇÃO

### A) Navegação e Módulos
- ✅ Sidebar tem exatamente 6 módulos com rotas acima
- ✅ Cada página aparece no módulo correto
- ❌ Fail se houver mistura

### B) Dados Reais
- ✅ Qualquer chart tem query real (hook)
- ❌ Proibido arrays hardcoded em runtime

### C) Feature Gating
- ✅ by_employee: se gate OFF, UI nunca tenta chamar endpoint
- ✅ NOT_SUPPORTED_BY_DATA: UI mostra reason + suggestion

### D) Consistência Visual
- ✅ Cards, spacing, pills, sidebar e charts obedecem ao ui-kit
- ❌ Fail se existirem inline styles fora do ui-kit

### E) Robustez
- ✅ Loading/empty/error/not_supported implementados em todas as páginas
- ✅ Paginação keyset nas listas

---

**Última atualização**: 2025-12-17

