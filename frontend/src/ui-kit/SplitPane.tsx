/**
 * SplitPane - Painel divisível resizable (industrial)
 * Left: listas/tabelas + filtros
 * Right: detalhe contextual + gráficos
 */

import { ReactNode, useState, useRef, useEffect } from 'react';
import { tokens } from './tokens';

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftWidth?: number; // Percentagem (0-100)
  minLeftWidth?: number; // Pixels
  minRightWidth?: number; // Pixels
}

export function SplitPane({
  left,
  right,
  defaultLeftWidth = 50,
  minLeftWidth = 300,
  minRightWidth = 300,
}: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      const minLeftPercent = (minLeftWidth / containerRect.width) * 100;
      const maxLeftPercent = 100 - (minRightWidth / containerRect.width) * 100;

      const clampedWidth = Math.max(minLeftPercent, Math.min(maxLeftPercent, newLeftWidth));
      setLeftWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minLeftWidth, minRightWidth]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '100%',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  };

  const leftStyle: React.CSSProperties = {
    width: `${leftWidth}%`,
    minWidth: `${minLeftWidth}px`,
    overflow: 'hidden',
    borderRight: `1px solid ${tokens.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
  };

  const rightStyle: React.CSSProperties = {
    width: `${100 - leftWidth}%`,
    minWidth: `${minRightWidth}px`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const handleStyle: React.CSSProperties = {
    width: '4px',
    backgroundColor: tokens.colors.border,
    cursor: 'col-resize',
    position: 'absolute',
    left: `${leftWidth}%`,
    top: 0,
    bottom: 0,
    transform: 'translateX(-50%)',
    zIndex: 10,
    transition: isDragging ? 'none' : tokens.transitions.fast,
  };

  const handleHoverStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.primary.default,
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={leftStyle}>{left}</div>
      <div
        style={handleStyle}
        onMouseDown={() => setIsDragging(true)}
        onMouseEnter={(e) => {
          if (!isDragging) {
            Object.assign(e.currentTarget.style, handleHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = tokens.colors.border;
          }
        }}
      />
      <div style={rightStyle}>{right}</div>
    </div>
  );
}

