/**
 * Badge - Tag para status/categorias
 */
import { ReactNode } from 'react';
import { tokens } from './tokens';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: `${tokens.colors.primary.default}20`,
          color: tokens.colors.primary.default,
          border: `1px solid ${tokens.colors.primary.default}40`,
        };
      case 'warning':
        return {
          backgroundColor: `${tokens.colors.warning}20`,
          color: tokens.colors.warning,
          border: `1px solid ${tokens.colors.warning}40`,
        };
      case 'danger':
        return {
          backgroundColor: `${tokens.colors.danger}20`,
          color: tokens.colors.danger,
          border: `1px solid ${tokens.colors.danger}40`,
        };
      case 'info':
        return {
          backgroundColor: `${tokens.colors.text.secondary}20`,
          color: tokens.colors.text.body,
          border: `1px solid ${tokens.colors.border}`,
        };
      default:
        return {
          backgroundColor: tokens.colors.card.elevated,
          color: tokens.colors.text.body,
          border: `1px solid ${tokens.colors.border}`,
        };
    }
  };

  const style: React.CSSProperties = {
    ...getVariantStyles(),
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
    borderRadius: tokens.borderRadius.input,
    fontSize: tokens.typography.fontSize.body.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontFamily: tokens.typography.fontFamily,
  };

  return (
    <span style={style} className={className}>
      {children}
    </span>
  );
}

