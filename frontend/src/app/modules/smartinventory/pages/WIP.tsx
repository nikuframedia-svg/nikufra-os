/**
 * SMARTINVENTORY WIP Explorer - Drill-down de ordens em WIP
 * Ciclo 3: Filtros server-side, drill-down funcional, CommandBox melhorado
 */

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  tokens,
  Panel,
  SectionHeader,
  DenseTable,
  Badge,
  Loading,
  Empty,
  ErrorState,
  NotSupportedState,
  PageCommandBox,
  DrilldownDrawer,
  KPIStat,
  DataFreshnessChip,
} from '../../../../ui-kit';
import { smartinventoryApi, prodplanApi } from '../../../../api/api-client';
import type { WIPItem } from '../../../../api/hooks/smartinventory';

export default function SmartInventoryWIP() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFaseId, setSelectedFaseId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filtros da URL
  const faseIdFilter = searchParams.get('fase_id') ? parseInt(searchParams.get('fase_id')!) : undefined;
  const produtoIdFilter = searchParams.get('produto_id') ? parseInt(searchParams.get('produto_id')!) : undefined;

  // Data hooks com filtros
  const { data: wipData, isLoading: wipLoading, error: wipError } = useQuery({
    queryKey: ['smartinventory', 'wip', faseIdFilter, produtoIdFilter],
    queryFn: () => smartinventoryApi.getWIP(faseIdFilter, produtoIdFilter),
    staleTime: 30000,
  });

  // Ordens para drill-down (quando uma fase é selecionada)
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['prodplan', 'orders', selectedFaseId],
    queryFn: () => prodplanApi.getOrders({ fase_id: selectedFaseId!, limit: 50 }),
    enabled: !!selectedFaseId && drawerOpen,
  });

  // Handler para CommandBox
  const handleCommand = (command: string) => {
    const cmd = command.trim().toLowerCase();
    
    // "fase:12" ou "fase 12"
    const faseMatch = cmd.match(/fase[:\s]+(\d+)/i);
    if (faseMatch) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('fase_id', faseMatch[1]);
      setSearchParams(newParams);
      return;
    }

    // "produto:894" ou "produto 894"
    const produtoMatch = cmd.match(/produto[:\s]+(\d+)/i);
    if (produtoMatch) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('produto_id', produtoMatch[1]);
      setSearchParams(newParams);
      return;
    }

    // "limpar" ou "clear"
    if (cmd === 'limpar' || cmd === 'clear') {
      setSearchParams({});
      return;
    }
  };

  const wipList = wipData?.wip || [];
  const totalWip = wipList.reduce((sum: number, item: WIPItem) => sum + (item.wip_count || 0), 0);

  // Check for NOT_SUPPORTED_BY_DATA
  const wipNotSupported = wipError && typeof wipError === 'object' && 'message' in wipError
    ? String(wipError.message).includes('NOT_SUPPORTED_BY_DATA')
    : false;

  // Error handling
  if (wipError && !wipNotSupported) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onCommand={handleCommand} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          WIP Explorer
        </h1>
        <ErrorState 
          message="Erro ao carregar WIP"
          reason={wipError && typeof wipError === 'object' && 'message' in wipError ? String(wipError.message) : 'Erro desconhecido'}
        />
      </div>
    );
  }

  if (wipNotSupported) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onCommand={handleCommand} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          WIP Explorer
        </h1>
        <NotSupportedState 
          reason={wipError && typeof wipError === 'object' && 'message' in wipError 
            ? String(wipError.message).replace('NOT_SUPPORTED_BY_DATA: ', '')
            : 'WIP data not supported by available data'}
          feature="smartinventory.wip-explorer"
          suggestion="Execute data ingestion or verify that OrdensFabrico and FasesOrdemFabrico tables have data."
        />
      </div>
    );
  }

  if (wipLoading && !wipData) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onCommand={handleCommand} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          WIP Explorer
        </h1>
        <Loading />
      </div>
    );
  }

  return (
    <div style={{ padding: tokens.spacing.lg, minHeight: '100vh' }}>
      {/* HEADER ZONE */}
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, margin: 0, marginBottom: tokens.spacing.xs }}>
          WIP Explorer
        </h1>
        <div style={{ display: 'flex', gap: tokens.spacing.md, alignItems: 'center', marginBottom: tokens.spacing.md }}>
          {wipData && 'generated_at' in wipData && <DataFreshnessChip lastIngestion={String(wipData.generated_at)} />}
          <span style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary }}>
            Drill-down de ordens em WIP - Total: {totalWip} ordens
          </span>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: tokens.spacing.md, alignItems: 'center', marginBottom: tokens.spacing.md }}>
          <div style={{ display: 'flex', gap: tokens.spacing.xs, alignItems: 'center' }}>
            <label style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.secondary }}>
              Fase ID:
            </label>
            <input
              type="number"
              value={faseIdFilter || ''}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) {
                  newParams.set('fase_id', e.target.value);
                } else {
                  newParams.delete('fase_id');
                }
                setSearchParams(newParams);
              }}
              placeholder="Filtrar por fase"
              style={{
                width: '100px',
                padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                backgroundColor: tokens.colors.card.default,
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: tokens.borderRadius.input,
                color: tokens.colors.text.body,
                fontSize: tokens.typography.fontSize.body.sm,
                fontFamily: tokens.typography.fontFamily,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: tokens.spacing.xs, alignItems: 'center' }}>
            <label style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.secondary }}>
              Produto ID:
            </label>
            <input
              type="number"
              value={produtoIdFilter || ''}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) {
                  newParams.set('produto_id', e.target.value);
                } else {
                  newParams.delete('produto_id');
                }
                setSearchParams(newParams);
              }}
              placeholder="Filtrar por produto"
              style={{
                width: '100px',
                padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                backgroundColor: tokens.colors.card.default,
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: tokens.borderRadius.input,
                color: tokens.colors.text.body,
                fontSize: tokens.typography.fontSize.body.sm,
                fontFamily: tokens.typography.fontFamily,
                outline: 'none',
              }}
            />
          </div>
          {(faseIdFilter || produtoIdFilter) && (
            <button
              onClick={() => setSearchParams({})}
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
              Limpar filtros
            </button>
          )}
        </div>

        {/* PageCommandBox */}
        <PageCommandBox onCommand={handleCommand} placeholder='Comandos: "fase:12", "produto:894", "limpar" | "/" para focar' />
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPIStat label="Total WIP" value={totalWip} />
        <KPIStat label="Fases com WIP" value={wipList.length} />
        <KPIStat 
          label="P90 Age Máx" 
          value={
            wipList.length > 0 && wipList.some((w: WIPItem) => w.p90_age_hours !== null && w.p90_age_hours !== undefined)
              ? `${Math.max(...wipList.map((w: WIPItem) => w.p90_age_hours || 0).filter(Boolean), 0).toFixed(1)}h`
              : 'N/A'
          }
        />
      </div>

      {/* Table */}
      <Panel>
        <SectionHeader 
          title={`WIP por Fase${faseIdFilter ? ` (Fase ${faseIdFilter})` : ''}${produtoIdFilter ? ` (Produto ${produtoIdFilter})` : ''}`}
          subtitle="Clique numa linha para ver ordens dessa fase"
        />
        {wipLoading ? (
          <Loading />
        ) : wipList.length > 0 ? (
          <DenseTable<WIPItem>
            columns={[
              { key: 'fase', header: 'Fase', render: (row) => row.fase_nome || `Fase ${row.fase_id}` },
              { key: 'wip', header: 'WIP Count', render: (row) => row.wip_count.toLocaleString() },
              { key: 'p50', header: 'P50 Age', render: (row) => row.p50_age_hours ? `${row.p50_age_hours.toFixed(1)}h` : 'N/A' },
              { key: 'p90', header: 'P90 Age', render: (row) => (
                <Badge variant={(row.p90_age_hours || 0) > 48 ? 'danger' : (row.p90_age_hours || 0) > 24 ? 'warning' : 'default'}>
                  {row.p90_age_hours ? `${row.p90_age_hours.toFixed(1)}h` : 'N/A'}
                </Badge>
              )},
            ]}
            data={wipList}
            onRowClick={(row) => {
              setSelectedFaseId(row.fase_id);
              setDrawerOpen(true);
            }}
          />
        ) : (
          <Empty message="Nenhuma ordem em WIP. Execute ingestão de dados ou verifique os filtros." />
        )}
      </Panel>

      {/* Drilldown Drawer */}
      <DrilldownDrawer
        isOpen={drawerOpen && !!selectedFaseId}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedFaseId(null);
        }}
        title={selectedFaseId ? `Ordens na Fase ${selectedFaseId}` : 'Detalhe'}
      >
        {ordersLoading ? (
          <Loading />
        ) : ordersData?.orders && ordersData.orders.length > 0 ? (
          <div>
            <div style={{ marginBottom: tokens.spacing.md }}>
              <KPIStat label="Total de Ordens" value={ordersData.orders.length} />
            </div>
            <DenseTable
              columns={[
                { key: 'of_id', header: 'OF ID', render: (row: any) => row.of_id },
                { key: 'produto', header: 'Produto ID', render: (row: any) => row.of_produto_id?.toString() || 'N/A' },
                { key: 'status', header: 'Status', render: (row: any) => (
                  <Badge variant={
                    row.status === 'LATE' ? 'danger' : 
                    row.status === 'AT_RISK' ? 'warning' : 
                    'default'
                  }>
                    {row.status || 'N/A'}
                  </Badge>
                )},
              ]}
              data={ordersData.orders}
              onRowClick={(row: any) => {
                navigate(`/prodplan/orders/${row.of_id}`);
                setDrawerOpen(false);
              }}
            />
          </div>
        ) : (
          <Empty message="Nenhuma ordem encontrada nesta fase" />
        )}
      </DrilldownDrawer>
    </div>
  );
}
