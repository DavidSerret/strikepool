'use client'

import type { Mesa } from '@/types'

interface Props {
  mesa: Mesa
  selected: boolean
  onSelect: (mesa: Mesa) => void
}

const estadoConfig = {
  libre:    { label: 'Libre',    bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  reservada:{ label: 'Reservada',bg: 'bg-amber-500/20',   border: 'border-amber-500',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  ocupada:  { label: 'Ocupada',  bg: 'bg-red-500/20',     border: 'border-red-500',      text: 'text-red-400',     dot: 'bg-red-400' },
}

export function MesaCard({ mesa, selected, onSelect }: Props) {
  const config = estadoConfig[mesa.estado]
  const isDisponible = mesa.estado === 'libre'

  return (
    <button
      onClick={() => isDisponible && onSelect(mesa)}
      disabled={!isDisponible}
      className={`
        relative flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-200
        ${config.bg} ${config.border}
        ${isDisponible ? 'cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10' : 'cursor-not-allowed opacity-60'}
        ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-105' : ''}
      `}
    >
      {/* Número de mesa */}
      <span className="text-3xl font-bold text-white">{mesa.numero}</span>
      <span className="text-xs text-gray-400 mt-1">Mesa</span>

      {/* Estado */}
      <div className={`flex items-center gap-1.5 mt-3 ${config.text}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
        <span className="text-xs font-medium">{config.label}</span>
      </div>

      {/* Indicador de seleccionada */}
      {selected && (
        <div className="absolute -top-2 -right-2 bg-white text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          ✓
        </div>
      )}
    </button>
  )
}
