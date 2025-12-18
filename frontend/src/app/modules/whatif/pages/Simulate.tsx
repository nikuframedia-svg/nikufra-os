/**
 * WHAT-IF Simulate - Simulador determinístico COMPLETO
 * Endpoints: /whatif/simulate, /api/whatif/vip, /api/whatif/avaria
 * Industrial: form rigoroso, resultados comparativos, affected orders
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Panel,
  SectionHeader,
  DenseTable,
  Button,
  Input,
  Select,
  Loading,
  Error as ErrorComponent,
  NotSupportedState,
  PageCommandBox,
  DataFreshnessChip,
  tokens,
} from '../../../../ui-kit';
import { whatifApi } from '../../../../api/api-client';
import { toast } from '../../../../ui-kit';

interface SimulationResult {
  baseline_kpis: {
    otd_pct: number;
    lead_time_h: number;
    makespan_h?: number;
  };
  simulated_kpis: {
    otd_pct: number;
    lead_time_h: number;
    makespan_h?: number;
  };
  delta_kpis: {
    otd_pct: number;
    lead_time_h: number;
    makespan_h?: number;
  };
  top_affected_orders?: Array<{
    of_id: string;
    delta_lead_time_h?: number;
    new_status?: string;
  }>;
  scenario_hash?: string;
  engine_version?: string;
  generated_at?: string;
}

// Delta Badge
const DeltaBadge: React.FC<{ value: number; isPositive: boolean; unit?: string }> = ({ value, isPositive, unit }) => {
  const color = isPositive ? tokens.colors.status.success : tokens.colors.status.error;
  const sign = value >= 0 ? '+' : '';
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: `2px ${tokens.spacing.sm}`,
      backgroundColor: color + '20',
      color: color,
      fontSize: tokens.typography.fontSize.label,
      fontWeight: tokens.typography.fontWeight.semibold,
      borderRadius: tokens.borderRadius.badge,
      border: `1px solid ${color}40`,
    }}>
      {sign}{value.toFixed(1)}{unit}
    </span>
  );
};

// KPI Comparison Card
const KPIComparisonCard: React.FC<{
  label: string;
  baseline: number;
  simulated: number;
  delta: number;
  unit: string;
  higherIsBetter?: boolean;
}> = ({ label, baseline, simulated, delta, unit, higherIsBetter = true }) => {
  const isImprovement = higherIsBetter ? delta > 0 : delta < 0;
  
  return (
    <div style={{
      backgroundColor: tokens.colors.card.elevated,
      borderRadius: tokens.borderRadius.card,
      padding: tokens.spacing.md,
      border: `1px solid ${tokens.colors.border}`,
    }}>
      <div style={{ 
        fontSize: tokens.typography.fontSize.label, 
        color: tokens.colors.text.muted,
        textTransform: 'uppercase',
        letterSpacing: tokens.typography.letterSpacing.uppercase,
        marginBottom: tokens.spacing.sm,
      }}>
        {label}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end',
        marginBottom: tokens.spacing.sm,
      }}>
        <div>
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.muted }}>Baseline</div>
          <div style={{ fontSize: tokens.typography.fontSize.body.md, color: tokens.colors.text.secondary }}>
            {baseline.toFixed(1)}{unit}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: `0 ${tokens.spacing.sm}` }}>
          <div style={{ fontSize: '16px', color: tokens.colors.text.muted }}>→</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.muted }}>Simulated</div>
          <div style={{ fontSize: tokens.typography.fontSize.title.md, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title }}>
            {simulated.toFixed(1)}{unit}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <DeltaBadge value={delta} isPositive={isImprovement} unit={unit} />
      </div>
    </div>
  );
};

export default function WhatIfSimulate() {
  const [priorityRule, setPriorityRule] = useState<'FIFO' | 'EDD' | 'SPT'>('FIFO');
  const [capacityOverrides, setCapacityOverrides] = useState<Record<string, string>>({});
  const [scenarioType, setScenarioType] = useState<'capacity' | 'vip' | 'avaria'>('capacity');
  
  // VIP/Avaria specific
  const [vipSku, setVipSku] = useState('');
  const [vipQuantidade, setVipQuantidade] = useState('');
  const [vipPrazo, setVipPrazo] = useState('');
  const [avariaRecurso, setAvariaRecurso] = useState('');
  const [avariaDe, setAvariaDe] = useState('');
  const [avariaAte, setAvariaAte] = useState('');

  // Standard simulation
  const simulationMutation = useMutation<SimulationResult>({
    mutationFn: async () => {
      const request: any = {
        priority_rule: priorityRule,
      };

      if (Object.keys(capacityOverrides).length > 0) {
        const capacity: Record<string, Record<string, number>> = {};
        Object.entries(capacityOverrides).forEach(([key, value]) => {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            capacity[key] = { throughput_multiplier: numValue };
          }
        });
        if (Object.keys(capacity).length > 0) {
          request.capacity_overrides = capacity;
        }
      }

      return whatifApi.simulate(request);
    },
    onSuccess: () => {
      toast.success('Simulação executada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao executar simulação');
    },
  });

  // VIP simulation
  const vipMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/whatif/vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: vipSku,
          quantidade: parseInt(vipQuantidade) || 0,
          prazo: vipPrazo,
        }),
      });
      if (!response.ok) throw new Error('VIP simulation failed');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Simulação VIP executada');
    },
    onError: () => {
      toast.error('Erro na simulação VIP');
    },
  });

  // Avaria simulation
  const avariaMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/whatif/avaria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recurso: avariaRecurso,
          de: avariaDe,
          ate: avariaAte,
        }),
      });
      if (!response.ok) throw new Error('Avaria simulation failed');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Simulação de avaria executada');
    },
    onError: () => {
      toast.error('Erro na simulação de avaria');
    },
  });

  const handleSimulate = () => {
    switch (scenarioType) {
      case 'vip':
        vipMutation.mutate();
        break;
      case 'avaria':
        avariaMutation.mutate();
        break;
      default:
        simulationMutation.mutate();
    }
  };

  const isPending = simulationMutation.isPending || vipMutation.isPending || avariaMutation.isPending;
  const result = simulationMutation.data;
  const error = simulationMutation.error || vipMutation.error || avariaMutation.error;

  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = String(error.message);
    if (errorMessage.includes('NOT_SUPPORTED_BY_DATA')) {
      return (
        <div style={{ padding: tokens.spacing.lg }}>
          <NotSupportedState reason={errorMessage} feature="whatif.simulate" />
        </div>
      );
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: tokens.colors.background,
      padding: tokens.spacing.lg,
    }}>
      <PageCommandBox onSearch={() => {}} />
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: tokens.spacing.xl,
        paddingBottom: tokens.spacing.lg,
        borderBottom: `1px solid ${tokens.colors.border}`,
      }}>
        <div>
          <h1 style={{
            fontSize: tokens.typography.fontSize.title.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.text.title,
            fontFamily: tokens.typography.fontFamily,
            margin: 0,
            marginBottom: tokens.spacing.xs,
          }}>
            What-If Simulator
          </h1>
          <p style={{
            fontSize: tokens.typography.fontSize.body.sm,
            color: tokens.colors.text.secondary,
            margin: 0,
          }}>
            Simulação determinística de cenários de produção
          </p>
        </div>
        {result && 'generated_at' in result && <DataFreshnessChip lastIngestion={String(result.generated_at)} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.lg }}>
        {/* Form Panel */}
        <Panel>
          <SectionHeader title="Parâmetros de Simulação" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md, padding: tokens.spacing.sm }}>
            
            {/* Scenario Type Selector */}
            <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
              {(['capacity', 'vip', 'avaria'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setScenarioType(type)}
                  style={{
                    flex: 1,
                    padding: tokens.spacing.sm,
                    backgroundColor: scenarioType === type ? tokens.colors.primary.default + '20' : 'transparent',
                    border: `1px solid ${scenarioType === type ? tokens.colors.primary.default : tokens.colors.border}`,
                    borderRadius: tokens.borderRadius.button,
                    color: scenarioType === type ? tokens.colors.primary.default : tokens.colors.text.secondary,
                    fontSize: tokens.typography.fontSize.body.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {type === 'capacity' ? '📊 Capacity' : type === 'vip' ? '⭐ VIP' : '🔧 Avaria'}
                </button>
              ))}
            </div>

            {/* Capacity Form */}
            {scenarioType === 'capacity' && (
              <>
                <Select
                  label="Priority Rule"
                  value={priorityRule}
                  options={[
                    { value: 'FIFO', label: 'FIFO (First In, First Out)' },
                    { value: 'EDD', label: 'EDD (Earliest Due Date)' },
                    { value: 'SPT', label: 'SPT (Shortest Processing Time)' },
                  ]}
                  onChange={(e) => setPriorityRule(e.target.value as 'FIFO' | 'EDD' | 'SPT')}
                />

                <div>
                  <div style={{ fontSize: tokens.typography.fontSize.label, color: tokens.colors.text.secondary, marginBottom: tokens.spacing.xs }}>
                    Capacity Overrides (Fase ID: Multiplier)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.xs }}>
                    {Object.entries(capacityOverrides).map(([key]) => (
                      <div key={key} style={{ display: 'flex', gap: tokens.spacing.xs }}>
                        <Input
                          value={key}
                          placeholder="Fase ID"
                          readOnly
                          style={{ flex: 1 }}
                        />
                        <Input
                          value={capacityOverrides[key]}
                          onChange={(e) =>
                            setCapacityOverrides({ ...capacityOverrides, [key]: e.target.value })
                          }
                          placeholder="Multiplier (e.g., 1.5)"
                          style={{ flex: 1 }}
                        />
                        <Button
                          onClick={() => {
                            const newOverrides = { ...capacityOverrides };
                            delete newOverrides[key];
                            setCapacityOverrides(newOverrides);
                          }}
                          variant="danger"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={() => {
                        const newKey = prompt('Enter Fase ID:');
                        if (newKey) {
                          setCapacityOverrides({ ...capacityOverrides, [newKey]: '1.0' });
                        }
                      }}
                      variant="secondary"
                    >
                      + Add Capacity Override
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* VIP Form */}
            {scenarioType === 'vip' && (
              <>
                <Input
                  label="SKU"
                  value={vipSku}
                  onChange={(e) => setVipSku(e.target.value)}
                  placeholder="Enter product SKU"
                />
                <Input
                  label="Quantidade"
                  type="number"
                  value={vipQuantidade}
                  onChange={(e) => setVipQuantidade(e.target.value)}
                  placeholder="Enter quantity"
                />
                <Input
                  label="Prazo"
                  type="date"
                  value={vipPrazo}
                  onChange={(e) => setVipPrazo(e.target.value)}
                />
              </>
            )}

            {/* Avaria Form */}
            {scenarioType === 'avaria' && (
              <>
                <Input
                  label="Recurso (Machine/Worker)"
                  value={avariaRecurso}
                  onChange={(e) => setAvariaRecurso(e.target.value)}
                  placeholder="Enter resource ID"
                />
                <Input
                  label="De (Start)"
                  type="datetime-local"
                  value={avariaDe}
                  onChange={(e) => setAvariaDe(e.target.value)}
                />
                <Input
                  label="Até (End)"
                  type="datetime-local"
                  value={avariaAte}
                  onChange={(e) => setAvariaAte(e.target.value)}
                />
              </>
            )}

            <Button onClick={handleSimulate} disabled={isPending}>
              {isPending ? 'Executando...' : 'Executar Simulação'}
            </Button>
          </div>
        </Panel>

        {/* Results Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
          <Panel>
            <SectionHeader title="Resultados" />
            {isPending ? (
              <div style={{ padding: tokens.spacing.xl, textAlign: 'center' }}>
                <Loading />
              </div>
            ) : error ? (
              <ErrorComponent message="Erro ao executar simulação" />
            ) : result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md, padding: tokens.spacing.sm }}>
                <KPIComparisonCard
                  label="On-Time Delivery"
                  baseline={result.baseline_kpis?.otd_pct || 0}
                  simulated={result.simulated_kpis?.otd_pct || 0}
                  delta={result.delta_kpis?.otd_pct || 0}
                  unit="%"
                  higherIsBetter={true}
                />
                <KPIComparisonCard
                  label="Lead Time"
                  baseline={result.baseline_kpis?.lead_time_h || 0}
                  simulated={result.simulated_kpis?.lead_time_h || 0}
                  delta={result.delta_kpis?.lead_time_h || 0}
                  unit="h"
                  higherIsBetter={false}
                />
                {result.baseline_kpis?.makespan_h !== undefined && (
                  <KPIComparisonCard
                    label="Makespan"
                    baseline={result.baseline_kpis?.makespan_h || 0}
                    simulated={result.simulated_kpis?.makespan_h || 0}
                    delta={result.delta_kpis?.makespan_h || 0}
                    unit="h"
                    higherIsBetter={false}
                  />
                )}

                {result.scenario_hash && (
                  <div style={{ 
                    fontSize: tokens.typography.fontSize.body.xs, 
                    color: tokens.colors.text.muted,
                    padding: tokens.spacing.sm,
                    backgroundColor: tokens.colors.card.elevated,
                    borderRadius: tokens.borderRadius.card,
                  }}>
                    <div>Scenario Hash: {result.scenario_hash}</div>
                    {result.engine_version && <div>Engine: {result.engine_version}</div>}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: tokens.colors.text.muted, textAlign: 'center', padding: tokens.spacing.xl }}>
                Execute uma simulação para ver resultados
              </div>
            )}
          </Panel>

          {/* Affected Orders */}
          {result?.top_affected_orders && result.top_affected_orders.length > 0 && (
            <Panel>
              <SectionHeader title="Top Affected Orders" />
              <DenseTable
                columns={[
                  { key: 'of_id', header: 'OF ID', render: (row) => row.of_id },
                  { 
                    key: 'delta', 
                    header: 'Δ Lead Time', 
                    render: (row) => row.delta_lead_time_h 
                      ? <DeltaBadge value={row.delta_lead_time_h} isPositive={row.delta_lead_time_h < 0} unit="h" />
                      : 'N/A'
                  },
                  { key: 'status', header: 'Status', render: (row) => row.new_status || 'N/A' },
                ]}
                data={result.top_affected_orders}
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
