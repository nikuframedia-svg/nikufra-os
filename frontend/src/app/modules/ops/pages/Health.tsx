/**
 * OPS Health - Dashboard de saúde do sistema
 * Industrial UI
 */

import { useNavigate } from 'react-router-dom';
import {
  tokens,
  Panel,
  SectionHeader,
  DenseTable,
  Badge,
  Loading,
  Empty,
  Error as ErrorState,
  NotSupportedState,
  PageCommandBox,
  DataFreshnessChip,
} from '../../../../ui-kit';
import { useOpsHealth, useFeatureGates } from '../../../../api/hooks';

// Status Indicator
const StatusIndicator = ({ status }: { status: string }) => {
  const isUp = status === 'up' || status === 'healthy' || status === 'ok' || status === 'connected';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: tokens.borderRadius.circle,
        backgroundColor: isUp ? tokens.colors.status.success : tokens.colors.status.error,
      }} />
      <span style={{
        fontSize: tokens.typography.fontSize.body.sm,
        color: isUp ? tokens.colors.status.success : tokens.colors.status.error,
        fontWeight: tokens.typography.fontWeight.medium,
      }}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    </div>
  );
};

export default function OpsHealth() {
  const navigate = useNavigate();
  const health = useOpsHealth();
  const featureGates = useFeatureGates();

  if (health.isLoading && !health.data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          System Health
        </h1>
        <Loading />
      </div>
    );
  }

  if (health.isError) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          System Health
        </h1>
        <ErrorState message="Erro ao carregar saúde do sistema" reason={health.errorMessage} />
      </div>
    );
  }

  const healthData: any = health.data || {};
  const gatesData: any = featureGates.data || {};

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onSearch={() => {}} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.lg }}>
        <div>
          <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, margin: 0, marginBottom: tokens.spacing.xs }}>
            System Health
          </h1>
          <p style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary, margin: 0 }}>
            Monitorização de serviços e dados
          </p>
        </div>
        {healthData && 'generated_at' in healthData ? (
          <DataFreshnessChip lastIngestion={String(healthData.generated_at)} />
        ) : null}
      </div>

      {/* Status KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <Panel>
          <SectionHeader title="API" />
          <StatusIndicator status={healthData.api_status || healthData.status || 'unknown'} />
        </Panel>
        <Panel>
          <SectionHeader title="Database" />
          <StatusIndicator status={healthData.db_status || healthData.database || 'unknown'} />
        </Panel>
        <Panel>
          <SectionHeader title="Redis" />
          <StatusIndicator status={healthData.redis_status || healthData.redis || 'unknown'} />
        </Panel>
      </div>

      {/* Last Ingestion */}
      <Panel style={{ marginBottom: tokens.spacing.lg }}>
        <SectionHeader title="Última Ingestão" />
        <NotSupportedState
          reason="Endpoint /ops/ingestion/status não existe no backend"
          suggestion="Use /api/ingestion/status/{run_id} para status de uma run específica"
          feature="ops.ingestion.status"
        />
      </Panel>

      {/* Feature Gates */}
      <Panel style={{ marginBottom: tokens.spacing.lg }}>
        <SectionHeader 
          title="Feature Gates" 
          actions={
            <button
              onClick={() => navigate('/ops/feature-gates')}
              style={{
                padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: tokens.borderRadius.button,
                color: tokens.colors.text.secondary,
                fontSize: tokens.typography.fontSize.body.xs,
                cursor: 'pointer',
              }}
            >
              Ver todas →
            </button>
          }
        />
        {featureGates.isLoading ? (
          <Loading />
        ) : gatesData && Object.keys(gatesData).length > 0 ? (
          <DenseTable<{ name: string; status: string; reason?: string }>
            columns={[
              { key: 'name', header: 'Feature', render: (row) => row.name },
              { key: 'status', header: 'Status', render: (row) => (
                <Badge variant={row.status === 'ON' ? 'success' : 'danger'}>
                  {row.status}
                </Badge>
              )},
              { key: 'reason', header: 'Reason', render: (row) => row.reason || 'N/A' },
            ]}
            data={Object.entries(gatesData).slice(0, 10).map(([key, value]: [string, any]) => ({
              name: key,
              status: value?.status || value?.enabled ? 'ON' : 'OFF',
              reason: value?.reason,
            }))}
          />
        ) : (
          <Empty message="Nenhum feature gate configurado" />
        )}
      </Panel>

      {/* Quick Links */}
      <Panel>
        <SectionHeader title="Quick Actions" />
        <div style={{ display: 'flex', gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/ops/ingestion')}
            style={{
              padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
              backgroundColor: tokens.colors.card.elevated,
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: tokens.borderRadius.button,
              color: tokens.colors.text.body,
              fontSize: tokens.typography.fontSize.body.sm,
              cursor: 'pointer',
            }}
          >
            📥 Ver Ingestão
          </button>
          <button
            onClick={() => navigate('/ops/data-contract')}
            style={{
              padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
              backgroundColor: tokens.colors.card.elevated,
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: tokens.borderRadius.button,
              color: tokens.colors.text.body,
              fontSize: tokens.typography.fontSize.body.sm,
              cursor: 'pointer',
            }}
          >
            📋 Data Contract
          </button>
          <button
            onClick={() => navigate('/ops/performance')}
            style={{
              padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
              backgroundColor: tokens.colors.card.elevated,
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: tokens.borderRadius.button,
              color: tokens.colors.text.body,
              fontSize: tokens.typography.fontSize.body.sm,
              cursor: 'pointer',
            }}
          >
            ⚡ Performance
          </button>
        </div>
      </Panel>
    </div>
  );
}
