/**
 * ML Train - Dashboard de treino de modelos
 * Endpoints: /ml/train/leadtime, /ml/train/risk, /ml/models
 * Industrial: sem decoração, funcional
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Panel,
  SectionHeader,
  KPIStat,
  DenseTable,
  Button,
  Loading,
  Empty,
  PageCommandBox,
  DataFreshnessChip,
  tokens,
  toast,
} from '../../../../ui-kit';

interface Model {
  model_id: string;
  model_name: string;
  version: string;
  algorithm: string;
  metrics: Record<string, number>;
  is_active: boolean;
  created_at: string;
}

interface ModelsResponse {
  models: Model[];
  total: number;
  active_count: number;
  generated_at: string;
}

interface TrainResponse {
  status: string;
  job_id: string;
  model_name: string;
  estimated_duration_minutes: number;
  message: string;
  created_at: string;
}

// Status Badge
const ModelStatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    padding: `2px ${tokens.spacing.sm}`,
    backgroundColor: isActive ? tokens.colors.status.success + '20' : tokens.colors.status.warning + '20',
    color: isActive ? tokens.colors.status.success : tokens.colors.status.warning,
    fontSize: tokens.typography.fontSize.label,
    fontWeight: tokens.typography.fontWeight.medium,
    borderRadius: tokens.borderRadius.badge,
    border: `1px solid ${isActive ? tokens.colors.status.success : tokens.colors.status.warning}40`,
  }}>
    {isActive ? 'ACTIVE' : 'INACTIVE'}
  </span>
);

// Metrics Display
const MetricsDisplay: React.FC<{ metrics: Record<string, number> }> = ({ metrics }) => (
  <div style={{ display: 'flex', gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
    {Object.entries(metrics).slice(0, 3).map(([key, value]) => (
      <span key={key} style={{
        fontSize: tokens.typography.fontSize.label,
        color: tokens.colors.text.secondary,
        backgroundColor: tokens.colors.card.elevated,
        padding: `2px ${tokens.spacing.xs}`,
        borderRadius: tokens.borderRadius.badge,
      }}>
        {key}: {typeof value === 'number' ? value.toFixed(3) : value}
      </span>
    ))}
  </div>
);

export default function MLTrain() {
  const queryClient = useQueryClient();
  const [trainingJobs, setTrainingJobs] = useState<TrainResponse[]>([]);

  // Get models list
  const { data: modelsData, isLoading: modelsLoading } = useQuery<ModelsResponse>({
    queryKey: ['ml', 'models'],
    queryFn: async () => {
      const response = await fetch('/api/ml/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      return response.json();
    },
    staleTime: 30000,
  });

  // Train leadtime mutation
  const trainLeadtimeMutation = useMutation<TrainResponse>({
    mutationFn: async () => {
      const response = await fetch('/api/ml/train/leadtime', { method: 'POST' });
      if (!response.ok) throw new Error('Training failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Leadtime training job started: ${data.job_id}`);
      setTrainingJobs(prev => [...prev, data]);
      queryClient.invalidateQueries({ queryKey: ['ml', 'models'] });
    },
    onError: () => {
      toast.error('Failed to start leadtime training');
    },
  });

  // Train risk mutation
  const trainRiskMutation = useMutation<TrainResponse>({
    mutationFn: async () => {
      const response = await fetch('/api/ml/train/risk', { method: 'POST' });
      if (!response.ok) throw new Error('Training failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Risk training job started: ${data.job_id}`);
      setTrainingJobs(prev => [...prev, data]);
      queryClient.invalidateQueries({ queryKey: ['ml', 'models'] });
    },
    onError: () => {
      toast.error('Failed to start risk training');
    },
  });

  if (modelsLoading && !modelsData) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          ML Training
        </h1>
        <Loading />
      </div>
    );
  }

  const models = modelsData?.models || [];

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
            ML Training
          </h1>
          <p style={{
            fontSize: tokens.typography.fontSize.body.sm,
            color: tokens.colors.text.secondary,
            margin: 0,
          }}>
            Treino e gestão de modelos ML
          </p>
        </div>
        {modelsData && 'generated_at' in modelsData && <DataFreshnessChip lastIngestion={String(modelsData.generated_at)} />}
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: tokens.spacing.md,
        marginBottom: tokens.spacing.lg,
      }}>
        <Panel>
          <div style={{ padding: tokens.spacing.sm }}>
            <KPIStat label="Total Models" value={modelsData?.total || 0} />
          </div>
        </Panel>
        <Panel>
          <div style={{ padding: tokens.spacing.sm }}>
            <KPIStat label="Active Models" value={modelsData?.active_count || 0} />
          </div>
        </Panel>
        <Panel>
          <div style={{ padding: tokens.spacing.sm }}>
            <KPIStat label="Training Jobs" value={trainingJobs.length} />
          </div>
        </Panel>
      </div>

      {/* Main grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: tokens.spacing.lg,
      }}>
        {/* Models List */}
        <Panel>
          <SectionHeader title="Model Registry" />
          {models.length > 0 ? (
            <DenseTable
              columns={[
                { key: 'name', header: 'Model', render: (row: Model) => row.model_name },
                { key: 'version', header: 'Version', render: (row: Model) => row.version },
                { key: 'algorithm', header: 'Algorithm', render: (row: Model) => row.algorithm },
                { key: 'status', header: 'Status', render: (row: Model) => <ModelStatusBadge isActive={row.is_active} /> },
                { key: 'metrics', header: 'Metrics', render: (row: Model) => <MetricsDisplay metrics={row.metrics} /> },
                { 
                  key: 'created', 
                  header: 'Created', 
                  render: (row: Model) => new Date(row.created_at).toLocaleDateString() 
                },
              ]}
              data={models}
            />
          ) : (
            <Empty message="Sem modelos registados" />
          )}
        </Panel>

        {/* Training Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
          <Panel>
            <SectionHeader title="Train New Model" />
            <div style={{ padding: tokens.spacing.sm, display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
              <div style={{
                padding: tokens.spacing.md,
                backgroundColor: tokens.colors.card.elevated,
                borderRadius: tokens.borderRadius.card,
              }}>
                <div style={{ 
                  fontSize: tokens.typography.fontSize.body.sm, 
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.text.title,
                  marginBottom: tokens.spacing.xs,
                }}>
                  Lead Time Prediction
                </div>
                <div style={{ 
                  fontSize: tokens.typography.fontSize.body.xs, 
                  color: tokens.colors.text.secondary,
                  marginBottom: tokens.spacing.sm,
                }}>
                  Gradient Boosting model for predicting order lead times
                </div>
                <Button
                  onClick={() => trainLeadtimeMutation.mutate()}
                  disabled={trainLeadtimeMutation.isPending}
                >
                  {trainLeadtimeMutation.isPending ? 'Training...' : 'Start Training'}
                </Button>
              </div>

              <div style={{
                padding: tokens.spacing.md,
                backgroundColor: tokens.colors.card.elevated,
                borderRadius: tokens.borderRadius.card,
              }}>
                <div style={{ 
                  fontSize: tokens.typography.fontSize.body.sm, 
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.text.title,
                  marginBottom: tokens.spacing.xs,
                }}>
                  Defect Risk Prediction
                </div>
                <div style={{ 
                  fontSize: tokens.typography.fontSize.body.xs, 
                  color: tokens.colors.text.secondary,
                  marginBottom: tokens.spacing.sm,
                }}>
                  Random Forest model for predicting defect risk
                </div>
                <Button
                  onClick={() => trainRiskMutation.mutate()}
                  disabled={trainRiskMutation.isPending}
                >
                  {trainRiskMutation.isPending ? 'Training...' : 'Start Training'}
                </Button>
              </div>
            </div>
          </Panel>

          {/* Recent Training Jobs */}
          {trainingJobs.length > 0 && (
            <Panel>
              <SectionHeader title="Recent Jobs" />
              <div style={{ padding: tokens.spacing.sm }}>
                {trainingJobs.map((job, idx) => (
                  <div key={idx} style={{
                    padding: tokens.spacing.sm,
                    borderBottom: idx < trainingJobs.length - 1 ? `1px solid ${tokens.colors.border}` : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.body }}>
                        {job.model_name}
                      </span>
                      <span style={{
                        fontSize: tokens.typography.fontSize.label,
                        color: job.status === 'queued' ? tokens.colors.status.warning : tokens.colors.status.success,
                      }}>
                        {job.status}
                      </span>
                    </div>
                    <div style={{ fontSize: tokens.typography.fontSize.label, color: tokens.colors.text.muted }}>
                      Job ID: {job.job_id}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
