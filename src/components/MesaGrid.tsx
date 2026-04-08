'use client'

import { useEffect, useId, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Mesa } from '@/types'
import { MesaCard } from './MesaCard'

interface Props {
  initialMesas: Mesa[]
  selectedMesa: Mesa | null
  onSelect: (mesa: Mesa) => void
}

export function MesaGrid({ initialMesas, selectedMesa, onSelect }: Props) {
  const [mesas, setMesas] = useState<Mesa[]>(initialMesas)
  const instanceId = useId()

  useEffect(() => {
    const supabase = createClient()

    // Suscripción Realtime a cambios en mesas (canal único por instancia)
    const channel = supabase
      .channel(`mesas-realtime-${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mesas' },
        (payload) => {
          setMesas((prev) => {
            if (payload.eventType === 'UPDATE') {
              return prev.map((m) =>
                m.id === (payload.new as Mesa).id ? (payload.new as Mesa) : m
              )
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const libres    = mesas.filter((m) => m.estado === 'libre').length
  const reservadas = mesas.filter((m) => m.estado === 'reservada').length
  const ocupadas   = mesas.filter((m) => m.estado === 'ocupada').length

  return (
    <div>
      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-gray-300">Libre ({libres})</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-gray-300">Reservada ({reservadas})</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-gray-300">Ocupada ({ocupadas})</span>
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-gray-500 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Actualización en tiempo real
        </span>
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {mesas.map((mesa) => (
          <MesaCard
            key={mesa.id}
            mesa={mesa}
            selected={selectedMesa?.id === mesa.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
