'use client'

import { useState, useTransition } from 'react'
import type { Reserva } from '@/types'

interface Props {
  reservas: Reserva[]
  onRefresh: () => void
}

const estadoBadge: Record<string, string> = {
  pendiente:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmada: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelada:  'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export function ReservasList({ reservas, onRefresh }: Props) {
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)

  async function updateEstado(id: string, estado: 'confirmada' | 'cancelada') {
    setActionId(id)
    startTransition(async () => {
      await fetch(`/api/reservas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      setActionId(null)
      onRefresh()
    })
  }

  if (reservas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay reservas para este día.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reservas.map((r) => (
        <div
          key={r.id}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
        >
          {/* Info mesa y hora */}
          <div className="flex items-center gap-3 min-w-[140px]">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg font-bold text-white">
              {r.mesas?.numero ?? '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {r.hora_inicio} – {r.hora_fin}
              </p>
              <p className="text-xs text-gray-500">Mesa {r.mesas?.numero}</p>
            </div>
          </div>

          {/* Cliente */}
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{r.nombre_cliente}</p>
            <p className="text-xs text-gray-400">{r.telefono}</p>
            {r.email && <p className="text-xs text-gray-500">{r.email}</p>}
            {r.notas && (
              <p className="text-xs text-gray-500 mt-1 italic">"{r.notas}"</p>
            )}
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${estadoBadge[r.estado]}`}>
              {r.estado}
            </span>
          </div>

          {/* Acciones */}
          {r.estado !== 'cancelada' && (
            <div className="flex gap-2">
              {r.estado === 'pendiente' && (
                <button
                  onClick={() => updateEstado(r.id, 'confirmada')}
                  disabled={isPending && actionId === r.id}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                >
                  Confirmar
                </button>
              )}
              <button
                onClick={() => updateEstado(r.id, 'cancelada')}
                disabled={isPending && actionId === r.id}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
