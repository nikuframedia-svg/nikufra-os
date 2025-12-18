/**
 * OPS Data Contract - Match rates e orphan counts
 * Industrial: denso, estados completos
 */

import { useQuery } from '@tanstack/react-query';
import {
  Panel,
  SectionHeader,
  DenseTable,
  Loading,
  Empty,
  NotSupportedState,
  Badge,
  PageCommandBox,
  tokens,
} from '../../../../ui-kit';
import { opsApi } from '../../../../api/api-client';

export default function OpsDataContract() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ops', 'data-contract'],
    queryFn: () => opsApi.getDataContract?.() || Promise.resolve(null),
    staleTime: 60000,
  });

  if (isLoading && !data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Data Contract
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
            Data Contract
          </h1>
          <NotSupportedState reason={errorMessage} feature="ops.data-contract" />
        </div>
      );
    }
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Data Contract
        </h1>
        <NotSupportedState reason="Data contract endpoint não disponível" feature="ops.data-contract" />
      </div>
    );
  }

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onSearch={() => {}} />
      
      <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
        Data Contract
      </h1>

      <Panel style={{ marginBottom: tokens.spacing.lg }}>
        <SectionHeader title="Match Rates" subtitle="Taxa de correspondência entre tabelas" />
        {data?.match_rates ? (
          <DenseTable
            columns={[
              { key: 'table', header: 'Tabela', render: (row: any) => row.table },
              { key: 'rate', header: 'Match Rate', render: (row: any) => (
                <Badge variant={row.rate > 0.9 ? 'success' : row.rate > 0.7 ? 'warning' : 'danger'}>
                  {(row.rate * 100).toFixed(1)}%
                </Badge>
              )},
            ]}
            data={data.match_rates}
          />
        ) : (
          <Empty message="Sem dados de match rates" />
        )}
      </Panel>

      <Panel>
        <SectionHeader title="Orphan Counts" subtitle="Registos sem correspondência" />
        {data?.orphan_counts ? (
          <DenseTable
            columns={[
              { key: 'table', header: 'Tabela', render: (row: any) => row.table },
              { key: 'count', header: 'Orphans', render: (row: any) => (
                <Badge variant={row.count === 0 ? 'success' : 'warning'}>
                  {row.count}
                </Badge>
              )},
            ]}
            data={data.orphan_counts}
          />
        ) : (
          <Empty message="Sem dados de orphans" />
        )}
      </Panel>
    </div>
  );
}
