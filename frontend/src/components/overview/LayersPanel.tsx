import React from 'react';
import { PlanningLayer } from '../../types/prodplan';

interface LayersPanelProps {
  layers: PlanningLayer[];
}

export function LayersPanel({ layers }: LayersPanelProps) {
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
        Camadas de planeamento
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {layers.map((layer) => (
          <div
            key={layer.id}
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(147, 121, 255, 0.6)',
            }} />
            <div style={{ fontSize: 14, color: '#FFFFFF' }}>
              {layer.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


