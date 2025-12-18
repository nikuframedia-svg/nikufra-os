/**
 * Card - Container genérico com border, padding, background
 * Usa tokens para consistência total
 */
import { ReactNode } from 'react';
import { tokens } from './tokens';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  elevated?: boolean;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, elevated = false, hover = false, className = '', onClick }: CardProps) {
  const baseStyle: React.CSSProperties = {
    backgroundColor: elevated ? tokens.colors.card.elevated : tokens.colors.card.default,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.borderRadius.card, // 4px (industrial)
    padding: tokens.spacing.lg,
    boxShadow: elevated ? tokens.shadows.elevation.sm : 'none', // Sombra sutil
    transition: tokens.transitions.default,
    cursor: onClick ? 'pointer' : 'default',
  };

  const hoverStyle = hover
    ? {
        transform: 'scale(1.02)',
        boxShadow: tokens.shadows.cardHover,
      }
    : {};

  if (onClick || hover) {
    return (
      <motion.div
        style={baseStyle}
        className={className}
        onClick={onClick}
        whileHover={hoverStyle}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div style={baseStyle} className={className}>
      {children}
    </div>
  );
}

