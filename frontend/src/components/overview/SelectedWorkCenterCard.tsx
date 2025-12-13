import React from 'react';
import { SelectedWorkCenterDetails } from '../../types/prodplan';

interface SelectedWorkCenterCardProps {
  details: SelectedWorkCenterDetails;
}

export function SelectedWorkCenterCard({ details }: SelectedWorkCenterCardProps) {
  return (
    <div style={{
      overflow: 'hidden',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      gap: 10,
      display: 'flex',
    }}>
      <div style={{
        width: 200,
        height: 14,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          left: 0,
          top: 0,
          position: 'absolute',
          color: '#C7CFD6',
          fontSize: 12,
          fontFamily: 'Ubuntu',
          fontWeight: '400',
          wordWrap: 'break-word',
        }}>
          Centro de trabalho selecionado
        </div>
      </div>
      
      <div style={{
        paddingLeft: 9,
        paddingRight: 9,
        paddingTop: 20,
        paddingBottom: 20,
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 20,
        display: 'inline-flex',
      }}>
        {/* Primeira linha */}
        <div style={{
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          gap: 228,
          display: 'inline-flex',
        }}>
          <Field 
            label="hypercolumn name" 
            value={details.name}
            valueSize={20}
          />
          <Field 
            label="category" 
            value={details.category}
            valueSize={20}
          />
        </div>
        
        {/* Segunda linha */}
        <div style={{
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          gap: 228,
          display: 'inline-flex',
        }}>
          <Field 
            label="Inhibitory connections" 
            value={details.equipmentTypes.join(', ')}
            valueSize={20}
          />
          <Field 
            label="Exctractory connections" 
            value={details.bottleneckManagement.join(', ')}
            valueSize={20}
          />
        </div>
        
        {/* Terceira linha - métricas */}
        <div style={{
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          gap: 64,
          display: 'inline-flex',
        }}>
          <Field 
            label="Total de operações em carteira" 
            value={details.totalOperationsInQueue.toString()}
            valueSize={20}
          />
          <Field 
            label="Qualidade do plano (entregas a tempo)" 
            value={`${details.onTimeDeliveryAccuracy.toFixed(1)}%`}
            valueSize={20}
          />
          <Field 
            label="Famílias de produto" 
            value={details.productFamilies.length.toString()}
            valueSize={20}
          />
          <Field 
            label="Novos produtos sem histórico" 
            value={details.newProductsWithoutHistory.toString()}
            valueSize={20}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ 
  label, 
  value, 
  valueSize = 20 
}: { 
  label: string; 
  value: string;
  valueSize?: number;
}) {
  return (
    <div style={{
      width: 100,
      height: 42,
      position: 'relative',
    }}>
      <div style={{
        width: 41,
        height: 23,
        left: 0,
        top: 0,
        position: 'absolute',
      }}>
        <div style={{
          left: 0,
          top: 0,
          position: 'absolute',
          color: 'white',
          fontSize: valueSize,
          fontFamily: 'Ubuntu',
          fontWeight: '400',
          wordWrap: 'break-word',
        }}>
          {value}
        </div>
      </div>
      <div style={{
        width: 72,
        height: 14,
        left: 0,
        top: 28,
        position: 'absolute',
      }}>
        <div style={{
          left: 0,
          top: 0,
          position: 'absolute',
          color: '#C7CFD6',
          fontSize: 12,
          fontFamily: 'Ubuntu',
          fontWeight: '400',
          textTransform: 'uppercase',
          wordWrap: 'break-word',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}
