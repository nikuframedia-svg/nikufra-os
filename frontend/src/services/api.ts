/**
 * API service layer for ProdPlan 4.0 OS
 * Integrates with backend services
 */
import { 
  WorkCenter, 
  WorkCenterKpiBreakdown, 
  FactoryOverviewMetrics,
  EquipmentSpec,
  OperationCategoryCard,
  GlobalIndicator,
  ProductionEvent,
  SelectedWorkCenterDetails,
  TimeBreakdown,
} from '../types/prodplan';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Work Centers
  async getWorkCenters(): Promise<WorkCenter[]> {
    return this.fetch<WorkCenter[]>('/work-centers');
  }

  async getWorkCenter(id: string): Promise<WorkCenter> {
    return this.fetch<WorkCenter>(`/work-centers/${id}`);
  }

  async getWorkCenterKpiBreakdown(
    workCenterId: string, 
    horizon: 'last_8h' | 'last_24h' = 'last_24h'
  ): Promise<WorkCenterKpiBreakdown> {
    return this.fetch<WorkCenterKpiBreakdown>(
      `/work-centers/${workCenterId}/kpi-breakdown?horizon=${horizon}`
    );
  }

  // Factory Overview
  async getFactoryOverviewMetrics(): Promise<FactoryOverviewMetrics> {
    return this.fetch<FactoryOverviewMetrics>('/factory/overview');
  }

  async getOperationCategories(): Promise<OperationCategoryCard[]> {
    return this.fetch<OperationCategoryCard[]>('/factory/operation-categories');
  }

  async getGlobalIndicators(): Promise<GlobalIndicator[]> {
    return this.fetch<GlobalIndicator[]>('/factory/global-indicators');
  }

  async getProductionEvents(limit: number = 10): Promise<ProductionEvent[]> {
    return this.fetch<ProductionEvent[]>(`/factory/events?limit=${limit}`);
  }

  async getSelectedWorkCenterDetails(workCenterId: string): Promise<SelectedWorkCenterDetails> {
    return this.fetch<SelectedWorkCenterDetails>(`/work-centers/${workCenterId}/details`);
  }

  // Equipment
  async getEquipmentSpecs(workCenterId: string): Promise<EquipmentSpec[]> {
    return this.fetch<EquipmentSpec[]>(`/work-centers/${workCenterId}/equipment`);
  }

  // Time Breakdown
  async getTimeBreakdown(workCenterId: string): Promise<TimeBreakdown[]> {
    return this.fetch<TimeBreakdown[]>(`/work-centers/${workCenterId}/time-breakdown`);
  }

  // Bottlenecks
  async getBottlenecks(topN: number = 5): Promise<any[]> {
    return this.fetch<any[]>(`/bottlenecks?top_n=${topN}`);
  }
}

export const apiService = new ApiService();

