/**
 * PRODPLAN Schedule - WIP por fase
 * Industrial: tabela densa + filtros
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

interface ScheduleItem {
  fase_id: number;
  fase_nome: string | null;
  wip_count: number;
  p50_age_hours: number | null;
  p90_age_hours: number | null;
  oldest_event_time: string | null;
}

export default function Schedule() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['prodplan', 'schedule', 'current'],
    queryFn: () => prodplanApi.getScheduleCurrent(),
    staleTime: 20000,
  });

  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = String(error.message);
    if (errorMessage.includes('NOT_SUPPORTED_BY_DATA')) {
      return (
        <div style={{ padding: tokens.spacing.lg }}>
          <PageCommandBox onSearch={() => {}} />
          <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
            Schedule (WIP por Fase)
          </h1>
          <NotSupportedState reason={errorMessage} feature="prodplan.schedule" />
        </div>
      );
    }
  }

  if (isLoading && !data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Schedule (WIP por Fase)
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
          Schedule (WIP por Fase)
        </h1>
        <ErrorComponent message="Erro ao carregar schedule" reason={error instanceof Error ? error.message : 'Unknown error'} />
      </div>
    );
  }

  const schedule = data?.schedule || [];
  const filteredSchedule = schedule.filter((item: ScheduleItem) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.fase_nome?.toLowerCase().includes(term) ||
      String(item.fase_id).includes(term)
    );
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'fase',
      header: 'Fase',
      render: (row: ScheduleItem) => row.fase_nome || `Fase ${row.fase_id}`,
    },
    {
      key: 'wip',
      header: 'WIP Count',
      render: (row: ScheduleItem) => row.wip_count.toLocaleString(),
    },
    {
      key: 'p50_age',
      header: 'P50 Age',
      render: (row: ScheduleItem) =>
        row.p50_age_hours ? `${row.p50_age_hours.toFixed(1)}h` : 'N/A',
    },
    {
      key: 'p90_age',
      header: 'P90 Age',
      render: (row: ScheduleItem) =>
        row.p90_age_hours ? `${row.p90_age_hours.toFixed(1)}h` : 'N/A',
    },
    {
      key: 'oldest',
      header: 'Oldest',
      render: (row: ScheduleItem) => formatDate(row.oldest_event_time),
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
            Schedule (WIP por Fase)
          </h1>
          {data && 'generated_at' in data && <DataFreshnessChip lastIngestion={String(data.generated_at)} />}
        </div>
        {filteredSchedule.length === 0 && !isLoading && schedule.length > 0 && (
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.muted, marginTop: tokens.spacing.xs }}>
            Filtro aplicado: {schedule.length - filteredSchedule.length} fases ocultas
          </div>
        )}
        {schedule.length === 0 && !isLoading && (
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.muted, marginTop: tokens.spacing.xs }}>
            Sem WIP no momento. Verifique se há ordens em progresso.
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
        />

        <div style={{ flex: 1, overflow: 'auto', padding: tokens.spacing.lg }}>
          <Panel>
            {filteredSchedule.length > 0 ? (
              <DenseTable columns={columns} data={filteredSchedule} />
            ) : (
              <Empty message="Sem WIP no momento" />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
