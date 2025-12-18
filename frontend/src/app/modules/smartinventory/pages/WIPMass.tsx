/**
 * SMARTINVENTORY WIP Mass - Massa em processo
 * Industrial: denso, estados completos, confidence badges
 */

import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Panel,
  SectionHeader,
  DenseTable,
  KPIStat,
  ConfidenceBadge,
  Loading,
  Empty,
  ErrorState,
  NotSupportedState,
  PageCommandBox,
  DataFreshnessChip,
  tokens,
} from '../../../../ui-kit';
import { smartinventoryApi } from '../../../../api/api-client';

export default function SmartInventoryWIPMass() {
  const [searchParams, setSearchParams] = useSearchParams();
  const faseIdFilter = searchParams.get('fase_id') ? parseInt(searchParams.get('fase_id')!) : undefined;
  const produtoIdFilter = searchParams.get('produto_id') ? parseInt(searchParams.get('produto_id')!) : undefined;

  const { data, isLoading, error } = useQuery({
    queryKey: ['smartinventory', 'wip_mass', faseIdFilter, produtoIdFilter],
    queryFn: () => smartinventoryApi.getWIPMass(faseIdFilter, produtoIdFilter),
    staleTime: 30000,
  });

  // Handler para CommandBox
  const handleCommand = (command: string) => {
    const cmd = command.trim().toLowerCase();
    const faseMatch = cmd.match(/fase[:\s]+(\d+)/i);
    if (faseMatch) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('fase_id', faseMatch[1]);
      setSearchParams(newParams);
      return;
    }
    const produtoMatch = cmd.match(/produto[:\s]+(\d+)/i);
    if (produtoMatch) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('produto_id', produtoMatch[1]);
      setSearchParams(newParams);
      return;
    }
    if (cmd === 'limpar' || cmd === 'clear') {
      setSearchParams({});
      return;
    }
  };

  if (isLoading && !data) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onCommand={handleCommand} placeholder='Comandos: "fase:12", "produto:894", "limpar" | "/" para focar' />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          WIP Mass
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
          <PageCommandBox onCommand={handleCommand} placeholder='Comandos: "fase:12", "produto:894", "limpar" | "/" para focar' />
          <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
            WIP Mass
          </h1>
          <NotSupportedState reason={errorMessage} feature="smartinventory.wip-mass" />
        </div>
      );
    }
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onCommand={handleCommand} placeholder='Comandos: "fase:12", "produto:894", "limpar" | "/" para focar' />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          WIP Mass
        </h1>
        <ErrorState message="Erro ao carregar WIP Mass" reason={error instanceof Error ? error.message : 'Unknown error'} />
      </div>
    );
  }

  const massItems = data?.wip_mass || data?.wip_mass_by_phase_and_product || [];
  const totalMass = data?.total_wip_mass_kg || massItems.reduce((sum: number, item: any) => sum + (item.wip_mass_kg || item.total_mass_kg || 0), 0);

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onCommand={handleCommand} placeholder='Comandos: "fase:12", "produto:894", "limpar" | "/" para focar' />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, margin: 0 }}>
          WIP Mass
        </h1>
        {data && 'generated_at' in data && <DataFreshnessChip lastIngestion={String(data.generated_at)} />}
      </div>

      {/* Confidence Warning */}
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
        <ConfidenceBadge level="ESTIMATED" reason="Massa baseada em faseof_peso ou produto_peso_desmolde" />
        <span style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary }}>
          Estimativa baseada em faseof_peso quando disponível, fallback para produto_peso_desmolde
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPIStat label="Total WIP Mass" value={totalMass?.toFixed(1) || '0'} unit="kg" />
        <KPIStat label="Grupos Fase/Produto" value={massItems.length} />
      </div>

      <Panel>
        <SectionHeader title="Massa por Fase e Produto" />
        {massItems.length > 0 ? (
          <DenseTable
            columns={[
              { key: 'fase', header: 'Fase ID', render: (row: any) => row.fase_id },
              { key: 'produto', header: 'Produto ID', render: (row: any) => row.produto_id || 'N/A' },
              { key: 'wip', header: 'WIP Count', render: (row: any) => row.wip_count },
              { key: 'mass', header: 'Massa (kg)', render: (row: any) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs }}>
                  {(row.wip_mass_kg || row.total_mass_kg || 0).toFixed(2)}
                  {row.low_confidence && <ConfidenceBadge level="LOW" />}
                </span>
              )},
            ]}
            data={massItems}
          />
        ) : (
          <Empty message="Sem dados de massa WIP" />
        )}
      </Panel>
    </div>
  );
}
