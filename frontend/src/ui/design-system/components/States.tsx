/**
 * State Components - Loading, Empty, Error, NotSupported
 * Estados obrigatórios para cada endpoint
 */

import React from 'react';
import { tokens } from '../tokens';

// ============================================
// LOADING SKELETON
// ============================================
interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'chart' | 'text' | 'full';
  lines?: number;
  height?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  lines = 3,
  height = '200px',
}) => {
  const pulseStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.surface.tertiary,
    borderRadius: tokens.radius.sm,
    animation: 'pulse 1.5s ease-in-out infinite',
  };

  if (variant === 'text') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing['2'] }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{
              ...pulseStyle,
              height: '14px',
              width: i === lines - 1 ? '60%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing['1'] }}>
        <div style={{ ...pulseStyle, height: '32px', marginBottom: tokens.spacing['2'] }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ ...pulseStyle, height: '36px' }} />
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div style={{
        ...pulseStyle,
        height,
        display: 'flex',
        alignItems: 'flex-end',
        gap: tokens.spacing['1'],
        padding: tokens.spacing['4'],
      }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              ...pulseStyle,
              flex: 1,
              height: `${30 + Math.random() * 50}%`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing['4'],
        padding: tokens.spacing['4'],
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: tokens.spacing['3'] }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ ...pulseStyle, height: '80px' }} />
          ))}
        </div>
        <div style={{ ...pulseStyle, height: '200px' }} />
        <div style={{ ...pulseStyle, height: '300px' }} />
      </div>
    );
  }

  // Default: card
  return (
    <div style={{
      ...pulseStyle,
      height,
      padding: tokens.spacing['4'],
    }} />
  );
};

// ============================================
// EMPTY STATE
// ============================================
interface EmptyStateProps {
  title?: string;
  message: string;
  reason?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Sem dados',
  message,
  reason,
  action,
  icon = '📭',
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing['8'],
    textAlign: 'center',
    backgroundColor: tokens.colors.surface.secondary,
    border: `1px dashed ${tokens.colors.border.default}`,
    borderRadius: tokens.radius.lg,
  }}>
    <span style={{ fontSize: '32px', marginBottom: tokens.spacing['3'], opacity: 0.5 }}>
      {icon}
    </span>
    <h4 style={{
      fontSize: tokens.typography.fontSize.md,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.text.secondary,
      margin: 0,
      marginBottom: tokens.spacing['1'],
    }}>
      {title}
    </h4>
    <p style={{
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.text.tertiary,
      margin: 0,
      maxWidth: '300px',
    }}>
      {message}
    </p>
    {reason && (
      <p style={{
        fontSize: tokens.typography.fontSize.xs,
        color: tokens.colors.text.muted,
        margin: `${tokens.spacing['2']} 0 0`,
        padding: tokens.spacing['2'],
        backgroundColor: tokens.colors.surface.tertiary,
        borderRadius: tokens.radius.sm,
        fontFamily: tokens.typography.fontFamily.mono,
      }}>
        Motivo: {reason}
      </p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        style={{
          marginTop: tokens.spacing['4'],
          padding: `${tokens.spacing['2']} ${tokens.spacing['4']}`,
          backgroundColor: tokens.colors.accent.primary,
          color: tokens.colors.text.inverse,
          border: 'none',
          borderRadius: tokens.radius.md,
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium,
          cursor: 'pointer',
        }}
      >
        {action.label}
      </button>
    )}
  </div>
);

