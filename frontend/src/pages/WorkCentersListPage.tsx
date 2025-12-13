import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { WorkCenterCard } from '../components/workcenter/WorkCenterCard';
import { WorkCenter } from '../types/prodplan';
import { useWorkCenters } from '../hooks/useWorkCenters';

// Fallback mock data
const mockWorkCenters: WorkCenter[] = [
  { 
    id: "MC-01", 
    name: "Linha de Corte 1", 
    factory: "Planta Porto", 
    area: "Corte", 
    floor: "Piso 1", 
    status: "running", 
    oee: 87, 
    currentOrder: "OP-2025-001" 
  },
  { 
    id: "MC-02", 
    name: "Prensa 250T", 
    factory: "Planta Porto", 
    area: "Quinagem", 
    floor: "Piso 1", 
    status: "down", 
    oee: 0 
  },
  { 
    id: "MC-03", 
    name: "Célula de Montagem A", 
    factory: "Planta Porto", 
    area: "Montagem", 
    floor: "Piso 2", 
    status: "idle", 
    oee: 65 
  },
  { 
    id: "MC-04", 
    name: "Laser CNC", 
    factory: "Planta Porto", 
    area: "Corte", 
    floor: "Piso 1", 
    status: "setup", 
    oee: 0,
    currentOrder: "OP-2025-002"
  },
];

export default function WorkCentersListPage() {
  const navigate = useNavigate();
  const { workCenters, loading } = useWorkCenters();
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const displayWorkCenters = workCenters.length > 0 ? workCenters : mockWorkCenters;

  const filteredWorkCenters = displayWorkCenters.filter(wc => {
    if (!showUnavailable && wc.status === 'down') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return wc.name.toLowerCase().includes(query) ||
             wc.id.toLowerCase().includes(query) ||
             wc.area.toLowerCase().includes(query);
    }
    return true;
  });

  const handleViewWorkCenter = (workCenter: WorkCenter) => {
    navigate(`/work-centers/${workCenter.id}`);
  };

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
            ProdPlan 4.0 OS · Centros de Trabalho
          </h1>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: 16,
          marginBottom: 24,
          alignItems: 'center',
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Pesquisar máquinas, linhas ou células"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontSize: 14,
            }}
          />

          {/* Toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 14,
          }}>
            <input
              type="checkbox"
              checked={showUnavailable}
              onChange={(e) => setShowUnavailable(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Mostrar máquinas paradas
          </label>
        </div>

        {/* Work Centers List */}
        <div>
          {loading ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
            }}>
              A carregar centros de trabalho...
            </div>
          ) : filteredWorkCenters.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
            }}>
              Nenhum centro de trabalho encontrado
            </div>
          ) : (
            filteredWorkCenters.map(workCenter => (
              <WorkCenterCard
                key={workCenter.id}
                workCenter={workCenter}
                onView={handleViewWorkCenter}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

