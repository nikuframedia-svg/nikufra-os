/**
 * Type definitions for ProdPlan 4.0 OS
 */

export interface WorkCenter {
  id: string;                // ex: "MC-01"
  name: string;              // ex: "Prensa Hidráulica 250T"
  factory: string;           // ex: "Planta Porto"
  area: string;              // ex: "Corte e Quinagem"
  floor: string;             // ex: "Piso 1"
  status: 'running' | 'idle' | 'down' | 'setup';
  oee: number;               // 0–100
  currentOrder?: string;     // ex: "OP-2025-001"
}

export interface WorkCenterKpiBreakdown {
  workCenterId: string;
  horizon: 'last_8h' | 'last_24h';
  setupPct: number;
  productionPct: number;
  internalLogisticsPct: number;
  qualityPct: number;
  monitoringPct: number;
  otherPct: number;
}

export interface FactoryOverviewMetrics {
  totalWorkCenters: number;
  predictiveAccuracy: number;  // 0–100
  activeOrders: number;
  newAlerts: number;
}

export interface EquipmentSpec {
  id: string;
  name: string;
  category: 'arm' | 'wheel' | 'sensor' | 'camera' | 'controller' | 'other';
  quantity: number;
}

export interface OperationCategoryCard {
  label: string;
  utilizationPct: number;
}

export interface TimeBreakdown {
  label: string;
  pct: number;
}

export interface GlobalIndicator {
  label: string;
  value: number;
  unit?: string;
}

export interface ProductionEvent {
  id: string;
  type: 'quality_alert' | 'unplanned_downtime' | 'capacity_conflict' | 'order_completed' | 
        'operator_notification' | 'order_released' | 'production_start' | 'sequence_update' | 
        'predictive_maintenance';
  label: string;
  timestamp: Date;
  severity?: 'low' | 'medium' | 'high';
}

export interface SelectedWorkCenterDetails {
  workCenterId: string;
  name: string;
  resourceType: string;
  category: string;
  equipmentTypes: string[];
  capacityConstraints: string[];
  bottleneckManagement: string[];
  orderDependencies: string[];
  totalOperationsInQueue: number;
  onTimeDeliveryAccuracy: number;
  productFamilies: string[];
  newProductsWithoutHistory: number;
}

export interface PlanningLayer {
  id: string;
  label: string;
  description: string;
}

export interface BottleneckModel {
  id: string;
  criticalResource: string;
  description: string;
}


