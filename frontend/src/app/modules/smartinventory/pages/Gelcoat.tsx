/**
 * SMARTINVENTORY Gelcoat - Consumo teórico de gelcoat
 * Industrial: denso, estados completos, disclaimer fixo
 */

import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Panel,
  SectionHeader,
  DenseTable,
  KPIStat,
  Loading,
  Empty,
  ErrorState,
  NotSupportedState,
  PageCommandBox,
  DataFreshnessChip,
  tokens,
} from '../../../../ui-kit';
import { smartinventoryApi } from '../../../../api/api-client';

export default function SmartInventoryGelcoat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const produtoIdFilter = searchParams.get('produto_id') ? parseInt(searchParams.get('produto_id')!) : undefined;

  const { data, isLoading, error } = useQuery({
    queryKey: ['smartinventory', 'gelcoat', produtoIdFilter],
    queryFn: () => smartinventoryApi.getGelcoatTheoreticalUsage(produtoIdFilter),
    staleTime: 30000,
  });

  // Handler para CommandBox
  const handleCommand = (command: string) => {
    const cmd = command.trim().toLowerCase();
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
        <PageCommandBox onCommand={handleCommand} placeholder='Comandos: "produto:894", "limpar" | "/" para focar' />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Gelcoat (Consumo Teórico)
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
          <PageCommandBox onCommand={handleCommand} placeholder='Comandos: "produto:894", "limpar" | "/" para focar' />
          <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
            Gelcoat (Consumo Teórico)
          </h1>
          <NotSupportedState reason={errorMessage} feature="smartinventory.gelcoat" />
        </div>
      );
    }
  }

  if (error) {
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageCommandBox onCommand={handleCommand} placeholder='Comandos: "produto:894", "limpar" | "/" para focar' />
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
          Gelcoat (Consumo Teórico)
        </h1>
        <ErrorState message="Erro ao carregar gelcoat" reason={error instanceof Error ? error.message : 'Unknown error'} />
      </div>
    );
  }

  // Handle union type
  const isSupported = data && 'status' in data && data.status === 'SUPPORTED';
  const hasUsage = data && 'gelcoat_usage' in data && data.gelcoat_usage;
  const products = isSupported && data.by_product ? data.by_product : hasUsage ? data.gelcoat_usage : [];
  const totalDeck = isSupported ? data.total_theoretical_gel_deck : products.reduce((sum: number, p: any) => sum + (p.theoretical_usage_deck || 0), 0);
  const totalCasco = isSupported ? data.total_theoretical_gel_casco : products.reduce((sum: number, p: any) => sum + (p.theoretical_usage_casco || 0), 0);

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onCommand={handleCommand} placeholder='Comandos: "produto:894", "limpar" | "/" para focar' />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.lg }}>
        <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, margin: 0 }}>
          Gelcoat (Consumo Teórico)
        </h1>
        {data && ('generated_at' in data || (typeof data === 'object' && data !== null && 'generated_at' in data)) && (
          <DataFreshnessChip lastIngestion={String((data as any).generated_at)} />
        )}
      </div>

      {/* Disclaimer FIXO - sempre visível */}
      <div style={{
        padding: tokens.spacing.md,
        backgroundColor: tokens.colors.status.warning + '20',
        borderRadius: tokens.borderRadius.card,
        borderLeft: `4px solid ${tokens.colors.status.warning}`,
        marginBottom: tokens.spacing.lg,
      }}>
        <div style={{ fontSize: tokens.typography.fontSize.body.sm, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.status.warning, marginBottom: tokens.spacing.xs }}>
          ⚠️ DISCLAIMER
        </div>
        <div style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary }}>
          Este é o consumo TEÓRICO de gelcoat, baseado nas especificações de produto (Produto_QtdGelDeck e Produto_QtdGelCasco).
          NÃO representa consumo real. Sem dados de inventário ou movimentos de stock.
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        <KPIStat label="Total Gel Deck" value={totalDeck?.toFixed(1) || '0'} unit="kg" />
        <KPIStat label="Total Gel Casco" value={totalCasco?.toFixed(1) || '0'} unit="kg" />
        <KPIStat label="Produtos Analisados" value={products.length} />
      </div>

      <Panel>
        <SectionHeader title="Breakdown por Produto" subtitle="Top 20 produtos por consumo teórico" />
        {products.length > 0 ? (
          <DenseTable
            columns={[
              { key: 'produto', header: 'Produto', render: (row: any) => row.produto_nome || `Prod ${row.produto_id}` },
              { key: 'ofs', header: 'OFs em WIP', render: (row: any) => row.ofs_in_progress || row.order_count || 0 },
              { key: 'deck', header: 'Gel Deck (kg)', render: (row: any) => (row.theoretical_usage_deck || row.qtd_gel_deck || 0).toFixed(2) },
              { key: 'casco', header: 'Gel Casco (kg)', render: (row: any) => (row.theoretical_usage_casco || row.qtd_gel_casco || 0).toFixed(2) },
            ]}
            data={products.slice(0, 20)}
          />
        ) : (
          <Empty message="Sem dados de gelcoat por produto" />
        )}
      </Panel>
    </div>
  );
}
