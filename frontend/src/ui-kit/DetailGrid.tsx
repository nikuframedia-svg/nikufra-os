/**
 * DetailGrid - Grid de informações chave-valor
 * Usado na seção "Device Details"
 */
// React 18;
import { tokens } from './tokens';

interface DetailItem {
  label: string;
  value: string | number;
}

interface DetailGridProps {
  items: DetailItem[];
  columns?: number;
  className?: string;
}

export function DetailGrid({ items, columns = 3, className = '' }: DetailGridProps) {
  const gap = '160px'; // Gap entre colunas

  return (
    <div
      style={{
        padding: `20px 7px`,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
      className={className}
    >
      {/* Render items in rows */}
      {Array.from({ length: Math.ceil(items.length / columns) }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            gap: gap,
          }}
        >
          {items.slice(rowIndex * columns, (rowIndex + 1) * columns).map((item, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                width: '100px',
                height: '42px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: tokens.typography.fontSize.title.md,
                  fontWeight: tokens.typography.fontWeight.regular,
                  color: tokens.colors.text.title,
                  fontFamily: tokens.typography.fontFamily,
                  marginBottom: '8px',
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: tokens.typography.fontSize.label,
                  fontWeight: tokens.typography.fontWeight.regular,
                  color: tokens.colors.text.secondary,
                  fontFamily: tokens.typography.fontFamily,
                  textTransform: 'uppercase',
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

