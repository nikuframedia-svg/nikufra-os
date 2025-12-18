/**
 * App Entry - ProdPlan 4.0 OS
 * Industrial UI, ZERO fake data
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import { AppShell } from './app/shell/AppShell';
import { AppRoutes } from './app/routes/index';
import { Loading } from './ui-kit';
import { RouteErrorBoundary } from './ui-kit/RouteErrorBoundary';
import { tokens } from './ui-kit/tokens';

// Query Client com retries inteligentes
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30s para endpoints quentes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:21',message:'retry function called',data:{failureCount,errorStatus:error?.response?.status,errorMessage:error?.message,hasNormalized:!!error?.normalized},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Extrair kind do erro normalizado se disponível
        const normalized = error?.normalized || (error?.response ? {
          kind: error.response?.status === 404 ? 'NOT_SUPPORTED_BACKEND' :
                error.response?.status === 503 ? 'OFFLINE' :
                error.response?.status === 500 ? 'SERVER_ERROR' :
                error.response?.status === 400 || error.response?.status === 422 ? 'VALIDATION' :
                error.response?.status === 401 || error.response?.status === 403 ? 'UNAUTHORIZED' :
                'UNKNOWN'
        } : { kind: 'OFFLINE' });
        
        const kind = normalized.kind || 'UNKNOWN';
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:35',message:'retry decision',data:{kind,failureCount,willRetry:!['NOT_SUPPORTED_BACKEND','NOT_SUPPORTED_BY_DATA','VALIDATION','UNAUTHORIZED'].includes(kind) && (kind === 'OFFLINE' || kind === 'SERVER_ERROR' ? failureCount < 1 : failureCount < 2)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Não retry para erros que não vão melhorar
        if (['NOT_SUPPORTED_BACKEND', 'NOT_SUPPORTED_BY_DATA', 'VALIDATION', 'UNAUTHORIZED'].includes(kind)) {
          return false;
        }
        
        // Retry limitado para OFFLINE e SERVER_ERROR
        if (kind === 'OFFLINE' || kind === 'SERVER_ERROR') {
          return failureCount < 1; // Apenas 1 retry
        }
        
        // Default: 2 retries
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Global styles
const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  html, body, #root {
    min-height: 100vh;
    background-color: ${tokens.colors.background};
    color: ${tokens.colors.text.body};
    font-family: ${tokens.typography.fontFamily};
    font-size: ${tokens.typography.fontSize.body.md};
    line-height: ${tokens.typography.lineHeight.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${tokens.colors.card.default};
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${tokens.colors.border};
    border-radius: ${tokens.borderRadius.card};
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: ${tokens.colors.primary.default};
  }
  
  /* Animations */
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Form elements */
  input, select, textarea, button {
    font-family: inherit;
  }
  
  input::placeholder, textarea::placeholder {
    color: ${tokens.colors.text.muted};
  }
  
  /* Links */
  a {
    color: ${tokens.colors.primary.default};
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  /* Selection */
  ::selection {
    background-color: ${tokens.colors.primary.light};
    color: ${tokens.colors.text.title};
  }
`;

function App() {
  return (
    <>
      <style>{globalStyles}</style>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppShell>
            <RouteErrorBoundary>
              <Suspense fallback={
                <div style={{ padding: tokens.spacing.lg }}>
                  <Loading />
                </div>
              }>
                <AppRoutes />
              </Suspense>
            </RouteErrorBoundary>
          </AppShell>
        </BrowserRouter>
      </QueryClientProvider>
    </>
  );
}

export default App;
