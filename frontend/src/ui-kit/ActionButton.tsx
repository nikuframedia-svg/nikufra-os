/**
 * ActionButton - Botão de ação com variantes Connect/Request
 * Connect: fundo verde claro com texto escuro
 * Request: outline verde com texto branco
 */
import React from 'react';
import { tokens } from './tokens';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'connect' | 'request';
  children: React.ReactNode;
}

export function ActionButton({ variant, children, className = '', ...props }: ActionButtonProps) {
  const isConnect = variant === 'connect';

  const buttonStyle: React.CSSProperties = {
    paddingLeft: isConnect ? tokens.spacing.lg : '23px',
    paddingRight: isConnect ? tokens.spacing.lg : '23px',
    paddingTop: '10px',
    paddingBottom: '10px',
    borderRadius: tokens.borderRadius.button,
    border: 'none',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    fontSize: tokens.typography.fontSize.body.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontFamily: tokens.typography.fontFamily,
    textTransform: 'capitalize',
    transition: tokens.transitions.default,
    ...(isConnect
      ? {
          backgroundColor: tokens.colors.primary.action,
          color: tokens.colors.text.onAction,
        }
      : {
          backgroundColor: 'transparent',
          color: tokens.colors.text.title,
          outline: `2px ${tokens.colors.primary.action} solid`,
          outlineOffset: '-2px',
        }),
    ...(props.disabled && {
      opacity: 0.5,
    }),
  };

  return (
    <button style={buttonStyle} className={className} {...props}>
      {children}
    </button>
  );
}

