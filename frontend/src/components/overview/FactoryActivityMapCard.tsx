import React from 'react';

interface FactoryActivityMapCardProps {
  columns?: number;
  rows?: number;
  focusWindow?: { x: number; y: number; width: number; height: number };
}

export function FactoryActivityMapCard({ 
  columns = 12, 
  rows = 5,
  focusWindow = { x: 296, y: 68, width: 84, height: 60 }
}: FactoryActivityMapCardProps) {
  // Gerar grid de dots como no Figma (com outline)
  const generateDotState = (row: number, col: number): 'dark' | 'light' | 'white' => {
    // Alguns dots brancos e alguns com rgba(255, 255, 255, 0.10) baseado no padrão do Figma
    const whiteDots = [
      { row: 0, col: 11 },
      { row: 1, col: 1 },
      { row: 1, col: 11 },
      { row: 1, col: 19 },
      { row: 2, col: 0 },
      { row: 2, col: 19 },
      { row: 2, col: 20 },
      { row: 2, col: 23 },
      { row: 3, col: 2 },
      { row: 3, col: 11 },
      { row: 3, col: 19 },
      { row: 3, col: 20 },
      { row: 4, col: 4 },
      { row: 4, col: 11 },
    ];
    
    if (whiteDots.some(d => d.row === row && d.col === col)) {
      return 'white';
    }
    
    const lightDots = [
      { row: 1, col: 2 },
      { row: 1, col: 23 },
      { row: 2, col: 2 },
      { row: 2, col: 20 },
      { row: 3, col: 11 },
      { row: 3, col: 20 },
      { row: 4, col: 2 },
      { row: 4, col: 11 },
    ];
    
    if (lightDots.some(d => d.row === row && d.col === col)) {
      return 'light';
    }
    
    return 'dark';
  };

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
          Mapa de Atividade da Fábrica
        </div>
      </div>
      
      <div style={{
        width: 580,
        height: 244,
        position: 'relative',
      }}>
        <div style={{
          padding: 20,
          left: 0,
          top: 0,
          position: 'absolute',
          background: '#212024',
          overflow: 'hidden',
          borderRadius: 15,
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          display: 'inline-flex',
        }}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                justifyContent: 'flex-start',
                alignItems: 'center',
                display: 'inline-flex',
              }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => {
                const state = generateDotState(rowIndex, colIndex);
                const bgColor = 
                  state === 'white' ? 'white' :
                  state === 'light' ? 'rgba(255, 255, 255, 0.10)' :
                  '#2C2D30';
                
                return (
                  <div
                    key={colIndex}
                    style={{
                      width: 12,
                      height: 12,
                      background: bgColor,
                      borderRadius: 10,
                      outline: '6px #212024 solid',
                      outlineOffset: '-3px',
                    }}
                  />
                );
              })}
            </div>
          ))}
          
          {/* Janela branca de foco */}
          <div style={{
            width: focusWindow.width,
            height: focusWindow.height,
            left: focusWindow.x,
            top: focusWindow.y,
            position: 'absolute',
            borderRadius: 5,
            border: '2px white solid',
          }} />
        </div>
      </div>
    </div>
  );
}
