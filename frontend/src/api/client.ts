/**
 * API Client - Único ponto de acesso ao backend
 * Zero fake data, tipagem completa
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';
const TIMEOUT = 60000; // 60s

// ============================================
// TYPES
// ============================================
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'not_supported' | 'error';
  message?: string;
  timestamp?: string;
}

export interface NotSupportedResponse {
  status: 'NOT_SUPPORTED_BY_DATA';
  reason: string;
  suggestion?: string;
  match_rate?: number;
  timestamp?: string;
}

export interface ErrorResponse {
  detail: string;
  status_code?: number;
  correlation_id?: string;
}

// UI State consolidado
export interface UIState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  isNotSupported: boolean;
  notSupportedReason?: string;
  errorMessage?: string;
  errorEndpoint?: string;
  errorStatusCode?: number;
}

// ============================================
// API CLIENT
// ============================================
class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle NOT_SUPPORTED_BY_DATA
      if (response.status === 422 || response.status === 501) {
        const notSupported = await response.json() as NotSupportedResponse;
        throw new NotSupportedError(notSupported);
      }

      // Handle errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiError(
          errorData.detail || `API Error: ${response.status}`,
          response.status,
          endpoint,
          errorData.correlation_id
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof NotSupportedError || error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, endpoint);
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        endpoint
      );
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        ).toString()}`
      : endpoint;
    
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// ============================================
// CUSTOM ERRORS
// ============================================
export class ApiError extends Error {
  statusCode: number;
  endpoint: string;
  correlationId?: string;

  constructor(message: string, statusCode: number, endpoint: string, correlationId?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.correlationId = correlationId;
  }
}

export class NotSupportedError extends Error {
  reason: string;
  suggestion?: string;
  matchRate?: number;

  constructor(data: NotSupportedResponse) {
    super('NOT_SUPPORTED_BY_DATA');
    this.name = 'NotSupportedError';
    this.reason = data.reason;
    this.suggestion = data.suggestion;
    this.matchRate = data.match_rate;
  }
}

// ============================================
// INSTANCE
// ============================================
export const apiClient = new ApiClient(BASE_URL, API_KEY);

// ============================================
// HELPER: Build UI State
// ============================================
export function buildUIState<T>(
  data: T | undefined,
  isLoading: boolean,
  error: Error | null,
  isEmpty?: boolean
): UIState<T> {
  if (error instanceof NotSupportedError) {
    return {
      data: null,
      isLoading: false,
      isError: false,
      isEmpty: false,
      isNotSupported: true,
      notSupportedReason: error.reason,
    };
  }

  if (error instanceof ApiError) {
    return {
      data: null,
      isLoading: false,
      isError: true,
      isEmpty: false,
      isNotSupported: false,
      errorMessage: error.message,
      errorEndpoint: error.endpoint,
      errorStatusCode: error.statusCode,
    };
  }

  if (error) {
    return {
      data: null,
      isLoading: false,
      isError: true,
      isEmpty: false,
      isNotSupported: false,
      errorMessage: error.message,
    };
  }

  const isEmptyData = isEmpty !== undefined 
    ? isEmpty 
    : !data || (Array.isArray(data) && data.length === 0);

  return {
    data: data ?? null,
    isLoading,
    isError: false,
    isEmpty: isEmptyData && !isLoading,
    isNotSupported: false,
  };
}

