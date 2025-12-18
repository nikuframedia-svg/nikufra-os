/**
 * PageScaffold - Componente único para todas as páginas
 * Inclui: Header, filtros, actions, QuickNote, StateGate, DataFreshnessChip
 * Design industrial, radius <= 4px
 */

import { ReactNode } from 'react';
import { QuickNote } from './QuickNote';
import { DataFreshnessChip } from './DataFreshnessChip';
import { Loading } from './Loading';
import { Empty } from './Empty';
import { Error as ErrorState } from './Error';
import { NotSupportedState } from './NotSupportedState';
import { BackendOfflineBanner } from './BackendOfflineBanner';
import { useBackendHealth } from '../api/hooks/useBackendHealth';
import { createUIState, type ApiErrorNormalized } from '../api/utils/errorClassification';
import { tokens } from './tokens';

interface PageScaffoldProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  
  // Data state
  data: unknown;
  isLoading: boolean;
  error: unknown | null;
  endpoint: string;
  
  // Optional overrides
  emptyMessage?: string;
  showQuickNote?: boolean;
  showDataFreshness?: boolean;
  dataFreshnessTime?: string;
  
  // Custom render functions
  renderLoading?: () => ReactNode;
  renderEmpty?: () => ReactNode;
  renderError?: (error: ApiErrorNormalized) => ReactNode;
  renderNotSupported?: (error: ApiErrorNormalized) => ReactNode;
  renderOffline?: () => ReactNode;
}

export function PageScaffold({
  title,
  description,
  actions,
  filters,
  children,
  data,
  isLoading,
  error,
  endpoint,
  emptyMessage = 'Sem dados disponíveis',
  showQuickNote = true,
  showDataFreshness = true,
  dataFreshnessTime,
  renderLoading,
  renderEmpty,
  renderError,
  renderNotSupported,
  renderOffline,
}: PageScaffoldProps) {
  const { data: health } = useBackendHealth();
  const isBackendOffline = !health || health.status === 'unhealthy';
  
  const uiState = createUIState(data, isLoading, error, endpoint);
  
  // Backend offline - mostrar banner e degradar
  if (isBackendOffline && !isLoading) {
    if (renderOffline) {
      return <>{renderOffline()}</>;
    }
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <BackendOfflineBanner />
        <div style={{ marginTop: tokens.spacing.lg }}>
          <h1 style={{
            fontSize: tokens.typography.fontSize.title.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.text.title,
            marginBottom: tokens.spacing.md,
          }}>
            {title}
          </h1>
          <ErrorState
            message="Backend offline"
            reason="Não foi possível conectar ao servidor. Verifique se o backend está rodando."
          />
        </div>
      </div>
    );
  }
  
  // Loading state
  if (uiState.isLoading && !uiState.data) {
    if (renderLoading) {
      return <>{renderLoading()}</>;
    }
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageHeader title={title} description={description} actions={actions} />
        {filters && <div style={{ marginBottom: tokens.spacing.md }}>{filters}</div>}
        <Loading />
      </div>
    );
  }
  
  // Not supported by backend (404)
  if (uiState.isNotSupported && uiState.error) {
    if (renderNotSupported) {
      return <>{renderNotSupported(uiState.error)}</>;
    }
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageHeader title={title} description={description} actions={actions} />
        <NotSupportedState
          reason={uiState.error.message}
          suggestion="Este endpoint não está disponível no backend atual."
          feature={endpoint}
        />
        {showQuickNote && <QuickNote />}
      </div>
    );
  }
  
  // Not supported by data
  if (uiState.isNotSupportedByData && uiState.error) {
    if (renderNotSupported) {
      return <>{renderNotSupported(uiState.error)}</>;
    }
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageHeader title={title} description={description} actions={actions} />
        <NotSupportedState
          reason={uiState.error.message}
          suggestion={uiState.error.correlationId ? `Correlation ID: ${uiState.error.correlationId}` : undefined}
          feature={endpoint}
        />
        {showQuickNote && <QuickNote />}
      </div>
    );
  }
  
  // Error state
  if (uiState.error && !uiState.isNotSupported && !uiState.isNotSupportedByData) {
    if (renderError) {
      return <>{renderError(uiState.error)}</>;
    }
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageHeader title={title} description={description} actions={actions} />
        <ErrorState
          message={`Erro ao carregar ${title}`}
          reason={uiState.error.message}
          action={
            <button
              onClick={() => {
                const debugInfo = {
                  endpoint,
                  status: uiState.error?.status,
                  message: uiState.error?.message,
                  correlationId: uiState.error?.correlationId,
                };
                navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
                alert('Debug info copiado para clipboard');
              }}
              style={{
                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                backgroundColor: tokens.colors.primary.default,
                color: tokens.colors.text.onAction,
                border: 'none',
                borderRadius: tokens.borderRadius.button,
                cursor: 'pointer',
                fontFamily: tokens.typography.fontFamily,
                fontSize: tokens.typography.fontSize.body.sm,
              }}
            >
              Copiar Debug
            </button>
          }
        />
        {showQuickNote && <QuickNote />}
      </div>
    );
  }
  
  // Empty state
  if (uiState.isEmpty) {
    if (renderEmpty) {
      return <>{renderEmpty()}</>;
    }
    return (
      <div style={{ padding: tokens.spacing.lg }}>
        <PageHeader title={title} description={description} actions={actions} />
        {filters && <div style={{ marginBottom: tokens.spacing.md }}>{filters}</div>}
        <Empty message={emptyMessage} />
        {showQuickNote && <QuickNote />}
      </div>
    );
  }
  
  // Success state - render children
  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        dataFreshness={showDataFreshness ? dataFreshnessTime : undefined}
      />
      {filters && <div style={{ marginBottom: tokens.spacing.md }}>{filters}</div>}
      {children}
      {showQuickNote && <QuickNote />}
    </div>
  );
}

// Internal PageHeader component
function PageHeader({
  title,
  description,
  actions,
  dataFreshness,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  dataFreshness?: string;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: tokens.spacing.lg,
      flexWrap: 'wrap',
      gap: tokens.spacing.md,
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: tokens.typography.fontSize.title.lg,
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.text.title,
          marginBottom: description ? tokens.spacing.xs : 0,
          fontFamily: tokens.typography.fontFamily,
        }}>
          {title}
        </h1>
        {description && (
          <p style={{
            fontSize: tokens.typography.fontSize.body.sm,
            color: tokens.colors.text.secondary,
            fontFamily: tokens.typography.fontFamily,
          }}>
            {description}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
        {dataFreshness && <DataFreshnessChip lastIngestion={dataFreshness} />}
        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
}

