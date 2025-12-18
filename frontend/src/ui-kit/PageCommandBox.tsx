/**
 * PageCommandBox - Caixa de comando em todas as páginas
 * Industrial: densa, sem decoração, atalho "/"
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens } from './tokens';

interface PageCommandBoxProps {
  onSearch?: (query: string) => void;
  onCommand?: (command: string) => void;
  context?: Record<string, any>; // Contexto da página (filtros, KPIs, etc.)
  placeholder?: string;
  className?: string;
}

export function PageCommandBox({
  onSearch,
  onCommand,
  placeholder = 'Pesquisar ou comando (ex: "ir para ordem 12345", "/" para focar)',
  className = '',
}: PageCommandBoxProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Atalho "/" para focar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isFocused && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    // Comandos rápidos
    const cmd = query.trim().toLowerCase();
    
    // "ir para ordem X" ou "ordem X"
    const orderMatch = cmd.match(/(?:ir para )?ordem[:\s]+(\w+)/i) || cmd.match(/^of[:\s]+(\w+)/i);
    if (orderMatch) {
      navigate(`/prodplan/orders/${orderMatch[1]}`);
      setQuery('');
      return;
    }

    // "wip fase X" ou "fase X"
    const faseMatch = cmd.match(/(?:wip )?fase[:\s]+(\d+)/i);
    if (faseMatch) {
      navigate(`/smartinventory/wip-explorer?fase_id=${faseMatch[1]}`);
      setQuery('');
      return;
    }

    // "riscos overdue" ou "overdue"
    if (cmd.includes('risco') || cmd.includes('overdue')) {
      navigate('/smartinventory/due-risk?bucket=overdue');
      setQuery('');
      return;
    }

    // Se não for comando, enviar para chat ou pesquisa local
    if (onCommand) {
      onCommand(query);
    } else if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        padding: `${tokens.spacing.sm} 0`,
        backgroundColor: tokens.colors.background,
        borderBottom: `1px solid ${tokens.colors.border}`,
        marginBottom: tokens.spacing.md,
      }}
      className={className}
    >
      <div style={{ display: 'flex', gap: tokens.spacing.xs, alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
            backgroundColor: tokens.colors.card.default,
            border: `1px solid ${isFocused ? tokens.colors.primary.default : tokens.colors.border}`,
            borderRadius: tokens.borderRadius.input,
            color: tokens.colors.text.body,
            fontSize: tokens.typography.fontSize.body.sm,
            fontFamily: tokens.typography.fontFamily,
            outline: 'none',
            transition: tokens.transitions.default,
          }}
        />
        <button
          type="submit"
          style={{
            padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
            backgroundColor: tokens.colors.primary.default,
            color: tokens.colors.text.onAction,
            border: 'none',
            borderRadius: tokens.borderRadius.button,
            fontSize: tokens.typography.fontSize.body.sm,
            fontFamily: tokens.typography.fontFamily,
            fontWeight: tokens.typography.fontWeight.medium,
            cursor: 'pointer',
            transition: tokens.transitions.default,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = tokens.colors.primary.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = tokens.colors.primary.default;
          }}
        >
          →
        </button>
      </div>
      {isFocused && (
        <div
          style={{
            marginTop: tokens.spacing.xs,
            fontSize: tokens.typography.fontSize.body.xs,
            color: tokens.colors.text.muted,
          }}
        >
          Comandos: "ordem X", "fase X", "riscos overdue" | Enter para pesquisar
        </div>
      )}
    </form>
  );
}

