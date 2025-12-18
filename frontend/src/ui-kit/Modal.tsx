/**
 * Modal - Overlay com conteúdo centralizado
 * Suporta fechar com ESC ou clique fora
 */
import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from './tokens';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const sizeMap = {
    sm: '400px',
    md: '600px',
    lg: '800px',
    xl: '1200px',
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: sizeMap[size],
            maxHeight: '80vh',
            overflowY: 'auto',
            backgroundColor: tokens.colors.card.default,
            border: `2px solid ${tokens.colors.border}`,
            borderRadius: tokens.borderRadius.card,
            padding: tokens.spacing.lg,
            boxShadow: tokens.shadows.highlight,
          }}
        >
          {title && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: tokens.spacing.lg,
                paddingBottom: tokens.spacing.md,
                borderBottom: `1px solid ${tokens.colors.border}`,
              }}
            >
              <h2
                style={{
                  fontSize: tokens.typography.fontSize.title.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.colors.text.title,
                  fontFamily: tokens.typography.fontFamily,
                }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tokens.colors.text.secondary,
                  cursor: 'pointer',
                  fontSize: '24px',
                  padding: tokens.spacing.xs,
                  borderRadius: tokens.borderRadius.input,
                  transition: tokens.transitions.default,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = tokens.colors.text.title;
                  e.currentTarget.style.backgroundColor = tokens.colors.card.elevated;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = tokens.colors.text.secondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ✕
              </button>
            </div>
          )}
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

