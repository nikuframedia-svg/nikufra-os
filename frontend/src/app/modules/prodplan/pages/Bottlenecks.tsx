/**
 * PRODPLAN Bottlenecks - Top bottlenecks
 * Industrial: tabela densa, ranking claro
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Panel,
  DenseTable,
  FiltersBar,
  Loading,
  Empty,
  Error as ErrorComponent,
  NotSupportedState,
  PageCommandBox,
  DataFreshnessChip,
  tokens,
} from '../../../../ui-kit';
import { prodplanApi } from '../../../../api/api-client';

interface BottleneckItem {
  fase_id?: number;
  fase_nome?: string | null;
  wip_count: number;
  p90_age_hours: number;
  bottleneck_score?: number;
  utilizacao_pct?: number;
  fila_horas?: number;
}

export default function Bottlenecks() {
  const navigate = useNavigate();
  const [topN, setTopN] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['prodplan', 'bottlenecks', topN],
    queryFn: () => prodplanApi.getBottlenecks(topN),
    staleTime: 30000,
  });

  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = String(error.message);
    if (errorMessage.includes('NOT_SUPPORTED_BY_DATA')) {
      return (
        <div style={{ padding: tokens.spacing.lg }}>
          <PageCommandBox onSearch={() => {}} />
          <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
            Top Bottlenecks
          </h1>
          <NotSupportedState reason={errorMessage} feature="prodplan.bottlenecks" />
        </div>
      );
    }
  }

  if (isLoading && !data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Top Bottlenecks
        </h1>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Top Bottlenecks
        </h1>
        <ErrorComponent message="Erro ao carregar bottlenecks" reason={error instanceof Error ? error.message : 'Unknown error'} />
      </div>
    );
  }

  const bottlenecks = data?.bottlenecks || [];
  const filteredBottlenecks = bottlenecks.filter((item: BottleneckItem) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.fase_nome?.toLowerCase().includes(term) ||
      String(item.fase_id).includes(term)
    );
  });

  const columns = [
    {
      key: 'rank',
      header: 'Rank',
      render: (_: BottleneckItem, idx: number) => (idx + 1).toString(),
    },
    {
      key: 'fase',
      header: 'Fase',
      render: (row: BottleneckItem) => row.fase_nome || `Fase ${row.fase_id}`,
    },
    {
      key: 'wip',
      header: 'WIP',
      render: (row: BottleneckItem) => row.wip_count.toLocaleString(),
    },
    {
      key: 'p90_age',
      header: 'P90 Age',
      render: (row: BottleneckItem) => `${row.p90_age_hours.toFixed(1)}h`,
    },
    {
      key: 'score',
      header: 'Score',
      render: (row: BottleneckItem) =>
        row.bottleneck_score ? row.bottleneck_score.toFixed(2) : 'N/A',
    },
    {
      key: 'utilizacao',
      header: 'Utilização',
      render: (row: BottleneckItem) =>
        row.utilizacao_pct ? `${row.utilizacao_pct.toFixed(1)}%` : 'N/A',
    },
  ];

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <PageCommandBox onSearch={(q) => setSearchTerm(q)} />
      <div style={{ padding: tokens.spacing.lg, borderBottom: `1px solid ${tokens.colors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.xs }}>
          <h1
            style={{
              fontSize: tokens.typography.fontSize.title.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.text.title,
              fontFamily: tokens.typography.fontFamily,
              margin: 0,
            }}
          >
            Top Bottlenecks
          </h1>
          {data && 'generated_at' in data && <DataFreshnessChip lastIngestion={String(data.generated_at)} />}
        </div>
        {filteredBottlenecks.length === 0 && !isLoading && bottlenecks.length > 0 && (
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.muted, marginTop: tokens.spacing.xs }}>
            Filtro aplicado: {bottlenecks.length - filteredBottlenecks.length} bottlenecks ocultos
          </div>
        )}
        {bottlenecks.length === 0 && !isLoading && (
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.muted, marginTop: tokens.spacing.xs }}>
            Sem bottlenecks no momento. Verifique se há WIP acumulado.
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <FiltersBar
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: 'Search fase...',
          }}
          selects={[
            {
              label: 'Top N',
              value: topN,
              options: [
                { value: 5, label: 'Top 5' },
                { value: 10, label: 'Top 10' },
                { value: 20, label: 'Top 20' },
                { value: 50, label: 'Top 50' },
              ],
              onChange: (val) => setTopN(Number(val)),
            },
          ]}
        />

        <div style={{ flex: 1, overflow: 'auto', padding: tokens.spacing.lg }}>
          <Panel>
            {filteredBottlenecks.length > 0 ? (
              <DenseTable
                columns={columns}
                data={filteredBottlenecks}
                onRowClick={(row: BottleneckItem) => {
                  if (row.fase_id) {
                    navigate(`/prodplan/schedule?fase_id=${row.fase_id}`);
                  }
                }}
              />
            ) : (
              <Empty message="Sem bottlenecks no momento" />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
