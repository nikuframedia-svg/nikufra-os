/**
 * MetricCard - Card denso para KPIs
 * Industrial: compacto, sem desperdício de espaço
 */

import React from 'react';
import { tokens } from '../tokens';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: number;
    isPositive?: boolean;
  };
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
  onClick?: () => void;
  loading?: boolean;
  confidence?: 'high' | 'estimated' | 'low';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  delta,
  status = 'default',
  subtitle,
  onClick,
  loading,
  confidence,
}) => {
  const statusColors = {
    default: tokens.colors.text.primary,
    success: tokens.colors.status.success,
    warning: tokens.colors.status.warning,
    error: tokens.colors.status.error,
    info: tokens.colors.status.info,
  };

  const confidenceBadge = confidence && (
    <span style={{
      fontSize: tokens.typography.fontSize['2xs'],
      padding: `1px ${tokens.spacing['1']}`,
      backgroundColor: confidence === 'high' 
        ? tokens.colors.status.successMuted 
        : confidence === 'estimated'
          ? tokens.colors.status.warningMuted
          : tokens.colors.status.errorMuted,
      color: confidence === 'high'
        ? tokens.colors.status.success
        : confidence === 'estimated'
          ? tokens.colors.status.warning
          : tokens.colors.status.error,
      borderRadius: tokens.radius.sm,
      textTransform: 'uppercase' as const,
      letterSpacing: tokens.typography.letterSpacing.uppercase,
      fontWeight: tokens.typography.fontWeight.medium,
    }}>
      {confidence}
    </span>
  );

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: tokens.colors.surface.primary,
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: tokens.radius.lg,
        padding: tokens.spacing['3'],
        cursor: onClick ? 'pointer' : 'default',
        transition: tokens.transitions.fast,
        minWidth: '120px',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = tokens.colors.surface.hover;
          e.currentTarget.style.borderColor = tokens.colors.border.strong;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = tokens.colors.surface.primary;
        e.currentTarget.style.borderColor = tokens.colors.border.default;
      }}
    >
      {/* Header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: tokens.spacing['2'],
      }}>
        <span style={{
          fontSize: tokens.typography.fontSize.xs,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.text.tertiary,
          textTransform: 'uppercase',
          letterSpacing: tokens.typography.letterSpacing.uppercase,
        }}>
          {label}
        </span>
        {confidenceBadge}
      </div>

      {/* Value row */}
      {loading ? (
        <div style={{
          height: '28px',
          backgroundColor: tokens.colors.surface.tertiary,
          borderRadius: tokens.radius.sm,
          animation: 'pulse 1.5s infinite',
        }} />
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: tokens.spacing['1'],
        }}>
          <span style={{
            fontSize: tokens.typography.fontSize['2xl'],
            fontWeight: tokens.typography.fontWeight.bold,
            color: statusColors[status],
            fontFamily: tokens.typography.fontFamily.mono,
            letterSpacing: tokens.typography.letterSpacing.tight,
          }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && (
            <span style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.text.tertiary,
            }}>
              {unit}
            </span>
          )}
          {delta && (
            <span style={{
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.medium,
              color: delta.isPositive ? tokens.colors.status.success : tokens.colors.status.error,
              marginLeft: tokens.spacing['1'],
            }}>
              {delta.value >= 0 ? '+' : ''}{delta.value.toFixed(1)}
            </span>
          )}
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p style={{
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.text.muted,
          margin: `${tokens.spacing['1']} 0 0`,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

// Stat Row para listas de métricas
interface StatRowProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'default' | 'success' | 'warning' | 'error';
}

export const StatRow: React.FC<StatRowProps> = ({ label, value, unit, status = 'default' }) => {
  const statusColors = {
    default: tokens.colors.text.primary,
    success: tokens.colors.status.success,
    warning: tokens.colors.status.warning,
    error: tokens.colors.status.error,
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${tokens.spacing['2']} 0`,
      borderBottom: `1px solid ${tokens.colors.border.subtle}`,
    }}>
      <span style={{
        fontSize: tokens.typography.fontSize.sm,
        color: tokens.colors.text.secondary,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: statusColors[status],
        fontFamily: tokens.typography.fontFamily.mono,
      }}>
        {value}{unit && <span style={{ color: tokens.colors.text.tertiary, marginLeft: '2px' }}>{unit}</span>}
      </span>
    </div>
  );
};

