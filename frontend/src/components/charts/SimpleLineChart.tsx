
interface DataPoint {
  time: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
}

export function SimpleLineChart({ 
  data, 
  height = 200, 
  color = '#32E6B7' 
}: SimpleLineChartProps) {
  if (data.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 14,
      }}>
        Sem dados disponíveis
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  const padding = 20;
  const chartHeight = height - padding * 2;

  return (
    <div style={{ height, position: 'relative' }}>
      <svg width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            y1={padding + ratio * chartHeight}
            x2="100%"
            y2={padding + ratio * chartHeight}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Area under line */}
        <path
          d={`M 0 ${height - padding} ${data.map((point, i) => {
            const x = (i / (data.length - 1 || 1)) * 100;
            const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
            return `L ${x}% ${y}`;
          }).join(' ')} L 100% ${height - padding} Z`}
          fill="url(#lineGradient)"
        />

        {/* Line */}
        <polyline
          points={data.map((point, i) => {
            const x = (i / (data.length - 1 || 1)) * 100;
            const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
            return `${x}%,${y}`;
          }).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((point, i) => {
          const x = (i / (data.length - 1 || 1)) * 100;
          const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight;
          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={y}
              r="3"
              fill={color}
              stroke="#212024"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      {/* Time labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 8,
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
      }}>
        {data.length > 0 && (
          <>
            <span>{data[0].time}</span>
            {data.length > 1 && <span>{data[data.length - 1].time}</span>}
          </>
        )}
      </div>
    </div>
  );
}


