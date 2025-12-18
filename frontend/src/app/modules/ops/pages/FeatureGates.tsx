/**
 * OPS Feature Gates - Lista de features ON/OFF
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

export default function OpsFeatureGates() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ops', 'feature-gates'],
    queryFn: () => opsApi.getFeatureGates(),
    staleTime: 60000,
  });

  if (isLoading && !data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Feature Gates
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
            Feature Gates
          </h1>
          <NotSupportedState reason={errorMessage} feature="ops.feature-gates" />
        </div>
      );
    }
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Feature Gates
        </h1>
        <NotSupportedState reason="Feature gates endpoint não disponível" feature="ops.feature-gates" />
      </div>
    );
  }

  const gates = data ? Object.entries(data).map(([key, value]) => ({
    feature: key,
    status: (value as any)?.status || 'OFF',
    reason: (value as any)?.reason || '',
  })) : [];

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox />
      
      <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
        Feature Gates
      </h1>

      <Panel>
        <SectionHeader title="Status de Features" subtitle="Funcionalidades activas e inactivas" />
        {gates.length > 0 ? (
          <DenseTable
            columns={[
              { key: 'feature', header: 'Feature', render: (row: any) => row.feature },
              { key: 'status', header: 'Status', render: (row: any) => (
                <Badge variant={row.status === 'ON' ? 'success' : 'danger'}>
                  {row.status}
                </Badge>
              )},
              { key: 'reason', header: 'Reason', render: (row: any) => row.reason || '—' },
            ]}
            data={gates}
          />
        ) : (
          <Empty message="Sem feature gates configurados" />
        )}
      </Panel>
    </div>
  );
}
