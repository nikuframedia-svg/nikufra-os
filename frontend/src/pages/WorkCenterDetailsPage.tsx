import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { BrainFunctionCard } from '../components/workcenter/BrainFunctionCard';
import { EquipmentSpecRow } from '../components/equipment/EquipmentSpecRow';
import { useWorkCenter } from '../hooks/useWorkCenter';

// Fallback mock data
const fallbackTimeBreakdown = [
  { label: 'Setup & mudança de série', pct: 15 },
  { label: 'Produção', pct: 65 },
  { label: 'Movimento interno / logística', pct: 8 },
  { label: 'Qualidade & retrabalho', pct: 5 },
  { label: 'Monitorização & sensores', pct: 4 },
  { label: 'Outros estados', pct: 3 },
];

const fallbackEquipmentSpecs = [
  { id: '1', name: 'Atuador principal', category: 'arm' as const, quantity: 2, manufacturer: 'Japan Xinchipa' },
  { id: '2', name: 'Sistema de locomoção', category: 'wheel' as const, quantity: 4, manufacturer: 'Neon 723' },
  { id: '3', name: 'Sensor de balanceamento', category: 'sensor' as const, quantity: 1, manufacturer: 'Balancing Xion 2.7B' },
  { id: '4', name: 'Sensor de fumos/segurança', category: 'sensor' as const, quantity: 2, manufacturer: 'Smoke_SDCO 513B' },
  { id: '5', name: 'Câmara frontal', category: 'camera' as const, quantity: 1, manufacturer: 'Sony 24Px' },
  { id: '6', name: 'Câmara traseira', category: 'camera' as const, quantity: 1, manufacturer: 'Aony 98Px' },
];

export default function WorkCenterDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workCenter, timeBreakdown, equipmentSpecs, loading } = useWorkCenter(id || '');

  if (!id) {
    navigate('/work-centers');
    return null;
  }

  if (loading) {
    return (
      <AppLayout>
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.6)',
        }}>
          A carregar detalhes da máquina...
        </div>
      </AppLayout>
    );
  }

  if (!workCenter) {
    return (
      <AppLayout>
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.6)',
        }}>
          Centro de trabalho não encontrado
        </div>
      </AppLayout>
    );
  }

  const displayTimeBreakdown = timeBreakdown.length > 0 ? timeBreakdown : fallbackTimeBreakdown;
  const displayEquipmentSpecs = equipmentSpecs.length > 0 
    ? equipmentSpecs.map(spec => ({ ...spec, manufacturer: undefined }))
    : fallbackEquipmentSpecs;
  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #9379FF 0%, #5EC9FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 16,
          }}>
            Detalhe da máquina
          </h1>

          {/* Work Center Info Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 15,
            padding: 24,
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: 24,
          }}>
            <div style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#FFFFFF',
              marginBottom: 8,
            }}>
              {workCenter.name}
            </div>
            <div style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 4,
            }}>
              {workCenter.factory}, {workCenter.area}
            </div>
            <div style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.4)',
              marginBottom: 16,
            }}>
              ID {workCenter.id}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid #32E6B7',
                background: 'transparent',
                color: '#32E6B7',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Monitorizar
              </button>
              <button style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid #D9506B',
                background: '#D9506B',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Remover da vista
              </button>
            </div>
          </div>
        </div>

        {/* Distribuição de tempo */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: 16,
          }}>
            Distribuição de tempo (últimas 24h)
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {displayTimeBreakdown.map((breakdown, index) => (
              <BrainFunctionCard key={index} breakdown={breakdown} />
            ))}
          </div>
        </div>

        {/* Ficha técnica do equipamento */}
        <div>
          <h2 style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: 16,
          }}>
            Ficha técnica do equipamento
          </h2>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 15,
            padding: 20,
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            {displayEquipmentSpecs.map((spec) => (
              <EquipmentSpecRow
                key={spec.id}
                spec={spec}
                manufacturer={'manufacturer' in spec ? spec.manufacturer : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

