'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Mesa, Reserva } from '@/types'
import { ReservasList } from '@/components/admin/ReservasList'
import { WeeklyCalendar } from '@/components/admin/WeeklyCalendar'
import { BloqueoModal } from '@/components/admin/BloqueoModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  reservasHoy: Reserva[]
  reservasSemana: Reserva[]
  mesas: Mesa[]
  weekStart: string
  today: string
}

type Tab = 'hoy' | 'semana' | 'mesas'

export function AdminView({ reservasHoy, reservasSemana, mesas, weekStart, today }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('hoy')
  const [showBloqueo, setShowBloqueo] = useState(false)

  const todayFormatted = format(new Date(today + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })

  const pendientes  = reservasHoy.filter((r) => r.estado === 'pendiente').length
  const confirmadas = reservasHoy.filter((r) => r.estado === 'confirmada').length

  function handleRefresh() {
    router.refresh()
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Reservas hoy" value={reservasHoy.length} color="text-white" />
        <StatCard label="Pendientes" value={pendientes} color="text-amber-400" />
        <StatCard label="Confirmadas" value={confirmadas} color="text-emerald-400" />
        <StatCard label="Mesas libres" value={mesas.filter(m => m.estado === 'libre').length} color="text-blue-400" />
      </div>

      {/* Tabs + acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {(['hoy', 'semana', 'mesas'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                tab === t
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'hoy' ? 'Hoy' : t === 'semana' ? 'Semana' : 'Mesas'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowBloqueo(true)}
          className="px-4 py-2 rounded-xl bg-amber-600/20 border border-amber-600/30 text-amber-400 text-sm hover:bg-amber-600/30 transition"
        >
          + Bloquear horario
        </button>
      </div>

      {/* Tab: HOY */}
      {tab === 'hoy' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 capitalize">{todayFormatted}</h2>
          <ReservasList reservas={reservasHoy} onRefresh={handleRefresh} />
        </div>
      )}

      {/* Tab: SEMANA */}
      {tab === 'semana' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Calendario semanal</h2>
          <WeeklyCalendar
            reservas={reservasSemana}
            weekStart={new Date(weekStart)}
          />
        </div>
      )}

      {/* Tab: MESAS */}
      {tab === 'mesas' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Estado de las mesas</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {mesas.map((mesa) => (
              <MesaAdminCard key={mesa.id} mesa={mesa} onRefresh={handleRefresh} />
            ))}
          </div>
        </div>
      )}

      {/* Modal bloqueo */}
      {showBloqueo && (
        <BloqueoModal
          mesas={mesas}
          onClose={() => setShowBloqueo(false)}
          onCreated={handleRefresh}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function MesaAdminCard({ mesa, onRefresh }: { mesa: Mesa; onRefresh: () => void }) {
  const [isPending, startTransition] = useTransition()

  const estadoConfig = {
    libre:     { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Libre' },
    reservada: { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   label: 'Reservada' },
    ocupada:   { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     label: 'Ocupada' },
  }
  const cfg = estadoConfig[mesa.estado]

  function toggleOcupada() {
    startTransition(async () => {
      const nuevoEstado = mesa.estado === 'ocupada' ? 'libre' : 'ocupada'
      await fetch(`/api/mesas/${mesa.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      onRefresh()
    })
  }

  return (
    <button
      onClick={toggleOcupada}
      disabled={isPending || mesa.estado === 'reservada'}
      className={`rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition ${cfg.bg} ${cfg.border} hover:opacity-80 disabled:cursor-not-allowed`}
    >
      <span className="text-2xl font-bold text-white">{mesa.numero}</span>
      <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
      {mesa.estado !== 'reservada' && (
        <span className="text-[10px] text-gray-500">
          {isPending ? '...' : mesa.estado === 'ocupada' ? 'Marcar libre' : 'Marcar ocupada'}
        </span>
      )}
    </button>
  )
}
