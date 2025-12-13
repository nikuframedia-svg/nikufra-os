import React from 'react';
import { SelectedWorkCenterDetails } from '../../types/prodplan';

interface SelectedWorkCenterPanelProps {
  details: SelectedWorkCenterDetails;
}

export function SelectedWorkCenterPanel({ details }: SelectedWorkCenterPanelProps) {
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
        Centro de trabalho selecionado
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Centro de trabalho" value={details.name} />
        <Field label="Nome da célula" value={details.name} />
        <Field label="Tipo de recurso" value={details.resourceType} />
        <Field label="Categoria" value={details.category} />
        
        <Field 
          label="Prensas, quinadeiras, laser" 
          value={details.equipmentTypes.join(', ')} 
        />
        <Field 
          label="Restrições de capacidade e setup" 
          value={details.capacityConstraints.join(', ')} 
        />
        <Field 
          label="Gestão de gargalos" 
          value={details.bottleneckManagement.join(', ')} 
        />
        <Field 
          label="Dependências entre ordens" 
          value={details.orderDependencies.join(', ')} 
        />
        <Field 
          label="Total de operações em carteira" 
          value={details.totalOperationsInQueue.toString()} 
        />
        <Field 
          label="Qualidade do plano (entregas a tempo)" 
          value={`${details.onTimeDeliveryAccuracy.toFixed(1)}%`} 
        />
        <Field 
          label="Famílias de produto" 
          value={details.productFamilies.join(', ')} 
        />
        <Field 
          label="Novos produtos sem histórico" 
          value={details.newProductsWithoutHistory.toString()} 
        />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 14,
        color: '#FFFFFF',
      }}>
        {value}
      </div>
    </div>
  );
}


