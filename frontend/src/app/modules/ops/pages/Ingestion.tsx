/**
 * OPS Ingestion - Gestão de ingestão de dados
 * Endpoints: /api/ingestion/run, /api/ingestion/status/{run_id}
 * NOTA: /ops/ingestion/status não existe no backend
 * Industrial: form funcional, status claro
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Panel,
  SectionHeader,
  Button,
  Input,
  NotSupportedState,
  PageCommandBox,
  tokens,
  toast,
} from '../../../../ui-kit';
import { useRunIngestion } from '../../../../api/hooks';

export default function OpsIngestion() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');

  // Use hooks from API layer
  // NOTA: useIngestionStatus removido - endpoint /ops/ingestion/status não existe
  // Use opsApi.getIngestionStatus(runId) para status de uma run específica
  const runIngestion = useRunIngestion();

  const handleRunIngestion = () => {
    if (!apiKey || apiKey.length < 10) {
      toast.error('API key must be at least 10 characters');
      return;
    }
    runIngestion.run(apiKey);
    if (runIngestion.isError) {
      toast.error(`Failed to start ingestion: ${runIngestion.error?.message || 'Unknown error'}`);
    } else if (!runIngestion.isLoading) {
      toast.success('Ingestion started successfully');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/94246b8e-636e-4f72-8761-d2dc71b31e4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Ingestion.tsx:41',message:'invalidateQueries called',data:{queryKey:['ops','ingestion']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      queryClient.invalidateQueries({ queryKey: ['ops', 'ingestion'] });
    }
  };

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onSearch={() => {}} />
      <h1 style={{
        fontSize: tokens.typography.fontSize.title.lg,
        fontWeight: tokens.typography.fontWeight.bold,
        color: tokens.colors.text.title,
        marginBottom: tokens.spacing.lg,
      }}>
        Data Ingestion
      </h1>
      
      <NotSupportedState
        reason="Endpoint /ops/ingestion/status não existe no backend"
        suggestion="Use /api/ingestion/status/{run_id} para status de uma run específica após executar /api/ingestion/run"
        feature="ops.ingestion.status"
      />
      
      <div style={{ marginTop: tokens.spacing.lg }}>
        <Panel>
          <SectionHeader title="Manual Ingestion" />
          <div style={{ padding: tokens.spacing.sm }}>
            <div style={{
              padding: tokens.spacing.md,
              backgroundColor: tokens.colors.card.elevated,
              borderRadius: tokens.borderRadius.card,
              marginBottom: tokens.spacing.md,
            }}>
              <div style={{ 
                fontSize: tokens.typography.fontSize.body.sm, 
                color: tokens.colors.text.secondary,
                marginBottom: tokens.spacing.sm,
              }}>
                Trigger a manual data ingestion run. Requires API key authorization.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
                <Input
                  label="API Key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key..."
                />
                <Button
                  onClick={handleRunIngestion}
                  disabled={runIngestion.isLoading || !apiKey || apiKey.length < 10}
                >
                  {runIngestion.isLoading ? 'Starting...' : 'Run Ingestion'}
                </Button>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
