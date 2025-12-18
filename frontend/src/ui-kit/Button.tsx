/**
 * Button - Botão primário/secundário/terciário
 * Estados: default, hover, active, disabled
 */
import { ReactNode, ButtonHTMLAttributes } from 'react';
import { tokens } from './tokens';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}: ButtonProps) {
  const getVariantStyles = (): React.CSSProperties => {
    if (disabled) {
      return {
        backgroundColor: tokens.colors.border,
        color: tokens.colors.text.secondary,
        opacity: 0.5,
        cursor: 'not-allowed',
      };
    }

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: tokens.colors.primary.default,
          color: tokens.colors.background,
          border: `2px solid ${tokens.colors.primary.default}`,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          color: tokens.colors.primary.default,
          border: `2px solid ${tokens.colors.primary.default}`,
        };
      case 'tertiary':
        return {
          backgroundColor: 'transparent',
          color: tokens.colors.text.body,
          border: `2px solid ${tokens.colors.border}`,
        };
      case 'danger':
        return {
          backgroundColor: tokens.colors.danger,
          color: tokens.colors.text.title,
          border: `1px solid ${tokens.colors.danger}`,
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
          fontSize: tokens.typography.fontSize.body.sm,
        };
      case 'md':
        return {
          padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
          fontSize: tokens.typography.fontSize.body.md,
        };
      case 'lg':
        return {
          padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
          fontSize: tokens.typography.fontSize.title.md,
        };
    }
  };

  const baseStyle: React.CSSProperties = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    borderRadius: tokens.borderRadius.button,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontFamily: tokens.typography.fontFamily,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: tokens.transitions.default,
    outline: 'none',
  };

  return (
    <button
      style={baseStyle}
      className={className}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.backgroundColor = tokens.colors.primary.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant === 'primary') {
          e.currentTarget.style.backgroundColor = tokens.colors.primary.default;
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

