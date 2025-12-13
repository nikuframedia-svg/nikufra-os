import React from 'react';
import { GlobalIndicator } from '../../types/prodplan';
import { SimpleLineChart } from '../charts/SimpleLineChart';

interface FactoryIndicatorsChartProps {
  indicators: GlobalIndicator[];
  timeRange?: { start: string; end: string };
}

export function FactoryIndicatorsChart({ indicators, timeRange }: FactoryIndicatorsChartProps) {
  const indicatorLabels: Record<string, string> = {
    'OEE': 'OEE',
    'Utilização': 'Utilização',
    'Lead time': 'Lead time',
    'Entregas a tempo': 'Entregas a tempo',
    'WIP': 'WIP',
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 15,
      padding: 20,
      border: '1px solid rgba(255, 255, 255, 0.05)',
    }}>
      <div style={{
        fontSize: 18,
        fontWeight: 600,
        color: '#FFFFFF',
        marginBottom: 16,
      }}>
        Indicadores Globais
      </div>

      {/* Pills */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
      }}>
        {indicators.map((indicator, index) => (
          <div
            key={index}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              background: 'rgba(147, 121, 255, 0.2)',
              border: '1px solid rgba(147, 121, 255, 0.3)',
              fontSize: 12,
              color: '#9379FF',
            }}
          >
            {indicator.label}
          </div>
        ))}
      </div>

      {/* Chart */}
      <SimpleLineChart
        data={indicators.map((ind, i) => ({
          time: timeRange 
            ? `${timeRange.start.split(':')[0]}:${String(parseInt(timeRange.start.split(':')[1]) + i * 10).padStart(2, '0')}`
            : `${i}`,
          value: ind.value,
        }))}
        height={200}
        color="#32E6B7"
      />
    </div>
  );
}

