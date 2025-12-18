/**
 * SmartInventory Hooks - Hooks para dados de SmartInventory
 * Zero fake data - tudo vem da API
 */

import { useQuery } from '@tanstack/react-query';
import { smartinventoryApi } from '../api-client';

export interface WIPItem {
  fase_id: number;
  fase_nome?: string | null;
  produto_id?: number | null;
  wip_count: number;
  p50_age_hours?: number | null;
  p90_age_hours?: number | null;
  avg_age_hours?: number | null;
}

export type { WIPItem as HeatmapWIPItem };

export interface WIPMassItem {
  fase_id: number;
  produto_id?: number | null;
  wip_count: number;
  total_mass_kg: number;
  confidence?: 'HIGH' | 'ESTIMATED' | 'LOW';
}

export interface GelcoatItem {
  produto_id: number;
  qtd_gel_deck?: number | null;
  qtd_gel_casco?: number | null;
  order_count: number;
}

export interface SmartInventoryOverview {
  totals: {
    wip_count: number;
    wip_age_p50?: number;
    wip_age_p90?: number;
  };
  wip_mass_total?: {
    total_kg: number;
    confidence: 'HIGH' | 'ESTIMATED' | 'LOW';
  };
  gelcoat_totals?: {
    deck_kg: number;
    casco_kg: number;
    disclaimer: string;
  };
  due_risk_buckets?: {
    overdue: number;
    due_7d: number;
    due_14d: number;
    safe: number;
  };
}

/**
 * Hook para WIP
 */
export function useWIP(faseId?: number, produtoId?: number) {
  return useQuery({
    queryKey: ['smartinventory', 'wip', faseId, produtoId],
    queryFn: async () => {
      const result = await smartinventoryApi.getWIP(faseId, produtoId);
      return result;
    },
    staleTime: 30000,
  });
}

/**
 * Hook para WIP Mass
 */
export function useWIPMass(faseId?: number, produtoId?: number) {
  return useQuery({
    queryKey: ['smartinventory', 'wip_mass', faseId, produtoId],
    queryFn: async () => {
      const result = await smartinventoryApi.getWIPMass(faseId, produtoId);
      return result;
    },
    staleTime: 30000,
  });
}

/**
 * Hook para Gelcoat
 */
export function useGelcoat(produtoId?: number, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['smartinventory', 'gelcoat', produtoId, fromDate, toDate],
    queryFn: async () => {
      const result = await smartinventoryApi.getGelcoatTheoreticalUsage(produtoId, fromDate, toDate);
      return result;
    },
    staleTime: 30000,
  });
}

/**
 * Hook para Overview (agrega múltiplos endpoints)
 */
export function useSmartInventoryOverview() {
  const wip = useWIP();
  const wipMass = useWIPMass();
  const gelcoat = useGelcoat();

  const wipData = wip.data?.wip || [];
  const totalWip = wipData.reduce((sum: number, item: WIPItem) => sum + item.wip_count, 0);

  return {
    wip: {
      data: wipData,
      isLoading: wip.isLoading,
      isError: wip.isError,
      isEmpty: !wip.isLoading && wipData.length === 0,
      errorMessage: wip.error?.message,
    },
    totalWip,
    wipMass: {
      data: wipMass.data,
      isLoading: wipMass.isLoading,
      isError: wipMass.isError,
      isNotSupported: false, // WIPMass não retorna NOT_SUPPORTED, apenas dados ou erro
      notSupportedReason: undefined,
    },
    gelcoat: {
      data: gelcoat.data,
      isLoading: gelcoat.isLoading,
      isError: gelcoat.isError,
    },
    isLoading: wip.isLoading || wipMass.isLoading || gelcoat.isLoading,
  };
}

