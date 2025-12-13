import React from 'react';

interface ActivityByMachineCardProps {
  machines?: number; // Number of machine columns
  timeSlots?: number; // Number of time slots (rows)
  selectedMachineIndex?: number;
}

export function ActivityByMachineCard({ 
  machines = 8, 
  timeSlots = 5,
  selectedMachineIndex 
}: ActivityByMachineCardProps) {
  const totalSquares = machines * timeSlots;

  return (
    <div>
      {/* Grid de squares - cada coluna representa uma máquina */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${machines}, 1fr)`,
        gap: 4,
      }}>
        {Array.from({ length: totalSquares }).map((_, i) => {
          const columnIndex = i % machines;
          const isSelected = selectedMachineIndex !== undefined && columnIndex === selectedMachineIndex;
          
          return (
            <div
              key={i}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 2,
                background: `rgba(147, 121, 255, ${0.2 + Math.random() * 0.6})`,
                border: isSelected ? '2px solid #32E6B7' : 'none',
                transition: 'all 0.2s',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

