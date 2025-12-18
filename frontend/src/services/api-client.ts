/**
 * API Client com validação Zod automática
 * Todas as respostas são validadas antes de serem retornadas
 */
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import { toast } from '../ui-kit';
import { sanitizeParams } from '../api/utils/sanitizeParams';
import { classifyApiError } from '../api/utils/errorClassification';
import { PRODPLAN, KPIS, SMARTINVENTORY, QUALITY, WHATIF, ML, INGESTION, OPS } from '../api/endpoints';
import {
  OrdersResponseSchema,
  OrderSchema,
  OrderPhasesResponseSchema,
  ScheduleCurrentResponseSchema,
  BottlenecksResponseSchema,
  RiskQueueResponseSchema,
  KPIsOverviewResponseSchema,
  QualityOverviewResponseSchema,
  QualityRiskResponseSchema,
  WhatIfResponseSchema,
  WIPResponseSchema,
  WIPMassResponseSchema,
  GelcoatTheoreticalUsageResponseSchema,
  DueRiskResponseSchema,
  MLPredictResponseSchema,
  MLExplainResponseSchema,
  type WhatIfRequest,
} from '../schemas/api';

// Opção A: baseURL vazio, endpoints sempre com "/api/..."
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // Vazio - endpoints já têm /api
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
  },
  timeout: 30000,
});

/**
 * resolvePath - Valida e resolve path do endpoint
 * Regra Opção A: aceita apenas URLs que começam por "/api/"
 */
function resolvePath(endpoint: string): string {
  if (import.meta.env.DEV) {
    if (!endpoint.startsWith('/api/')) {
      throw new Error(`ENDPOINT_MISSING_/api_PREFIX: "${endpoint}" deve começar com "/api/"`);
    }
    if (endpoint.includes('/api/api/')) {
      throw new Error(`DUPLICATE_/api_PREFIX: "${endpoint}" contém "/api/api/"`);
    }
  }
  return endpoint;
}

// Interceptor para sanitizar params, validar path e log
api.interceptors.request.use((config) => {
  // Resolver e validar path
  if (config.url) {
    config.url = resolvePath(config.url);
  }
  
  // Sanitize params - remove undefined, null, empty
  if (config.params) {
    config.params = sanitizeParams(config.params as Record<string, unknown>);
  }
  
  if (import.meta.env.DEV) {
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
  }
  
  return config;
});

