/**
 * DataTable - Tabela densa industrial
 * Alta densidade, sem desperdício, linhas compactas
 */

import React, { useState, useMemo } from 'react';
import { tokens } from '../tokens';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedRow?: T;
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
  stickyHeader?: boolean;
  compact?: boolean;
  sortable?: boolean;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T = any>({
  columns,
  data,
  onRowClick,
  selectedRow,
  loading,
  emptyMessage = 'Sem dados',
  maxHeight,
  stickyHeader = true,
  compact = false,
  sortable = false,
  defaultSort,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    defaultSort || null
  );

  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig) return data;
    
    return [...data].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aVal = (a as any)[sortConfig.key];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bVal = (b as any)[sortConfig.key];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig, sortable]);

  const handleSort = (key: string) => {
    if (!sortable) return;
    
    setSortConfig(prev => {
      if (prev?.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const rowHeight = compact ? tokens.spacing['6'] : tokens.sizes.tableRow;
  const cellPadding = compact ? tokens.spacing['1'] : tokens.spacing['2'];

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ overflow: 'auto', maxHeight }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{
                  padding: cellPadding,
                  textAlign: col.align || 'left',
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: tokens.typography.letterSpacing.uppercase,
                  borderBottom: `1px solid ${tokens.colors.border.default}`,
                  backgroundColor: tokens.colors.surface.secondary,
                  position: stickyHeader ? 'sticky' as const : undefined,
                  top: 0,
                  zIndex: 1,
                }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: cellPadding, height: rowHeight }}>
                    <div style={{
                      height: '14px',
                      backgroundColor: tokens.colors.surface.tertiary,
                      borderRadius: tokens.radius.sm,
                      animation: 'pulse 1.5s infinite',
                    }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div style={{
        padding: tokens.spacing['6'],
        textAlign: 'center',
        color: tokens.colors.text.tertiary,
        fontSize: tokens.typography.fontSize.sm,
      }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflow: 'auto', maxHeight }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                style={{
                  padding: cellPadding,
                  textAlign: col.align || 'left',
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: tokens.typography.letterSpacing.uppercase,
                  borderBottom: `1px solid ${tokens.colors.border.default}`,
                  backgroundColor: tokens.colors.surface.secondary,
                  position: stickyHeader ? 'sticky' as const : undefined,
                  top: 0,
                  zIndex: 1,
                  cursor: sortable && col.sortable !== false ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  width: col.width,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: tokens.spacing['1'] }}>
                  {col.header}
                  {sortable && col.sortable !== false && sortConfig?.key === col.key && (
                    <span style={{ fontSize: '10px' }}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => {
            const isSelected = selectedRow && JSON.stringify(selectedRow) === JSON.stringify(row);
            
            return (
              <tr
                key={index}
                onClick={() => onRowClick?.(row)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  backgroundColor: isSelected 
                    ? tokens.colors.accent.primaryMuted 
                    : index % 2 === 0 
                      ? 'transparent' 
                      : tokens.colors.surface.secondary,
                  transition: tokens.transitions.fast,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = tokens.colors.surface.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 
                      ? 'transparent' 
                      : tokens.colors.surface.secondary;
                  }
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: cellPadding,
                      fontSize: tokens.typography.fontSize.sm,
                      color: tokens.colors.text.secondary,
                      borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                      textAlign: col.align || 'left',
                      height: rowHeight,
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render 
                      ? col.render(row, index) 
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      : String((row as any)[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Badge para status em tabelas
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm' }) => {
  const colors = {
    default: { bg: tokens.colors.surface.tertiary, text: tokens.colors.text.secondary },
    success: { bg: tokens.colors.status.successMuted, text: tokens.colors.status.success },
    warning: { bg: tokens.colors.status.warningMuted, text: tokens.colors.status.warning },
    error: { bg: tokens.colors.status.errorMuted, text: tokens.colors.status.error },
    info: { bg: tokens.colors.status.infoMuted, text: tokens.colors.status.info },
    muted: { bg: tokens.colors.surface.secondary, text: tokens.colors.text.muted },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? `1px ${tokens.spacing['1']}` : `2px ${tokens.spacing['2']}`,
      backgroundColor: colors[variant].bg,
      color: colors[variant].text,
      fontSize: size === 'sm' ? tokens.typography.fontSize['2xs'] : tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.medium,
      borderRadius: tokens.radius.sm,
      textTransform: 'uppercase',
      letterSpacing: tokens.typography.letterSpacing.uppercase,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
};

