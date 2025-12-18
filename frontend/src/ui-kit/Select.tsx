/**
 * Select - Dropdown com opções
 */
import { SelectHTMLAttributes } from 'react';
import { tokens } from './tokens';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string | number; label: string }>;
  label?: string;
}

export function Select({ options, label, className = '', ...props }: SelectProps) {
  const selectStyle: React.CSSProperties = {
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    backgroundColor: tokens.colors.card.default,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.borderRadius.input, // 4px (industrial)
    color: tokens.colors.text.body,
    fontSize: tokens.typography.fontSize.body.sm, // 14px (denso)
    fontFamily: tokens.typography.fontFamily,
    cursor: 'pointer',
    outline: 'none',
    transition: tokens.transitions.default,
    width: '100%',
  };

  if (label) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing.xs,
        }}
      >
        <label
          style={{
            fontSize: tokens.typography.fontSize.label,
            fontWeight: tokens.typography.fontWeight.regular,
            color: tokens.colors.text.secondary,
            fontFamily: tokens.typography.fontFamily,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </label>
        <select
          style={selectStyle}
          className={className}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = tokens.colors.primary.default;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = tokens.colors.border;
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
  }

  return (
    <select
      style={selectStyle}
      className={className}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = tokens.colors.primary.default;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = tokens.colors.border;
      }}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

