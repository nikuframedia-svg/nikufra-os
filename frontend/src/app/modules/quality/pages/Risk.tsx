/**
 * QUALITY Risk - Risco baseline e ML
 * Industrial: denso, estados completos
 */

import { useQuery } from '@tanstack/react-query';
import {
  Panel,
  SectionHeader,
  DenseTable,
  KPIStat,
  Loading,
  Empty,
  Error as ErrorState,
  NotSupportedState,
  Badge,
  PageCommandBox,
  DataFreshnessChip,
  tokens,
} from '../../../../ui-kit';
import { qualityApi } from '../../../../api/api-client';

export default function QualityRisk() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quality', 'risk'],
    queryFn: () => qualityApi.getRisk(),
    staleTime: 30000,
  });

  if (isLoading && !data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Quality Risk Analysis
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
            Quality Risk Analysis
          </h1>
          <NotSupportedState reason={errorMessage} feature="quality.risk" />
        </div>
      );
    }
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Quality Risk Analysis
        </h1>
        <ErrorState message="Erro ao carregar quality risk" reason={error instanceof Error ? error.message : 'Unknown error'} />
      </div>
    );
  }

  const risks = data?.risks || [];

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onSearch={() => {}} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, margin: 0 }}>
          Quality Risk Analysis
        </h1>
        {data && 'generated_at' in data && <DataFreshnessChip lastIngestion={String(data.generated_at)} />}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPIStat label="Alto Risco" value={risks.filter((r: any) => r.risk_level === 'HIGH').length} />
        <KPIStat label="Médio Risco" value={risks.filter((r: any) => r.risk_level === 'MEDIUM').length} />
        <KPIStat label="Baixo Risco" value={risks.filter((r: any) => r.risk_level === 'LOW').length} />
      </div>

      <Panel>
        <SectionHeader title="Risco por Produto/Fase" subtitle="Risco baseline calculado a partir de histórico de erros" />
        {risks.length > 0 ? (
          <DenseTable
            columns={[
              { key: 'produto', header: 'Produto', render: (row: any) => row.produto_nome || `Prod ${row.produto_id}` },
              { key: 'fase', header: 'Fase', render: (row: any) => row.fase_nome || `Fase ${row.fase_id}` },
              { key: 'risk_score', header: 'Score', render: (row: any) => row.risk_score?.toFixed(2) || 'N/A' },
              { key: 'risk_level', header: 'Nível', render: (row: any) => (
                <Badge variant={row.risk_level === 'HIGH' ? 'danger' : row.risk_level === 'MEDIUM' ? 'warning' : 'success'}>
                  {row.risk_level}
                </Badge>
              )},
            ]}
            data={risks}
          />
        ) : (
          <Empty message="Sem dados de risco" />
        )}
      </Panel>
    </div>
  );
}
