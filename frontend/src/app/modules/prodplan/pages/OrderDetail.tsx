/**
 * PRODPLAN Order Detail - Timeline de fases de uma ordem
 * Industrial UI
 */

import { useParams, useNavigate } from 'react-router-dom';
import {
  tokens,
  Panel,
  SectionHeader,
  KPIStat,
  DenseTable,
  Badge,
  Loading,
  Empty,
  Error as ErrorState,
  NotSupportedState,
  PageCommandBox,
  DataFreshnessChip,
} from '../../../../ui-kit';
import { useOrderDetails, type OrderPhase } from '../../../../api/hooks';

// Timeline Item Component
const TimelineItem = ({ phase, isLast }: { phase: OrderPhase; isLast: boolean }) => {
  const statusColors: Record<string, string> = {
    PENDING: tokens.colors.text.muted,
    IN_PROGRESS: tokens.colors.status.warning,
    DONE: tokens.colors.status.success,
  };

  const statusIcons: Record<string, string> = {
    PENDING: '○',
    IN_PROGRESS: '◐',
    DONE: '●',
  };

  return (
    <div style={{ display: 'flex', gap: tokens.spacing.md }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px' }}>
        <span style={{ fontSize: '16px', color: statusColors[phase.status] || tokens.colors.text.muted }}>
          {statusIcons[phase.status] || '○'}
        </span>
        {!isLast && (
          <div style={{
            flex: 1,
            width: '2px',
            backgroundColor: phase.status === 'DONE' ? tokens.colors.status.success : tokens.colors.border,
            marginTop: tokens.spacing.xs,
          }} />
        )}
      </div>

      <div style={{ flex: 1, paddingBottom: isLast ? 0 : tokens.spacing.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.xs }}>
          <div>
            <div style={{ fontSize: tokens.typography.fontSize.body.md, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.text.title }}>
              {phase.fase_nome}
            </div>
            <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.muted }}>
              Fase {phase.fase_id}
            </div>
          </div>
          <Badge variant={phase.status === 'DONE' ? 'success' : phase.status === 'IN_PROGRESS' ? 'warning' : 'default'}>
            {phase.status}
          </Badge>
        </div>

        {(phase.started_at || phase.ended_at) && (
          <div style={{ display: 'flex', gap: tokens.spacing.lg, fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.secondary }}>
            {phase.started_at && <span>Início: {new Date(phase.started_at).toLocaleString()}</span>}
            {phase.ended_at && <span>Fim: {new Date(phase.ended_at).toLocaleString()}</span>}
          </div>
        )}

        {phase.duration_hours !== null && (
          <div style={{
            display: 'flex',
            gap: tokens.spacing.md,
            marginTop: tokens.spacing.sm,
            padding: tokens.spacing.sm,
            backgroundColor: tokens.colors.card.elevated,
            borderRadius: tokens.borderRadius.card,
            fontSize: tokens.typography.fontSize.body.sm,
          }}>
            <span><strong>Duração:</strong> {phase.duration_hours.toFixed(1)}h</span>
            {phase.desvio_hours !== null && (
              <span style={{ color: phase.desvio_hours > 0 ? tokens.colors.status.error : tokens.colors.status.success }}>
                <strong>Desvio:</strong> {phase.desvio_hours > 0 ? '+' : ''}{phase.desvio_hours.toFixed(1)}h
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProdplanOrderDetail() {
  const { ofId } = useParams<{ ofId: string }>();
  const navigate = useNavigate();
  const { order, phases } = useOrderDetails(ofId || '');

  if (order.isLoading && !order.data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Ordem {ofId}
        </h1>
        <Loading />
      </div>
    );
  }

  if (order.isError) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Ordem {ofId}
        </h1>
        <ErrorState message="Erro ao carregar ordem" reason={order.errorMessage} />
      </div>
    );
  }

  if (order.isNotSupported) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Ordem {ofId}
        </h1>
        <NotSupportedState feature="Order Detail" reason={order.notSupportedReason || 'Dados não disponíveis'} />
      </div>
    );
  }

  const orderData = order.data;

  return (
    <div style={{ padding: tokens.spacing.lg, minHeight: '100vh' }}>
      <PageCommandBox onSearch={() => {}} />
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.lg }}>
        <div>
          <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, margin: 0 }}>
            Ordem {ofId}
          </h1>
          {orderData?.status && (
            <p style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary, margin: 0, marginTop: tokens.spacing.xs }}>
              Status: {orderData.status}
            </p>
          )}
        </div>
        {phases.data && phases.data.length > 0 && (
          <DataFreshnessChip lastIngestion={new Date().toISOString()} />
        )}
        <button
          onClick={() => navigate('/prodplan/orders')}
          style={{
            padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
            backgroundColor: 'transparent',
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: tokens.borderRadius.button,
            color: tokens.colors.text.secondary,
            fontSize: tokens.typography.fontSize.body.sm,
            cursor: 'pointer',
          }}
        >
          ← Voltar
        </button>
      </div>

      {/* Order KPIs */}
      {orderData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <KPIStat label="Status" value={orderData.status || 'CREATED'} />
          <KPIStat label="Produto" value={orderData.of_produto_id?.toString() ?? '—'} />
          <KPIStat label="Fase Atual" value={orderData.of_fase_id?.toString() ?? '—'} />
          <KPIStat label="Due Date" value={orderData.due_date ? new Date(orderData.due_date).toLocaleDateString() : '—'} />
          <KPIStat label="ETA" value={orderData.eta ? new Date(orderData.eta).toLocaleDateString() : '—'} />
        </div>
      )}

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.lg }}>
        {/* Timeline */}
        <Panel>
          <SectionHeader title="Timeline de Fases" subtitle="Progresso da ordem" />

          {phases.isLoading && !phases.data && <Loading />}
          {phases.isError && <ErrorState message="Erro ao carregar fases" reason={phases.errorMessage} />}
          {phases.isEmpty && <Empty message="Sem fases registadas" />}

          {phases.data && phases.data.length > 0 && (
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {phases.data.map((phase, idx) => (
                <TimelineItem key={phase.of_fase_id} phase={phase} isLast={idx === phases.data!.length - 1} />
              ))}
            </div>
          )}
        </Panel>

        {/* Phases table */}
        <Panel>
          <SectionHeader title="Detalhes das Fases" subtitle="Durações e desvios" />

          {phases.data && phases.data.length > 0 ? (
            <DenseTable<OrderPhase>
              columns={[
                { key: 'fase', header: 'Fase', render: (row) => row.fase_nome },
                { key: 'status', header: 'Status', render: (row) => (
                  <Badge variant={row.status === 'DONE' ? 'success' : row.status === 'IN_PROGRESS' ? 'warning' : 'default'}>
                    {row.status}
                  </Badge>
                )},
                { key: 'duration', header: 'Duração', render: (row) => row.duration_hours !== null ? `${row.duration_hours.toFixed(1)}h` : '—' },
                { key: 'desvio', header: 'Desvio', render: (row) => row.desvio_hours !== null ? (
                  <span style={{ color: row.desvio_hours > 0 ? tokens.colors.status.error : tokens.colors.status.success }}>
                    {row.desvio_hours > 0 ? '+' : ''}{row.desvio_hours.toFixed(1)}h
                  </span>
                ) : '—' },
              ]}
              data={phases.data}
            />
          ) : (
            <Empty message="Sem dados" />
          )}
        </Panel>
      </div>

      {/* Dates */}
      {orderData && (
        <Panel style={{ marginTop: tokens.spacing.lg }}>
          <SectionHeader title="Datas" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: tokens.spacing.md }}>
            <KPIStat label="Data Criação" value={orderData.of_data_criacao ? new Date(orderData.of_data_criacao).toLocaleDateString() : '—'} />
            <KPIStat label="Data Acabamento" value={orderData.of_data_acabamento ? new Date(orderData.of_data_acabamento).toLocaleDateString() : '—'} />
            <KPIStat label="Data Transporte" value={orderData.of_data_transporte ? new Date(orderData.of_data_transporte).toLocaleDateString() : '—'} />
          </div>
        </Panel>
      )}
    </div>
  );
}
