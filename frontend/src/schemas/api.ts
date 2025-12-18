/**
 * Zod Schemas para todas as respostas da API
 * Validação automática de todas as respostas
 */
import { z } from 'zod';

// ============================================================================
// PRODPLAN Schemas
// ============================================================================

export const OrderPhaseSchema = z.object({
  faseof_id: z.string(),
  faseof_of_id: z.string(),
  faseof_fase_id: z.number().nullable(),
  faseof_inicio: z.string().nullable(), // ISO datetime
  faseof_fim: z.string().nullable(), // ISO datetime
  faseof_data_prevista: z.string().nullable(), // ISO datetime
  faseof_sequencia: z.number().nullable(),
  faseof_peso: z.number().nullable(),
  faseof_coeficiente: z.number().nullable(),
  faseof_coeficiente_x: z.number().nullable(),
});

export const OrderSchema = z.object({
  of_id: z.string(),
  of_data_criacao: z.string().nullable(), // ISO datetime
  of_data_acabamento: z.string().nullable(), // ISO datetime
  of_data_transporte: z.string().nullable(), // ISO datetime
  of_produto_id: z.number().nullable(),
  of_fase_id: z.number().nullable(),
  status: z.enum(['CREATED', 'IN_PROGRESS', 'DONE', 'LATE', 'AT_RISK']).optional(),
  eta: z.string().nullable().optional(), // ISO datetime
  due_date: z.string().nullable().optional(), // ISO datetime
});

export const OrdersResponseSchema = z.object({
  orders: z.array(OrderSchema),
  total: z.number().optional(),
  next_cursor: z.string().nullable().optional(),
});

export const OrderPhasesResponseSchema = z.object({
  phases: z.array(OrderPhaseSchema),
});

export const ScheduleItemSchema = z.object({
  fase_id: z.number(),
  fase_nome: z.string().nullable(),
  wip_count: z.number(),
  p50_age_hours: z.number().nullable(),
  p90_age_hours: z.number().nullable(),
  oldest_event_time: z.string().nullable(), // ISO datetime
});

export const ScheduleCurrentResponseSchema = z.object({
  schedule: z.array(ScheduleItemSchema),
  generated_at: z.string().optional(), // ISO datetime
});

export const BottleneckSchema = z.object({
  fase_id: z.number().optional(),
  fase_nome: z.string().nullable().optional(),
  phase_code: z.string().optional(),
  phase_name: z.string().nullable().optional(),
  wip_count: z.number(),
  p90_age_hours: z.number(),
  bottleneck_score: z.number().optional(),
  utilizacao_pct: z.number().optional(),
  fila_horas: z.number().optional(),
  probabilidade: z.number().optional(),
});

export const BottlenecksResponseSchema = z.object({
  bottlenecks: z.array(BottleneckSchema),
  top_losses: z.array(BottleneckSchema).optional(),
  heatmap: z.array(z.any()).optional(),
  overlap_applied: z.record(z.string(), z.number()).optional(),
  lead_time_gain: z.number().optional(),
  generated_at: z.string().optional(), // ISO datetime
});

export const RiskQueueItemSchema = z.object({
  of_id: z.string(),
  produto_id: z.number().nullable(),
  due_date: z.string().nullable(), // ISO datetime
  eta: z.string().nullable(), // ISO datetime
  risk_score: z.number(),
  days_behind: z.number().nullable(),
});

export const RiskQueueResponseSchema = z.object({
  risk_queue: z.array(RiskQueueItemSchema).optional(),
  at_risk_orders: z.array(RiskQueueItemSchema).optional(),
  generated_at: z.string().optional(), // ISO datetime
});

// ============================================================================
// KPIs Schemas
// ============================================================================

export const KPISchema = z.object({
  otd_pct: z.number(),
  lead_time_h: z.number(),
  gargalo_ativo: z.string().nullable(),
  horas_setup_semana: z.number().optional(),
});

