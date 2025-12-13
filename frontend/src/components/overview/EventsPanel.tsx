import React from 'react';
import { ProductionEvent } from '../../types/prodplan';

interface EventsPanelProps {
  events: ProductionEvent[];
}

const eventTypeLabels: Record<ProductionEvent['type'], string> = {
  quality_alert: 'Alerta de qualidade',
  unplanned_downtime: 'Paragem não planeada',
  capacity_conflict: 'Replaneamento por conflito de capacidade',
  order_completed: 'Ordem concluída',
  operator_notification: 'Notificação de operador',
  order_released: 'Ordem lançada',
  production_start: 'Início de produção',
  sequence_update: 'Atualização de sequência',
  predictive_maintenance: 'Alerta preditivo (manutenção)',
};

const eventTypeColors: Record<ProductionEvent['type'], string> = {
  quality_alert: '#D9506B',
  unplanned_downtime: '#D9506B',
  capacity_conflict: '#D9CF25',
  order_completed: '#32E6B7',
  operator_notification: '#5EC9FF',
  order_released: '#9379FF',
  production_start: '#82D930',
  sequence_update: '#5EC9FF',
  predictive_maintenance: '#9379FF',
};

export function EventsPanel({ events }: EventsPanelProps) {
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
        Eventos Ativos na Produção
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${eventTypeColors[event.type]}40`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: eventTypeColors[event.type],
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14,
                color: '#FFFFFF',
                marginBottom: 2,
              }}>
                {eventTypeLabels[event.type]}
              </div>
              <div style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.4)',
              }}>
                {event.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


