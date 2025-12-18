/**
 * Table - Tabela com paginação keyset
 * Suporta loading, empty, error states
 */
import { ReactNode } from 'react';
import { tokens } from './tokens';

interface TableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T | string;
    label: string;
    render?: (value: any, row: T) => ReactNode;
  }>;
  loading?: boolean;
  emptyMessage?: string;
  error?: string | null;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'Nenhum dado disponível',
  error = null,
  onRowClick,
  className = '',
}: TableProps<T>) {
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: tokens.typography.fontFamily,
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.card.elevated,
    color: tokens.colors.text.title,
    fontSize: tokens.typography.fontSize.body.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    textAlign: 'left',
    padding: tokens.spacing.md,
    borderBottom: `2px solid ${tokens.colors.border}`,
  };

  const cellStyle: React.CSSProperties = {
    padding: tokens.spacing.md,
    borderBottom: `1px solid ${tokens.colors.border}`,
    color: tokens.colors.text.body,
    fontSize: tokens.typography.fontSize.body.sm,
  };

  const rowStyle: React.CSSProperties = {
    cursor: onRowClick ? 'pointer' : 'default',
    transition: tokens.transitions.default,
  };

  if (loading) {
    return (
      <div style={{ padding: tokens.spacing.xl, textAlign: 'center', color: tokens.colors.text.secondary }}>
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: tokens.spacing.xl,
          textAlign: 'center',
          color: tokens.colors.danger,
          backgroundColor: `${tokens.colors.danger}20`,
          borderRadius: tokens.borderRadius.card,
          border: `1px solid ${tokens.colors.danger}40`,
        }}
      >
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ padding: tokens.spacing.xl, textAlign: 'center', color: tokens.colors.text.secondary }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <table style={tableStyle} className={className}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)} style={headerStyle}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr
            key={idx}
            style={rowStyle}
            onClick={() => onRowClick?.(row)}
            onMouseEnter={(e) => {
              if (onRowClick) {
                e.currentTarget.style.backgroundColor = tokens.colors.card.elevated;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {columns.map((col) => (
              <td key={String(col.key)} style={cellStyle}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

