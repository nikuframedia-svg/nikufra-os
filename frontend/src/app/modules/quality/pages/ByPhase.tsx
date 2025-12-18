/**
 * QUALITY By Phase - Heatmap de erros por fase
 * Industrial: denso, estados completos
 */

import { useQuery } from '@tanstack/react-query';
import {
  Panel,
  SectionHeader,
  DenseTable,
  HeatmapGrid,
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

export default function QualityByPhase() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quality', 'overview'],
    queryFn: () => qualityApi.getOverview(),
    staleTime: 30000,
  });

  if (isLoading && !data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Quality By Phase
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
            Quality By Phase
          </h1>
          <NotSupportedState reason={errorMessage} feature="quality.by-phase" />
        </div>
      );
    }
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Quality By Phase
        </h1>
        <ErrorState message="Erro ao carregar quality by phase" reason={error instanceof Error ? error.message : 'Unknown error'} />
      </div>
    );
  }

  // Use heatmap data from quality overview and transform for phase-based view
  const heatmapData = data?.heatmap || [];
  
  // Group by culpada phase
  const phaseMap = new Map<string, { fase_id: string; fase_nome: string; error_count: number; avg_severity: number }>();
  heatmapData.forEach((item: any) => {
    const fase = item.fase_culpada || 'Unknown';
    const existing = phaseMap.get(fase);
    if (existing) {
      existing.error_count += item.count;
      existing.avg_severity = (existing.avg_severity + (item.gravidade_avg || 0)) / 2;
    } else {
      phaseMap.set(fase, {
        fase_id: fase,
        fase_nome: fase,
        error_count: item.count,
        avg_severity: item.gravidade_avg || 0,
      });
    }
  });
  const phases = Array.from(phaseMap.values());

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onSearch={() => {}} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, margin: 0 }}>
          Quality By Phase
        </h1>
        {data && 'generated_at' in data && <DataFreshnessChip lastIngestion={String(data.generated_at)} />}
      </div>

      <Panel style={{ marginBottom: tokens.spacing.lg }}>
        <SectionHeader title="Erros por Fase (Heatmap)" />
        {phases.length > 0 ? (
          <HeatmapGrid
            cells={phases.map((p: any) => ({
              id: `fase-${p.fase_id}`,
              label: p.fase_nome || `Fase ${p.fase_id}`,
              value: p.error_count || 0,
            }))}
            colorScale="heat"
            cellSize={60}
          />
        ) : (
          <Empty message="Sem erros por fase" />
        )}
      </Panel>

      <Panel>
        <SectionHeader title="Ranking de Fases por Erros" />
        {phases.length > 0 ? (
          <DenseTable
            columns={[
              { key: 'fase', header: 'Fase', render: (row: any) => row.fase_nome || `Fase ${row.fase_id}` },
              { key: 'error_count', header: 'Erros', render: (row: any) => (
                <Badge variant={row.error_count > 10 ? 'danger' : row.error_count > 5 ? 'warning' : 'default'}>
                  {row.error_count}
                </Badge>
              )},
              { key: 'avg_severity', header: 'Severidade Média', render: (row: any) => row.avg_severity?.toFixed(1) || 'N/A' },
            ]}
            data={phases.sort((a: any, b: any) => (b.error_count || 0) - (a.error_count || 0))}
          />
        ) : (
          <Empty message="Sem dados de fases" />
        )}
      </Panel>
    </div>
  );
}
