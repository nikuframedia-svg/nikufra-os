/**
 * Endpoint Registry - Mapeamento centralizado de endpoints
 * Alinhado com backend (app/api/routers)
 * NUNCA inventar paths
 */

// Base paths
const BASE = '/api';

// PRODPLAN
export const PRODPLAN = {
  ORDERS: `${BASE}/prodplan/orders`,
  ORDER_DETAIL: (ofId: string) => `${BASE}/prodplan/orders/${ofId}`,
  ORDER_PHASES: (ofId: string) => `${BASE}/prodplan/orders/${ofId}/phases`,
  SCHEDULE_CURRENT: `${BASE}/prodplan/schedule/current`,
  BOTTLENECKS: `${BASE}/prodplan/bottlenecks`,
  RISK_QUEUE: `${BASE}/prodplan/risk_queue`,
} as const;

// KPIs
export const KPIS = {
  OVERVIEW: `${BASE}/kpis/overview`,
  BY_EMPLOYEE: `${BASE}/kpis/by-employee`,
  BY_PHASE: `${BASE}/kpis/by-phase`,
  BY_PRODUCT: `${BASE}/kpis/by-product`,
} as const;

// SMARTINVENTORY
export const SMARTINVENTORY = {
  WIP: `${BASE}/smartinventory/wip`,
  WIP_MASS: `${BASE}/smartinventory/wip_mass`,
  CONSUMPTION_ESTIMATE: `${BASE}/smartinventory/consumption_estimate`,
  GELCOAT_THEORETICAL_USAGE: `${BASE}/smartinventory/gelcoat_theoretical_usage`,
} as const;

// QUALITY
export const QUALITY = {
  OVERVIEW: `${BASE}/quality/overview`,
  RISK: `${BASE}/quality/risk`,
} as const;

// WHAT-IF
export const WHATIF = {
  SIMULATE: `${BASE}/whatif/simulate`,
} as const;

// ML
export const ML = {
  PREDICT_LEADTIME: `${BASE}/ml/predict/leadtime`,
  EXPLAIN_LEADTIME: `${BASE}/ml/explain/leadtime`,
  TRAIN_LEADTIME: `${BASE}/ml/train/leadtime`,
  TRAIN_RISK: `${BASE}/ml/train/risk`,
} as const;

// INGESTION
export const INGESTION = {
  RUN: `${BASE}/ingestion/run`,
  STATUS: (runId: number) => `${BASE}/ingestion/status/${runId}`,
  // NOTA: Não existe /ingestion/status sem run_id no backend
} as const;

// OPS
export const OPS = {
  HEALTH: `${BASE}/health`, // Health está em /api/health
  // NOTA: Não existe /ops/ingestion/status no backend
} as const;

// CHAT
// NOTA: Não existe endpoint de chat no backend atual
// Chat deve funcionar 100% local ou tentar /api/chat se existir no futuro
export const CHAT = {
  // Não implementado no backend
  // MESSAGE: `${BASE}/chat/message`,
  // STATUS: `${BASE}/chat/status`,
} as const;

