/**
 * ChartContainer - Wrapper para gráficos (Recharts)
 * Garante padding e background consistentes
 */
import { ReactNode } from 'react';
import { tokens } from './tokens';
import { Card } from './Card';

interface ChartContainerProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function ChartContainer({ children, title, className = '' }: ChartContainerProps) {
  return (
    <Card elevated className={className}>
      {title && (
        <h3
          style={{
            fontSize: tokens.typography.fontSize.title.md,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.text.title,
            fontFamily: tokens.typography.fontFamily,
            marginBottom: tokens.spacing.lg,
          }}
        >
          {title}
        </h3>
      )}
      <div style={{ width: '100%', height: '100%' }}>{children}</div>
    </Card>
  );
}

