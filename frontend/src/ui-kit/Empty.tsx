/**
 * Empty - Estado vazio com mensagem
 */
import { ReactNode } from 'react';
import { tokens } from './tokens';

interface EmptyProps {
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function Empty({ message = 'Nenhum dado disponível', icon, action }: EmptyProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing['2xl'],
        textAlign: 'center',
        color: tokens.colors.text.secondary,
      }}
    >
      {icon && <div style={{ marginBottom: tokens.spacing.md, fontSize: '48px' }}>{icon}</div>}
      <p
        style={{
          fontSize: tokens.typography.fontSize.body.md,
          color: tokens.colors.text.secondary,
          fontFamily: tokens.typography.fontFamily,
          marginBottom: action ? tokens.spacing.md : 0,
        }}
      >
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

