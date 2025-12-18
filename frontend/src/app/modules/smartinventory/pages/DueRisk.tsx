/**
 * SMARTINVENTORY Due Risk - Ordens em risco de atraso
 * Industrial: denso, estados completos
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Panel,
  SectionHeader,
  DenseTable,
  KPIStat,
  Badge,
  Loading,
  Empty,
  Error as ErrorState,
  NotSupportedState,
  PageCommandBox,
  DataFreshnessChip,
  tokens,
} from '../../../../ui-kit';
import { smartinventoryApi } from '../../../../api/api-client';

export default function SmartInventoryDueRisk() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bucket = searchParams.get('bucket') || 'all';

  const { data, isLoading, error } = useQuery({
    queryKey: ['smartinventory', 'due_risk', bucket],
    queryFn: () => smartinventoryApi.getDueRisk(),
    staleTime: 30000,
  });

  if (isLoading && !data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Due Risk Analysis
        </h1>
        <Loading />
      </div>
    );
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = String(error.message);
    if (errorMessage.includes('NOT_SUPPORTED_BY_DATA')) {
      return (
        <div style={{ padding: tokens.spacing.lg }}>
          <PageCommandBox onSearch={() => {}} />
          <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
            Due Risk Analysis
          </h1>
          <NotSupportedState reason={errorMessage} feature="smartinventory.due-risk" />
        </div>
      );
    }
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Due Risk Analysis
        </h1>
        <ErrorState message="Erro ao carregar due risk" reason={error instanceof Error ? error.message : 'Unknown error'} />
      </div>
    );
  }

  const orders = data?.due_risk_items || [];
  
  // Categorize by risk_bucket if available, otherwise by due date
  const categorized = {
    overdue: orders.filter((o: any) => o.risk_bucket === 'OVERDUE' || (!o.risk_bucket && o.due_date && new Date(o.due_date) < new Date())),
    due_7d: orders.filter((o: any) => o.risk_bucket === 'DUE_7D'),
    due_14d: orders.filter((o: any) => o.risk_bucket === 'DUE_14D'),
    safe: orders.filter((o: any) => o.risk_bucket === 'SAFE'),
  };

  const displayOrders = bucket === 'all' ? orders :
    bucket === 'overdue' ? categorized.overdue :
    bucket === 'due_7d' ? categorized.due_7d :
    bucket === 'due_14d' ? categorized.due_14d :
    categorized.safe;

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onSearch={() => {}} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, margin: 0 }}>
          Due Risk Analysis
        </h1>
        {data && 'generated_at' in data && <DataFreshnessChip lastIngestion={String(data.generated_at)} />}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <div 
          onClick={() => navigate('/smartinventory/due-risk?bucket=overdue')}
          style={{ cursor: 'pointer' }}
        >
          <KPIStat label="Overdue" value={categorized.overdue.length} />
          {bucket === 'overdue' && <Badge variant="danger">Selecionado</Badge>}
        </div>
        <div 
          onClick={() => navigate('/smartinventory/due-risk?bucket=due_7d')}
          style={{ cursor: 'pointer' }}
        >
          <KPIStat label="Due 7d" value={categorized.due_7d.length} />
          {bucket === 'due_7d' && <Badge variant="warning">Selecionado</Badge>}
        </div>
        <div 
          onClick={() => navigate('/smartinventory/due-risk?bucket=due_14d')}
          style={{ cursor: 'pointer' }}
        >
          <KPIStat label="Due 14d" value={categorized.due_14d.length} />
          {bucket === 'due_14d' && <Badge variant="default">Selecionado</Badge>}
        </div>
        <div 
          onClick={() => navigate('/smartinventory/due-risk?bucket=safe')}
          style={{ cursor: 'pointer' }}
        >
          <KPIStat label="Safe" value={categorized.safe.length} />
          {bucket === 'safe' && <Badge variant="success">Selecionado</Badge>}
        </div>
      </div>

      <Panel>
        <SectionHeader 
          title={`Ordens em Risco${bucket !== 'all' ? ` (${bucket})` : ''}`} 
          subtitle="Clique numa ordem para ver detalhes"
          actions={
            bucket !== 'all' && (
              <button
                onClick={() => navigate('/smartinventory/due-risk')}
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
                Ver Todas
              </button>
            )
          }
        />
        {displayOrders.length > 0 ? (
          <DenseTable
            columns={[
              { key: 'of_id', header: 'OF ID', render: (row: any) => row.of_id },
              { key: 'produto', header: 'Produto', render: (row: any) => row.produto_nome || row.produto_id?.toString() || 'N/A' },
              { key: 'fase', header: 'Fase Atual', render: (row: any) => row.fase_atual_nome || row.fase_atual_id?.toString() || 'N/A' },
              { key: 'due', header: 'Due Date', render: (row: any) => 
                row.due_date ? new Date(row.due_date).toLocaleDateString() : 'N/A'
              },
              { key: 'risk', header: 'Risk Score', render: (row: any) => (
                <Badge variant={row.risk_score > 0.7 ? 'danger' : row.risk_score > 0.4 ? 'warning' : 'default'}>
                  {row.risk_score?.toFixed(2) || 'N/A'}
                </Badge>
              )},
              { key: 'bucket', header: 'Risk Bucket', render: (row: any) => (
                <Badge variant={row.risk_bucket === 'OVERDUE' ? 'danger' : row.risk_bucket === 'DUE_7D' ? 'warning' : row.risk_bucket === 'DUE_14D' ? 'info' : 'success'}>
                  {row.risk_bucket || 'SAFE'}
                </Badge>
              )},
              { key: 'explanation', header: 'Explanation', render: (row: any) => row.explanation || row.reason || 'ETA > Due Date' },
            ]}
            data={displayOrders}
            onRowClick={(row) => navigate(`/prodplan/orders/${row.of_id}`)}
          />
        ) : (
          <Empty message={`Nenhuma ordem ${bucket !== 'all' ? `no bucket ${bucket}` : 'em risco'}`} />
        )}
      </Panel>
    </div>
  );
}

