/**
 * Loading - Estados de carregamento
 * Skeleton ou spinner baseado em tokens
 */
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { tokens } from './tokens';

interface LoadingProps {
  type?: 'skeleton' | 'spinner';
  count?: number;
  height?: number | string;
  className?: string;
}

export function Loading({ type = 'skeleton', count = 1, height, className = '' }: LoadingProps) {
  if (type === 'skeleton') {
    return (
      <Skeleton
        count={count}
        height={height}
        baseColor={tokens.colors.card.default}
        highlightColor={tokens.colors.card.elevated}
        className={className}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing.xl,
        color: tokens.colors.text.secondary,
      }}
      className={className}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${tokens.colors.border}`,
          borderTopColor: tokens.colors.primary.default,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

