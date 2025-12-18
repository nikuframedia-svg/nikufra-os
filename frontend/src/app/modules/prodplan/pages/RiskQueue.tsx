/**
 * PRODPLAN Risk Queue - Ordens em risco de atraso
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
} from '../../../../ui-kit';
import { useRiskQueue } from '../../../../api/hooks';

export default function ProdplanRiskQueue() {
  const navigate = useNavigate();
  const riskQueue = useRiskQueue(50);

  if (riskQueue.isLoading && !riskQueue.data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Risk Queue
        </h1>
        <Loading />
      </div>
    );
  }

  if (riskQueue.isNotSupported) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Risk Queue
        </h1>
        <NotSupportedState feature="Risk Queue" reason={riskQueue.notSupportedReason || 'Dados não disponíveis'} />
      </div>
    );
  }

  if (riskQueue.isError) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Risk Queue
        </h1>
        <ErrorState message="Erro ao carregar fila de risco" reason={riskQueue.errorMessage} />
      </div>
    );
  }

  if (riskQueue.isEmpty) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Risk Queue
        </h1>
        <Empty message="Nenhuma ordem em risco. Excelente!" />
      </div>
    );
  }

  const orders = riskQueue.data || [];

  return (
    <div style={{ padding: tokens.spacing.lg, minHeight: '100vh' }}>
      <PageCommandBox onSearch={() => {}} />

      {/* Header */}
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, margin: 0, marginBottom: tokens.spacing.xs }}>
          Risk Queue
        </h1>
        <p style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary, margin: 0 }}>
          Ordens em risco de atraso - {orders.length} ordens
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <div style={{
          padding: tokens.spacing.md,
          backgroundColor: tokens.colors.status.error + '20',
          borderRadius: tokens.borderRadius.card,
          borderLeft: `4px solid ${tokens.colors.status.error}`,
        }}>
          <div style={{ fontSize: tokens.typography.fontSize.title.md, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title }}>
            {orders.filter((o: any) => o.risk_score && o.risk_score > 0.7).length}
          </div>
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.secondary }}>
            High Risk
          </div>
        </div>
        <div style={{
          padding: tokens.spacing.md,
          backgroundColor: tokens.colors.status.warning + '20',
          borderRadius: tokens.borderRadius.card,
          borderLeft: `4px solid ${tokens.colors.status.warning}`,
        }}>
          <div style={{ fontSize: tokens.typography.fontSize.title.md, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title }}>
            {orders.filter((o: any) => o.risk_score && o.risk_score > 0.4 && o.risk_score <= 0.7).length}
          </div>
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.secondary }}>
            Medium Risk
          </div>
        </div>
        <div style={{
          padding: tokens.spacing.md,
          backgroundColor: tokens.colors.card.elevated,
          borderRadius: tokens.borderRadius.card,
          borderLeft: `4px solid ${tokens.colors.border}`,
        }}>
          <div style={{ fontSize: tokens.typography.fontSize.title.md, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title }}>
            {orders.filter((o: any) => !o.risk_score || o.risk_score <= 0.4).length}
          </div>
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.secondary }}>
            Low Risk
          </div>
        </div>
      </div>

      {/* Table */}
      <Panel>
        <SectionHeader title="Ordens em Risco" subtitle="Clique numa ordem para ver detalhes" />
        <DenseTable<any>
          columns={[
            { key: 'of_id', header: 'OF ID', render: (row: any) => row.of_id },
            { key: 'produto', header: 'Produto', render: (row: any) => row.produto_id?.toString() || 'N/A' },
            { key: 'fase', header: 'Fase Atual', render: (row: any) => row.fase_id?.toString() || 'N/A' },
            { key: 'due', header: 'Due Date', render: (row: any) => row.due_date ? new Date(row.due_date).toLocaleDateString() : 'N/A' },
            { key: 'eta', header: 'ETA', render: (row: any) => row.eta ? new Date(row.eta).toLocaleDateString() : 'N/A' },
            { key: 'risk', header: 'Risk Score', render: (row: any) => (
              <Badge variant={row.risk_score && row.risk_score > 0.7 ? 'danger' : row.risk_score && row.risk_score > 0.4 ? 'warning' : 'default'}>
                {row.risk_score?.toFixed(2) || 'N/A'}
              </Badge>
            )},
            { key: 'reason', header: 'Reason', render: (row: any) => row.reason || 'ETA > Due Date' },
          ]}
          data={orders}
          onRowClick={(row: any) => navigate(`/prodplan/orders/${row.of_id}`)}
        />
      </Panel>
    </div>
  );
}
