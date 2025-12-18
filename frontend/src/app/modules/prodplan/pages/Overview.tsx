/**
 * PRODPLAN Overview - Dashboard principal
 * Industrial UI
 */

import { useNavigate } from 'react-router-dom';
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
  HeatmapGrid,
  DataFreshnessChip,
  PageCommandBox,
} from '../../../../ui-kit';
import { useProdplanOverview } from '../../../../api/hooks';

export default function ProdplanOverview() {
  const navigate = useNavigate();
  const { kpis, schedule, bottlenecks, riskQueue, isLoading } = useProdplanOverview();

  // Loading state
  if (isLoading && !kpis.data && !schedule.data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          PRODPLAN Overview
        </h1>
        <Loading />
      </div>
    );
  }

  // Calculate totals from schedule data
  const scheduleData = schedule.data || [];
  const totalWip = scheduleData.reduce((sum: number, item: any) => sum + (item.wip_count || 0), 0);

  // Prepare heatmap cells from schedule
  const heatmapCells = scheduleData.map((item: any) => ({
    id: `fase-${item.fase_id}`,
    label: item.fase_nome || `Fase ${item.fase_id}`,
    value: item.wip_count || 0,
  }));

  // KPI data
  const kpiData: any = kpis.data || {};

  // Error handling
  if (kpis.isError || schedule.isError || bottlenecks.isError || riskQueue.isError) {
    const errorMsg = kpis.isError ? kpis.errorMessage : schedule.isError ? schedule.errorMessage : bottlenecks.isError ? bottlenecks.errorMessage : riskQueue.errorMessage;
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          PRODPLAN Overview
        </h1>
        <ErrorState message="Erro ao carregar dados" reason={errorMsg} />
      </div>
    );
  }

  // Not supported handling
  if (kpis.isNotSupported || schedule.isNotSupported) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          PRODPLAN Overview
        </h1>
        <NotSupportedState 
          reason={kpis.isNotSupported ? kpis.notSupportedReason : schedule.notSupportedReason} 
          feature="prodplan.overview" 
        />
      </div>
    );
  }

  return (
    <div style={{ padding: tokens.spacing.lg, minHeight: '100vh' }}>
      <PageCommandBox onSearch={() => {}} />

      {/* Header */}
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, margin: 0, marginBottom: tokens.spacing.xs }}>
          PRODPLAN Overview
        </h1>
        <div style={{ display: 'flex', gap: tokens.spacing.md, alignItems: 'center' }}>
          {kpiData.generated_at && <DataFreshnessChip lastIngestion={kpiData.generated_at} />}
          <span style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary }}>
            KPIs globais, WIP, bottlenecks e fila de risco
          </span>
        </div>
      </div>

      {/* Status Banner - VISÍVEL - SEMPRE MOSTRAR SE VAZIO */}
      {(!schedule.data || schedule.data.length === 0) && !schedule.isLoading && (
        <Panel style={{ marginBottom: tokens.spacing.lg, border: `2px solid ${tokens.colors.status.warning}`, padding: tokens.spacing.md }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
            <Badge variant="warning">DADOS VAZIOS</Badge>
            <span style={{ fontSize: tokens.typography.fontSize.body.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.status.warning }}>
              Schedule vazio
            </span>
          </div>
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.secondary }}>
            Nenhum WIP encontrado. Execute ingestão de dados ou verifique os filtros.
          </div>
        </Panel>
      )}
      
      {(!kpis.data || Object.keys(kpis.data).length === 0) && !kpis.isLoading && (
        <Panel style={{ marginBottom: tokens.spacing.lg, border: `2px solid ${tokens.colors.status.warning}`, padding: tokens.spacing.md }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs }}>
            <Badge variant="warning">KPIS VAZIOS</Badge>
            <span style={{ fontSize: tokens.typography.fontSize.body.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.status.warning }}>
              KPIs não disponíveis
            </span>
          </div>
          <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.secondary }}>
            Execute ingestão de dados para ver KPIs.
          </div>
        </Panel>
      )}

      {/* Executive Strip - KPIs - SEMPRE VISÍVEL */}
      <Panel style={{ marginBottom: tokens.spacing.lg }}>
        <SectionHeader title="KPIs Principais" />
        {kpis.isLoading || schedule.isLoading ? (
          <div style={{ padding: tokens.spacing.md }}>
            <Loading />
          </div>
        ) : (
          <div style={{ padding: tokens.spacing.md, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: tokens.spacing.md }}>
            <div title={totalWip === 0 ? 'Nenhuma ordem em WIP no momento. Execute ingestão de dados ou verifique filtros.' : `Total de ${totalWip} ordens em processo`}>
              <KPIStat label="Total WIP" value={totalWip} />
            </div>
            <div title={!kpiData.otd_pct ? 'OTD não calculado. Requer dados de ordens com due_date e data_acabamento.' : `On-Time Delivery: ${(kpiData.otd_pct * 100).toFixed(1)}% das ordens entregues no prazo`}>
              <KPIStat label="OTD %" value={kpiData.otd_pct ? `${(kpiData.otd_pct * 100).toFixed(1)}%` : 'N/A'} />
            </div>
            <div title={!kpiData.throughput_day ? 'Throughput não calculado. Requer dados de ordens finalizadas.' : `Throughput médio: ${kpiData.throughput_day.toFixed(0)} ordens por dia`}>
              <KPIStat label="Throughput" value={kpiData.throughput_day ? kpiData.throughput_day.toFixed(0) : 'N/A'} unit="/day" />
            </div>
            <div title={!kpiData.avg_cycle_time_hours ? 'Cycle time não calculado. Requer dados de fases com durações.' : `Tempo médio de ciclo: ${kpiData.avg_cycle_time_hours.toFixed(1)} horas`}>
              <KPIStat label="Cycle Time" value={kpiData.avg_cycle_time_hours ? kpiData.avg_cycle_time_hours.toFixed(1) : 'N/A'} unit="h" />
            </div>
            <div title={riskQueue.data && riskQueue.data.length === 0 ? 'Nenhuma ordem em risco. Excelente!' : `${riskQueue.data?.length || 0} ordens com ETA > Due Date`}>
              <KPIStat label="At Risk" value={riskQueue.data ? riskQueue.data.length : 0} />
            </div>
            <div title={bottlenecks.data && bottlenecks.data.length === 0 ? 'Nenhum bottleneck identificado.' : `${bottlenecks.data?.length || 0} fases com WIP acumulado e alta utilização`}>
              <KPIStat label="Bottlenecks" value={bottlenecks.data ? bottlenecks.data.length : 0} />
            </div>
          </div>
        )}
      </Panel>

      {/* Distribution Zone */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.lg, marginBottom: tokens.spacing.lg }}>
        {/* WIP Heatmap */}
        <Panel>
          <SectionHeader 
            title="WIP por Fase" 
            actions={
              <button
                onClick={() => navigate('/smartinventory/wip-explorer')}
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
                Ver detalhes →
              </button>
            }
          />
          {schedule.isLoading && <Loading />}
          {schedule.isError && <ErrorState message="Erro ao carregar schedule" reason={schedule.errorMessage} />}
          {!schedule.isLoading && !schedule.isError && heatmapCells.length > 0 ? (
            <HeatmapGrid 
              cells={heatmapCells} 
              onCellClick={(cell) => {
                const faseId = cell.id.replace('fase-', '');
                navigate(`/smartinventory/wip-explorer?fase_id=${faseId}`);
              }}
              colorScale="cold-hot"
              cellSize={50}
            />
          ) : !schedule.isLoading && !schedule.isError ? (
            <Empty message="Sem dados de schedule" />
          ) : null}
        </Panel>

        {/* Bottlenecks */}
        <Panel>
          <SectionHeader 
            title="Top Bottlenecks" 
            actions={
              <button
                onClick={() => navigate('/prodplan/bottlenecks')}
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
                Ver todos →
              </button>
            }
          />
          {bottlenecks.isLoading && <Loading />}
          {bottlenecks.isError && <ErrorState message="Erro ao carregar bottlenecks" />}
          {bottlenecks.isNotSupported && <NotSupportedState feature="bottlenecks" reason={bottlenecks.notSupportedReason} />}
        {!bottlenecks.isLoading && !bottlenecks.isError && !bottlenecks.isNotSupported && bottlenecks.data && bottlenecks.data.length > 0 ? (
          <DenseTable<any>
            columns={[
              { key: 'fase', header: 'Fase', render: (row: any) => row.fase_nome || `Fase ${row.fase_id}` },
              { key: 'wip', header: 'WIP', render: (row: any) => row.wip_count?.toString() || '0' },
              { key: 'wait', header: 'Wait Time', render: (row: any) => row.avg_wait_hours ? `${row.avg_wait_hours.toFixed(1)}h` : 'N/A' },
              { key: 'severity', header: 'Severity', render: (row: any) => (
                <Badge variant={row.severity === 'HIGH' ? 'danger' : row.severity === 'MEDIUM' ? 'warning' : 'default'}>
                  {row.severity || 'N/A'}
                </Badge>
              )},
            ]}
            data={bottlenecks.data.slice(0, 5)}
            onRowClick={(row: any) => navigate(`/smartinventory/wip-explorer?fase_id=${row.fase_id}`)}
          />
        ) : !bottlenecks.isLoading && !bottlenecks.isError && !bottlenecks.isNotSupported ? (
          <Empty message="Sem bottlenecks" />
        ) : null}
        </Panel>
      </div>

      {/* Risk Queue */}
      <Panel style={{ marginBottom: tokens.spacing.lg }}>
        <SectionHeader 
          title="Fila de Risco" 
          subtitle="Ordens em risco de atraso"
          actions={
            <button
              onClick={() => navigate('/prodplan/risk-queue')}
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
              Ver todas →
            </button>
          }
        />
        {riskQueue.isLoading && <Loading />}
        {riskQueue.isError && <ErrorState message="Erro ao carregar risk queue" />}
        {riskQueue.isNotSupported && <NotSupportedState feature="risk_queue" reason={riskQueue.notSupportedReason} />}
        {!riskQueue.isLoading && !riskQueue.isError && !riskQueue.isNotSupported && riskQueue.data && riskQueue.data.length > 0 ? (
          <DenseTable<any>
            columns={[
              { key: 'of_id', header: 'OF', render: (row: any) => row.of_id },
              { key: 'produto', header: 'Produto', render: (row: any) => row.produto_id?.toString() || 'N/A' },
              { key: 'due', header: 'Due Date', render: (row: any) => row.due_date ? new Date(row.due_date).toLocaleDateString() : 'N/A' },
              { key: 'eta', header: 'ETA', render: (row: any) => row.eta ? new Date(row.eta).toLocaleDateString() : 'N/A' },
              { key: 'risk', header: 'Risk', render: (row: any) => (
                <Badge variant={row.risk_score && row.risk_score > 0.7 ? 'danger' : row.risk_score && row.risk_score > 0.4 ? 'warning' : 'default'}>
                  {row.risk_score?.toFixed(2) || 'N/A'}
                </Badge>
              )},
              { key: 'reason', header: 'Reason', render: (row: any) => row.reason || 'ETA > Due' },
            ]}
            data={riskQueue.data.slice(0, 10)}
            onRowClick={(row: any) => navigate(`/prodplan/orders/${row.of_id}`)}
          />
        ) : !riskQueue.isLoading && !riskQueue.isError && !riskQueue.isNotSupported ? (
          <Empty message="Sem ordens em risco" />
        ) : null}
      </Panel>

      {/* Quick Navigation */}
      <Panel>
        <SectionHeader title="Navegação Rápida" />
        <div style={{ display: 'flex', gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/prodplan/orders')}
            style={{
              padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
              backgroundColor: tokens.colors.card.elevated,
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: tokens.borderRadius.button,
              color: tokens.colors.text.body,
              fontSize: tokens.typography.fontSize.body.sm,
              cursor: 'pointer',
            }}
          >
            📋 Todas as Ordens
          </button>
          <button
            onClick={() => navigate('/prodplan/schedule')}
            style={{
              padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
              backgroundColor: tokens.colors.card.elevated,
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: tokens.borderRadius.button,
              color: tokens.colors.text.body,
              fontSize: tokens.typography.fontSize.body.sm,
              cursor: 'pointer',
            }}
          >
            📅 Schedule
          </button>
          <button
            onClick={() => navigate('/smartinventory/overview')}
            style={{
              padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
              backgroundColor: tokens.colors.card.elevated,
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: tokens.borderRadius.button,
              color: tokens.colors.text.body,
              fontSize: tokens.typography.fontSize.body.sm,
              cursor: 'pointer',
            }}
          >
            🛒 SmartInventory
          </button>
          <button
            onClick={() => navigate('/whatif/simulate')}
            style={{
              padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
              backgroundColor: tokens.colors.card.elevated,
              border: `1px solid ${tokens.colors.border}`,
              borderRadius: tokens.borderRadius.button,
              color: tokens.colors.text.body,
              fontSize: tokens.typography.fontSize.body.sm,
              cursor: 'pointer',
            }}
          >
            🔬 What-If
          </button>
        </div>
      </Panel>
    </div>
  );
}
