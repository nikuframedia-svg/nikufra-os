/**
 * CorticalActivityGrid - Grid de quadrados representando atividade cortical
 * Estados: inativo, semi-ativo, ativo, muito ativo
 */
import React from 'react';
import { tokens } from './tokens';

type CellState = 'inactive' | 'semi-active' | 'active' | 'very-active' | 'selected';

interface CorticalActivityGridProps {
  rows: number;
  cols: number;
  cells: CellState[][];
  selectedCell?: { row: number; col: number };
  onCellClick?: (row: number, col: number) => void;
  className?: string;
}

export function CorticalActivityGrid({
  rows,
  cols,
  cells,
  selectedCell,
  onCellClick,
  className = '',
}: CorticalActivityGridProps) {
  const getCellStyle = (state: CellState, isSelected: boolean): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: '48px',
      height: '48px',
      borderRadius: tokens.borderRadius.card,
      outline: `11px ${tokens.colors.card.elevated} solid`,
      outlineOffset: '-5.50px',
      cursor: onCellClick ? 'pointer' : 'default',
      transition: tokens.transitions.default,
    };

    if (isSelected) {
      return {
        ...baseStyle,
        outline: `11px ${tokens.colors.primary.default} solid`,
        outlineOffset: '-5.50px',
      };
    }

    switch (state) {
      case 'inactive':
        return { ...baseStyle, backgroundColor: tokens.colors.background };
      case 'semi-active':
        return { ...baseStyle, backgroundColor: 'rgba(255, 255, 255, 0.10)' };
      case 'active':
        return { ...baseStyle, backgroundColor: tokens.colors.text.title };
      case 'very-active':
        return { ...baseStyle, backgroundColor: 'rgba(255, 255, 255, 0.50)' };
      default:
        return { ...baseStyle, backgroundColor: tokens.colors.background };
    }
  };

  return (
    <div
      style={{
        padding: '5px',
        borderRadius: tokens.borderRadius.card,
        outline: '6px white solid',
        outlineOffset: '-6px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        backgroundColor: tokens.colors.card.elevated,
      }}
      className={className}
    >
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            gap: 0,
            backgroundColor: tokens.colors.card.elevated,
          }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => {
            const state = cells[rowIndex]?.[colIndex] || 'inactive';
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={getCellStyle(state, isSelected)}
                onClick={() => onCellClick?.(rowIndex, colIndex)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

