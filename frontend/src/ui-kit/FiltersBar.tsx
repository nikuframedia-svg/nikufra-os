/**
 * FiltersBar - Barra de filtros compacta (industrial)
 * Chips + Selects + Search
 * Altura: 48px, sticky top
 */

import { ReactNode } from 'react';
import { tokens } from './tokens';
import { Input } from './Input';
import { Select } from './Select';

interface FilterChip {
  label: string;
  active: boolean;
  onClick: () => void;
}

interface FiltersBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  selects?: Array<{
    label: string;
    value: string | number;
    options: Array<{ value: string | number; label: string }>;
    onChange: (value: string | number) => void;
  }>;
  chips?: FilterChip[];
  actions?: ReactNode;
  className?: string;
}

export function FiltersBar({ search, selects, chips, actions, className = '' }: FiltersBarProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.md,
    padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
    backgroundColor: tokens.colors.card.elevated,
    borderBottom: `1px solid ${tokens.colors.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
    minHeight: '48px',
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
    borderRadius: tokens.borderRadius.badge,
    fontSize: tokens.typography.fontSize.label,
    fontWeight: tokens.typography.fontWeight.medium,
    fontFamily: tokens.typography.fontFamily,
    cursor: 'pointer',
    backgroundColor: active ? tokens.colors.primary.light : tokens.colors.card.default,
    border: `1px solid ${active ? tokens.colors.primary.default : tokens.colors.border}`,
    color: active ? tokens.colors.primary.default : tokens.colors.text.body,
    transition: tokens.transitions.fast,
  });

  return (
    <div style={containerStyle} className={className}>
      {search && (
        <div style={{ width: '200px' }}>
          <Input
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder || 'Search...'}
          />
        </div>
      )}
      {chips && (
        <div style={{ display: 'flex', gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
          {chips.map((chip, idx) => (
            <div
              key={idx}
              style={chipStyle(chip.active)}
              onClick={chip.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  chip.onClick();
                }
              }}
            >
              {chip.label}
            </div>
          ))}
        </div>
      )}
      {selects && (
        <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
          {selects.map((select, idx) => (
            <div key={idx} style={{ minWidth: '150px' }}>
              <Select
                value={select.value}
                options={select.options}
                onChange={(e) => select.onChange(Number(e.target.value) || e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
      {actions && <div style={{ marginLeft: 'auto' }}>{actions}</div>}
    </div>
  );
}