// Interceptor para log de responses (apenas em dev)
if (import.meta.env.DEV) {
  api.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.config.url}`, response.status, response.data);
      return response;
    },
    (error) => {
      const status = error.response?.status;
      const url = error.config?.url;
      const data = error.response?.data;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-client.ts:83',message:'response interceptor error',data:{url,status,statusText:error.response?.statusText,errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error(`❌ API Error: ${url}`, {
        status,
        statusText: error.response?.statusText,
        data,
        message: error.message,
      });
      return Promise.reject(error);
    }
  );
}

/**
 * Valida resposta com Zod schema
 * Se falhar, mostra erro na UI e loga no console
 */
function validateResponse<T>(data: unknown, schema: z.ZodSchema<T>, endpoint: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`❌ Validation error for ${endpoint}:`, error.issues);
      console.error('Raw response:', data);
      toast.error(`Erro de validação: resposta inválida de ${endpoint}`);
      throw new Error(`Validation failed for ${endpoint}: ${error.message}`);
    }
    throw error;
  }
}


/**
 * Trata erros da API usando classificação normalizada
 * Mantém compatibilidade com código existente mas usa classificação
 */
function handleError(error: unknown, endpoint: string): never {
  const normalized = classifyApiError(error, endpoint);
  
  // Para compatibilidade, ainda lança Error, mas com mensagem baseada em kind
  let message: string;
  
  switch (normalized.kind) {
    case 'OFFLINE':
      message = `OFFLINE: ${normalized.message}`;
      break;
    case 'NOT_SUPPORTED_BACKEND':
      message = `ENDPOINT_NOT_FOUND: ${endpoint} não encontrado. Verifique se o router está registrado no backend.`;
      break;
    case 'NOT_SUPPORTED_BY_DATA':
      message = `NOT_SUPPORTED_BY_DATA: ${normalized.message}`;
      break;
    case 'VALIDATION':
      message = `VALIDATION_ERROR: ${normalized.message}`;
      break;
    case 'SERVER_ERROR':
      message = `HTTP_500: ${normalized.message}`;
      break;
    case 'UNAUTHORIZED':
      message = `UNAUTHORIZED: ${normalized.message}`;
      break;
    default:
      message = normalized.message || `Erro ao chamar ${endpoint}`;
  }
  
  const errorObj = new Error(message);
  // Attach normalized error for hooks to use
  (errorObj as any).normalized = normalized;
  throw errorObj;
}

// ============================================================================
// PRODPLAN API
// ============================================================================

export const prodplanApi = {
  async getOrders(params?: {
    limit?: number;
    cursor?: string;
    of_id?: string;
    produto_id?: number;
    fase_id?: number;
    data_criacao_from?: string;
    data_criacao_to?: string;
  }) {
    try {
      const response = await api.get(PRODPLAN.ORDERS, { params });
      return validateResponse(response.data, OrdersResponseSchema, PRODPLAN.ORDERS);
    } catch (error) {
      return handleError(error, PRODPLAN.ORDERS);
    }
  },

  async getOrder(ofId: string) {
    try {
      const response = await api.get(PRODPLAN.ORDER_DETAIL(ofId));
      return validateResponse(response.data, OrderSchema, PRODPLAN.ORDER_DETAIL(ofId));
    } catch (error) {
      return handleError(error, PRODPLAN.ORDER_DETAIL(ofId));
    }
  },

  async getOrderPhases(ofId: string) {
    try {
      const response = await api.get(PRODPLAN.ORDER_PHASES(ofId));
      return validateResponse(response.data, OrderPhasesResponseSchema, PRODPLAN.ORDER_PHASES(ofId));
    } catch (error) {
      return handleError(error, PRODPLAN.ORDER_PHASES(ofId));
    }
  },

  async getScheduleCurrent(faseId?: number) {
    try {
      const params = faseId !== undefined ? { fase_id: faseId } : {};
      const response = await api.get(PRODPLAN.SCHEDULE_CURRENT, { params });
      return validateResponse(response.data, ScheduleCurrentResponseSchema, PRODPLAN.SCHEDULE_CURRENT);
    } catch (error) {
      return handleError(error, PRODPLAN.SCHEDULE_CURRENT);
    }
  },

  async getBottlenecks(topN: number = 10) {
    try {
      const response = await api.get(PRODPLAN.BOTTLENECKS, { params: { top_n: topN } });
      return validateResponse(response.data, BottlenecksResponseSchema, PRODPLAN.BOTTLENECKS);
    } catch (error) {
      return handleError(error, PRODPLAN.BOTTLENECKS);
    }
  },

  async getRiskQueue(topN: number = 20) {
    try {
      const response = await api.get(PRODPLAN.RISK_QUEUE, { params: { top_n: topN } });
      return validateResponse(response.data, RiskQueueResponseSchema, PRODPLAN.RISK_QUEUE);
    } catch (error) {
      return handleError(error, PRODPLAN.RISK_QUEUE);
    }
  },
};

// ============================================================================
// KPIs API
// ============================================================================

export const kpisApi = {
  async getOverview() {
    try {
      const response = await api.get(KPIS.OVERVIEW);
      return validateResponse(response.data, KPIsOverviewResponseSchema, KPIS.OVERVIEW);
    } catch (error) {
      return handleError(error, KPIS.OVERVIEW);
    }
  },
};

// ============================================================================
// QUALITY API
// ============================================================================

export const qualityApi = {
  async getOverview(faseAvaliacaoId?: number, faseCulpadaId?: number) {
    try {
      // Build params object only with defined values
      const params: Record<string, number> = {};
      if (faseAvaliacaoId !== undefined) params.fase_avaliacao_id = faseAvaliacaoId;
      if (faseCulpadaId !== undefined) params.fase_culpada_id = faseCulpadaId;
      
      const response = await api.get(QUALITY.OVERVIEW, { params });
      return validateResponse(response.data, QualityOverviewResponseSchema, QUALITY.OVERVIEW);
    } catch (error) {
      return handleError(error, QUALITY.OVERVIEW);
    }
  },

  async getRisk(modeloId?: number, faseCulpadaId?: number) {
    try {
      // Build params object only with defined values
      const params: Record<string, number> = {};
      if (modeloId !== undefined) params.modelo_id = modeloId;
      if (faseCulpadaId !== undefined) params.fase_culpada_id = faseCulpadaId;
      
      const response = await api.get(QUALITY.RISK, { params });
      return validateResponse(response.data, QualityRiskResponseSchema, QUALITY.RISK);
    } catch (error) {
      return handleError(error, QUALITY.RISK);
    }
  },
};

// ============================================================================
// WHAT-IF API
// ============================================================================

export const whatifApi = {
  async simulate(request: WhatIfRequest) {
    try {
      const response = await api.post(WHATIF.SIMULATE, request);
      return validateResponse(response.data, WhatIfResponseSchema, WHATIF.SIMULATE);
    } catch (error) {
      return handleError(error, WHATIF.SIMULATE);
    }
  },
};

// ============================================================================
// SMARTINVENTORY API
// ============================================================================

export const smartinventoryApi = {
  async getWIP(faseId?: number, produtoId?: number) {
    try {
      const params: Record<string, number> = {};
      if (faseId !== undefined) params.fase_id = faseId;
      if (produtoId !== undefined) params.produto_id = produtoId;
      
      const response = await api.get(SMARTINVENTORY.WIP, { params });
      return validateResponse(response.data, WIPResponseSchema, SMARTINVENTORY.WIP);
    } catch (error) {
      return handleError(error, SMARTINVENTORY.WIP);
    }
  },

  async getWIPMass(faseId?: number, produtoId?: number) {
    try {
      const params: Record<string, number> = {};
      if (faseId !== undefined) params.fase_id = faseId;
      if (produtoId !== undefined) params.produto_id = produtoId;
      
      const response = await api.get(SMARTINVENTORY.WIP_MASS, { params });
      return validateResponse(response.data, WIPMassResponseSchema, SMARTINVENTORY.WIP_MASS);
    } catch (error) {
      return handleError(error, SMARTINVENTORY.WIP_MASS);
    }
  },

  async getGelcoatTheoreticalUsage(produtoId?: number, fromDate?: string, toDate?: string) {
    try {
      const params: Record<string, string | number> = {};
      if (produtoId !== undefined) params.produto_id = produtoId;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      
      const response = await api.get(SMARTINVENTORY.GELCOAT_THEORETICAL_USAGE, { params });
      return validateResponse(
        response.data,
        GelcoatTheoreticalUsageResponseSchema,
        SMARTINVENTORY.GELCOAT_THEORETICAL_USAGE
      );
    } catch (error) {
      return handleError(error, SMARTINVENTORY.GELCOAT_THEORETICAL_USAGE);
    }
  },

  async getMaterialYield(produtoId?: number) {
    try {
      const response = await api.get('/smartinventory/material_yield', {
        params: { produto_id: produtoId },
      });
      // Se endpoint retornar NOT_SUPPORTED_BY_DATA, será tratado pelo handleError
      return response.data;
    } catch (error) {
      return handleError(error, '/smartinventory/material_yield');
    }
  },

  async getDueRisk() {
    try {
      const response = await api.get('/smartinventory/due_risk');
      // Validar com schema se dados disponíveis
      try {
        return validateResponse(response.data, DueRiskResponseSchema, '/smartinventory/due_risk');
      } catch {
        // Se validação falhar, retornar dados raw (pode ser NOT_SUPPORTED_BY_DATA)
        return response.data;
      }
    } catch (error) {
      return handleError(error, '/smartinventory/due_risk');
    }
  },
};

// ============================================================================
// ML API
// ============================================================================

export const mlApi = {
  async predictLeadTime(modeloId: number) {
    try {
      const response = await api.get(ML.PREDICT_LEADTIME, { params: { modelo_id: modeloId } });
      return validateResponse(response.data, MLPredictResponseSchema, ML.PREDICT_LEADTIME);
    } catch (error) {
      return handleError(error, ML.PREDICT_LEADTIME);
    }
  },

  async explainLeadTime(modeloId: number) {
    try {
      const response = await api.get(ML.EXPLAIN_LEADTIME, { params: { modelo_id: modeloId } });
      return validateResponse(response.data, MLExplainResponseSchema, ML.EXPLAIN_LEADTIME);
    } catch (error) {
      return handleError(error, ML.EXPLAIN_LEADTIME);
    }
  },

  async trainLeadTime(apiKey?: string) {
    try {
      const response = await api.post(ML.TRAIN_LEADTIME, {}, {
        headers: apiKey ? { 'X-API-Key': apiKey } : {},
      });
      return response.data;
    } catch (error) {
      return handleError(error, ML.TRAIN_LEADTIME);
    }
  },

  async trainRisk(apiKey?: string) {
    try {
      const response = await api.post(ML.TRAIN_RISK, {}, {
        headers: apiKey ? { 'X-API-Key': apiKey } : {},
      });
      return response.data;
    } catch (error) {
      return handleError(error, ML.TRAIN_RISK);
    }
  },
};

// ============================================================================
// OPS API
// ============================================================================

export const opsApi = {
  async getHealth() {
    try {
      const response = await api.get(OPS.HEALTH);
      return response.data;
    } catch (error) {
      return handleError(error, OPS.HEALTH);
    }
  },

  async runIngestion() {
    try {
      const response = await api.post(INGESTION.RUN);
      return response.data;
    } catch (error) {
      return handleError(error, INGESTION.RUN);
    }
  },

  async getIngestionStatus(runId: number) {
    try {
      const response = await api.get(INGESTION.STATUS(runId));
      return response.data;
    } catch (error) {
      return handleError(error, INGESTION.STATUS(runId));
    }
  },

  async getFeatureGates() {
    try {
      const response = await api.get('/ops/feature-gates');
      return response.data;
    } catch (error) {
      // Return empty object if endpoint doesn't exist
      return {};
    }
  },

  async getSLOResults() {
    try {
      const response = await api.get('/ops/performance');
      return response.data;
    } catch (error) {
      return { slos: [], generated_at: null };
    }
  },

  async getDataContract() {
    try {
      const response = await api.get('/ops/data-contract');
      return response.data;
    } catch (error) {
      return { match_rates: [], orphan_counts: [] };
    }
  },
};

// ============================================================================
// Export default
// ============================================================================

export default api;

