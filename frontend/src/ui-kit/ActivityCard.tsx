/**
 * ActivityCard - Card com percentagem, ícone colorido e barra de progresso vertical
 * Usado na seção "Activity In The Brain"
 */
import type { ReactNode } from 'react';
import { tokens } from './tokens';

type ActivityType = 'executive' | 'association' | 'motor' | 'speech' | 'vision' | 'other';

interface ActivityCardProps {
  title: string;
  percentage: number;
  icon: ReactNode;
  type: ActivityType;
  className?: string;
}

export function ActivityCard({ title, percentage, icon, type, className = '' }: ActivityCardProps) {
  const color = tokens.colors.activity[type];
  const progressHeight = Math.round((percentage / 100) * 121); // Altura máxima: 121px
  const emptyHeight = 121 - progressHeight;

  return (
    <div
      style={{
        width: '196px',
        height: '181px',
        position: 'relative',
        backgroundColor: tokens.colors.card.semiTransparent,
        borderRadius: tokens.borderRadius.card,
        padding: '19px',
      }}
      className={className}
    >
      {/* Title and Percentage */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            fontSize: tokens.typography.fontSize.title.md,
            fontWeight: tokens.typography.fontWeight.regular,
            color: tokens.colors.text.title,
            fontFamily: tokens.typography.fontFamily,
            textTransform: 'capitalize',
          }}
        >
          {title}
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
          {percentage}%
        </div>
      </div>

      {/* Icon */}
      <div
        style={{
          width: '45px',
          height: '45px',
          position: 'absolute',
          left: '19px',
          top: '120px',
          backgroundColor: color,
          borderRadius: tokens.borderRadius.card,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          position: 'absolute',
          left: '169.51px',
          top: '16.50px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          alignItems: 'center',
        }}
      >
        {/* Empty portion */}
        {emptyHeight > 0 && (
          <div
            style={{
              width: '7px',
              height: `${emptyHeight}px`,
              backgroundColor: tokens.colors.card.listItem,
              borderRadius: tokens.borderRadius.card,
            }}
          />
        )}
        {/* Filled portion */}
        {progressHeight > 0 && (
          <div
            style={{
              width: '7px',
              height: `${progressHeight}px`,
              backgroundColor: color,
              borderRadius: tokens.borderRadius.card,
            }}
          />
        )}
      </div>
    </div>
  );
}