export const KPIsOverviewResponseSchema = z.object({
  kpis: KPISchema,
  generated_at: z.string().optional(), // ISO datetime
}).or(z.object({
  message: z.string().optional(),
  from_date: z.string().nullable().optional(),
  to_date: z.string().nullable().optional(),
}));

// ============================================================================
// QUALITY Schemas
// ============================================================================

export const QualityHeatmapItemSchema = z.object({
  fase_avaliacao: z.string().nullable(),
  fase_culpada: z.string().nullable(),
  count: z.number(),
  gravidade_avg: z.number().nullable(),
});

export const QualityOverviewResponseSchema = z.object({
  heatmap: z.array(QualityHeatmapItemSchema),
  generated_at: z.string().optional(), // ISO datetime
});

export const QualityRiskItemSchema = z.object({
  produto_id: z.number(),
  fase_id: z.number(),
  risk_score: z.number(),
  historical_rate: z.number().nullable(),
});

export const QualityRiskResponseSchema = z.object({
  risks: z.array(QualityRiskItemSchema),
  generated_at: z.string().optional(), // ISO datetime
});

// ============================================================================
// WHAT-IF Schemas
// ============================================================================

export const WhatIfRequestSchema = z.object({
  capacity_overrides: z.record(z.string(), z.number()).optional(),
  coef_overrides: z.record(z.string(), z.number()).optional(),
  priority_rule: z.enum(['EDD', 'SPT', 'FIFO']).optional(),
});

export const WhatIfKPISchema = z.object({
  otd_pct: z.number(),
  lead_time_h: z.number(),
  makespan_h: z.number().optional(),
});

export const WhatIfAffectedOrderSchema = z.object({
  of_id: z.string(),
  delta_lead_time_h: z.number(),
  new_status: z.string().optional(),
});

export const WhatIfResponseSchema = z.object({
  baseline_kpis: WhatIfKPISchema,
  simulated_kpis: WhatIfKPISchema,
  delta_kpis: WhatIfKPISchema,
  top_affected_orders: z.array(WhatIfAffectedOrderSchema),
  scenario_hash: z.string().optional(),
  engine_version: z.string().optional(),
});

// ============================================================================
// SMARTINVENTORY Schemas
// ============================================================================

export const WIPItemSchema = z.object({
  fase_id: z.number(),
  produto_id: z.number().nullable(),
  wip_count: z.number(),
  p50_age_hours: z.number().nullable(),
  p90_age_hours: z.number().nullable(),
});

export const WIPResponseSchema = z.object({
  wip: z.array(WIPItemSchema),
  generated_at: z.string().optional(), // ISO datetime
});

export const WIPMassItemSchema = z.object({
  fase_id: z.number(),
  produto_id: z.number().nullable(),
  wip_mass_kg: z.number(),
  low_confidence: z.boolean().optional(),
});

export const WIPMassResponseSchema = z.object({
  wip_mass: z.array(WIPMassItemSchema).optional(),
  wip_mass_by_phase_and_product: z.array(WIPMassItemSchema).optional(),
  total_wip_mass_kg: z.number().optional(),
  generated_at: z.string().optional(), // ISO datetime
});

export const GelcoatTheoreticalUsageSchema = z.object({
  produto_id: z.number(),
  produto_nome: z.string().nullable(),
  qtd_gel_deck: z.number().nullable(),
  qtd_gel_casco: z.number().nullable(),
  ofs_in_progress: z.number(),
  theoretical_usage_deck: z.number(),
  theoretical_usage_casco: z.number(),
  disclaimer: z.string(),
});

