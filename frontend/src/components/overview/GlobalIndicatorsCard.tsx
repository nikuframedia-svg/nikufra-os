import React from 'react';
import { GlobalIndicator } from '../../types/prodplan';
import { SimpleLineChart } from '../charts/SimpleLineChart';

interface GlobalIndicatorsCardProps {
  indicators: GlobalIndicator[];
  timeRange?: { start: string; end: string };
}

export function GlobalIndicatorsCard({ indicators, timeRange }: GlobalIndicatorsCardProps) {
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

      {/* Chart area - mantém a mesma área do Figma */}
      <div style={{
        height: 200,
        position: 'relative',
      }}>
        {/* Grid lines de referência (0, 25, 50, 75, 100) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}>
          {[100, 75, 50, 25, 0].map((value) => (
            <div
              key={value}
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingLeft: 8,
                fontSize: 10,
                color: 'rgba(255, 255, 255, 0.3)',
                height: '25%',
                display: 'flex',
                alignItems: 'flex-start',
                paddingTop: 4,
              }}
            >
              {value}
            </div>
          ))}
        </div>

        {/* Chart overlay */}
        <div style={{
          position: 'relative',
          height: '100%',
          width: '100%',
        }}>
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
      </div>
    </div>
  );
}


