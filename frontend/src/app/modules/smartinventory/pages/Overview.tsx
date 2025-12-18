/**
 * SMARTINVENTORY Overview - Dashboard denso e operacional
 * Layout: Header → Executive Strip → Distribution → Operational → Limitations
 * ZERO fake data - tudo vem de hooks/API
 * Ciclo 2: Filtros, CommandBox melhorado, Fases críticas, Top Produtos
 */

import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Panel,
  SectionHeader,
  KPIStat,
  DenseTable,
  HeatmapGrid,
  DrilldownDrawer,
  DataFreshnessChip,
  ConfidenceBadge,
  PageCommandBox,
  Loading,
  Empty,
  NotSupportedState,
  ErrorState,
  Badge,
  QuickNote,
  tokens,
} from '../../../../ui-kit';
import { smartinventoryApi, prodplanApi } from '../../../../api/api-client';
import { useBackendHealth } from '../../../../api/hooks';
import type { WIPItem } from '../../../../api/hooks/smartinventory';

export default function SmartInventoryOverview() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOfId, setSelectedOfId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filtros da URL
  const faseIdFilter = searchParams.get('fase_id') ? parseInt(searchParams.get('fase_id')!) : undefined;
  const produtoIdFilter = searchParams.get('produto_id') ? parseInt(searchParams.get('produto_id')!) : undefined;

  // Check backend health
  const { data: health } = useBackendHealth();
  const isBackendOffline = !health || health.status === 'unhealthy';
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Overview.tsx:42',message:'useQuery hooks called',data:{isBackendOffline,healthStatus:health?.status,componentMounted:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  // Data hooks com filtros
  const { data: wipData, isLoading: wipLoading, error: wipError } = useQuery({
    queryKey: ['smartinventory', 'wip', faseIdFilter, produtoIdFilter],
    queryFn: () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Overview.tsx:48',message:'wip queryFn executing',data:{faseIdFilter,produtoIdFilter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return smartinventoryApi.getWIP(faseIdFilter, produtoIdFilter);
    },
    staleTime: 30000,
    enabled: !isBackendOffline, // Desabilitar se backend offline
    // #region agent log
    refetchInterval: false, // Desabilitar polling automático
    // #endregion
  });

  const { data: wipMassData, isLoading: wipMassLoading, error: wipMassError } = useQuery({
    queryKey: ['smartinventory', 'wip_mass', faseIdFilter, produtoIdFilter],
    queryFn: () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Overview.tsx:56',message:'wip_mass queryFn executing',data:{faseIdFilter,produtoIdFilter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return smartinventoryApi.getWIPMass(faseIdFilter, produtoIdFilter);
    },
    staleTime: 30000,
    enabled: !isBackendOffline, // Desabilitar se backend offline
    // #region agent log
    refetchInterval: false, // Desabilitar polling automático
    // #endregion
  });

  const { data: gelcoatData, isLoading: gelcoatLoading } = useQuery({
    queryKey: ['smartinventory', 'gelcoat'],
    queryFn: () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Overview.tsx:64',message:'gelcoat queryFn executing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return smartinventoryApi.getGelcoatTheoreticalUsage();
    },
    staleTime: 30000,
    enabled: !isBackendOffline, // Desabilitar se backend offline
    // #region agent log
    refetchInterval: false, // Desabilitar polling automático
    // #endregion
  });

  // Order detail for drilldown
  const { data: orderDetail } = useQuery({
    queryKey: ['prodplan', 'orders', selectedOfId],
    queryFn: () => prodplanApi.getOrder(selectedOfId!),
    enabled: !!selectedOfId && drawerOpen,
  });

  const isLoading = wipLoading || wipMassLoading || gelcoatLoading;
  
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
  
  // Extract WIP data - handle both schema formats
  const wipList = wipData?.wip || [];
  const totalWip = wipList.reduce((sum: number, item: WIPItem) => sum + (item.wip_count || 0), 0);

  // Check for NOT_SUPPORTED_BY_DATA in WIP response
  const wipNotSupported = wipError && typeof wipError === 'object' && 'message' in wipError
    ? String(wipError.message).includes('NOT_SUPPORTED_BY_DATA')
    : false;
  
  const wipNotSupportedReason = wipNotSupported && wipError && typeof wipError === 'object' && 'message' in wipError
    ? String(wipError.message).replace('NOT_SUPPORTED_BY_DATA: ', '')
    : undefined;

  // Check for NOT_SUPPORTED_BY_DATA in WIP Mass response
  const wipMassNotSupported = wipMassError && typeof wipMassError === 'object' && 'message' in wipMassError
    ? String(wipMassError.message).includes('NOT_SUPPORTED_BY_DATA')
    : false;

  // Heatmap cells from WIP data
  const heatmapCells = wipList.map((item: WIPItem) => ({
    id: `fase-${item.fase_id}`,
    label: item.fase_nome || `Fase ${item.fase_id}`,
    value: item.wip_count || 0,
    metadata: {
      p50: item.p50_age_hours,
      p90: item.p90_age_hours,
    },
  }));

  // Top aging phases
  const topAgingPhases = [...wipList]
    .filter((w: WIPItem) => w.p90_age_hours !== undefined && w.p90_age_hours !== null)
    .sort((a: WIPItem, b: WIPItem) => (b.p90_age_hours || 0) - (a.p90_age_hours || 0))
    .slice(0, 10);

  // Fases críticas: score = (wip_count * 0.4) + (p90_age_hours * 0.6)
  const criticalPhases = useMemo(() => {
    return [...wipList]
      .filter((w: WIPItem) => w.wip_count > 0 && w.p90_age_hours !== null && w.p90_age_hours !== undefined)
      .map((w: WIPItem) => ({
        ...w,
        critical_score: (w.wip_count * 0.4) + ((w.p90_age_hours || 0) * 0.6),
      }))
      .sort((a, b) => (b.critical_score || 0) - (a.critical_score || 0))
      .slice(0, 10);
  }, [wipList]);

  // Top produtos em WIP (agrupado por produto_id)
  const topProducts = useMemo(() => {
    const productMap = new Map<number, { produto_id: number; wip_count: number; fases: number[] }>();
    wipList.forEach((item: WIPItem) => {
      if (item.produto_id) {
        const existing = productMap.get(item.produto_id);
        if (existing) {
          existing.wip_count += item.wip_count;
          if (!existing.fases.includes(item.fase_id)) {
            existing.fases.push(item.fase_id);
          }
        } else {
          productMap.set(item.produto_id, {
            produto_id: item.produto_id,
            wip_count: item.wip_count,
            fases: [item.fase_id],
          });
        }
      }
    });
    return Array.from(productMap.values())
      .sort((a, b) => b.wip_count - a.wip_count)
      .slice(0, 10);
  }, [wipList]);

  // Check for BACKEND_DEPENDENCY_DOWN (BD down)
  const wipErrorMsg = wipError && typeof wipError === 'object' && 'message' in wipError ? String(wipError.message) : '';
  const isDependencyDown = wipErrorMsg.includes('BACKEND_DEPENDENCY_DOWN');

  // Error handling - DEPOIS de todos os hooks e useMemo
  if (wipError && !wipNotSupported && !isDependencyDown) {
    const errorMessage = wipErrorMsg || 'Erro desconhecido';
    const is404 = errorMessage.includes('ENDPOINT_NOT_FOUND') || errorMessage.includes('404');
    const is500 = errorMessage.includes('HTTP_500') || errorMessage.includes('500');
    
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onCommand={handleCommand} />
        <h1 style={{
          fontSize: tokens.typography.fontSize.title.lg,
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.text.title,
          marginBottom: tokens.spacing.lg,
        }}>
          SmartInventory Overview
        </h1>
        <ErrorState 
          message={is404 ? "Endpoint não encontrado (404)" : is500 ? "Erro do servidor (500)" : "Erro ao carregar dados de WIP"}
          reason={
            is404 
              ? `O endpoint /api/smartinventory/wip não foi encontrado. Verifique se o router está registrado no backend.`
              : is500
              ? `Erro do servidor: ${errorMessage.replace('HTTP_500: ', '')}`
              : errorMessage
          }
        />
      </div>
    );
  }

  // If WIP is NOT_SUPPORTED, show NotSupportedState but still try to show what we can
  if (wipNotSupported && wipList.length === 0) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onCommand={handleCommand} />
        <h1 style={{
          fontSize: tokens.typography.fontSize.title.lg,
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.text.title,
          marginBottom: tokens.spacing.lg,
        }}>
          SmartInventory Overview
        </h1>
        <NotSupportedState 
          reason={wipNotSupportedReason || 'WIP data not supported by available data'} 
          feature="smartinventory.overview"
          suggestion="Execute data ingestion or verify that OrdensFabrico and FasesOrdemFabrico tables have data."
        />
      </div>
    );
  }

  if (isLoading && !wipData && !wipMassData && !gelcoatData) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onCommand={handleCommand} />
        <h1 style={{
          fontSize: tokens.typography.fontSize.title.lg,
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.text.title,
          marginBottom: tokens.spacing.lg,
        }}>
          SmartInventory Overview
        </h1>
        <Loading />
      </div>
    );
  }

  if (isLoading && !wipData && !wipMassData && !gelcoatData) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onCommand={handleCommand} />
        <h1 style={{
          fontSize: tokens.typography.fontSize.title.lg,
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.text.title,
          marginBottom: tokens.spacing.lg,
        }}>
          SmartInventory Overview
        </h1>
        <Loading />
      </div>
    );
  }

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      {/* PageCommandBox - obrigatório em todas as páginas */}
      <PageCommandBox onCommand={handleCommand} />
      
      {/* Quick Note - obrigatório em todas as páginas */}
      <QuickNote placeholder='Nota rápida para esta página...' />

      {/* HEADER ZONE */}
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <h1
          style={{
            fontSize: tokens.typography.fontSize.title.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.text.title,
            fontFamily: tokens.typography.fontFamily,
            margin: 0,
            marginBottom: tokens.spacing.xs,
          }}
        >
          SmartInventory Overview
        </h1>
        <div style={{ display: 'flex', gap: tokens.spacing.md, alignItems: 'center', marginBottom: tokens.spacing.md }}>
          {wipData && 'generated_at' in wipData && <DataFreshnessChip lastIngestion={String(wipData.generated_at)} />}
          <span style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary }}>
            Digital Twin de Inventário & WIP
          </span>
        </div>

        {/* Filtros mínimos */}
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
      </div>

      {/* EXECUTIVE STRIP - KPIs densos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
        }}
      >
        {/* Total WIP - SEMPRE VISÍVEL */}
        <div title="Total de ordens em Work In Progress (WIP) em todas as fases">
          <KPIStat label="Total WIP" value={totalWip} />
        </div>
        
        {/* WIP Age P90 - SEMPRE VISÍVEL */}
        <div title="Percentil 90 do tempo de permanência em WIP (horas). 90% das ordens têm idade menor que este valor.">
          <KPIStat
            label="WIP Age P90"
            value={
              wipList.length > 0 && wipList.some((w: WIPItem) => w.p90_age_hours !== null && w.p90_age_hours !== undefined)
                ? `${Math.max(...wipList.map((w: WIPItem) => w.p90_age_hours || 0).filter(Boolean), 0).toFixed(1)}h`
                : 'N/A'
            }
          />
        </div>
        
        {/* WIP Mass - SEMPRE VISÍVEL (mesmo que NotSupported) */}
        {wipMassNotSupported ? (
          <div>
            <KPIStat label="WIP Mass" value="N/A" unit="kg" />
            <div style={{ marginTop: tokens.spacing.xs }}>
              <NotSupportedState 
                reason={wipMassError && typeof wipMassError === 'object' && 'message' in wipMassError
                  ? String(wipMassError.message).replace('NOT_SUPPORTED_BY_DATA: ', '')
                  : 'WIP Mass not supported by available data'}
                feature="wip_mass"
                suggestion="WIP Mass requires faseof_peso or produto_peso_desmolde fields to be populated."
              />
            </div>
          </div>
        ) : wipMassData?.total_wip_mass_kg !== undefined ? (
          <div>
            <KPIStat
              label="WIP Mass"
              value={wipMassData.total_wip_mass_kg.toFixed(1)}
              unit="kg"
            />
            <div style={{ marginTop: tokens.spacing.xs }}>
              <ConfidenceBadge
                level="ESTIMATED"
                reason="Baseado em faseof_peso ou produto_peso_desmolde"
              />
            </div>
          </div>
        ) : (
          <KPIStat label="WIP Mass" value="N/A" unit="kg" />
        )}
        {gelcoatData && 'status' in gelcoatData && gelcoatData.status === 'SUPPORTED' && (
          <>
            <div title="Consumo teórico de gelcoat para deck (baseado em especificações de produto, não consumo real)">
              <KPIStat
                label="Gel Deck"
                value={gelcoatData.total_theoretical_gel_deck?.toFixed(1) || '0'}
                unit="kg"
              />
            </div>
            <div title="Consumo teórico de gelcoat para casco (baseado em especificações de produto, não consumo real)">
              <KPIStat
                label="Gel Casco"
                value={gelcoatData.total_theoretical_gel_casco?.toFixed(1) || '0'}
                unit="kg"
              />
            </div>
          </>
        )}
      </div>

      {/* DISTRIBUTION ZONE - Heatmap + Rankings */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: tokens.spacing.lg,
          marginBottom: tokens.spacing.lg,
        }}
      >
        {/* Heatmap WIP por Fase */}
        <Panel>
          <SectionHeader
            title="WIP por Fase (Heatmap)"
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
                Ver mais →
              </button>
            }
          />
          {wipList.length > 0 ? (
            <HeatmapGrid
              cells={heatmapCells}
              onCellClick={(cell) => {
                const faseId = parseInt(cell.id.replace('fase-', ''));
                navigate(`/smartinventory/wip-explorer?fase_id=${faseId}`);
              }}
              colorScale="cold-hot"
              cellSize={50}
            />
          ) : (
            <Empty message="Sem WIP no momento" />
          )}
        </Panel>

        {/* Top WIP Aging */}
        <Panel>
          <SectionHeader title="Top WIP Aging (P90)" />
          {topAgingPhases.length > 0 ? (
            <DenseTable<WIPItem>
              columns={[
                {
                  key: 'fase',
                  header: 'Fase',
                  render: (row) => row.fase_nome || `Fase ${row.fase_id}`,
                },
                {
                  key: 'wip',
                  header: 'WIP',
                  render: (row) => row.wip_count.toString(),
                },
                {
                  key: 'p90',
                  header: 'P90 Age',
                  render: (row) => (
                    <Badge
                      variant={
                        (row.p90_age_hours || 0) > 48 ? 'danger' : (row.p90_age_hours || 0) > 24 ? 'warning' : 'default'
                      }
                    >
                      {row.p90_age_hours?.toFixed(1) || 'N/A'}h
                    </Badge>
                  ),
                },
              ]}
              data={topAgingPhases}
              onRowClick={(row) => {
                navigate(`/smartinventory/wip-explorer?fase_id=${row.fase_id}`);
              }}
            />
          ) : (
            <Empty message="Sem dados de aging" />
          )}
        </Panel>
      </div>

      {/* OPERATIONAL ZONE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.lg, marginBottom: tokens.spacing.lg }}>
        {/* Fases Críticas */}
        <Panel>
          <SectionHeader
            title="Fases Críticas"
            subtitle="Score = (WIP × 0.4) + (P90 Age × 0.6)"
          />
          {wipLoading ? (
            <Loading />
          ) : criticalPhases.length > 0 ? (
            <DenseTable<typeof criticalPhases[0]>
              columns={[
                {
                  key: 'fase',
                  header: 'Fase',
                  render: (row) => row.fase_nome || `Fase ${row.fase_id}`,
                },
                {
                  key: 'wip',
                  header: 'WIP',
                  render: (row) => (row.wip_count || 0).toLocaleString(),
                },
                {
                  key: 'p90',
                  header: 'P90 Age',
                  render: (row) => (row.p90_age_hours ? `${row.p90_age_hours.toFixed(1)}h` : 'N/A'),
                },
                {
                  key: 'score',
                  header: 'Score',
                  render: (row) => (
                    <Badge
                      variant={
                        (row.critical_score || 0) > 100 ? 'danger' : (row.critical_score || 0) > 50 ? 'warning' : 'default'
                      }
                    >
                      {(row.critical_score || 0).toFixed(1)}
                    </Badge>
                  ),
                },
              ]}
              data={criticalPhases}
              onRowClick={(row) => {
                navigate(`/smartinventory/wip-explorer?fase_id=${row.fase_id}`);
              }}
            />
          ) : (
            <Empty message="Sem fases críticas identificadas" />
          )}
        </Panel>

        {/* Top Produtos em WIP */}
        <Panel>
          <SectionHeader
            title="Top Produtos em WIP"
            subtitle="Agrupado por produto_id"
          />
          {wipLoading ? (
            <Loading />
          ) : topProducts.length > 0 ? (
            <DenseTable<typeof topProducts[0]>
              columns={[
                {
                  key: 'produto',
                  header: 'Produto ID',
                  render: (row) => row.produto_id.toString(),
                },
                {
                  key: 'wip',
                  header: 'WIP Total',
                  render: (row) => row.wip_count.toLocaleString(),
                },
                {
                  key: 'fases',
                  header: 'Fases',
                  render: (row) => `${row.fases.length} fase${row.fases.length !== 1 ? 's' : ''}`,
                },
              ]}
              data={topProducts}
              onRowClick={(row) => {
                navigate(`/smartinventory/wip-explorer?produto_id=${row.produto_id}`);
              }}
            />
          ) : (
            <Empty message="Sem produtos em WIP. Execute ingestão de dados ou verifique se há ordens em progresso." />
          )}
        </Panel>
      </div>

      {/* WIP por Fase (TABELA OBRIGATÓRIA) */}
      <Panel style={{ marginBottom: tokens.spacing.lg }}>
        <SectionHeader
          title="WIP por Fase"
          subtitle={wipList.length > 0 ? `${wipList.length} fases com WIP` : 'Clique numa linha para ver detalhes'}
        />
        {wipLoading ? (
          <Loading />
        ) : wipList.length > 0 ? (
          <DenseTable<WIPItem>
            columns={[
              {
                key: 'fase',
                header: 'Fase',
                render: (row) => row.fase_nome || `Fase ${row.fase_id}`,
              },
              {
                key: 'wip',
                header: 'WIP Count',
                render: (row) => (row.wip_count || 0).toLocaleString(),
              },
              {
                key: 'p50',
                header: 'P50 Age',
                render: (row) => (row.p50_age_hours ? `${row.p50_age_hours.toFixed(1)}h` : 'N/A'),
              },
              {
                key: 'p90',
                header: 'P90 Age',
                render: (row) => (row.p90_age_hours ? `${row.p90_age_hours.toFixed(1)}h` : 'N/A'),
              },
            ]}
            data={wipList}
            onRowClick={(row) => {
              // Navegar para WIP Explorer com filtro de fase
              navigate(`/smartinventory/wip-explorer?fase_id=${row.fase_id}`);
            }}
          />
        ) : (
          <Empty message="Nenhuma ordem em WIP. Execute ingestão de dados ou verifique se há ordens em progresso." />
        )}
      </Panel>

      {/* LIMITATIONS ZONE */}
      <Panel>
        <SectionHeader title="Data Health & Limitações" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: tokens.spacing.md,
          }}
        >
          <div style={{ padding: tokens.spacing.sm }}>
            <div style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary, marginBottom: tokens.spacing.xs }}>
              Status dos Endpoints
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.xs }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: tokens.typography.fontSize.body.xs }}>WIP</span>
                <Badge variant={wipData ? 'success' : wipError ? 'danger' : 'default'}>
                  {wipData ? 'OK' : wipError ? 'Error' : 'Loading'}
                </Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: tokens.typography.fontSize.body.xs }}>WIP Mass</span>
                <Badge variant={wipMassData ? 'success' : wipMassError ? 'danger' : 'default'}>
                  {wipMassData ? 'OK' : wipMassError ? 'Error' : 'Loading'}
                </Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: tokens.typography.fontSize.body.xs }}>Gelcoat</span>
                <Badge variant={
                  (gelcoatData && 'status' in gelcoatData && gelcoatData.status === 'SUPPORTED') ||
                  (gelcoatData && 'gelcoat_usage' in gelcoatData && gelcoatData.gelcoat_usage && gelcoatData.gelcoat_usage.length > 0)
                    ? 'success' : 'warning'
                }>
                  {(gelcoatData && 'status' in gelcoatData && gelcoatData.status === 'SUPPORTED') ||
                   (gelcoatData && 'gelcoat_usage' in gelcoatData && gelcoatData.gelcoat_usage && gelcoatData.gelcoat_usage.length > 0)
                    ? 'OK' : 'N/A'}
                </Badge>
              </div>
            </div>
          </div>

          <div style={{ padding: tokens.spacing.sm }}>
            <div style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary, marginBottom: tokens.spacing.xs }}>
              Limitações Conhecidas
            </div>
            <ul style={{ margin: 0, paddingLeft: tokens.spacing.lg, fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.muted }}>
              <li>❌ ROP, Safety Stock, Procurement — não suportado</li>
              <li>❌ Consumo real de materiais — não disponível</li>
              <li>❌ Movimentos de stock, armazéns — não disponível</li>
              <li>⚠️ Massa WIP — estimativa baseada em pesos de produto</li>
              <li>⚠️ Gelcoat — uso teórico, não consumo real</li>
            </ul>
          </div>

          {gelcoatData && 'disclaimer' in gelcoatData && gelcoatData.disclaimer && (
            <div
              style={{
                padding: tokens.spacing.sm,
                backgroundColor: tokens.colors.status.warning + '20',
                borderRadius: tokens.borderRadius.card,
                borderLeft: `3px solid ${tokens.colors.status.warning}`,
              }}
            >
              <div style={{ fontSize: tokens.typography.fontSize.body.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.status.warning, marginBottom: tokens.spacing.xs }}>
                ⚠️ Disclaimer Gelcoat
              </div>
              <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.secondary }}>
                {gelcoatData.disclaimer}
              </div>
            </div>
          )}
          {gelcoatData && 'gelcoat_usage' in gelcoatData && gelcoatData.gelcoat_usage && gelcoatData.gelcoat_usage.length > 0 && gelcoatData.gelcoat_usage[0]?.disclaimer && (
            <div
              style={{
                padding: tokens.spacing.sm,
                backgroundColor: tokens.colors.status.warning + '20',
                borderRadius: tokens.borderRadius.card,
                borderLeft: `3px solid ${tokens.colors.status.warning}`,
              }}
            >
              <div style={{ fontSize: tokens.typography.fontSize.body.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.status.warning, marginBottom: tokens.spacing.xs }}>
                ⚠️ Disclaimer Gelcoat
              </div>
              <div style={{ fontSize: tokens.typography.fontSize.body.xs, color: tokens.colors.text.secondary }}>
                {gelcoatData.gelcoat_usage[0].disclaimer}
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Drilldown Drawer */}
      <DrilldownDrawer
        isOpen={drawerOpen && !!selectedOfId}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedOfId(null);
        }}
        title={selectedOfId ? `Ordem ${selectedOfId}` : 'Detalhe'}
      >
        {orderDetail ? (
          <div>
            <div style={{ marginBottom: tokens.spacing.md }}>
              <KPIStat label="OF ID" value={orderDetail.of_id} />
              <KPIStat label="Produto ID" value={orderDetail.of_produto_id?.toString() || 'N/A'} />
              <KPIStat label="Fase Atual" value={orderDetail.of_fase_id?.toString() || 'N/A'} />
            </div>
            <button
              onClick={() => navigate(`/prodplan/orders/${selectedOfId}`)}
              style={{
                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                backgroundColor: tokens.colors.primary.default,
                color: tokens.colors.text.onAction,
                border: 'none',
                borderRadius: tokens.borderRadius.button,
                cursor: 'pointer',
              }}
            >
              Ver detalhe completo →
            </button>
          </div>
        ) : (
          <Loading />
        )}
      </DrilldownDrawer>
    </div>
  );
}
