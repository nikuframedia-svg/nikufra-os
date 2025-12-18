/**
 * ML Explain Leadtime - Explicação das previsões
 * Industrial UI
 */

import { useState } from 'react';
import {
  tokens,
  Panel,
  SectionHeader,
  Input,
  Button,
  DenseTable,
  Loading,
  Empty,
  Error as ErrorState,
  PageCommandBox,
  DataFreshnessChip,
} from '../../../../ui-kit';
import { useExplainLeadtime } from '../../../../api/hooks';

interface FeatureItem {
  name: string;
  value: number;
  contribution: number;
}

export default function MLExplainLeadtime() {
  const [modeloId, setModeloId] = useState('');
  const { explain, result, isLoading, isError, error } = useExplainLeadtime();

  // Extract features from result if available
  const resultData = result as any;
  const features: FeatureItem[] = (resultData?.feature_importance || resultData?.features || []).map((fi: any) => ({
    name: fi.feature || fi.name || 'Unknown',
    value: fi.value || 0,
    contribution: fi.contribution || fi.importance || 0,
  }));

  return (
    <div style={{ padding: tokens.spacing.lg, minHeight: '100vh' }}>
      <PageCommandBox onSearch={() => {}} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.lg }}>
        <div>
          <h1 style={{ 
            fontSize: tokens.typography.fontSize.title.lg, 
            fontWeight: tokens.typography.fontWeight.bold, 
            color: tokens.colors.text.title, 
            margin: 0,
            marginBottom: tokens.spacing.xs,
          }}>
            Explain Lead Time
          </h1>
          <p style={{ fontSize: tokens.typography.fontSize.body.sm, color: tokens.colors.text.secondary, margin: 0 }}>
            Explicação das previsões ML
          </p>
        </div>
        {resultData && 'generated_at' in resultData && <DataFreshnessChip lastIngestion={String(resultData.generated_at)} />}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing.lg }}>
        <Panel>
          <SectionHeader title="Input" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
            <Input 
              label="Modelo ID" 
              type="number" 
              value={modeloId} 
              onChange={(e) => setModeloId(e.target.value)} 
              placeholder="Ex: 123" 
            />
            <Button 
              onClick={() => explain({ modelo_id: parseInt(modeloId) })} 
              disabled={isLoading || !modeloId}
            >
              {isLoading ? 'A explicar...' : 'Explicar'}
            </Button>
          </div>
        </Panel>

        <Panel>
          <SectionHeader title="Feature Importance" />
          {isLoading && <Loading />}
          {isError && <ErrorState message="Erro ao explicar" reason={error?.message} />}
          {!isLoading && !isError && features.length > 0 ? (
            <DenseTable<FeatureItem>
              columns={[
                { key: 'name', header: 'Feature', render: (row: FeatureItem) => row.name },
                { key: 'value', header: 'Valor', render: (row: FeatureItem) => row.value.toFixed(2) },
                { key: 'contribution', header: 'Contribuição', render: (row: FeatureItem) => row.contribution.toFixed(3) },
              ]}
              data={features}
            />
          ) : !isLoading && !isError ? (
            <Empty message="Selecione um modelo para ver a explicação" />
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
