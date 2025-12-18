/**
 * Topbar - Barra superior (opcional)
 */
import { ReactNode } from 'react';
import { tokens } from './tokens';

interface TopbarProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function Topbar({ title, description, actions, className = '' }: TopbarProps) {
  return (
    <div
      style={{
        width: '100%',
        padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
        backgroundColor: tokens.colors.card.elevated,
        borderBottom: `2px solid ${tokens.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginLeft: '80px', // Offset for sidebar
      }}
      className={className}
    >
      <div>
        {title && (
          <h1
            style={{
              fontSize: tokens.typography.fontSize.title.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.text.title,
              fontFamily: tokens.typography.fontFamily,
              marginBottom: description ? tokens.spacing.xs : 0,
            }}
          >
            {title}
          </h1>
        )}
        {description && (
          <p
            style={{
              fontSize: tokens.typography.fontSize.body.sm,
              color: tokens.colors.text.secondary,
              fontFamily: tokens.typography.fontFamily,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: tokens.spacing.md }}>{actions}</div>}
    </div>
  );
}

