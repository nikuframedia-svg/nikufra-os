/**
 * Input - Campo de texto
 */
import { InputHTMLAttributes } from 'react';
import { tokens } from './tokens';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  const inputStyle: React.CSSProperties = {
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    backgroundColor: tokens.colors.card.default,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.borderRadius.input, // 4px (industrial)
    color: tokens.colors.text.body,
    fontSize: tokens.typography.fontSize.body.sm, // 14px (denso)
    fontFamily: tokens.typography.fontFamily,
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
        <input
          style={inputStyle}
          className={className}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = tokens.colors.primary.default;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = tokens.colors.border;
          }}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      style={inputStyle}
      className={className}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = tokens.colors.primary.default;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = tokens.colors.border;
      }}
      {...props}
    />
  );
}

