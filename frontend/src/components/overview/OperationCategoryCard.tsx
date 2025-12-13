import React from 'react';
import { OperationCategoryCard as OperationCategoryCardType } from '../../types/prodplan';

interface OperationCategoryCardProps {
  category: OperationCategoryCardType;
  onClick?: () => void;
}

export function OperationCategoryCard({ category, onClick }: OperationCategoryCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 15,
        padding: 16,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        ...(onClick && {
          ':hover': {
            background: 'rgba(255, 255, 255, 0.05)',
          },
        }),
      }}
    >
      <div style={{
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 8,
      }}>
        {category.label}
      </div>
      <div style={{
        fontSize: 24,
        fontWeight: 700,
        background: 'linear-gradient(135deg, #9379FF 0%, #5EC9FF 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        {category.utilizationPct.toFixed(1)}%
      </div>
    </div>
  );
}


