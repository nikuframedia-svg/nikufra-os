import React from 'react';
import { WorkCenter } from '../../types/prodplan';

interface WorkCenterCardProps {
  workCenter: WorkCenter;
  onView?: (workCenter: WorkCenter) => void;
}

export function WorkCenterCard({ workCenter, onView }: WorkCenterCardProps) {
  const getStatusColor = (status: WorkCenter['status']): string => {
    switch (status) {
      case 'running':
        return '#32E6B7';
      case 'down':
        return '#D9506B';
      case 'idle':
        return 'rgba(199, 207, 214, 0.18)';
      case 'setup':
        return '#D9CF25';
      default:
        return 'rgba(199, 207, 214, 0.18)';
    }
  };

  const getButtonText = (status: WorkCenter['status']): string => {
    switch (status) {
      case 'running':
      case 'idle':
        return 'Ver painel';
      case 'down':
        return 'Em paragem';
      case 'setup':
        return 'Em setup';
      default:
        return 'Ver detalhes';
    }
  };

  const getButtonStyle = (status: WorkCenter['status']) => {
    const baseStyle: React.CSSProperties = {
      padding: '8px 16px',
      borderRadius: 8,
      border: '1px solid',
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
    };

    switch (status) {
      case 'running':
        return {
          ...baseStyle,
          background: '#32E6B7',
          borderColor: '#32E6B7',
          color: '#212024',
        };
      case 'idle':
        return {
          ...baseStyle,
          background: 'transparent',
          borderColor: '#32E6B7',
          color: '#32E6B7',
        };
      case 'down':
        return {
          ...baseStyle,
          background: 'transparent',
          borderColor: '#D9506B',
          color: '#D9506B',
        };
      case 'setup':
        return {
          ...baseStyle,
          background: 'transparent',
          borderColor: '#D9CF25',
          color: '#D9CF25',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 15,
      padding: 16,
      marginBottom: 12,
      border: '1px solid rgba(255, 255, 255, 0.05)',
    }}>
      {/* Status bar */}
      <div style={{
        width: 7,
        height: 46,
        background: getStatusColor(workCenter.status),
        borderRadius: 4,
        marginRight: 16,
      }} />

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#FFFFFF',
          marginBottom: 4,
        }}>
          {workCenter.name}
        </div>
        <div style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: 8,
        }}>
          {workCenter.factory}, {workCenter.area}
        </div>
        <div style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.4)',
        }}>
          ID {workCenter.id}
        </div>
        {workCenter.currentOrder && (
          <div style={{
            fontSize: 12,
            color: '#32E6B7',
            marginTop: 4,
          }}>
            Ordem: {workCenter.currentOrder}
          </div>
        )}
      </div>

      {/* Button */}
      <button
        onClick={() => onView?.(workCenter)}
        style={getButtonStyle(workCenter.status)}
      >
        {getButtonText(workCenter.status)}
      </button>
    </div>
  );
}


