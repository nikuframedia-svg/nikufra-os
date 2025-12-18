/**
 * QuickNote - Textarea compacta para notas operacionais
 * Guardada em localStorage por routeKey
 * Design industrial, radius <= 4px
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { tokens } from './tokens';

interface QuickNoteProps {
  routeKey?: string; // Se não fornecido, usa pathname
  placeholder?: string;
  maxHeight?: number;
}

export function QuickNote({ routeKey, placeholder = 'Nota rápida...', maxHeight = 100 }: QuickNoteProps) {
  const location = useLocation();
  const storageKey = routeKey || `quicknote:${location.pathname}`;
  
  const [note, setNote] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setNote(saved);
      if (saved.length > 0) {
        setIsExpanded(true);
      }
    }
  }, [storageKey]);

  // Save to localStorage on change
  const handleChange = (value: string) => {
    setNote(value);
    if (value.trim()) {
      localStorage.setItem(storageKey, value);
    } else {
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <div
      style={{
        marginTop: tokens.spacing.md,
        marginBottom: tokens.spacing.md,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing.xs,
          marginBottom: tokens.spacing.xs,
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
            backgroundColor: 'transparent',
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: tokens.borderRadius.button,
            color: tokens.colors.text.secondary,
            fontSize: tokens.typography.fontSize.body.xs,
            cursor: 'pointer',
            fontFamily: tokens.typography.fontFamily,
          }}
        >
          {isExpanded ? '▼' : '▶'} Quick Note
        </button>
        {note.trim() && (
          <span
            style={{
              fontSize: tokens.typography.fontSize.body.xs,
              color: tokens.colors.text.muted,
            }}
          >
            ({note.length} chars)
          </span>
        )}
      </div>
      {isExpanded && (
        <textarea
          value={note}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: '60px',
            maxHeight: `${maxHeight}px`,
            padding: tokens.spacing.sm,
            backgroundColor: tokens.colors.card.default,
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: tokens.borderRadius.input,
            color: tokens.colors.text.body,
            fontSize: tokens.typography.fontSize.body.sm,
            fontFamily: tokens.typography.fontFamily,
            lineHeight: tokens.typography.lineHeight.normal,
            resize: 'vertical',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = tokens.colors.primary.default;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = tokens.colors.border;
          }}
        />
      )}
    </div>
  );
}

