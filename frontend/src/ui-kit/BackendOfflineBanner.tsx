/**
 * BackendOfflineBanner - Banner global para backend offline
 * Design industrial, radius <= 4px
 */

import { useBackendHealth } from '../api/hooks/useBackendHealth';
import { tokens } from './tokens';

export function BackendOfflineBanner() {
  const { data: health, isLoading } = useBackendHealth();

  // Mostrar banner apenas se backend estiver offline/unhealthy
  if (isLoading || !health || health.status === 'healthy') {
    return null;
  }

  const isOffline = health.status === 'unhealthy' || !health.db_connected;

  if (!isOffline) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
        backgroundColor: tokens.colors.status.error + '20',
        borderBottom: `2px solid ${tokens.colors.status.error}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginLeft: '80px', // Offset for sidebar
        fontSize: tokens.typography.fontSize.body.sm,
        fontFamily: tokens.typography.fontFamily,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
        <span style={{ color: tokens.colors.status.error, fontWeight: tokens.typography.fontWeight.semibold }}>
          ⚠️ Backend Offline
        </span>
        <span style={{ color: tokens.colors.text.secondary }}>
          {health.db_connected === false
            ? 'Base de dados não conectada. Verifique se PostgreSQL está rodando.'
            : 'Backend não responde. Verifique se o servidor está rodando.'}
        </span>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
          backgroundColor: tokens.colors.status.error,
          color: tokens.colors.text.onAction,
          border: 'none',
          borderRadius: tokens.borderRadius.button,
          fontSize: tokens.typography.fontSize.body.xs,
          fontFamily: tokens.typography.fontFamily,
          cursor: 'pointer',
        }}
      >
        Recarregar
      </button>
    </div>
  );
}

