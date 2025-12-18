/**
 * ListCard - Card horizontal para listas (padrão RoboDoc)
 * Status bar + Ícone + Informações + Botão de ação
 */
import type { ReactNode } from 'react';
import { tokens } from './tokens';
import { ActionButton } from './ActionButton';

interface ListCardProps {
  status: 'available' | 'unavailable';
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  metadata?: string;
  actionLabel: string;
  onAction?: () => void;
  onMenuClick?: () => void;
  className?: string;
}

export function ListCard({
  status,
  icon,
  title,
  subtitle,
  metadata,
  actionLabel,
  onAction,
  onMenuClick,
  className = '',
}: ListCardProps) {
  const statusColor = status === 'available' ? tokens.colors.status.available : tokens.colors.status.unavailable;
  const actionVariant = status === 'available' ? 'connect' : 'request';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '82px',
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacing.md,
      }}
      className={className}
    >
      {/* Status Bar */}
      <div
        style={{
          width: '7px',
          height: '46px',
          backgroundColor: statusColor,
          borderRadius: tokens.borderRadius.circle,
          flexShrink: 0,
        }}
      />

      {/* Card Content */}
      <div
        style={{
          flex: 1,
          height: '82px',
          backgroundColor: tokens.colors.card.listItem,
          borderRadius: tokens.borderRadius.card,
          padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing.md,
        }}
      >
        {/* Icon */}
        {icon && (
          <div
            style={{
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}

        {/* Info */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          <div
            style={{
              fontSize: tokens.typography.fontSize.body.md,
              fontWeight: tokens.typography.fontWeight.regular,
              color: tokens.colors.text.title,
              fontFamily: tokens.typography.fontFamily,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: tokens.typography.fontSize.label,
                fontWeight: tokens.typography.fontWeight.regular,
                color: tokens.colors.text.title,
                fontFamily: tokens.typography.fontFamily,
              }}
            >
              {subtitle}
            </div>
          )}
          {metadata && (
            <div
              style={{
                fontSize: tokens.typography.fontSize.label,
                fontWeight: tokens.typography.fontWeight.regular,
                color: tokens.colors.text.secondary,
                fontFamily: tokens.typography.fontFamily,
                textTransform: 'uppercase',
              }}
            >
              {metadata}
            </div>
          )}
        </div>

        {/* Action Button */}
        <ActionButton variant={actionVariant} onClick={onAction}>
          {actionLabel}
        </ActionButton>

        {/* Menu Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            style={{
              width: '25px',
              height: '25px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.colors.text.secondary,
            }}
          >
            <span style={{ fontSize: '18px' }}>⋯</span>
          </button>
        )}
      </div>
    </div>
  );
}

