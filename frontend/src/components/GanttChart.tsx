import { useMemo, useState } from 'react'
import { Operation } from '../types'
import { differenceInHours, parseISO, format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface GanttChartProps {
  operations: Operation[]
  title: string
  startDate: Date
  endDate: Date
  isBaseline?: boolean
  allMachines?: string[]  // Lista completa de máquinas (mesmo sem operações)
}

// Cores inteligentes por setor e tipo
const getOperationColor = (op: Operation, isBaseline: boolean) => {
  // Baseline: cinza claro
  if (isBaseline) {
    return '#9CA3AF' // Cinza claro
  }
  
  // Overlap: verde fluorescente (prioridade máxima)
  if (op.overlap > 0) return '#34D399' // Verde fluorescente
  
  // Rotas alternativas: amarelo
  if (op.rota === 'B') return '#FBBF24' // Amarelo
  
  // Cores por setor
  const setorLower = op.setor?.toLowerCase() || ''
  if (setorLower.includes('transform')) return '#3B82F6' // Azul - Transformação
  if (setorLower.includes('acab')) return '#10B981' // Verde claro - Acabamentos
  if (setorLower.includes('emb')) return '#059669' // Verde escuro - Embalagem
  
  return '#6B7280' // Cinza padrão
}

// Determinar setor da máquina (para agrupamento visual)
const getMachineSector = (machineId: string): string => {
  // Lógica baseada em IDs de máquinas (ajustar conforme necessário)
  if (machineId.startsWith('0') || machineId.startsWith('1')) return 'Transformação'
  if (machineId.startsWith('2') || machineId.startsWith('3')) return 'Acabamentos'
  if (machineId.startsWith('4') || machineId.startsWith('5')) return 'Embalagem'
  return 'Outros'
}

export const GanttChart = ({ operations, title, startDate, endDate, isBaseline = false, allMachines: propAllMachines }: GanttChartProps) => {
  const horizonHours = Math.max(differenceInHours(endDate, startDate), 1)

  const [hoveredOp, setHoveredOp] = useState<Operation | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })

  // Calcular marcadores de tempo adaptativos
  const timeMarkers = useMemo(() => {
    const markers = []
    const horizonStart = new Date(startDate)
    const horizonEnd = new Date(endDate)
    
    // Steps adaptativos baseados no horizonte
    let stepHours: number
    if (horizonHours <= 4) {
      stepHours = 1  // 1h para horizontes muito curtos
    } else if (horizonHours <= 8) {
      stepHours = 2  // 2h para horizontes curtos
    } else if (horizonHours <= 24) {
      stepHours = 4  // 4h para 1 dia
    } else if (horizonHours <= 48) {
      stepHours = 6  // 6h para 2 dias
    } else if (horizonHours <= 168) {
      stepHours = 12  // 12h para 1 semana
    } else {
      stepHours = 24  // 24h para horizontes maiores
    }
    
    let currentHour = 0
    while (currentHour <= horizonHours) {
      const markerDate = new Date(horizonStart.getTime() + currentHour * 60 * 60 * 1000)
      if (markerDate <= horizonEnd) {
        markers.push({
          date: markerDate,
          position: (currentHour / horizonHours) * 100,
        })
      }
      currentHour += stepHours
      if (markers.length > 100) break
    }
    
    return markers
  }, [startDate, endDate, horizonHours])

  // TODAS as máquinas sempre visíveis
  const allMachines = useMemo(() => {
    if (propAllMachines && propAllMachines.length > 0) {
      return propAllMachines.sort()
    }
    const machines = new Set<string>()
    operations.forEach((op) => {
      machines.add(op.recurso)
    })
    return Array.from(machines).sort()
  }, [operations, propAllMachines])
  
  // Agrupar por máquina
  const operationsByResource = useMemo(() => {
    const grouped: Record<string, Operation[]> = {}
    allMachines.forEach((machine) => {
      grouped[machine] = []
    })
    operations.forEach((op) => {
      if (!grouped[op.recurso]) {
        grouped[op.recurso] = []
      }
      grouped[op.recurso].push(op)
    })
    // Ordenar operações por start_time dentro de cada máquina
    Object.keys(grouped).forEach((machine) => {
      grouped[machine].sort((a, b) => 
        parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
      )
    })
    return grouped
  }, [operations, allMachines])

  // Calcular posições das barras (sem colisões)
  const bars = useMemo(() => {
    const result: Array<Operation & { left: number; width: number; color: string; row: number }> = []
    
    allMachines.forEach((machine) => {
      const ops = operationsByResource[machine] || []
      const rows: Array<Operation[]> = [] // Múltiplas linhas para evitar colisões
      
      ops.forEach((op) => {
      const start = parseISO(op.start_time)
      const end = parseISO(op.end_time)
        const opStart = start.getTime()
        const opEnd = end.getTime()
        
        // Encontrar primeira linha onde não há colisão
        let rowIndex = 0
        for (let i = 0; i < rows.length; i++) {
          const hasCollision = rows[i].some((existingOp) => {
            const existingStart = parseISO(existingOp.start_time).getTime()
            const existingEnd = parseISO(existingOp.end_time).getTime()
            // Verificar sobreposição
            return !(opEnd <= existingStart || opStart >= existingEnd)
          })
          if (!hasCollision) {
            rowIndex = i
            break
          }
          rowIndex = i + 1
        }
        
        // Criar nova linha se necessário
        if (rowIndex >= rows.length) {
          rows.push([])
        }
        rows[rowIndex].push(op)
        
        // Calcular posição
        const hoursFromStart = differenceInHours(start, startDate)
        const durationHours = differenceInHours(end, start)
        const left = Math.max(0, Math.min(100, (hoursFromStart / horizonHours) * 100))
        const width = Math.max(0.5, Math.min(100, (durationHours / horizonHours) * 100))
        
        result.push({
        ...op,
        left,
          width,
          color: getOperationColor(op, isBaseline),
          row: rowIndex,
        })
      })
    })
    
    return result
  }, [operations, startDate, horizonHours, isBaseline, allMachines, operationsByResource])

  // Tooltip rico
  const getTooltipContent = (op: Operation) => {
    const start = parseISO(op.start_time)
    const end = parseISO(op.end_time)
    const duration = differenceInHours(end, start)
    
    return {
      ordem: op.ordem,
      operacao: op.operacao,
      recurso: op.recurso,
      setor: op.setor || getMachineSector(op.recurso),
      duracao: `${duration.toFixed(1)}h`,
      overlap: op.overlap > 0 ? `${(op.overlap * 100).toFixed(0)}%` : '0%',
      rota: op.rota || 'A',
      inicio: format(start, 'dd/MM HH:mm'),
      fim: format(end, 'dd/MM HH:mm'),
      }
  }

  // Agrupar máquinas por setor para visualização
  const machinesBySector = useMemo(() => {
    const grouped: Record<string, string[]> = {}
    allMachines.forEach((machine) => {
      const sector = getMachineSector(machine)
      if (!grouped[sector]) {
        grouped[sector] = []
      }
      grouped[sector].push(machine)
    })
    return grouped
  }, [allMachines])

  const rowHeight = 85 // Aumentado para mais espaçamento (era 70)
  const sectorSpacing = 25 // Espaço entre setores (era 20)

  return (
    <div className="space-y-6">
      {/* Header claro */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary">{title}</h3>
          <p className="text-sm text-text-muted mt-1">
            {format(startDate, 'dd/MM/yyyy HH:mm')} → {format(endDate, 'dd/MM/yyyy HH:mm')} ({horizonHours}h)
          </p>
        </div>
        {!isBaseline && (
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border/60 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-[#34D399] shadow-sm"></div>
              <span className="text-text-primary font-medium">Overlap</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border/60 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-[#FBBF24] shadow-sm"></div>
              <span className="text-text-primary font-medium">Rota B</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border/60 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-[#10B981] shadow-sm"></div>
              <span className="text-text-primary font-medium">Acabamentos</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border/60 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-[#3B82F6] shadow-sm"></div>
              <span className="text-text-primary font-medium">Transformação</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Gantt Container - Layout moderno */}
      <div className="relative rounded-2xl border-2 border-border/80 bg-gradient-to-br from-surface to-surface/90 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
        {/* Linhas verticais de tempo */}
        <div className="absolute inset-0 pointer-events-none">
          {timeMarkers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute top-0 bottom-0 w-px bg-border/60"
              style={{ left: `${marker.position}%` }}
            >
              <div className="absolute top-0 left-0 transform -translate-x-1/2 text-[10px] font-semibold text-text-muted/80 whitespace-nowrap bg-surface/90 px-1.5 py-0.5 rounded border border-border/40">
                {horizonHours <= 24 
                  ? format(marker.date, 'HH:mm') 
                  : format(marker.date, 'dd/MM HH:mm')}
              </div>
            </div>
          ))}
        </div>

        {/* Labels de recursos (lado esquerdo) - TODAS as máquinas com agrupamento por setor */}
        <div 
          className="absolute left-0 top-0 w-36 bg-surface/95 backdrop-blur-sm border-r-2 border-border/80 z-10 overflow-y-auto" 
          style={{ height: `${Math.max(400, allMachines.length * rowHeight + Object.keys(machinesBySector).length * sectorSpacing + 40)}px` }}
        >
          {Object.entries(machinesBySector).map(([sector, machines]) => (
            <div key={sector} className="mb-2">
              {/* Label do setor */}
              <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted/70 uppercase tracking-wider bg-background/40 border-b border-border/40">
                {sector}
              </div>
              {/* Máquinas do setor */}
              {machines.map((machine) => {
                const globalIdx = allMachines.indexOf(machine)
                const hasOperations = operationsByResource[machine]?.length > 0
                const rowTop = globalIdx * rowHeight + Object.keys(machinesBySector).indexOf(sector) * sectorSpacing + 20
                return (
                  <div
                    key={machine}
                    className={`absolute text-sm font-bold py-3 px-4 rounded-xl transition-all border-2 ${
                      hasOperations 
                        ? 'text-text-primary bg-background/70 border-border/60 shadow-md' 
                        : 'text-text-muted/40 bg-background/20 border-border/20'
                    }`}
                    style={{ top: `${rowTop}px`, left: '8px', right: '8px' }}
                  >
                    {machine}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Área do Gantt - Adaptativa */}
        <div 
          className="ml-36 relative overflow-x-auto overflow-y-auto" 
          style={{ height: `${Math.max(400, allMachines.length * rowHeight + Object.keys(machinesBySector).length * sectorSpacing + 40)}px` }}
        >
          <div 
            className="relative h-full" 
            style={{ 
              width: `${Math.max(100, Math.max(horizonHours * 8, 1000))}px`, 
              minWidth: '100%' 
            }}
          >
            {/* Barras de operações - sem colisões */}
            {allMachines.map((machine, resourceIdx) => {
              const ops = operationsByResource[machine] || []
              const sector = getMachineSector(machine)
              const sectorOffset = Object.keys(machinesBySector).indexOf(sector) * sectorSpacing
              const rowTop = resourceIdx * rowHeight + sectorOffset + 20
              
              return ops.map((op) => {
                const bar = bars.find((b) => 
                  b.ordem === op.ordem && 
                  b.operacao === op.operacao && 
                  b.recurso === machine
                )
                if (!bar) return null
                
                // Calcular top considerando múltiplas linhas (rows)
                const barTop = rowTop + (bar.row * 25) // Offset para múltiplas linhas (aumentado de 20 para 25)
                
                return (
                  <motion.div
                    key={`${op.ordem}-${op.operacao}-${machine}-${bar.row}`}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute h-12 rounded-xl px-3 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 hover:z-20 border-2 border-white/30 shadow-lg"
                    style={{
                      left: `${bar.left}%`,
                      width: `${Math.max(bar.width, 0.5)}%`,
                      top: `${barTop}px`,
                      backgroundColor: bar.color,
                      boxShadow: hoveredOp === op 
                        ? '0 0 24px rgba(69,255,193,0.6), 0 6px 16px rgba(0,0,0,0.4)' 
                        : '0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
                    }}
                    onMouseEnter={(e) => {
                      setHoveredOp(op)
                      setHoverPosition({ x: e.clientX, y: e.clientY })
                    }}
                    onMouseLeave={() => setHoveredOp(null)}
                    onMouseMove={(e) => setHoverPosition({ x: e.clientX, y: e.clientY })}
                  >
                    <span className="text-xs font-bold text-white truncate flex-1 drop-shadow-sm">
                      {op.ordem}
                    </span>
                    {/* Badge de Rota - sempre visível */}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap drop-shadow-sm ${
                      op.rota === 'B' ? 'bg-yellow-500/80' : 'bg-blue-500/60'
                    }`}>
                      Rota {op.rota || 'A'}
                    </span>
                    {op.overlap > 0 && (
                      <span className="rounded-full bg-white/40 px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap drop-shadow-sm">
                        {op.overlap.toFixed(1)}
                    </span>
                  )}
                  </motion.div>
                )
              })
            })}
          </div>
        </div>

        {/* Tooltip rico */}
        <AnimatePresence>
          {hoveredOp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-50 bg-surface border-2 border-nikufra/60 rounded-xl p-4 shadow-2xl pointer-events-none backdrop-blur-sm"
              style={{
                left: `${hoverPosition.x + 15}px`,
                top: `${hoverPosition.y + 15}px`,
                maxWidth: '320px',
              }}
            >
              <div className="space-y-3 text-sm">
                <div className="font-bold text-text-primary border-b-2 border-nikufra/30 pb-2">
                  {hoveredOp.ordem} • {hoveredOp.operacao}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-text-muted font-medium">Máquina:</span>
                    <span className="ml-2 font-bold text-text-primary">{hoveredOp.recurso}</span>
                  </div>
                  <div>
                    <span className="text-text-muted font-medium">Setor:</span>
                    <span className="ml-2 font-bold text-text-primary">{getTooltipContent(hoveredOp).setor}</span>
                  </div>
                  <div>
                    <span className="text-text-muted font-medium">Rota:</span>
                    <span className="ml-2 font-bold text-text-primary">{getTooltipContent(hoveredOp).rota}</span>
                  </div>
                  <div>
                    <span className="text-text-muted font-medium">Duração total:</span>
                    <span className="ml-2 font-bold text-nikufra">{getTooltipContent(hoveredOp).duracao}</span>
                  </div>
                  <div className="col-span-2 text-xs text-text-muted mt-1">
                    <span className="font-medium">Breakdown:</span>
                    <span className="ml-2">Setup + Execução = {getTooltipContent(hoveredOp).duracao}</span>
                  </div>
                  {hoveredOp.overlap > 0 && (
                    <div className="col-span-2">
                      <span className="text-text-muted font-medium">Overlap aplicado:</span>
                      <span className="ml-2 font-bold text-[#34D399]">{getTooltipContent(hoveredOp).overlap}</span>
                    </div>
                  )}
                  <div className="col-span-2 pt-2 border-t border-border/40">
                    <span className="text-text-muted font-medium">Início:</span>
                    <span className="ml-2 font-bold text-text-primary">{getTooltipContent(hoveredOp).inicio}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-text-muted font-medium">Fim:</span>
                    <span className="ml-2 font-bold text-text-primary">{getTooltipContent(hoveredOp).fim}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
