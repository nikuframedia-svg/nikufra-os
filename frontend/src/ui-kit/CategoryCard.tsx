/**
 * CategoryCard - Card pequeno com percentagem e barra de progresso horizontal
 * Usado na seção "Categories"
 */
// React 18;
import { tokens } from './tokens';

interface CategoryCardProps {
  title: string;
  percentage: number;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}

export function CategoryCard({ title, percentage, active = false, className = '', onClick }: CategoryCardProps) {
  const progressWidth = Math.round((percentage / 100) * 101); // Largura máxima: 101px
  const emptyWidth = 101 - progressWidth;

  return (
    <div
      style={{
        width: '147px',
        height: '124px',
        position: 'relative',
        backgroundColor: active ? tokens.colors.card.semiTransparent : tokens.colors.background,
        borderRadius: tokens.borderRadius.card,
        padding: '18px 19px',
        cursor: onClick ? 'pointer' : 'default',
        transition: tokens.transitions.default,
      }}
      className={className}
      onClick={onClick}
    >
      {/* Title and Percentage */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '11px',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            fontSize: tokens.typography.fontSize.label,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.text.title,
            fontFamily: tokens.typography.fontFamily,
            textTransform: 'uppercase',
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

      {/* Progress Bar (rotated 90deg) */}
      <div
        style={{
          position: 'absolute',
          left: '126.50px',
          top: '99px',
          transform: 'rotate(90deg)',
          transformOrigin: 'top left',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          alignItems: 'center',
        }}
      >
        {/* Empty portion */}
        {emptyWidth > 0 && (
          <div
            style={{
              width: `${emptyWidth}px`,
              height: '7px',
              backgroundColor: active ? tokens.colors.card.semiTransparent : tokens.colors.card.listItem,
              borderRadius: tokens.borderRadius.card,
            }}
          />
        )}
        {/* Filled portion */}
        {progressWidth > 0 && (
          <div
            style={{
              width: `${progressWidth}px`,
              height: '7px',
              backgroundColor: tokens.colors.primary.default,
              borderRadius: tokens.borderRadius.card,
            }}
          />
        )}
      </div>
    </div>
  );
}

