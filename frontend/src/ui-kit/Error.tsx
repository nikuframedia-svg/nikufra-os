/**
 * Error - Estado de erro com mensagem
 * Suporta NOT_SUPPORTED_BY_DATA
 */
import { ReactNode } from 'react';
import { tokens } from './tokens';
import { Badge } from './Badge';

interface ErrorProps {
  message: string;
  reason?: string;
  isNotSupported?: boolean;
  action?: ReactNode;
}

export function Error({ message, reason, isNotSupported = false, action }: ErrorProps) {
  return (
    <div
      style={{
        padding: tokens.spacing.lg,
        borderRadius: tokens.borderRadius.card,
        border: `2px solid ${isNotSupported ? tokens.colors.warning : tokens.colors.danger}`,
        backgroundColor: isNotSupported ? `${tokens.colors.warning}20` : `${tokens.colors.danger}20`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing.sm,
          marginBottom: reason ? tokens.spacing.sm : 0,
        }}
      >
        {isNotSupported ? (
          <Badge variant="warning">NOT_SUPPORTED_BY_DATA</Badge>
        ) : (
          <Badge variant="danger">Erro</Badge>
        )}
        <p
          style={{
            fontSize: tokens.typography.fontSize.body.md,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: isNotSupported ? tokens.colors.warning : tokens.colors.danger,
            fontFamily: tokens.typography.fontFamily,
          }}
        >
          {message}
        </p>
      </div>
      {reason && (
        <p
          style={{
            fontSize: tokens.typography.fontSize.body.sm,
            color: tokens.colors.text.body,
            fontFamily: tokens.typography.fontFamily,
            marginTop: tokens.spacing.sm,
          }}
        >
          {reason}
        </p>
      )}
      {action && <div style={{ marginTop: tokens.spacing.md }}>{action}</div>}
    </div>
  );
}

