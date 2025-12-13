import { 
  WorkCenter, 
  OperationCategoryCard,
  GlobalIndicator,
  SelectedWorkCenterDetails,
  PlanningLayer,
} from '../types/prodplan';

export const mockWorkCenters: WorkCenter[] = [
  { 
    id: "MC-01", 
    name: "Linha de Corte 1", 
    factory: "Planta Porto", 
    area: "Corte", 
    floor: "Piso 1", 
    status: "running", 
    oee: 87, 
    currentOrder: "OP-2025-001" 
  },
  { 
    id: "MC-02", 
    name: "Prensa 250T", 
    factory: "Planta Porto", 
    area: "Quinagem", 
    floor: "Piso 1", 
    status: "down", 
    oee: 0 
  },
  { 
    id: "MC-03", 
    name: "Célula de Montagem A", 
    factory: "Planta Porto", 
    area: "Montagem", 
    floor: "Piso 2", 
    status: "idle", 
    oee: 65 
  },
];

export const mockOperationCategories: OperationCategoryCard[] = [
  { label: 'Operação contínua', utilizationPct: 45 },
  { label: 'Setup & mudança de série', utilizationPct: 25 },
  { label: 'Logística interna', utilizationPct: 15 },
  { label: 'Fluxo de ordens', utilizationPct: 15 },
];

export const mockGlobalIndicators: GlobalIndicator[] = [
  { label: 'OEE', value: 78 },
  { label: 'Utilização', value: 85 },
  { label: 'Lead time', value: 5.2 },
  { label: 'Entregas a tempo', value: 92 },
  { label: 'WIP', value: 145 },
];

export const mockSelectedWorkCenter: SelectedWorkCenterDetails = {
  workCenterId: 'MC-01',
  name: 'Linha de Corte 1',
  resourceType: 'Linha de produção',
  category: 'Corte',
  equipmentTypes: ['Prensas', 'Quinadeiras', 'Laser'],
  capacityConstraints: ['Setup mínimo 30min', 'Capacidade máxima 1000 un/dia'],
  bottleneckManagement: ['Priorização de ordens VIP', 'Balanceamento de carga'],
  orderDependencies: ['Depende de matéria-prima', 'Antecede montagem'],
  totalOperationsInQueue: 23,
  onTimeDeliveryAccuracy: 87.5,
  productFamilies: ['Família A', 'Família B', 'Família C'],
  newProductsWithoutHistory: 3,
};

export const mockPlanningLayers: PlanningLayer[] = [
  { id: '1', label: 'Planeamento de médio prazo', description: 'Distant Connection' },
  { id: '2', label: 'Sequenciamento no chão de fábrica', description: 'Local Connection' },
  { id: '3', label: 'Padrão de ordens (mix de produto)', description: 'Input Pattern' },
  { id: '4', label: 'Modelo de gargalos', description: 'Causal Model' },
  { id: '5', label: 'Ligação a operadores e turnos', description: 'Motor Connection' },
];


