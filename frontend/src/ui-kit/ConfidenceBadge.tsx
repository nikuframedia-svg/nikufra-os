/**
 * ConfidenceBadge - Badge de confiança de dados
 * Industrial: denso, sem decoração
 */

import { tokens } from './tokens';

type ConfidenceLevel = 'HIGH' | 'ESTIMATED' | 'LOW';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  reason?: string;
  className?: string;
}

export function ConfidenceBadge({ level, reason, className = '' }: ConfidenceBadgeProps) {
  const getVariant = (level: ConfidenceLevel): { bg: string; color: string; label: string } => {
    switch (level) {
      case 'HIGH':
        return {
          bg: tokens.colors.status.success + '20',
          color: tokens.colors.status.success,
          label: 'HIGH',
        };
      case 'ESTIMATED':
        return {
          bg: tokens.colors.status.warning + '20',
          color: tokens.colors.status.warning,
          label: 'ESTIMATED',
        };
      case 'LOW':
        return {
          bg: tokens.colors.status.error + '20',
          color: tokens.colors.status.error,
          label: 'LOW',
        };
    }
  };

  const variant = getVariant(level);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spacing.xs,
        padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
        backgroundColor: variant.bg,
        color: variant.color,
        borderRadius: tokens.borderRadius.badge,
        fontSize: tokens.typography.fontSize.label,
        fontWeight: tokens.typography.fontWeight.medium,
        fontFamily: tokens.typography.fontFamily,
        textTransform: 'uppercase',
        letterSpacing: tokens.typography.letterSpacing.wide,
      }}
      className={className}
      title={reason}
    >
      {variant.label}
    </span>
  );
}

