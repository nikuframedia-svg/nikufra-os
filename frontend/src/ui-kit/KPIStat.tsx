/**
 * KPIStat - Estatística KPI (label + value + delta opcional)
 * Industrial: denso, sem decoração, unidades sempre presentes
 */

import { tokens } from './tokens';
import { Badge } from './Badge';

interface KPIStatProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: number;
    isPositive?: boolean;
  };
  className?: string;
}

export function KPIStat({ label, value, unit, delta, className = '' }: KPIStatProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.xs,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.label,
    fontWeight: tokens.typography.fontWeight.regular,
    color: tokens.colors.text.muted,
    fontFamily: tokens.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: tokens.typography.letterSpacing.uppercase,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.title.md,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.title,
    fontFamily: tokens.typography.fontFamily,
    lineHeight: tokens.typography.lineHeight.tight,
  };

  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  const fullValue = unit ? `${displayValue} ${unit}` : displayValue;

  return (
    <div style={containerStyle} className={className}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{fullValue}</div>
      {delta && (
        <Badge variant={delta.isPositive ? 'success' : 'danger'}>
          {delta.isPositive ? '+' : ''}
          {delta.value.toFixed(1)}%
        </Badge>
      )}
    </div>
  );
}

