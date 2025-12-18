/**
 * Panel - Componente industrial base (surface + border)
 * Sem arredondados infantis, sem sombras pesadas
 */

import { ReactNode } from 'react';
import { tokens } from './tokens';

interface PanelProps {
  children: ReactNode;
  elevated?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Panel({ children, elevated = false, className = '', style: customStyle }: PanelProps) {
  const baseStyle: React.CSSProperties = {
    backgroundColor: elevated ? tokens.colors.card.elevated : tokens.colors.card.default,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.borderRadius.card,
    padding: tokens.spacing.lg,
    boxShadow: tokens.shadows.elevation.sm,
  };

  return (
    <div style={{ ...baseStyle, ...customStyle }} className={className}>
      {children}
    </div>
  );
}

