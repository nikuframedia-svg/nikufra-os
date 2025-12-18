/**
 * useBackendHealth - Hook para verificar saúde do backend
 * Detecta backend_offline para degradação elegante
 */

import { useQuery } from '@tanstack/react-query';
import api from '../../services/api-client';
import { OPS } from '../endpoints';

export interface BackendHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  db_connected: boolean;
  redis_connected: boolean;
  db_host?: string;
  db_port?: number;
  db_name?: string;
  execution_mode?: string;
  checks?: Record<string, string>;
}

export function useBackendHealth() {
  return useQuery<BackendHealth>({
    queryKey: ['backend', 'health'],
    queryFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useBackendHealth.ts:22',message:'health check queryFn executing',data:{endpoint:OPS.HEALTH},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      try {
        const response = await api.get(OPS.HEALTH, {
          timeout: 2000, // Timeout curto para health check
        });
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useBackendHealth.ts:27',message:'health check success',data:{status:response.data?.status,dbConnected:response.data?.db_connected},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return response.data as BackendHealth;
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useBackendHealth.ts:32',message:'health check error',data:{errorMessage:error?.message,errorCode:error?.code,isConnectionError:error?.message?.includes('Network Error') || error?.message?.includes('Failed to fetch') || error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        // Se falhar connection/refused/timeout, retornar unhealthy
        const isConnectionError = 
          error?.message?.includes('Network Error') ||
          error?.message?.includes('Failed to fetch') ||
          error?.code === 'ECONNREFUSED' ||
          error?.code === 'ETIMEDOUT' ||
          error?.code === 'ECONNABORTED';
        
        if (isConnectionError) {
          return {
            status: 'unhealthy',
            db_connected: false,
            redis_connected: false,
          };
        }
        
        throw error;
      }
    },
    staleTime: 10000, // 10s
    refetchInterval: 30000, // 30s
    retry: 1,
    retryDelay: 2000,
    // Desabilitar se backend estiver offline (evitar loops)
    enabled: true,
  });
}

