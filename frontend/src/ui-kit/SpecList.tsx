/**
 * SpecList - Lista de especificações com ícones, tipos e quantidades
 * Usado na seção "Robo Spec"
 */
import type { ReactNode } from 'react';
import { tokens } from './tokens';

interface SpecItem {
  name: string;
  type: string;
  quantity: string;
  icon: ReactNode;
}

interface SpecListProps {
  items: SpecItem[];
  className?: string;
}

export function SpecList({ items, className = '' }: SpecListProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '25px',
      }}
      className={className}
    >
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            width: '337px',
            height: '45px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing.md,
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '45px',
              height: '45px',
              backgroundColor: tokens.colors.card.listItem,
              borderRadius: tokens.borderRadius.card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {item.icon}
          </div>

          {/* Info */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: tokens.typography.fontSize.body.sm,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.text.title,
                fontFamily: tokens.typography.fontFamily,
              }}
            >
              {item.name}
            </div>
            <div
              style={{
                fontSize: tokens.typography.fontSize.label,
                fontWeight: tokens.typography.fontWeight.regular,
                color: tokens.colors.text.secondary,
                fontFamily: tokens.typography.fontFamily,
                textTransform: 'uppercase',
              }}
            >
              {item.type}
            </div>
          </div>

          {/* Quantity */}
          <div
            style={{
              fontSize: tokens.typography.fontSize.body.sm,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.text.title,
              fontFamily: tokens.typography.fontFamily,
              textAlign: 'right',
              minWidth: '60px',
            }}
          >
            {item.quantity}
          </div>
        </div>
      ))}
    </div>
  );
}

