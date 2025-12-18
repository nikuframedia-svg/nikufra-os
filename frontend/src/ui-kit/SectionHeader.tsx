/**
 * SectionHeader - Título de seção com ações opcionais
 * Industrial: denso, claro, sem decoração
 */

import { ReactNode } from 'react';
import { tokens } from './tokens';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, actions, className = '' }: SectionHeaderProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: tokens.spacing.md,
    borderBottom: `1px solid ${tokens.colors.border}`,
    marginBottom: tokens.spacing.lg,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.body.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.title,
    fontFamily: tokens.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: tokens.typography.letterSpacing.uppercase,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.body.xs,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  };

  return (
    <div style={containerStyle} className={className}>
      <div>
        <h2 style={titleStyle}>{title}</h2>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: tokens.spacing.sm }}>{actions}</div>}
    </div>
  );
}