// ============================================
// ERROR STATE
// ============================================
interface ErrorStateProps {
  title?: string;
  message: string;
  endpoint?: string;
  statusCode?: number;
  correlationId?: string;
  onRetry?: () => void;
  onCopyDebug?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Erro',
  message,
  endpoint,
  statusCode,
  correlationId,
  onRetry,
  onCopyDebug,
}) => {
  const debugPayload = JSON.stringify({
    endpoint,
    statusCode,
    correlationId,
    message,
    timestamp: new Date().toISOString(),
  }, null, 2);

  const handleCopyDebug = () => {
    navigator.clipboard.writeText(debugPayload);
    onCopyDebug?.();
  };

  return (
    <div style={{
      padding: tokens.spacing['4'],
      backgroundColor: tokens.colors.status.errorMuted,
      border: `1px solid ${tokens.colors.status.error}40`,
      borderRadius: tokens.radius.lg,
      borderLeft: `3px solid ${tokens.colors.status.error}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacing['3'] }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <h4 style={{
            fontSize: tokens.typography.fontSize.md,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.status.error,
            margin: 0,
            marginBottom: tokens.spacing['1'],
          }}>
            {title}
          </h4>
          <p style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.text.secondary,
            margin: 0,
          }}>
            {message}
          </p>
          
          {/* Debug info */}
          {(endpoint || statusCode || correlationId) && (
            <div style={{
              marginTop: tokens.spacing['3'],
              padding: tokens.spacing['2'],
              backgroundColor: tokens.colors.surface.primary,
              borderRadius: tokens.radius.sm,
              fontSize: tokens.typography.fontSize.xs,
              fontFamily: tokens.typography.fontFamily.mono,
              color: tokens.colors.text.tertiary,
            }}>
              {endpoint && <div>Endpoint: {endpoint}</div>}
              {statusCode && <div>Status: {statusCode}</div>}
              {correlationId && <div>Correlation ID: {correlationId}</div>}
            </div>
          )}
          
          {/* Actions */}
          <div style={{ display: 'flex', gap: tokens.spacing['2'], marginTop: tokens.spacing['3'] }}>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  padding: `${tokens.spacing['1']} ${tokens.spacing['3']}`,
                  backgroundColor: tokens.colors.status.error,
                  color: tokens.colors.text.primary,
                  border: 'none',
                  borderRadius: tokens.radius.md,
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                  cursor: 'pointer',
                }}
              >
                Tentar novamente
              </button>
            )}
            <button
              onClick={handleCopyDebug}
              style={{
                padding: `${tokens.spacing['1']} ${tokens.spacing['3']}`,
                backgroundColor: 'transparent',
                color: tokens.colors.text.tertiary,
                border: `1px solid ${tokens.colors.border.default}`,
                borderRadius: tokens.radius.md,
                fontSize: tokens.typography.fontSize.xs,
                cursor: 'pointer',
              }}
            >
              Copiar debug
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// NOT SUPPORTED STATE
// ============================================
interface NotSupportedStateProps {
  feature: string;
  reason: string;
  type: 'data' | 'backend' | 'gate';
  suggestion?: string;
  matchRate?: number;
  timestamp?: string;
}

export const NotSupportedState: React.FC<NotSupportedStateProps> = ({
  feature,
  reason,
  type,
  suggestion,
  matchRate,
  timestamp,
}) => {
  const typeConfig = {
    data: {
      icon: '📊',
      title: 'NOT_SUPPORTED_BY_DATA',
      color: tokens.colors.status.warning,
      bgColor: tokens.colors.status.warningMuted,
    },
    backend: {
      icon: '🔧',
      title: 'NOT_SUPPORTED_BY_BACKEND',
      color: tokens.colors.status.info,
      bgColor: tokens.colors.status.infoMuted,
    },
    gate: {
      icon: '🚫',
      title: 'FEATURE_GATED',
      color: tokens.colors.text.muted,
      bgColor: tokens.colors.surface.tertiary,
    },
  };

  const config = typeConfig[type];

  return (
    <div style={{
      padding: tokens.spacing['4'],
      backgroundColor: config.bgColor,
      border: `1px solid ${config.color}40`,
      borderRadius: tokens.radius.lg,
      borderLeft: `3px solid ${config.color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacing['3'] }}>
        <span style={{ fontSize: '20px' }}>{config.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: `1px ${tokens.spacing['2']}`,
            backgroundColor: config.color + '30',
            borderRadius: tokens.radius.sm,
            marginBottom: tokens.spacing['2'],
          }}>
            <span style={{
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: config.color,
              textTransform: 'uppercase',
              letterSpacing: tokens.typography.letterSpacing.uppercase,
              fontFamily: tokens.typography.fontFamily.mono,
            }}>
              {config.title}
            </span>
          </div>
          
          <h4 style={{
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.text.secondary,
            margin: 0,
            marginBottom: tokens.spacing['1'],
          }}>
            {feature}
          </h4>
          
          <p style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.text.tertiary,
            margin: 0,
          }}>
            {reason}
          </p>
          
          {suggestion && (
            <p style={{
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.text.muted,
              margin: `${tokens.spacing['2']} 0 0`,
              fontStyle: 'italic',
            }}>
              💡 {suggestion}
            </p>
          )}
          
          {/* Match rate indicator */}
          {matchRate !== undefined && (
            <div style={{
              marginTop: tokens.spacing['2'],
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing['2'],
            }}>
              <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted }}>
                Match rate:
              </span>
              <div style={{
                flex: 1,
                maxWidth: '100px',
                height: '4px',
                backgroundColor: tokens.colors.surface.tertiary,
                borderRadius: tokens.radius.full,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${matchRate * 100}%`,
                  height: '100%',
                  backgroundColor: matchRate > 0.7 
                    ? tokens.colors.status.success 
                    : matchRate > 0.4 
                      ? tokens.colors.status.warning 
                      : tokens.colors.status.error,
                }} />
              </div>
              <span style={{ 
                fontSize: tokens.typography.fontSize.xs, 
                color: tokens.colors.text.muted,
                fontFamily: tokens.typography.fontFamily.mono,
              }}>
                {(matchRate * 100).toFixed(0)}%
              </span>
            </div>
          )}
          
          {timestamp && (
            <p style={{
              fontSize: tokens.typography.fontSize['2xs'],
              color: tokens.colors.text.muted,
              margin: `${tokens.spacing['2']} 0 0`,
              fontFamily: tokens.typography.fontFamily.mono,
            }}>
              Checked: {new Date(timestamp).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// DATA FRESHNESS CHIP
// ============================================
interface DataFreshnessChipProps {
  lastUpdated?: string;
  source?: string;
  isStale?: boolean;
}

export const DataFreshnessChip: React.FC<DataFreshnessChipProps> = ({
  lastUpdated,
  source,
  isStale = false,
}) => {
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: tokens.spacing['1'],
      padding: `2px ${tokens.spacing['2']}`,
      backgroundColor: isStale ? tokens.colors.status.warningMuted : tokens.colors.surface.tertiary,
      borderRadius: tokens.radius.sm,
      fontSize: tokens.typography.fontSize['2xs'],
      color: isStale ? tokens.colors.status.warning : tokens.colors.text.muted,
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: tokens.radius.full,
        backgroundColor: isStale ? tokens.colors.status.warning : tokens.colors.status.success,
      }} />
      {lastUpdated ? formatRelativeTime(lastUpdated) : 'N/A'}
      {source && <span style={{ opacity: 0.7 }}>• {source}</span>}
    </div>
  );
};

