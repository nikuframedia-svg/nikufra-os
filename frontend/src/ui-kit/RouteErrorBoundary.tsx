/**
 * RouteErrorBoundary - Error boundary para rotas lazy
 * Design industrial, sem UI infantil
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Error as ErrorState } from './Error';
import { tokens } from './tokens';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RouteErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'Erro desconhecido';
      const isChunkError = errorMessage.includes('ChunkLoadError') || errorMessage.includes('Failed to fetch dynamically imported module');

      return (
        <div style={{ padding: tokens.spacing.lg }}>
          <ErrorState
            message={isChunkError ? 'Erro ao carregar módulo' : 'Erro na rota'}
            reason={
              isChunkError
                ? 'O módulo não pôde ser carregado. Tente recarregar a página.'
                : errorMessage
            }
            action={
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                  backgroundColor: tokens.colors.primary.default,
                  color: tokens.colors.text.onAction,
                  border: 'none',
                  borderRadius: tokens.borderRadius.button,
                  cursor: 'pointer',
                  fontFamily: tokens.typography.fontFamily,
                }}
              >
                {isChunkError
                  ? 'Recarregar página'
                  : 'Ver console'}
              </button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

