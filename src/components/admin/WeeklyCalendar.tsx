'use client'

import { useMemo } from 'react'
import { addDays, startOfWeek, format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Reserva } from '@/types'

interface Props {
  reservas: Reserva[]
  weekStart: Date
}

const HORAS = Array.from({ length: 15 }, (_, i) => i + 9)  // 9–23

export function WeeklyCalendar({ reservas, weekStart }: Props) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  function getReservasForDayHour(day: Date, hora: number) {
    return reservas.filter((r) => {
      if (r.estado === 'cancelada') return false
      const fechaR = new Date(r.fecha + 'T00:00:00')
      if (!isSameDay(fechaR, day)) return false
      const h = parseInt(r.hora_inicio.split(':')[0], 10)
      return h === hora
    })
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Cabecera días */}
        <div className="grid grid-cols-8 gap-px bg-gray-800 rounded-t-xl overflow-hidden">
          <div className="bg-gray-900 p-2" />
          {days.map((day) => (
            <div key={day.toISOString()} className="bg-gray-900 p-2 text-center">
              <p className="text-xs text-gray-400 capitalize">
                {format(day, 'EEE', { locale: es })}
              </p>
              <p className="text-sm font-semibold text-white">
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Filas de horas */}
        <div className="bg-gray-800 rounded-b-xl overflow-hidden divide-y divide-gray-800">
          {HORAS.map((hora) => (
            <div key={hora} className="grid grid-cols-8 gap-px">
              {/* Hora */}
              <div className="bg-gray-900 p-2 text-right text-xs text-gray-500 pt-2.5">
                {String(hora).padStart(2, '0')}:00
              </div>

              {/* Celda por día */}
              {days.map((day) => {
                const items = getReservasForDayHour(day, hora)
                return (
                  <div
                    key={day.toISOString()}
                    className={`bg-gray-900 min-h-[44px] p-1 ${
                      items.length > 0 ? '' : ''
                    }`}
                  >
                    {items.map((r) => (
                      <div
                        key={r.id}
                        className={`text-xs rounded px-1 py-0.5 mb-0.5 truncate ${
                          r.estado === 'confirmada'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                        title={`${r.nombre_cliente} — Mesa ${r.mesas?.numero} (${r.hora_inicio}–${r.hora_fin})`}
                      >
                        M{r.mesas?.numero} {r.nombre_cliente.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
