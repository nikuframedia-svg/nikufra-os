/**
 * QUALITY Overview - Dashboard de qualidade completo
 * Endpoints: /quality/overview, /quality/risk
 * Industrial: heatmap, tabelas densas, drill-down
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Panel,
  SectionHeader,
  KPIStat,
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
import { qualityApi } from '../../../../api/api-client';
import { useBackendHealth } from '../../../../api/hooks';

interface HeatmapItem {
  fase_avaliacao_id?: number;
  fase_avaliacao: string | null;
  fase_culpada_id?: number;
  fase_culpada: string | null;
  count: number;
  gravidade_avg: number | null;
}

interface RiskItem {
  modelo_id: number;
  modelo_nome?: string;
  fase_culpada_id?: number;
  fase_culpada?: string;
  error_count: number;
  gravidade_avg: number;
  risk_score: number;
  produto_id?: number;
  fase_id?: number;
  historical_rate?: number | null;
}

// Heatmap Cell Component
const HeatmapCell: React.FC<{
  value: number;
  maxValue: number;
  label?: string;
  onClick?: () => void;
}> = ({ value, maxValue, label, onClick }) => {
  const intensity = maxValue > 0 ? Math.min(value / maxValue, 1) : 0;
  const bgColor = intensity > 0.7 
    ? tokens.colors.status.error 
    : intensity > 0.4 
      ? tokens.colors.status.warning 
      : intensity > 0.1 
        ? tokens.colors.status.info 
        : tokens.colors.card.elevated;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: `${bgColor}${Math.floor(intensity * 60 + 20).toString(16).padStart(2, '0')}`,
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: '2px',
        padding: tokens.spacing.sm,
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'center',
        minWidth: '60px',
        minHeight: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ 
        fontSize: tokens.typography.fontSize.body.md,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.colors.text.title,
      }}>
        {value}
      </div>
      {label && (
        <div style={{ 
          fontSize: '10px',
          color: tokens.colors.text.muted,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}>
          {label}
        </div>
      )}
    </div>
  );
};

// Severity Badge
const SeverityBadge: React.FC<{ value: number }> = ({ value }) => {
  const color = value > 7 
    ? tokens.colors.status.error 
    : value > 4 
      ? tokens.colors.status.warning 
      : tokens.colors.status.success;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: `2px ${tokens.spacing.sm}`,
      backgroundColor: color + '20',
      color: color,
      fontSize: tokens.typography.fontSize.label,
      fontWeight: tokens.typography.fontWeight.medium,
      borderRadius: tokens.borderRadius.badge,
      border: `1px solid ${color}40`,
    }}>
      {value.toFixed(1)}
    </span>
  );
};

export default function QualityOverview() {
  const navigate = useNavigate();
  const [faseAvaliacaoId, setFaseAvaliacaoId] = useState<number | null>(null);
  const [faseCulpadaId, setFaseCulpadaId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Check backend health
  const { data: health } = useBackendHealth();
  const isBackendOffline = !health || health.status === 'unhealthy';
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Overview.tsx:137',message:'quality useQuery hooks called',data:{isBackendOffline,healthStatus:health?.status,faseAvaliacaoId,faseCulpadaId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  // Quality overview (heatmap)
  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['quality', 'overview', faseAvaliacaoId, faseCulpadaId],
    queryFn: () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Overview.tsx:145',message:'quality overview queryFn executing',data:{faseAvaliacaoId,faseCulpadaId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return qualityApi.getOverview(faseAvaliacaoId || undefined, faseCulpadaId || undefined);
    },
    staleTime: 30000,
    enabled: !isBackendOffline, // Desabilitar se backend offline
    // #region agent log
    refetchInterval: false, // Desabilitar polling automático
    // #endregion
  });

  // Quality risk
  const { data: riskData } = useQuery({
    queryKey: ['quality', 'risk'],
    queryFn: () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Overview.tsx:155',message:'quality risk queryFn executing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return qualityApi.getRisk();
    },
    staleTime: 30000,
    enabled: !isBackendOffline, // Desabilitar se backend offline
    // #region agent log
    refetchInterval: false, // Desabilitar polling automático
    // #endregion
  });

  const isLoading = overviewLoading && !overviewData;

  if (overviewError && typeof overviewError === 'object' && 'message' in overviewError) {
    const errorMessage = String(overviewError.message);
    if (errorMessage.includes('NOT_SUPPORTED_BY_DATA')) {
      return (
        <div style={{ padding: tokens.spacing.lg }}>
          <NotSupportedState reason={errorMessage} feature="quality.overview" />
        </div>
      );
    }
  }

  if (isLoading) {
    return <Loading />;
  }

  if (overviewError) {
    return <ErrorComponent message="Erro ao carregar quality overview" />;
  }

  const heatmap: HeatmapItem[] = overviewData?.heatmap || [];
  // Transform risk data if format differs
  const risksRaw = riskData?.risks || [];
  const risks: RiskItem[] = risksRaw.map((r: any) => ({
    modelo_id: r.modelo_id ?? r.produto_id ?? 0,
    modelo_nome: r.modelo_nome,
    fase_culpada_id: r.fase_culpada_id ?? r.fase_id,
    fase_culpada: r.fase_culpada,
    error_count: r.error_count ?? 0,
    gravidade_avg: r.gravidade_avg ?? 0,
    risk_score: r.risk_score ?? 0,
  }));
  
  // Calculate totals
  const totalErrors = heatmap.reduce((sum, item) => sum + item.count, 0);
  const avgGravidade = heatmap.length > 0 
    ? heatmap.reduce((sum, item) => sum + (item.gravidade_avg || 0), 0) / heatmap.length 
    : 0;
  const maxCount = Math.max(...heatmap.map(item => item.count), 1);

  // Filter heatmap
  const filteredHeatmap = heatmap.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.fase_avaliacao?.toLowerCase().includes(term) ||
      item.fase_culpada?.toLowerCase().includes(term)
    );
  });

  // Group by fase_avaliacao for heatmap visualization
  const faseAvaliacoes = [...new Set(heatmap.map(item => item.fase_avaliacao))].filter(Boolean);
  const faseCulpadas = [...new Set(heatmap.map(item => item.fase_culpada))].filter(Boolean);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: tokens.colors.background,
      padding: tokens.spacing.lg,
    }}>
      <PageCommandBox onSearch={(q) => setSearchTerm(q)} />
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: tokens.spacing.xl,
        paddingBottom: tokens.spacing.lg,
        borderBottom: `1px solid ${tokens.colors.border}`,
      }}>
        <div>
          <h1 style={{
            fontSize: tokens.typography.fontSize.title.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.text.title,
            fontFamily: tokens.typography.fontFamily,
            margin: 0,
            marginBottom: tokens.spacing.xs,
          }}>
            Quality / ZDM Overview
          </h1>
          <p style={{
            fontSize: tokens.typography.fontSize.body.sm,
            color: tokens.colors.text.secondary,
            margin: 0,
          }}>
            Heatmap de erros: Fase Avaliação vs Fase Culpada
          </p>
        </div>
        {overviewData && 'generated_at' in overviewData && <DataFreshnessChip lastIngestion={String(overviewData.generated_at)} />}
      </div>

      {/* Top KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: tokens.spacing.md,
        marginBottom: tokens.spacing.lg,
      }}>
        <Panel>
          <div style={{ padding: tokens.spacing.sm }}>
            <KPIStat label="Total Errors" value={totalErrors} />
          </div>
        </Panel>
        <Panel>
          <div style={{ padding: tokens.spacing.sm }}>
            <KPIStat label="Avg Gravidade" value={avgGravidade.toFixed(2)} />
          </div>
        </Panel>
        <Panel>
          <div style={{ padding: tokens.spacing.sm }}>
            <KPIStat label="Fases Avaliação" value={faseAvaliacoes.length} />
          </div>
        </Panel>
        <Panel>
          <div style={{ padding: tokens.spacing.sm }}>
            <KPIStat label="Fases Culpadas" value={faseCulpadas.length} />
          </div>
        </Panel>
      </div>

      {/* Filters */}
      <FiltersBar
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Search fase...',
        }}
        chips={[
          { label: 'All', active: !faseAvaliacaoId && !faseCulpadaId, onClick: () => { setFaseAvaliacaoId(null); setFaseCulpadaId(null); } },
        ]}
      />

      {/* Main content grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: tokens.spacing.lg,
        marginTop: tokens.spacing.lg,
      }}>
        {/* Heatmap Table */}
        <Panel>
          <SectionHeader 
            title="Error Heatmap" 
            actions={
              <button
                onClick={() => navigate('/quality/by-phase')}
                style={{
                  padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                  backgroundColor: 'transparent',
                  border: `1px solid ${tokens.colors.border}`,
                  borderRadius: tokens.borderRadius.button,
                  color: tokens.colors.text.secondary,
                  fontSize: tokens.typography.fontSize.label,
                  cursor: 'pointer',
                }}
              >
                By Phase →
              </button>
            }
          />
          {filteredHeatmap.length > 0 ? (
            <DenseTable
              columns={[
                {
                  key: 'fase_avaliacao',
                  header: 'Fase Avaliação',
                  render: (row: HeatmapItem) => row.fase_avaliacao || 'N/A',
                },
                {
                  key: 'fase_culpada',
                  header: 'Fase Culpada',
                  render: (row: HeatmapItem) => row.fase_culpada || 'N/A',
                },
                {
                  key: 'count',
                  header: 'Count',
                  render: (row: HeatmapItem) => (
                    <HeatmapCell 
                      value={row.count} 
                      maxValue={maxCount}
                    />
                  ),
                },
                {
                  key: 'gravidade',
                  header: 'Gravidade Avg',
                  render: (row: HeatmapItem) =>
                    row.gravidade_avg ? <SeverityBadge value={row.gravidade_avg} /> : 'N/A',
                },
              ]}
              data={filteredHeatmap}
              onRowClick={(row: HeatmapItem) => {
                if (row.fase_culpada_id) {
                  navigate(`/quality/by-phase?fase_culpada_id=${row.fase_culpada_id}`);
                }
              }}
            />
          ) : (
            <Empty message="Sem dados de qualidade" />
          )}
        </Panel>

        {/* Risk Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
          {/* Top Risks */}
          <Panel>
            <SectionHeader 
              title="Top Risks" 
              actions={
                <button
                  onClick={() => navigate('/quality/risk')}
                  style={{
                    padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                    backgroundColor: 'transparent',
                    border: `1px solid ${tokens.colors.border}`,
                    borderRadius: tokens.borderRadius.button,
                    color: tokens.colors.text.secondary,
                    fontSize: tokens.typography.fontSize.label,
                    cursor: 'pointer',
                  }}
                >
                  View All →
                </button>
              }
            />
            {risks.length > 0 ? (
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {risks.slice(0, 10).map((risk, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(`/quality/risk?modelo_id=${risk.modelo_id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: tokens.spacing.sm,
                      borderBottom: `1px solid ${tokens.colors.border}`,
                      cursor: 'pointer',
                      backgroundColor: idx === 0 ? `${tokens.colors.status.error}10` : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: idx < 3 ? tokens.colors.status.error + '20' : tokens.colors.card.elevated,
                        borderRadius: tokens.borderRadius.badge,
                        fontSize: tokens.typography.fontSize.label,
                        fontWeight: tokens.typography.fontWeight.semibold,
                        color: idx < 3 ? tokens.colors.status.error : tokens.colors.text.secondary,
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ 
                          fontSize: tokens.typography.fontSize.body.sm,
                          color: tokens.colors.text.body,
                        }}>
                          {risk.modelo_nome || `Modelo ${risk.modelo_id}`}
                        </div>
                        {risk.fase_culpada && (
                          <div style={{ 
                            fontSize: tokens.typography.fontSize.label,
                            color: tokens.colors.text.muted,
                          }}>
                            {risk.fase_culpada}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: tokens.typography.fontSize.body.sm,
                        fontWeight: tokens.typography.fontWeight.semibold,
                        color: risk.risk_score > 0.7 ? tokens.colors.status.error : tokens.colors.text.body,
                      }}>
                        {(risk.risk_score * 100).toFixed(0)}%
                      </div>
                      <div style={{ 
                        fontSize: tokens.typography.fontSize.label,
                        color: tokens.colors.text.muted,
                      }}>
                        {risk.error_count} errors
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty message="Sem dados de risco" />
            )}
          </Panel>

          {/* Visual Heatmap Grid */}
          {faseAvaliacoes.length > 0 && faseCulpadas.length > 0 && faseAvaliacoes.length <= 10 && faseCulpadas.length <= 10 && (
            <Panel>
              <SectionHeader title="Visual Heatmap" />
              <div style={{ 
                overflowX: 'auto',
                padding: tokens.spacing.sm,
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `auto repeat(${faseCulpadas.length}, 1fr)`,
                  gap: '2px',
                  fontSize: tokens.typography.fontSize.label,
                }}>
                  {/* Header row */}
                  <div style={{ padding: tokens.spacing.xs }}></div>
                  {faseCulpadas.map((fc, idx) => (
                    <div key={idx} style={{ 
                      padding: tokens.spacing.xs, 
                      textAlign: 'center',
                      color: tokens.colors.text.muted,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {(fc as string).substring(0, 8)}
                    </div>
                  ))}
                  
                  {/* Data rows */}
                  {faseAvaliacoes.map((fa, rowIdx) => (
                    <React.Fragment key={rowIdx}>
                      <div style={{ 
                        padding: tokens.spacing.xs,
                        color: tokens.colors.text.muted,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {(fa as string).substring(0, 8)}
                      </div>
                      {faseCulpadas.map((fc, colIdx) => {
                        const item = heatmap.find(h => h.fase_avaliacao === fa && h.fase_culpada === fc);
                        return (
                          <HeatmapCell
                            key={colIdx}
                            value={item?.count || 0}
                            maxValue={maxCount}
                          />
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {/* Limitations */}
          <Panel>
            <SectionHeader title="Data Health" />
            <div style={{ padding: tokens.spacing.sm }}>
              <div style={{
                padding: tokens.spacing.sm,
                backgroundColor: tokens.colors.card.elevated,
                borderRadius: tokens.borderRadius.card,
                fontSize: tokens.typography.fontSize.body.xs,
                color: tokens.colors.text.secondary,
              }}>
                {heatmap.length > 0 ? (
                  <>
                    <div>✅ Quality data available</div>
                    <div>• {heatmap.length} error combinations</div>
                    <div>• {faseAvaliacoes.length} evaluation phases</div>
                    <div>• {faseCulpadas.length} culprit phases</div>
                  </>
                ) : (
                  <>
                    <div>⚠ Limited quality data</div>
                    <div>• Run data ingestion for more data</div>
                  </>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
