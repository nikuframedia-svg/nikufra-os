/**
 * Feature Gates - Sistema de controle de features baseado em dados
 * Prioridade: API endpoint > FEATURE_GATES.json > Safe defaults
 */

export type FeatureGateStatus = 'ON' | 'OFF';

export interface FeatureGate {
  feature: string;
  status: FeatureGateStatus;
  reason?: string;
  match_rate?: number;
  suggestion?: string;
}

export interface FeatureGatesConfig {
  gates: Record<string, FeatureGate>;
  generated_at?: string;
}

// Safe defaults - features críticas desativadas por padrão
const SAFE_DEFAULTS: Record<string, FeatureGate> = {
  'kpis.by_employee': {
    feature: 'kpis.by_employee',
    status: 'OFF',
    reason: 'Match rate FuncionarioFaseOf_FaseOfId ↔ FaseOf_Id: 32.3% (below threshold)',
    match_rate: 0.323,
    suggestion: 'Improve data quality for employee-phase relationships',
  },
  'inventory.real_stock': {
    feature: 'inventory.real_stock',
    status: 'OFF',
    reason: 'No real stock data available',
  },
  'machines.*': {
    feature: 'machines.*',
    status: 'OFF',
    reason: 'No machine data available',
  },
  'ml.risk': {
    feature: 'ml.risk',
    status: 'OFF',
    reason: 'ML risk model not active',
  },
  'ml.explain': {
    feature: 'ml.explain',
    status: 'ON', // Default ON, will be checked against endpoint availability
  },
};

let cachedGates: FeatureGatesConfig | null = null;

/**
 * Load feature gates from API or JSON file
 */
export async function loadFeatureGates(): Promise<FeatureGatesConfig> {
  // Try API endpoint first
  try {
    const response = await fetch('/api/ops/feature-gates');
    if (response.ok) {
      const data = await response.json();
      cachedGates = data;
      return data;
    }
  } catch (error) {
    console.warn('Feature gates API not available, trying JSON file');
  }

  // Try JSON file
  try {
    const response = await fetch('/FEATURE_GATES.json');
    if (response.ok) {
      const data = await response.json();
      cachedGates = data;
      return data;
    }
  } catch (error) {
    console.warn('FEATURE_GATES.json not found, using safe defaults');
  }

  // Fallback to safe defaults
  return {
    gates: SAFE_DEFAULTS,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Get feature gate status
 */
export function getFeatureGate(feature: string): FeatureGate {
  if (!cachedGates) {
    return SAFE_DEFAULTS[feature] || { feature, status: 'OFF', reason: 'Feature gate not configured' };
  }

  // Check exact match
  if (cachedGates.gates[feature]) {
    return cachedGates.gates[feature];
  }

  // Check wildcard patterns (e.g., 'machines.*')
  for (const [pattern, gate] of Object.entries(cachedGates.gates)) {
    if (pattern.endsWith('.*') && feature.startsWith(pattern.slice(0, -2))) {
      return gate;
    }
  }

  // Default to OFF if not found
  return { feature, status: 'OFF', reason: 'Feature gate not configured' };
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  return getFeatureGate(feature).status === 'ON';
}

/**
 * Initialize feature gates (call on app startup)
 */
export async function initFeatureGates(): Promise<void> {
  await loadFeatureGates();
}

