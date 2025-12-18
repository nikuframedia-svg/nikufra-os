/**
 * Feature Gates Hook - React hook para feature gating
 * Integra com useFeatureGates do index.ts
 */

import { useFeatureGates } from './index';
import { isFeatureEnabled } from '../feature-gates';

/**
 * Hook para verificar se uma feature está habilitada
 */
export function useFeatureGate(feature: string) {
  const gates = useFeatureGates();
  
  // Se temos dados dos gates, usar eles
  if (gates.data && Array.isArray(gates.data)) {
    const gate = gates.data.find(g => g.feature === feature);
    return {
      enabled: gate?.enabled ?? false,
      reason: gate?.reason,
      isLoading: gates.isLoading,
    };
  }
  
  // Se temos dados como objeto
  if (gates.data && typeof gates.data === 'object' && !Array.isArray(gates.data)) {
    const gate = (gates.data as any)[feature];
    return {
      enabled: gate?.status === 'ON' || gate?.enabled === true,
      reason: gate?.reason,
      isLoading: gates.isLoading,
    };
  }
  
  // Fallback para função estática
  return {
    enabled: isFeatureEnabled(feature),
    reason: undefined,
    isLoading: gates.isLoading,
  };
}

