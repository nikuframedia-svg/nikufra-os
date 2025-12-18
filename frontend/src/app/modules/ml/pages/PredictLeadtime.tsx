/**
 * ML Predict Leadtime - Previsão de lead time
 * Industrial: input simples, resultado claro
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Panel,
  SectionHeader,
  KPIStat,
  Button,
  Input,
  Loading,
  Error as ErrorComponent,
  NotSupportedState,
  PageCommandBox,
  DataFreshnessChip,
  tokens,
} from '../../../../ui-kit';
import { mlApi } from '../../../../api/api-client';
import { toast } from '../../../../ui-kit';

export default function MLPredictLeadtime() {
  const [modeloId, setModeloId] = useState<string>('');

  const { mutate, data, isPending, error } = useMutation({
    mutationFn: (id: number) => mlApi.predictLeadTime(id),
    onSuccess: () => {
      toast.success('Previsão gerada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao gerar previsão');
    },
  });

  const handlePredict = () => {
    const id = parseInt(modeloId);
    if (isNaN(id)) {
      toast.error('Modelo ID inválido');
      return;
    }
    mutate(id);
  };

  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = String(error.message);
    if (errorMessage.includes('NOT_SUPPORTED_BY_DATA')) {
      return (
        <div style={{ padding: tokens.spacing.lg }}>
          <PageCommandBox onSearch={() => {}} />
          <h1 style={{ fontSize: tokens.typography.fontSize.title.lg, fontWeight: tokens.typography.fontWeight.bold, color: tokens.colors.text.title, marginBottom: tokens.spacing.lg }}>
            ML Predict Lead Time
          </h1>
          <NotSupportedState reason={errorMessage} feature="ml.predict_leadtime" />
        </div>
      );
    }
  }

  return (
    <div style={{ padding: tokens.spacing.lg }}>
      <PageCommandBox onSearch={() => {}} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.xl }}>
        <h1
          style={{
            fontSize: tokens.typography.fontSize.title.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.text.title,
            fontFamily: tokens.typography.fontFamily,
            margin: 0,
          }}
        >
          ML Predict Lead Time
        </h1>
        {data && 'generated_at' in data && <DataFreshnessChip lastIngestion={String(data.generated_at)} />}
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
            <Button onClick={handlePredict} disabled={isPending || !modeloId}>
              {isPending ? 'Gerando...' : 'Gerar Previsão'}
            </Button>
          </div>
        </Panel>

        <Panel>
          <SectionHeader title="Resultado" />
          {isPending ? (
            <Loading />
          ) : error ? (
            <ErrorComponent message="Erro ao gerar previsão" />
          ) : data ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: tokens.spacing.md,
              }}
            >
              <KPIStat
                label="Predicted Lead Time"
                value={(data.predicted_leadtime_hours || data.predicted_lead_time_h || 0).toFixed(1)}
                unit="h"
              />
              {(data.baseline_leadtime_hours || data.baseline_lead_time_h) && (
                <KPIStat
                  label="Baseline Lead Time"
                  value={(data.baseline_leadtime_hours || data.baseline_lead_time_h || 0).toFixed(1)}
                  unit="h"
                />
              )}
              {data.confidence_interval && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    fontSize: tokens.typography.fontSize.body.sm,
                    color: tokens.colors.text.secondary,
                  }}
                >
                  Confidence Interval: {data.confidence_interval[0].toFixed(1)}h -{' '}
                  {data.confidence_interval[1].toFixed(1)}h
                </div>
              )}
              {data.model_version && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    fontSize: tokens.typography.fontSize.body.xs,
                    color: tokens.colors.text.muted,
                  }}
                >
                  Model Version: {data.model_version}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: tokens.colors.text.muted, textAlign: 'center', padding: tokens.spacing.xl }}>
              Execute uma previsão
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
