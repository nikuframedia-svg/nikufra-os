/**
 * DataFreshnessChip - Mostra última ingestão e fonte
 * Industrial: chip denso, sem decoração
 */

import { tokens } from './tokens';

interface DataFreshnessChipProps {
  lastIngestion?: string; // ISO datetime
  runId?: number;
  source?: string;
  className?: string;
}

export function DataFreshnessChip({
  lastIngestion,
  runId,
  source = 'Folha_IA.xlsx',
  className = '',
}: DataFreshnessChipProps) {
  const getTimeAgo = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return '<1h ago';
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spacing.xs,
        padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
        backgroundColor: tokens.colors.card.default,
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: tokens.borderRadius.badge,
        fontSize: tokens.typography.fontSize.body.xs,
        color: tokens.colors.text.secondary,
        fontFamily: tokens.typography.fontFamily,
      }}
      className={className}
      title={`Última ingestão: ${lastIngestion || 'N/A'} | Fonte: ${source}${runId ? ` | Run ID: ${runId}` : ''}`}
    >
      <span style={{ color: tokens.colors.text.muted }}>📊</span>
      <span>Data: {getTimeAgo(lastIngestion)}</span>
      {runId && <span style={{ color: tokens.colors.text.muted }}>| Run {runId}</span>}
    </div>
  );
}

