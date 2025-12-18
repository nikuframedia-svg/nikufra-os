/**
 * Flowchart - Diagrama de fluxo com nós e conexões
 * Usado em "Active Interference"
 */
// React import not needed in React 17+ with jsx automatic runtime
import { tokens } from './tokens';

type NodeColor = 'blue' | 'purple' | 'green';

interface FlowchartNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: NodeColor;
}

interface FlowchartConnection {
  from: string;
  to: string;
}

interface FlowchartProps {
  nodes: FlowchartNode[];
  connections: FlowchartConnection[];
  className?: string;
}

const colorMap: Record<NodeColor, string> = {
  blue: '#3255E6',
  purple: '#9379FF',
  green: '#32E6B7',
};

export function Flowchart({ nodes, connections, className = '' }: FlowchartProps) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div
      style={{
        width: '580px',
        height: '224px',
        position: 'relative',
        backgroundColor: tokens.colors.card.listItem,
        borderRadius: tokens.borderRadius.card,
      }}
      className={className}
    >
      {/* Nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          style={{
            position: 'absolute',
            left: `${node.x}px`,
            top: `${node.y}px`,
            padding: '10px',
            borderRadius: tokens.borderRadius.card,
            outline: `1px ${colorMap[node.color]} solid`,
            outlineOffset: '-1px',
            backgroundColor: 'transparent',
          }}
        >
          <div
            style={{
              fontSize: tokens.typography.fontSize.label,
              fontWeight: tokens.typography.fontWeight.regular,
              color: tokens.colors.text.secondary,
              fontFamily: tokens.typography.fontFamily,
              textTransform: 'capitalize',
              textAlign: 'center',
            }}
          >
            {node.label.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      ))}

      {/* Connections */}
      {connections.map((conn, index) => {
        const fromNode = nodeMap.get(conn.from);
        const toNode = nodeMap.get(conn.to);
        
        if (!fromNode || !toNode) return null;

        // Calcular posição da conexão (simplificado - linha reta)
        const fromX = fromNode.x + 50; // Aproximado centro do nó
        const fromY = fromNode.y + 20;
        const toX = toNode.x + 50;
        const toY = toNode.y + 20;

        const dx = toX - fromX;
        const dy = toY - fromY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <div key={index}>
            {/* Connection line */}
            <div
              style={{
                position: 'absolute',
                left: `${fromX}px`,
                top: `${fromY}px`,
                width: `${length}px`,
                height: '1px',
                backgroundColor: tokens.colors.text.title,
                transformOrigin: 'left center',
                transform: `rotate(${angle}deg)`,
                borderRadius: tokens.borderRadius.card, // 4px max
              }}
            />
            {/* Connection point */}
            <div
              style={{
                position: 'absolute',
                left: `${toX - 3}px`,
                top: `${toY - 3}px`,
                width: '6px',
                height: '6px',
                backgroundColor: tokens.colors.text.title,
                borderRadius: '9999px',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

