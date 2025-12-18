/**
 * NotSupportedState - Componente para exibir quando feature não é suportada pelos dados
 * Mostra reason e suggestion vindos do backend
 */

import { tokens } from './tokens';
import { Badge } from './Badge';

interface NotSupportedStateProps {
  reason?: string;
  suggestion?: string;
  matchRate?: number;
  feature?: string;
}

export function NotSupportedState({
  reason,
  suggestion,
  matchRate,
  feature,
}: NotSupportedStateProps) {
  const containerStyle: React.CSSProperties = {
    padding: tokens.spacing.xl,
    backgroundColor: tokens.colors.card.default,
    borderRadius: tokens.borderRadius.card,
    border: `1px solid ${tokens.colors.warning}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
    alignItems: 'center',
    textAlign: 'center',
  };

  const textStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.body.md,
    color: tokens.colors.text.body,
    fontFamily: tokens.typography.fontFamily,
    lineHeight: tokens.typography.lineHeight.relaxed,
  };

  const suggestionStyle: React.CSSProperties = {
    ...textStyle,
    color: tokens.colors.text.secondary,
    fontStyle: 'italic',
  };

  return (
    <div style={containerStyle}>
      <Badge variant="warning">NOT_SUPPORTED_BY_DATA</Badge>
      {feature && (
        <div style={textStyle}>
          <strong>Feature:</strong> {feature}
        </div>
      )}
      {reason && <div style={textStyle}>{reason}</div>}
      {matchRate !== undefined && (
        <div style={textStyle}>
          <strong>Match Rate:</strong> {(matchRate * 100).toFixed(1)}%
        </div>
      )}
      {suggestion && <div style={suggestionStyle}>💡 {suggestion}</div>}
    </div>
  );
}

