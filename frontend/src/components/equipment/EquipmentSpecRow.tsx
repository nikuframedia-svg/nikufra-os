import { EquipmentSpec } from '../../types/prodplan';

interface EquipmentSpecRowProps {
  spec: EquipmentSpec;
  manufacturer?: string;
}

const categoryLabels: Record<EquipmentSpec['category'], string> = {
  arm: 'Atuador principal',
  wheel: 'Sistema de locomoção',
  sensor: 'Sensor',
  camera: 'Câmara',
  controller: 'Controlador',
  other: 'Outro',
};

export function EquipmentSpecRow({ spec, manufacturer }: EquipmentSpecRowProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: 12,
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: 8,
      marginBottom: 8,
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        background: 'rgba(147, 121, 255, 0.2)',
        marginRight: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9379FF',
        fontSize: 20,
      }}>
        {spec.category === 'arm' ? '🔧' : 
         spec.category === 'wheel' ? '⚙️' :
         spec.category === 'sensor' ? '📡' :
         spec.category === 'camera' ? '📷' :
         spec.category === 'controller' ? '🎛️' : '📦'}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 14,
          color: '#FFFFFF',
          marginBottom: 2,
        }}>
          {manufacturer && `${manufacturer} / `}{spec.name}
        </div>
        <div style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.5)',
        }}>
          {categoryLabels[spec.category]} · {spec.quantity} unidade(s)
        </div>
      </div>
    </div>
  );
}


