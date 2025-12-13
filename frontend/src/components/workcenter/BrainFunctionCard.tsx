import React from 'react';
import { TimeBreakdown } from '../../types/prodplan';

interface BrainFunctionCardProps {
  breakdown: TimeBreakdown;
  icon?: React.ReactNode;
}

export function BrainFunctionCard({ breakdown, icon }: BrainFunctionCardProps) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 15,
      padding: 20,
      border: '1px solid rgba(255, 255, 255, 0.05)',
      minHeight: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div>
        {icon && (
          <div style={{ marginBottom: 12 }}>
            {icon}
          </div>
        )}
        <div style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: 8,
        }}>
          {breakdown.label}
        </div>
      </div>
      <div style={{
        fontSize: 32,
        fontWeight: 700,
        background: 'linear-gradient(135deg, #9379FF 0%, #5EC9FF 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {breakdown.pct.toFixed(1)}%
      </div>
    </div>
  );
}