export const GelcoatTheoreticalUsageResponseSchema = z.union([
  z.object({
    status: z.literal('SUPPORTED'),
    disclaimer: z.string(),
    by_product: z.array(GelcoatTheoreticalUsageSchema),
    total_theoretical_gel_deck: z.number(),
    total_theoretical_gel_casco: z.number(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
  }),
  z.object({
    status: z.literal('NOT_SUPPORTED_BY_DATA'),
    reason: z.string(),
    total_products: z.number().optional(),
    with_gel_deck: z.number().optional(),
    with_gel_casco: z.number().optional(),
  }),
  z.object({
    gelcoat_usage: z.array(GelcoatTheoreticalUsageSchema),
    generated_at: z.string().optional(),
  }),
]);

export const DueRiskItemSchema = z.object({
  of_id: z.string(),
  produto_id: z.number(),
  produto_nome: z.string().nullable().optional(),
  fase_atual_id: z.number(),
  fase_atual_nome: z.string().nullable().optional(),
  due_date: z.string(), // ISO datetime
  risk_score: z.number(),
  explanation: z.string(),
  risk_bucket: z.enum(['OVERDUE', 'DUE_7D', 'DUE_14D', 'SAFE']),
});

export const DueRiskResponseSchema = z.object({
  due_risk_items: z.array(DueRiskItemSchema),
  generated_at: z.string().optional(), // ISO datetime
});

// ============================================================================
// ML Schemas
// ============================================================================

export const MLPredictRequestSchema = z.object({
  produto_id: z.number(),
  stats: z.record(z.string(), z.number()).optional(),
});

export const MLPredictResponseSchema = z.object({
  predicted_leadtime_hours: z.number(),
  predicted_lead_time_h: z.number().optional(), // Alias
  confidence_interval: z.array(z.number()).optional(), // [lower, upper]
  baseline_leadtime_hours: z.number().optional(),
  baseline_lead_time_h: z.number().optional(), // Alias
  model_version: z.string().optional(),
});

export const MLExplainResponseSchema = z.object({
  features: z.array(
    z.object({
      name: z.string(),
      importance: z.number(),
      value: z.number().optional(),
    })
  ),
  model_version: z.string().optional(),
});

// ============================================================================
// Error Response Schema
// ============================================================================

export const ErrorResponseSchema = z.object({
  detail: z.string(),
  error_code: z.string().optional(),
  reason: z.string().optional(),
});

export const NotSupportedResponseSchema = z.object({
  status: z.literal('NOT_SUPPORTED_BY_DATA'),
  reason: z.string(),
  match_rate: z.number().optional(),
  relationship: z.string().optional(),
});

// ============================================================================
// Type exports
// ============================================================================

export type Order = z.infer<typeof OrderSchema>;
export type OrderPhase = z.infer<typeof OrderPhaseSchema>;
export type OrdersResponse = z.infer<typeof OrdersResponseSchema>;
export type OrderPhasesResponse = z.infer<typeof OrderPhasesResponseSchema>;
export type ScheduleCurrentResponse = z.infer<typeof ScheduleCurrentResponseSchema>;
export type BottlenecksResponse = z.infer<typeof BottlenecksResponseSchema>;
export type RiskQueueResponse = z.infer<typeof RiskQueueResponseSchema>;
export type KPIsOverviewResponse = z.infer<typeof KPIsOverviewResponseSchema>;
export type QualityOverviewResponse = z.infer<typeof QualityOverviewResponseSchema>;
export type QualityRiskResponse = z.infer<typeof QualityRiskResponseSchema>;
export type WhatIfRequest = z.infer<typeof WhatIfRequestSchema>;
export type WhatIfResponse = z.infer<typeof WhatIfResponseSchema>;
export type WIPResponse = z.infer<typeof WIPResponseSchema>;
export type WIPMassResponse = z.infer<typeof WIPMassResponseSchema>;
export type GelcoatTheoreticalUsageResponse = z.infer<typeof GelcoatTheoreticalUsageResponseSchema>;
export type MLPredictRequest = z.infer<typeof MLPredictRequestSchema>;
export type MLPredictResponse = z.infer<typeof MLPredictResponseSchema>;
export type MLExplainResponse = z.infer<typeof MLExplainResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type NotSupportedResponse = z.infer<typeof NotSupportedResponseSchema>;

