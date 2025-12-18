/**
 * API Hooks - TanStack Query hooks por módulo
 * Cada hook retorna UIState consolidado
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, buildUIState } from '../client';
import { qualityApi } from '../../services/api-client';
// Re-export UIState for external consumers
export type { UIState } from '../client';

// ============================================
// TYPES
// ============================================

// PRODPLAN
export interface Order {
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

export interface OrderPhase {
  of_fase_id: number;
  fase_id: number;
  fase_nome: string;
  of_id: string;
  started_at: string | null;
  ended_at: string | null;
  duration_hours: number | null;
  desvio_hours: number | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
}

export interface ScheduleItem {
  fase_id: number;
  fase_nome: string | null;
  wip_count: number;
  p50_age_hours: number | null;
  p90_age_hours: number | null;
  oldest_event_time: string | null;
}

export interface Bottleneck {
  fase_id: number;
  fase_nome: string;
  wip_count: number;
  p90_age_hours: number;
  bottleneck_score: number;
  utilizacao_pct?: number;
}

export interface RiskQueueItem {
  of_id: string;
  produto_id: number | null;
  fase_atual: string | null;
  due_date: string | null;
  eta: string | null;
  delay_hours: number;
  risk_reason: string;
}

export interface KPIs {
  otd_pct: number;
  lead_time_h: number;
  gargalo_ativo: string | null;
  horas_setup_semana?: number;
  wip_total?: number;
  throughput_dia?: number;
}

// SMARTINVENTORY
export interface WIPItem {
  fase_id: number;
  fase_nome: string | null;
  wip_count: number;
  p50_age_hours?: number;
  p90_age_hours?: number;
}

export interface WIPMass {
  total_wip_mass_kg: number;
  by_phase?: Array<{ fase_id: number; fase_nome: string; mass_kg: number }>;
  confidence: 'high' | 'estimated' | 'low';
}

export interface GelcoatUsage {
  status: 'SUPPORTED' | 'NOT_SUPPORTED_BY_DATA';
  disclaimer?: string;
  total_theoretical_gel_deck?: number;
  total_theoretical_gel_casco?: number;
  by_product?: Array<{ produto_id: number; gel_deck: number; gel_casco: number }>;
  reason?: string;
}

// QUALITY
export interface QualityHeatmapItem {
  fase_avaliacao_id?: number;
  fase_avaliacao: string | null;
  fase_culpada_id?: number;
  fase_culpada: string | null;
  count: number;
  gravidade_avg: number | null;
}

export interface QualityRiskItem {
  modelo_id: number;
  modelo_nome?: string;
  fase_culpada_id?: number;
  fase_culpada?: string;
  error_count: number;
  gravidade_avg: number;
  risk_score: number;
}

// WHAT-IF
export interface WhatIfRequest {
  priority_rule?: 'FIFO' | 'EDD' | 'SPT';
  capacity_overrides?: Record<string, { throughput_multiplier?: number }>;
  coeficiente_overrides?: Record<string, { coef?: number }>;
}

export interface WhatIfResult {
  baseline_kpis: KPIs;
  simulated_kpis: KPIs;
  delta_kpis: Partial<KPIs>;
  top_affected_orders?: Array<{ of_id: string; delta_lead_time_h?: number; new_status?: string }>;
  scenario_hash?: string;
  engine_version?: string;
  generated_at?: string;
}

// ML
export interface MLModel {
  model_id: string;
  model_name: string;
  version: string;
  algorithm: string;
  metrics: Record<string, number>;
  is_active: boolean;
  created_at: string;
  data_cutoff?: string;
}

export interface PredictResult {
  predicted_leadtime_hours: number;
  baseline_leadtime_hours?: number;
  confidence_interval?: [number, number];
  model_version?: string;
  prediction_method?: string;
}

export interface ExplainResult {
  prediction: number;
  top_features: Array<{ name: string; value: number; contribution: number }>;
  explanation_method: string;
}

// OPS
export interface HealthStatus {
  status: string;
  services?: Record<string, { status: string; latency_ms?: number }>;
  uptime_hours?: number;
  version?: string;
  checked_at?: string;
}

export interface IngestionStatus {
  status: string;
  last_run?: string;
  last_success?: boolean;
  records_processed?: number;
  errors?: string[];
  next_scheduled?: string;
}

export interface FeatureGate {
  feature: string;
  enabled: boolean;
  reason?: string;
}

// ============================================
// PRODPLAN HOOKS
// ============================================

export function useProdplanOverview() {
  const kpis = useQuery({
    queryKey: ['kpis', 'overview'],
    queryFn: () => apiClient.get<{ kpis: KPIs }>('/kpis/overview'),
    staleTime: 30000,
  });

  const schedule = useQuery({
    queryKey: ['prodplan', 'schedule', 'current'],
    queryFn: () => apiClient.get<{ schedule: ScheduleItem[] }>('/prodplan/schedule/current'),
    staleTime: 20000,
  });

  const bottlenecks = useQuery({
    queryKey: ['prodplan', 'bottlenecks'],
    queryFn: () => apiClient.get<{ bottlenecks: Bottleneck[] }>('/prodplan/bottlenecks', { top_n: 10 }),
    staleTime: 30000,
  });

  const riskQueue = useQuery({
    queryKey: ['prodplan', 'risk_queue'],
    queryFn: () => apiClient.get<{ queue: RiskQueueItem[] }>('/prodplan/risk_queue', { limit: 20 }),
    staleTime: 30000,
  });

  return {
    kpis: buildUIState(kpis.data?.kpis, kpis.isLoading, kpis.error as Error | null),
    schedule: buildUIState(schedule.data?.schedule, schedule.isLoading, schedule.error as Error | null),
    bottlenecks: buildUIState(bottlenecks.data?.bottlenecks, bottlenecks.isLoading, bottlenecks.error as Error | null),
    riskQueue: buildUIState(riskQueue.data?.queue, riskQueue.isLoading, riskQueue.error as Error | null),
    isLoading: kpis.isLoading || schedule.isLoading,
  };
}

export function useOrders(params: {
  limit?: number;
  cursor?: string;
  of_id?: string;
  fase_id?: number;
  produto_id?: number;
  status?: string;
}) {
  const query = useQuery({
    queryKey: ['prodplan', 'orders', params],
    queryFn: () => apiClient.get<{ orders: Order[]; next_cursor?: string; total?: number }>(
      '/prodplan/orders',
      params
    ),
    staleTime: 15000,
  });

  return {
    ...buildUIState(query.data?.orders, query.isLoading, query.error as Error | null),
    nextCursor: query.data?.next_cursor,
    total: query.data?.total,
    refetch: query.refetch,
  };
}

export function useOrderDetails(ofId: string) {
  const order = useQuery({
    queryKey: ['prodplan', 'orders', ofId],
    queryFn: () => apiClient.get<Order>(`/prodplan/orders/${ofId}`),
    enabled: !!ofId,
    staleTime: 30000,
  });

  const phases = useQuery({
    queryKey: ['prodplan', 'orders', ofId, 'phases'],
    queryFn: () => apiClient.get<{ phases: OrderPhase[] }>(`/prodplan/orders/${ofId}/phases`),
    enabled: !!ofId,
    staleTime: 30000,
  });

  return {
    order: buildUIState(order.data, order.isLoading, order.error as Error | null),
    phases: buildUIState(phases.data?.phases, phases.isLoading, phases.error as Error | null),
  };
}

export function useScheduleCurrent(faseId?: number) {
  const query = useQuery({
    queryKey: ['prodplan', 'schedule', 'current', faseId],
    queryFn: () => apiClient.get<{ schedule: ScheduleItem[] }>(
      '/prodplan/schedule/current',
      faseId ? { fase_id: faseId } : undefined
    ),
    staleTime: 20000,
  });

  return buildUIState(query.data?.schedule, query.isLoading, query.error as Error | null);
}

export function useBottlenecks(topN: number = 10) {
  const query = useQuery({
    queryKey: ['prodplan', 'bottlenecks', topN],
    queryFn: () => apiClient.get<{ bottlenecks: Bottleneck[]; top_losses?: Bottleneck[] }>(
      '/prodplan/bottlenecks',
      { top_n: topN }
    ),
    staleTime: 30000,
  });

  return {
    ...buildUIState(query.data?.bottlenecks, query.isLoading, query.error as Error | null),
    topLosses: query.data?.top_losses,
  };
}

export function useRiskQueue(limit: number = 20) {
  const query = useQuery({
    queryKey: ['prodplan', 'risk_queue', limit],
    queryFn: () => apiClient.get<{ queue: RiskQueueItem[] }>('/prodplan/risk_queue', { limit }),
    staleTime: 30000,
  });

  return buildUIState(query.data?.queue, query.isLoading, query.error as Error | null);
}

// ============================================
// SMARTINVENTORY HOOKS
// ============================================

export function useSmartInventoryOverview() {
  const wip = useQuery({
    queryKey: ['smartinventory', 'wip'],
    queryFn: () => apiClient.get<{ wip: WIPItem[]; total_wip: number }>('/smartinventory/wip'),
    staleTime: 30000,
  });

  const wipMass = useQuery({
    queryKey: ['smartinventory', 'wip_mass'],
    queryFn: () => apiClient.get<WIPMass>('/smartinventory/wip_mass'),
    staleTime: 30000,
  });

  const gelcoat = useQuery({
    queryKey: ['smartinventory', 'gelcoat'],
    queryFn: () => apiClient.get<GelcoatUsage>('/smartinventory/gelcoat_theoretical_usage'),
    staleTime: 60000,
  });

  return {
    wip: buildUIState(wip.data?.wip, wip.isLoading, wip.error as Error | null),
    totalWip: wip.data?.total_wip ?? 0,
    wipMass: buildUIState(wipMass.data, wipMass.isLoading, wipMass.error as Error | null),
    gelcoat: buildUIState(gelcoat.data, gelcoat.isLoading, gelcoat.error as Error | null),
    isLoading: wip.isLoading,
  };
}

export function useWipExplorer(params: { fase_id?: number; produto_id?: number }) {
  const query = useQuery({
    queryKey: ['smartinventory', 'wip', params],
    queryFn: () => apiClient.get<{ wip: WIPItem[]; total_wip: number }>(
      '/smartinventory/wip',
      params
    ),
    staleTime: 20000,
  });

  return buildUIState(query.data?.wip, query.isLoading, query.error as Error | null);
}

// ============================================
// QUALITY HOOKS
// ============================================

export function useQualityOverview(faseAvaliacaoId?: number, faseCulpadaId?: number) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hooks/index.ts:361',message:'useQualityOverview hook called',data:{faseAvaliacaoId,faseCulpadaId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const query = useQuery({
    queryKey: ['quality', 'overview', faseAvaliacaoId, faseCulpadaId],
    queryFn: () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hooks/index.ts:365',message:'useQualityOverview queryFn executing',data:{faseAvaliacaoId,faseCulpadaId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return qualityApi.getOverview(faseAvaliacaoId, faseCulpadaId);
    },
    staleTime: 30000,
    // #region agent log
    refetchInterval: false, // Desabilitar polling automático
    // #endregion
  });

  return {
    ...buildUIState(query.data?.heatmap, query.isLoading, query.error as Error | null),
    // totalErrors calculado a partir do heatmap se necessário
    totalErrors: query.data?.heatmap?.reduce((sum, item) => sum + (item.count || 0), 0) || 0,
  };
}

export function useQualityRisk(modeloId?: number, faseCulpadaId?: number) {
  const query = useQuery({
    queryKey: ['quality', 'risk', modeloId, faseCulpadaId],
    queryFn: () => qualityApi.getRisk(modeloId, faseCulpadaId),
    staleTime: 30000,
  });

  return buildUIState(query.data?.risks, query.isLoading, query.error as Error | null);
}

// ============================================
// WHAT-IF HOOKS
// ============================================

export function useWhatIfSimulate() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: WhatIfRequest) =>
      apiClient.post<WhatIfResult>('/whatif/simulate', request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatif', 'history'] });
    },
  });

  return {
    simulate: mutation.mutate,
    result: mutation.data ?? null,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    reset: mutation.reset,
  };
}

// ============================================
// ML HOOKS
// ============================================

export function useMLModels() {
  const query = useQuery({
    queryKey: ['ml', 'models'],
    queryFn: () => apiClient.get<{ models: MLModel[]; total: number; active_count: number }>(
      '/ml/models'
    ),
    staleTime: 60000,
  });

  return {
    ...buildUIState(query.data?.models, query.isLoading, query.error as Error | null),
    total: query.data?.total,
    activeCount: query.data?.active_count,
  };
}

export function usePredictLeadtime() {
  const mutation = useMutation({
    mutationFn: (modeloId: number) =>
      apiClient.post<PredictResult>('/ml/predict/leadtime', { modelo_id: modeloId }),
  });

  return {
    predict: mutation.mutate,
    result: mutation.data ?? null,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    reset: mutation.reset,
  };
}

export function useExplainLeadtime() {
  const mutation = useMutation({
    mutationFn: (params: { modelo_id: number; prediction?: number }) =>
      apiClient.post<ExplainResult>('/ml/explain/leadtime', params),
  });

  return {
    explain: mutation.mutate,
    result: mutation.data ?? null,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    reset: mutation.reset,
  };
}

export function useTrainModel() {
  const queryClient = useQueryClient();

  const trainLeadtime = useMutation({
    mutationFn: () => apiClient.post<{ status: string; job_id: string }>('/ml/train/leadtime'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml', 'models'] });
    },
  });

  const trainRisk = useMutation({
    mutationFn: () => apiClient.post<{ status: string; job_id: string }>('/ml/train/risk'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml', 'models'] });
    },
  });

  return {
    trainLeadtime: trainLeadtime.mutate,
    trainRisk: trainRisk.mutate,
    isTraining: trainLeadtime.isPending || trainRisk.isPending,
  };
}

// ============================================
// OPS HOOKS
// ============================================

export function useOpsHealth() {
  const query = useQuery({
    queryKey: ['ops', 'health'],
    queryFn: () => apiClient.get<HealthStatus>('/ops/health'),
    staleTime: 10000,
    refetchInterval: 30000,
  });

  return buildUIState(query.data, query.isLoading, query.error as Error | null);
}

// REMOVIDO: useIngestionStatus - endpoint /ops/ingestion/status não existe no backend
// Use opsApi.getIngestionStatus(runId) para status de uma run específica

export function useRunIngestion() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (apiKey: string) =>
      apiClient.post<{ status: string; job_id: string }>(`/ops/ingestion/run?api_key=${apiKey}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops', 'ingestion'] });
    },
  });

  return {
    run: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
  };
}

export function useFeatureGates() {
  const query = useQuery({
    queryKey: ['ops', 'feature-gates'],
    queryFn: () => apiClient.get<{ gates: FeatureGate[] } | Record<string, FeatureGate>>('/ops/feature-gates'),
    staleTime: 60000,
  });

  // Handle both array and object formats
  const gatesData = Array.isArray(query.data) 
    ? query.data 
    : query.data && 'gates' in query.data 
      ? query.data.gates 
      : query.data && typeof query.data === 'object'
        ? Object.entries(query.data).map(([key, value]: [string, any]) => ({
            feature: key,
            enabled: value?.status === 'ON' || value?.enabled === true,
            reason: value?.reason,
          }))
        : null;

  return buildUIState(gatesData, query.isLoading, query.error as Error | null);
}

export interface ReleaseGateResult {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    reason?: string;
    details?: string;
  }>;
  blocked_reason?: string;
  timestamp?: string;
}

export function useReleaseGate() {
  const query = useQuery({
    queryKey: ['ops', 'release-gate'],
    queryFn: () => apiClient.get<ReleaseGateResult>('/ops/release-gate'),
    staleTime: 300000, // 5 minutes
  });

  return buildUIState(query.data, query.isLoading, query.error as Error | null);
}

// Re-export useBackendHealth
export { useBackendHealth } from './useBackendHealth';
export type { BackendHealth } from './useBackendHealth';

