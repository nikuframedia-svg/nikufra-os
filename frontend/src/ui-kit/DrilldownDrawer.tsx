/**
 * DrilldownDrawer - Drawer lateral para detalhes
 * Industrial: sem cantos arredondados grandes, denso, operacional
 */

import { ReactNode, useEffect } from 'react';
import { tokens } from './tokens';

interface DrilldownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export function DrilldownDrawer({
  isOpen,
  onClose,
  title,
  children,
  width = 420,
}: DrilldownDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        }}
      />
      
      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${width}px`,
          backgroundColor: tokens.colors.card.default,
          borderLeft: `1px solid ${tokens.colors.border}`,
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: tokens.shadows.elevation.lg,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: tokens.spacing.md,
            borderBottom: `1px solid ${tokens.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3
            style={{
              fontSize: tokens.typography.fontSize.title.md,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.text.title,
              fontFamily: tokens.typography.fontFamily,
              margin: 0,
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: tokens.spacing.xs,
              backgroundColor: 'transparent',
              border: 'none',
              color: tokens.colors.text.secondary,
              cursor: 'pointer',
              fontSize: tokens.typography.fontSize.title.lg,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: tokens.spacing.md,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

