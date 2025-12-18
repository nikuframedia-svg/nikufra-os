/**
 * CategoryButton - Botão de categoria com estados ativo/inativo
 * Usado em "Neuromodulators Activity"
 */
import React from 'react';
import { tokens } from './tokens';

interface CategoryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  gradient?: 'ser' | 'dop' | 'none';
}

export function CategoryButton({ label, active = false, gradient = 'none', className = '', ...props }: CategoryButtonProps) {
  const getBackground = () => {
    if (!active) return 'transparent';
    
    switch (gradient) {
      case 'ser':
        return 'linear-gradient(225deg, #9379FF 0%, #5EC9FF 100%)';
      case 'dop':
        return 'linear-gradient(180deg, #32E6B7 0%, #82D930 100%)';
      default:
        return 'transparent';
    }
  };

  const buttonStyle: React.CSSProperties = {
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: '5px',
    paddingBottom: '5px',
    borderRadius: tokens.borderRadius.button, // 4px max
    border: 'none',
    background: getBackground(),
    outline: active ? 'none' : `1px ${tokens.colors.text.secondary} solid`,
    outlineOffset: active ? 0 : '-1px',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    fontSize: tokens.typography.fontSize.label,
    fontWeight: active ? tokens.typography.fontWeight.semibold : tokens.typography.fontWeight.regular,
    fontFamily: tokens.typography.fontFamily,
    textTransform: 'uppercase',
    color: active ? tokens.colors.text.onAction : tokens.colors.text.secondary,
    transition: tokens.transitions.default,
    ...(props.disabled && {
      opacity: 0.5,
    }),
  };

  return (
    <button style={buttonStyle} className={className} {...props}>
      {label}
    </button>
  );
}

