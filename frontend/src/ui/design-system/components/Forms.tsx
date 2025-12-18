/**
 * Form Components - FilterBar, Input, Select, Button
 * Industrial: compactos, funcionais
 */

import React, { useState, useCallback } from 'react';
import { tokens } from '../tokens';

// ============================================
// BUTTON
// ============================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  style,
  ...props
}) => {
  const variants = {
    primary: {
      bg: tokens.colors.accent.primary,
      bgHover: tokens.colors.accent.primaryHover,
      text: tokens.colors.text.inverse,
      border: 'none',
    },
    secondary: {
      bg: 'transparent',
      bgHover: tokens.colors.surface.hover,
      text: tokens.colors.text.secondary,
      border: `1px solid ${tokens.colors.border.default}`,
    },
    danger: {
      bg: tokens.colors.status.error,
      bgHover: '#E53935',
      text: tokens.colors.text.primary,
      border: 'none',
    },
    ghost: {
      bg: 'transparent',
      bgHover: tokens.colors.surface.hover,
      text: tokens.colors.text.tertiary,
      border: 'none',
    },
  };

  const sizes = {
    sm: {
      height: tokens.sizes.button.sm,
      padding: `0 ${tokens.spacing['2']}`,
      fontSize: tokens.typography.fontSize.xs,
    },
    md: {
      height: tokens.sizes.button.md,
      padding: `0 ${tokens.spacing['3']}`,
      fontSize: tokens.typography.fontSize.sm,
    },
    lg: {
      height: tokens.sizes.button.lg,
      padding: `0 ${tokens.spacing['4']}`,
      fontSize: tokens.typography.fontSize.md,
    },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.spacing['1'],
        height: s.height,
        padding: s.padding,
        backgroundColor: v.bg,
        color: v.text,
        border: v.border,
        borderRadius: tokens.radius.md,
        fontSize: s.fontSize,
        fontWeight: tokens.typography.fontWeight.medium,
        fontFamily: tokens.typography.fontFamily.sans,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: tokens.transitions.fast,
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.backgroundColor = v.bgHover;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = v.bg;
      }}
      {...props}
    >
      {loading ? (
        <span style={{ 
          width: '14px', 
          height: '14px', 
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};

// ============================================
// INPUT
// ============================================
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  size?: 'sm' | 'md';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  size = 'md',
  style,
  ...props
}) => {
  const height = size === 'sm' ? '28px' : tokens.sizes.input;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing['1'] }}>
      {label && (
        <label style={{
          fontSize: tokens.typography.fontSize.xs,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.text.tertiary,
          textTransform: 'uppercase',
          letterSpacing: tokens.typography.letterSpacing.uppercase,
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          height,
          padding: `0 ${tokens.spacing['3']}`,
          backgroundColor: tokens.colors.surface.secondary,
          border: `1px solid ${error ? tokens.colors.status.error : tokens.colors.border.default}`,
          borderRadius: tokens.radius.md,
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.text.primary,
          fontFamily: tokens.typography.fontFamily.sans,
          outline: 'none',
          transition: tokens.transitions.fast,
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = tokens.colors.border.focus;
          e.currentTarget.style.boxShadow = tokens.shadows.focus;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? tokens.colors.status.error : tokens.colors.border.default;
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <span style={{
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.status.error,
        }}>
          {error}
        </span>
      )}
    </div>
  );
};

// ============================================
// SELECT
// ============================================
interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  size?: 'sm' | 'md';
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  size = 'md',
  style,
  ...props
}) => {
  const height = size === 'sm' ? '28px' : tokens.sizes.input;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing['1'] }}>
      {label && (
        <label style={{
          fontSize: tokens.typography.fontSize.xs,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.text.tertiary,
          textTransform: 'uppercase',
          letterSpacing: tokens.typography.letterSpacing.uppercase,
        }}>
          {label}
        </label>
      )}
      <select
        style={{
          height,
          padding: `0 ${tokens.spacing['3']}`,
          backgroundColor: tokens.colors.surface.secondary,
          border: `1px solid ${tokens.colors.border.default}`,
          borderRadius: tokens.radius.md,
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.text.primary,
          fontFamily: tokens.typography.fontFamily.sans,
          outline: 'none',
          cursor: 'pointer',
          ...style,
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============================================
// FILTER BAR
// ============================================
interface FilterChip {
  label: string;
  active: boolean;
  onClick: () => void;
}

interface FilterBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  chips?: FilterChip[];
  selects?: Array<{
    label: string;
    value: string | number;
    options: SelectOption[];
    onChange: (value: string | number) => void;
  }>;
  actions?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  chips,
  selects,
  actions,
}) => {
  const [searchValue, setSearchValue] = useState(search?.value || '');

  // Debounced search
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    // Debounce
    const timer = setTimeout(() => {
      search?.onChange(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacing['3'],
      padding: `${tokens.spacing['2']} ${tokens.spacing['4']}`,
      backgroundColor: tokens.colors.surface.secondary,
      borderBottom: `1px solid ${tokens.colors.border.default}`,
    }}>
      {/* Search */}
      {search && (
        <div style={{ position: 'relative', minWidth: '200px' }}>
          <span style={{
            position: 'absolute',
            left: tokens.spacing['2'],
            top: '50%',
            transform: 'translateY(-50%)',
            color: tokens.colors.text.muted,
            fontSize: '14px',
          }}>
            🔍
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder={search.placeholder || 'Search...'}
            style={{
              width: '100%',
              height: '28px',
              paddingLeft: tokens.spacing['6'],
              paddingRight: tokens.spacing['2'],
              backgroundColor: tokens.colors.surface.primary,
              border: `1px solid ${tokens.colors.border.subtle}`,
              borderRadius: tokens.radius.md,
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.text.primary,
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Chips */}
      {chips && chips.length > 0 && (
        <div style={{ display: 'flex', gap: tokens.spacing['1'] }}>
          {chips.map((chip, idx) => (
            <button
              key={idx}
              onClick={chip.onClick}
              style={{
                padding: `${tokens.spacing['1']} ${tokens.spacing['2']}`,
                backgroundColor: chip.active ? tokens.colors.accent.primaryMuted : 'transparent',
                border: `1px solid ${chip.active ? tokens.colors.accent.primary : tokens.colors.border.subtle}`,
                borderRadius: tokens.radius.sm,
                color: chip.active ? tokens.colors.accent.primary : tokens.colors.text.tertiary,
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.medium,
                cursor: 'pointer',
                transition: tokens.transitions.fast,
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Selects */}
      {selects && selects.length > 0 && (
        <div style={{ display: 'flex', gap: tokens.spacing['2'] }}>
          {selects.map((sel, idx) => (
            <select
              key={idx}
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              style={{
                height: '28px',
                padding: `0 ${tokens.spacing['2']}`,
                backgroundColor: tokens.colors.surface.primary,
                border: `1px solid ${tokens.colors.border.subtle}`,
                borderRadius: tokens.radius.md,
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.text.secondary,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {sel.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      {actions}
    </div>
  );
};

