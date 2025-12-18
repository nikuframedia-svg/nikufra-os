/**
 * SMARTINVENTORY Material Yield - Rendimento e desperdício
 * Industrial: denso, estados completos
 */

import { useQuery } from '@tanstack/react-query';
import {
  Panel,
  SectionHeader,
  KPIStat,
  ConfidenceBadge,
  Loading,
  Empty,
  Error as ErrorState,
  NotSupportedState,
  PageCommandBox,
  DataFreshnessChip,
  tokens,
} from '../../../../ui-kit';
import { smartinventoryApi } from '../../../../api/api-client';

export default function SmartInventoryMaterialYield() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['smartinventory', 'material_yield'],
    queryFn: () => smartinventoryApi.getMaterialYield(),
    staleTime: 60000,
  });

  // Check for NOT_SUPPORTED_BY_DATA
  const isNotSupported = error && typeof error === 'object' && 'message' in error 
    ? String(error.message).includes('NOT_SUPPORTED_BY_DATA')
    : data && typeof data === 'object' && 'status' in data && data.status === 'NOT_SUPPORTED_BY_DATA';

  if (isLoading && !data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <Loading />
      </div>
    );
  }

  if (isNotSupported) {
    const reason = (error && typeof error === 'object' && 'message' in error)
      ? String(error.message).replace('NOT_SUPPORTED_BY_DATA: ', '')
      : (data && typeof data === 'object' && 'reason' in data)
        ? String(data.reason)
        : 'Material yield não suportado pelos dados disponíveis';
    
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Material Yield
        </h1>
        <NotSupportedState 
          reason={reason}
          suggestion="Dados de yield requerem campos faseof_retorno preenchidos ou produto_peso_desmolde vs produto_peso_acabamento"
          feature="smartinventory.material-yield" 
        />
      </div>
    );
  }

  if (error && !isNotSupported) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onSearch={() => {}} />
        <ErrorState message="Erro ao carregar material yield" reason={error?.message} />
      </div>
    );
  }

  const yieldData = data && typeof data === 'object' && !('status' in data) ? data : null;

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onSearch={() => {}} />
      
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, margin: 0, marginBottom: tokens.spacing.xs }}>
          Material Yield
        </h1>
        <div style={{ display: 'flex', gap: tokens.spacing.md, alignItems: 'center' }}>
          {yieldData && 'generated_at' in yieldData && <DataFreshnessChip lastIngestion={String(yieldData.generated_at)} />}
          <span style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary }}>
            Rendimento e desperdício de materiais por produto
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        padding: tokens.spacing.md,
        backgroundColor: tokens.colors.status.info + '20',
        borderRadius: tokens.borderRadius.card,
        borderLeft: `4px solid ${tokens.colors.status.info}`,
        marginBottom: tokens.spacing.lg,
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacing.md,
      }}>
        <ConfidenceBadge level="ESTIMATED" reason="Baseado em produto_peso_desmolde vs produto_peso_acabamento" />
        <span style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary }}>
          Yield baseline calculado a partir de pesos de produto. faseof_retorno usado quando disponível.
        </span>
      </div>

      {/* KPIs - apenas se dados disponíveis */}
      {yieldData && 'avg_yield_pct' in yieldData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <KPIStat label="Yield Médio" value={String((yieldData as any).avg_yield_pct?.toFixed(1) || 'N/A')} unit="%" />
          <KPIStat label="Produtos Analisados" value={String((yieldData as any).products_analyzed || 0)} />
          <KPIStat label="Pior Yield" value={String((yieldData as any).worst_yield_pct?.toFixed(1) || 'N/A')} unit="%" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
          <KPIStat label="Yield Médio" value="N/A" unit="%" />
          <KPIStat label="Produtos Analisados" value="0" />
          <KPIStat label="Pior Yield" value="N/A" unit="%" />
        </div>
      )}

      <Panel>
        <SectionHeader title="Ranking por Yield" subtitle="Produtos com pior rendimento (maior desperdício)" />
        {yieldData && 'ranking' in yieldData && Array.isArray((yieldData as any).ranking) && (yieldData as any).ranking.length > 0 ? (
          <div style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary }}>
            Dados de ranking disponíveis (implementar tabela quando schema definido)
          </div>
        ) : (
          <Empty message="Dados de yield não disponíveis. Verifique se o endpoint /smartinventory/material_yield está implementado no backend." />
        )}
      </Panel>
    </div>
  );
}

