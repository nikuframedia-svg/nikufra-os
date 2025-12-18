/**
 * Error Classification - Normaliza erros da API
 * Classifica erros em tipos para UI state management
 */

import { AxiosError } from 'axios';

export type ApiErrorKind =
  | 'OFFLINE'
  | 'NOT_SUPPORTED_BACKEND'
  | 'NOT_SUPPORTED_BY_DATA'
  | 'VALIDATION'
  | 'SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'UNKNOWN';

export interface ApiErrorNormalized {
  endpoint: string;
  status: number | null;
  message: string;
  correlationId?: string;
  kind: ApiErrorKind;
  originalError?: unknown;
}

/**
 * Classifica erro da API
 */
export function classifyApiError(error: unknown, endpoint: string): ApiErrorNormalized {
  // Network errors, timeouts, connection refused
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    const isNetworkError =
      errorMessage.includes('network error') ||
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('etimedout') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('networkerror');

    if (isNetworkError || !('response' in error)) {
      return {
        endpoint,
        status: null,
        message: error.message || 'Network error',
        kind: 'OFFLINE',
        originalError: error,
      };
    }
  }

  // Axios errors
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    // Check for NOT_SUPPORTED_BY_DATA in response
    if (data && typeof data === 'object' && 'status' in data && data.status === 'NOT_SUPPORTED_BY_DATA') {
      return {
        endpoint,
        status: status || null,
        message: (data as any).reason || 'Not supported by data',
        kind: 'NOT_SUPPORTED_BY_DATA',
        correlationId: (data as any).correlation_id,
        originalError: error,
      };
    }

    // Map HTTP status to kind
    const responseData = axiosError.response?.data;
    const detail = responseData && typeof responseData === 'object' && 'detail' in responseData
      ? String((responseData as any).detail)
      : undefined;
    
    if (status === 404) {
      return {
        endpoint,
        status,
        message: detail || 'Endpoint not found',
        kind: 'NOT_SUPPORTED_BACKEND',
        originalError: error,
      };
    }

    if (status === 401 || status === 403) {
      return {
        endpoint,
        status,
        message: detail || 'Unauthorized',
        kind: 'UNAUTHORIZED',
        originalError: error,
      };
    }

    if (status === 400 || status === 422) {
      return {
        endpoint,
        status,
        message: detail || 'Validation error',
        kind: 'VALIDATION',
        originalError: error,
      };
    }

    if (status === 500) {
      return {
        endpoint,
        status,
        message: detail || 'Server error',
        kind: 'SERVER_ERROR',
        originalError: error,
      };
    }

    if (status === 503) {
      return {
        endpoint,
        status,
        message: detail || 'Service unavailable',
        kind: 'OFFLINE',
        originalError: error,
      };
    }
  }

  // Fallback
  return {
    endpoint,
    status: null,
    message: error instanceof Error ? error.message : 'Unknown error',
    kind: 'UNKNOWN',
    originalError: error,
  };
}

/**
 * UIState - Estado derivado do erro normalizado
 */
export interface UIState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiErrorNormalized | null;
  isEmpty: boolean;
  isOffline: boolean;
  isNotSupported: boolean;
  isNotSupportedByData: boolean;
}

/**
 * Cria UIState a partir de query result
 */
export function createUIState<T>(
  data: T | undefined,
  isLoading: boolean,
  error: unknown | null,
  endpoint: string
): UIState<T> {
  const normalizedError = error ? classifyApiError(error, endpoint) : null;

  return {
    data: data ?? null,
    isLoading,
    error: normalizedError,
    isEmpty: !isLoading && !error && (data === null || data === undefined || (Array.isArray(data) && data.length === 0)),
    isOffline: normalizedError?.kind === 'OFFLINE' || false,
    isNotSupported: normalizedError?.kind === 'NOT_SUPPORTED_BACKEND' || false,
    isNotSupportedByData: normalizedError?.kind === 'NOT_SUPPORTED_BY_DATA' || false,
  };
}

