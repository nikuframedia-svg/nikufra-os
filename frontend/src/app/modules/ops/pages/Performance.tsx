/**
 * OPS Performance - SLO Scoreboard
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
  NotSupportedState,
  Badge,
  PageCommandBox,
  tokens,
} from '../../../../ui-kit';
import { opsApi } from '../../../../api/api-client';

export default function OpsPerformance() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ops', 'performance'],
    queryFn: () => opsApi.getSLOResults(),
    staleTime: 60000,
  });

  if (isLoading && !data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Performance (SLO Scoreboard)
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
            Performance (SLO Scoreboard)
          </h1>
          <NotSupportedState reason={errorMessage} feature="ops.performance" />
        </div>
      );
    }
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Performance (SLO Scoreboard)
        </h1>
        <NotSupportedState reason="SLO results endpoint não disponível" feature="ops.performance" />
      </div>
    );
  }

  const slos = data?.slos || [];
  const passCount = slos.filter((s: any) => s.status === 'PASS').length;
  const failCount = slos.filter((s: any) => s.status === 'FAIL').length;

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onSearch={() => {}} />
      
      <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
        Performance (SLO Scoreboard)
      </h1>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPIStat label="SLOs PASS" value={passCount} />
        <KPIStat label="SLOs FAIL" value={failCount} />
        <KPIStat label="Total SLOs" value={slos.length} />
        {data?.generated_at && (
          <KPIStat label="Gerado em" value={new Date(data.generated_at).toLocaleString()} />
        )}
      </div>

      <Panel>
        <SectionHeader title="SLO Results" subtitle="Objectivos de nível de serviço" />
        {slos.length > 0 ? (
          <DenseTable
            columns={[
              { key: 'name', header: 'SLO', render: (row: any) => row.name },
              { key: 'target', header: 'Target', render: (row: any) => row.target },
              { key: 'actual', header: 'Actual', render: (row: any) => row.actual },
              { key: 'status', header: 'Status', render: (row: any) => (
                <Badge variant={row.status === 'PASS' ? 'success' : 'danger'}>
                  {row.status}
                </Badge>
              )},
              { key: 'details', header: 'Details', render: (row: any) => row.details || '—' },
            ]}
            data={slos}
          />
        ) : (
          <Empty message="Sem SLO results" />
        )}
      </Panel>
    </div>
  );
}
