/**
 * DenseTable - Tabela compacta industrial
 * Altura mínima 40px por linha, font 13px, sticky header
 */

import { ReactNode } from 'react';
import { tokens } from './tokens';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => ReactNode;
  width?: string;
}

interface DenseTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedRow?: T;
  className?: string;
}

export function DenseTable<T extends { [key: string]: any }>({
  columns,
  data,
  onRowClick,
  selectedRow,
  className = '',
}: DenseTableProps<T>) {
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: tokens.typography.fontFamily,
    fontSize: tokens.typography.fontSize.body.xs,
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.card.elevated,
    borderBottom: `2px solid ${tokens.colors.border}`,
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    textAlign: 'left',
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.fontSize.label,
    textTransform: 'uppercase',
    letterSpacing: tokens.typography.letterSpacing.uppercase,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };

  const cellStyle: React.CSSProperties = {
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    borderBottom: `1px solid ${tokens.colors.border}`,
    color: tokens.colors.text.body,
    minHeight: '40px',
  };

  const rowStyle = (row: T): React.CSSProperties => ({
    backgroundColor: selectedRow === row ? tokens.colors.primary.light : 'transparent',
    cursor: onRowClick ? 'pointer' : 'default',
    transition: tokens.transitions.fast,
  });

  const rowHoverStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.card.hover,
  };

  return (
    <div style={{ overflow: 'auto', maxHeight: '600px' }} className={className}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ ...headerStyle, width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              style={rowStyle(row)}
              onClick={() => onRowClick?.(row)}
              onMouseEnter={(e) => {
                if (onRowClick) {
                  Object.assign(e.currentTarget.style, rowHoverStyle);
                }
              }}
              onMouseLeave={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.backgroundColor = rowStyle(row).backgroundColor || 'transparent';
                }
              }}
            >
              {columns.map((col) => (
                <td key={col.key} style={cellStyle}>
                  {col.render(row, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div
          style={{
            padding: tokens.spacing.xl,
            textAlign: 'center',
            color: tokens.colors.text.muted,
            fontSize: tokens.typography.fontSize.body.sm,
          }}
        >
          Nenhum dado disponível
        </div>
      )}
    </div>
  );
}

