/**
 * Panel - Container base para conteúdo
 * Industrial: border sutil, radius 3px, sem sombras
 */

import React from 'react';
import { tokens } from '../tokens';

interface PanelProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof tokens.spacing;
  className?: string;
  style?: React.CSSProperties;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  variant = 'default',
  padding = '4',
  className,
  style,
}) => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: variant === 'elevated' 
      ? tokens.colors.surface.secondary 
      : tokens.colors.surface.primary,
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[padding],
    ...style,
  };

  return (
    <div style={baseStyles} className={className}>
      {children}
    </div>
  );
};

// Section Header dentro de Panel
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actions,
  size = 'md',
}) => {
  const fontSize = {
    sm: tokens.typography.fontSize.sm,
    md: tokens.typography.fontSize.md,
    lg: tokens.typography.fontSize.lg,
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacing['3'],
      paddingBottom: tokens.spacing['2'],
      borderBottom: `1px solid ${tokens.colors.border.subtle}`,
    }}>
      <div>
        <h3 style={{
          fontSize: fontSize[size],
          fontWeight: tokens.typography.fontWeight.semibold,
          color: tokens.colors.text.primary,
          margin: 0,
          fontFamily: tokens.typography.fontFamily.sans,
          letterSpacing: tokens.typography.letterSpacing.tight,
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.text.tertiary,
            margin: `${tokens.spacing['1']} 0 0`,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: tokens.spacing['2'] }}>{actions}</div>}
    </div>
  );
};

// Divider simples
export const Divider: React.FC<{ spacing?: keyof typeof tokens.spacing }> = ({ spacing = '3' }) => (
  <hr style={{
    border: 'none',
    borderTop: `1px solid ${tokens.colors.border.subtle}`,
    margin: `${tokens.spacing[spacing]} 0`,
  }} />
);

