/**
 * HeatmapGrid - Grid de células para visualização de densidade
 * Industrial: células quadradas, tooltips ricos, sem decoração
 */

import { tokens } from './tokens';

export interface HeatmapCell {
  id: string;
  label: string;
  value: number;
  metadata?: {
    p50?: number | null;
    p90?: number | null;
    trend?: 'up' | 'down' | 'stable';
    [key: string]: any;
  };
}

interface HeatmapGridProps {
  cells: HeatmapCell[];
  onCellClick?: (cell: HeatmapCell) => void;
  colorScale?: 'heat' | 'cold-hot' | 'semantic';
  cellSize?: number;
  className?: string;
}

export function HeatmapGrid({
  cells,
  onCellClick,
  colorScale = 'cold-hot',
  cellSize = 40,
  className = '',
}: HeatmapGridProps) {
  if (cells.length === 0) {
    return null;
  }

  const maxValue = Math.max(...cells.map(c => c.value), 1);

  const getCellColor = (value: number): string => {
    const percentage = (value / maxValue) * 100;
    
    if (colorScale === 'heat') {
      if (percentage > 80) return tokens.colors.status.error;
      if (percentage > 60) return tokens.colors.status.warning;
      if (percentage > 40) return tokens.colors.status.info;
      return tokens.colors.border;
    }
    
    if (colorScale === 'cold-hot') {
      if (percentage > 70) return '#EF4444'; // Hot
      if (percentage > 50) return '#F59E0B'; // Warm
      if (percentage > 30) return '#3B82F6'; // Cool
      return '#6B7280'; // Cold
    }
    
    // semantic
    if (percentage > 80) return tokens.colors.status.error;
    if (percentage > 50) return tokens.colors.status.warning;
    return tokens.colors.status.info;
  };

  const getCellTooltip = (cell: HeatmapCell): string => {
    const parts = [
      `${cell.label}: ${cell.value}`,
      cell.metadata?.p50 && `P50: ${cell.metadata.p50.toFixed(1)}h`,
      cell.metadata?.p90 && `P90: ${cell.metadata.p90.toFixed(1)}h`,
    ].filter(Boolean);
    return parts.join(' | ');
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${cellSize}px, 1fr))`,
        gap: tokens.spacing.xs,
        padding: tokens.spacing.sm,
      }}
      className={className}
    >
      {cells.map((cell) => (
        <div
          key={cell.id}
          onClick={() => onCellClick && onCellClick(cell)}
          title={getCellTooltip(cell)}
          style={{
            width: cellSize,
            height: cellSize,
            backgroundColor: getCellColor(cell.value),
            borderRadius: tokens.borderRadius.card, // 4px max
            cursor: onCellClick ? 'pointer' : 'default',
            transition: tokens.transitions.default,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: tokens.typography.fontSize.body.xs,
            color: tokens.colors.text.title,
            fontWeight: tokens.typography.fontWeight.medium,
            border: `1px solid ${tokens.colors.border}`,
          }}
          onMouseEnter={(e) => {
            if (onCellClick) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = tokens.shadows.focus;
            }
          }}
          onMouseLeave={(e) => {
            if (onCellClick) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {cell.value}
        </div>
      ))}
    </div>
  );
}

