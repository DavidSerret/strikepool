'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Mesa, Reserva, ReservaEstado } from '@/types'
import { getMesaTipo } from '@/components/MesaCard'
import { WeeklyCalendar } from '@/components/admin/WeeklyCalendar'
import { BloqueoModal } from '@/components/admin/BloqueoModal'

type Tab = 'dia' | 'semana'
type FiltroEstado = 'todas' | ReservaEstado

interface Props {
  reservasHoy: Reserva[]
  reservasSemana: Reserva[]
  mesas: Mesa[]
  weekStart: string
  today: string
}

// ── Colores de estado ──────────────────────────────────────────
const mesaEstadoConfig = {
  libre:    { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Libre' },
  reservada:{ bg: 'bg-amber-500/10',   border: 'border-amber-500/40',   dot: 'bg-amber-400',   text: 'text-amber-400',   label: 'Reservada' },
  ocupada:  { bg: 'bg-red-500/10',     border: 'border-red-500/40',     dot: 'bg-red-400',     text: 'text-red-400',     label: 'Ocupada' },
}

const reservaBadge: Record<ReservaEstado, string> = {
  pendiente:  'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  confirmada: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  cancelada:  'bg-gray-500/20 text-gray-400 border border-gray-500/30',
}

// ── Componente principal ────────────────────────────────────────
export function AdminView({ reservasHoy, reservasSemana, mesas, weekStart, today }: Props) {
  const router = useRouter()
  const [tab, setTab]                   = useState<Tab>('dia')
  const [selectedDate, setSelectedDate] = useState(today)
  const [reservas, setReservas]         = useState<Reserva[]>(reservasHoy)
  const [isLoading, setIsLoading]       = useState(false)
  const [filtro, setFiltro]             = useState<FiltroEstado>('todas')
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null)
  const [showBloqueoModal, setShowBloqueoModal] = useState(false)
  const [bloqueoMesaId, setBloqueoMesaId]       = useState<string | null>(null)
  const [actionId, setActionId]         = useState<string | null>(null)
  const [isPending, startTransition]    = useTransition()

  const dateLabel = format(
    parseISO(selectedDate + 'T00:00:00'),
    "EEEE d 'de' MMMM 'de' yyyy",
    { locale: es }
  )

  // Cargar reservas desde la API cuando cambia la fecha
  const fetchReservas = useCallback(async (fecha: string) => {
    setIsLoading(true)
    try {
      const res  = await fetch(`/api/reservas?fecha=${fecha}`)
      const data = await res.json()
      setReservas(Array.isArray(data) ? data : [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDate !== today) {
      fetchReservas(selectedDate)
    }
  }, [selectedDate, today, fetchReservas])

  function handleRefresh() {
    fetchReservas(selectedDate)
    router.refresh()
  }

  async function updateEstado(id: string, estado: ReservaEstado) {
    setActionId(id)
    startTransition(async () => {
      await fetch(`/api/reservas/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ estado }),
      })
      await fetchReservas(selectedDate)
      setActionId(null)
    })
  }

  const reservasFiltradas = filtro === 'todas'
    ? reservas
    : reservas.filter(r => r.estado === filtro)

  const stats = {
    total:      reservas.length,
    pendientes: reservas.filter(r => r.estado === 'pendiente').length,
    confirmadas:reservas.filter(r => r.estado === 'confirmada').length,
    canceladas: reservas.filter(r => r.estado === 'cancelada').length,
  }

  return (
    <div>
      {/* ── Selector de fecha + stats ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 shrink-0">Fecha:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setFiltro('todas') }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
          />
          {isLoading && (
            <span className="text-xs text-gray-500 animate-pulse">Cargando…</span>
          )}
        </div>
        <p className="text-sm text-gray-400 capitalize hidden sm:block">{dateLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total reservas" value={stats.total}      color="text-white" />
        <StatCard label="Pendientes"     value={stats.pendientes} color="text-amber-400" />
        <StatCard label="Confirmadas"    value={stats.confirmadas}color="text-emerald-400" />
        <StatCard label="Canceladas"     value={stats.canceladas} color="text-gray-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
        {(['dia', 'semana'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === t ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'dia' ? 'Día' : 'Semana'}
          </button>
        ))}
      </div>

      {/* ── Tab DÍA ──────────────────────────────────────────────── */}
      {tab === 'dia' && (
        <div className="space-y-10">

          {/* Sección 1: cuadrícula de mesas */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Mesas</h2>
              <button
                onClick={() => { setBloqueoMesaId(null); setShowBloqueoModal(true) }}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-600/30 text-amber-400 hover:bg-amber-600/30 transition"
              >
                + Bloquear horario
              </button>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-400">
              {Object.entries(mesaEstadoConfig).map(([key, cfg]) => (
                <span key={key} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              ))}
              <span className="ml-auto text-gray-500 italic text-[11px]">
                Haz clic en una mesa para ver sus reservas
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {mesas.map(mesa => (
                <MesaAdminCard
                  key={mesa.id}
                  mesa={mesa}
                  reservaCount={reservas.filter(r => r.mesa_id === mesa.id).length}
                  selected={selectedMesa?.id === mesa.id}
                  onClick={() => setSelectedMesa(prev => prev?.id === mesa.id ? null : mesa)}
                />
              ))}
            </div>
          </section>

          {/* Sección 2: lista de reservas */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white">
                Reservas del día
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({reservasFiltradas.length})
                </span>
              </h2>
              {/* Filtros */}
              <div className="flex gap-1.5 flex-wrap">
                {(
                  [
                    { key: 'todas',      label: 'Todas',       count: stats.total },
                    { key: 'pendiente',  label: 'Pendientes',  count: stats.pendientes },
                    { key: 'confirmada', label: 'Confirmadas', count: stats.confirmadas },
                    { key: 'cancelada',  label: 'Canceladas',  count: stats.canceladas },
                  ] as { key: FiltroEstado; label: string; count: number }[]
                ).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFiltro(f.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      filtro === f.key
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                    }`}
                  >
                    {f.label} <span className="opacity-60">({f.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {reservasFiltradas.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
                {isLoading ? 'Cargando reservas…' : 'No hay reservas para este filtro.'}
              </div>
            ) : (
              <>
                {/* Desktop: tabla */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 bg-gray-900 border-b border-gray-800">
                        <th className="px-4 py-3 font-medium">Mesa</th>
                        <th className="px-4 py-3 font-medium">Cliente</th>
                        <th className="px-4 py-3 font-medium">Teléfono</th>
                        <th className="px-4 py-3 font-medium">Horario</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                        <th className="px-4 py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 bg-gray-900">
                      {reservasFiltradas.map(r => {
                        const tipo = getMesaTipo(r.mesas?.numero ?? 0)
                        const loading = isPending && actionId === r.id
                        return (
                          <tr key={r.id} className="hover:bg-gray-800/40 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-white text-sm">
                                  {r.mesas?.numero ?? '?'}
                                </span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  tipo === 'grande'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-gray-700 text-gray-400'
                                }`}>
                                  {tipo === 'grande' ? 'Grande' : 'Pequeña'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-white font-medium">{r.nombre_cliente}</p>
                              {r.notas && (
                                <p className="text-xs text-gray-500 italic truncate max-w-[180px]">"{r.notas}"</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{r.telefono}</td>
                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap font-mono text-xs">
                              {r.hora_inicio} – {r.hora_fin}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${reservaBadge[r.estado]}`}>
                                {r.estado}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {r.estado === 'pendiente' && (
                                  <button
                                    onClick={() => updateEstado(r.id, 'confirmada')}
                                    disabled={loading}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                                  >
                                    {loading ? '…' : 'Confirmar'}
                                  </button>
                                )}
                                {r.estado !== 'cancelada' && (
                                  <button
                                    onClick={() => updateEstado(r.id, 'cancelada')}
                                    disabled={loading}
                                    className="text-xs px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                                  >
                                    {loading ? '…' : 'Cancelar'}
                                  </button>
                                )}
                                <a
                                  href={`tel:${r.telefono}`}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
                                  title={`Llamar a ${r.nombre_cliente}`}
                                >
                                  📞
                                </a>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: tarjetas */}
                <div className="md:hidden space-y-3">
                  {reservasFiltradas.map(r => {
                    const loading = isPending && actionId === r.id
                    return (
                      <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-white shrink-0">
                              {r.mesas?.numero ?? '?'}
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{r.nombre_cliente}</p>
                              <p className="text-xs text-gray-400 font-mono">{r.hora_inicio} – {r.hora_fin}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${reservaBadge[r.estado]}`}>
                            {r.estado}
                          </span>
                        </div>
                        {r.notas && (
                          <p className="text-xs text-gray-500 italic mt-2">"{r.notas}"</p>
                        )}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {r.estado === 'pendiente' && (
                            <button
                              onClick={() => updateEstado(r.id, 'confirmada')}
                              disabled={loading}
                              className="flex-1 text-xs py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                            >
                              {loading ? '…' : 'Confirmar'}
                            </button>
                          )}
                          {r.estado !== 'cancelada' && (
                            <button
                              onClick={() => updateEstado(r.id, 'cancelada')}
                              disabled={loading}
                              className="flex-1 text-xs py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                            >
                              {loading ? '…' : 'Cancelar'}
                            </button>
                          )}
                          <a
                            href={`tel:${r.telefono}`}
                            className="text-xs py-2 px-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition"
                          >
                            📞 {r.telefono}
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* ── Tab SEMANA ────────────────────────────────────────────── */}
      {tab === 'semana' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Calendario semanal</h2>
          <WeeklyCalendar
            reservas={reservasSemana}
            weekStart={new Date(weekStart)}
          />
        </div>
      )}

      {/* ── Panel de mesa (overlay lateral) ─────────────────────── */}
      {selectedMesa && tab === 'dia' && (
        <MesaDetailPanel
          mesa={selectedMesa}
          reservas={reservas.filter(r => r.mesa_id === selectedMesa.id)}
          selectedDate={selectedDate}
          isPending={isPending}
          actionId={actionId}
          onClose={() => setSelectedMesa(null)}
          onUpdateEstado={updateEstado}
          onBloquear={() => {
            setBloqueoMesaId(selectedMesa.id)
            setShowBloqueoModal(true)
            setSelectedMesa(null)
          }}
        />
      )}

      {/* ── Modal de bloqueo ─────────────────────────────────────── */}
      {showBloqueoModal && (
        <BloqueoModal
          mesas={mesas}
          preselectedMesaId={bloqueoMesaId}
          onClose={() => setShowBloqueoModal(false)}
          onCreated={handleRefresh}
        />
      )}
    </div>
  )
}

// ── StatCard ────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

// ── MesaAdminCard ───────────────────────────────────────────────
function MesaAdminCard({
  mesa,
  reservaCount,
  selected,
  onClick,
}: {
  mesa: Mesa
  reservaCount: number
  selected: boolean
  onClick: () => void
}) {
  const cfg    = mesaEstadoConfig[mesa.estado]
  const tipo   = getMesaTipo(mesa.numero)
  const grande = tipo === 'grande'

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200
        ${grande ? 'p-4 min-h-[110px]' : 'p-3 min-h-[90px]'}
        ${cfg.bg} ${cfg.border}
        hover:scale-105 hover:shadow-lg hover:shadow-black/30
        ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-105' : ''}
      `}
    >
      {/* Badge tipo */}
      <span className={`
        absolute top-1.5 left-1.5 text-[9px] font-medium uppercase tracking-wide rounded px-1 py-0.5
        ${grande ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/30 text-gray-400'}
      `}>
        {grande ? 'Grande' : 'Pequeña'}
      </span>

      {/* Número */}
      <span className={`font-bold text-white ${grande ? 'text-3xl' : 'text-2xl'}`}>
        {mesa.numero}
      </span>

      {/* Estado */}
      <div className={`flex items-center gap-1 mt-1 ${cfg.text}`}>
        <span className={`rounded-full ${cfg.dot} w-1.5 h-1.5`} />
        <span className="text-[10px] font-medium">{cfg.label}</span>
      </div>

      {/* Reservas del día */}
      {reservaCount > 0 && (
        <span className="absolute top-1.5 right-1.5 bg-white/10 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
          {reservaCount}
        </span>
      )}

      {/* Indicador seleccionada */}
      {selected && (
        <div className="absolute -top-2 -right-2 bg-white text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          ✓
        </div>
      )}
    </button>
  )
}

// ── MesaDetailPanel ─────────────────────────────────────────────
function MesaDetailPanel({
  mesa,
  reservas,
  selectedDate,
  isPending,
  actionId,
  onClose,
  onUpdateEstado,
  onBloquear,
}: {
  mesa: Mesa
  reservas: Reserva[]
  selectedDate: string
  isPending: boolean
  actionId: string | null
  onClose: () => void
  onUpdateEstado: (id: string, estado: ReservaEstado) => void
  onBloquear: () => void
}) {
  const tipo    = getMesaTipo(mesa.numero)
  const grande  = tipo === 'grande'
  const cfg     = mesaEstadoConfig[mesa.estado]
  const fechaLegible = format(parseISO(selectedDate + 'T00:00:00'), "d 'de' MMMM", { locale: es })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-gray-900 border-l border-gray-800 z-50 overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded ${
                grande ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-700 text-gray-400'
              }`}>
                {grande ? 'Grande' : 'Pequeña'}
              </span>
              <span className={`flex items-center gap-1 text-xs ${cfg.text}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white">Mesa {mesa.numero}</h3>
            <p className="text-sm text-gray-400 mt-0.5">Reservas del {fechaLegible}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition text-xl mt-1"
          >
            ✕
          </button>
        </div>

        {/* Reservas */}
        <div className="flex-1 p-5 space-y-3 overflow-y-auto">
          {reservas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">📅</p>
              <p className="text-sm">Sin reservas este día.</p>
            </div>
          ) : (
            reservas
              .slice()
              .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
              .map(r => {
                const loading = isPending && actionId === r.id
                return (
                  <div key={r.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">{r.nombre_cliente}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${reservaBadge[r.estado]}`}>
                        {r.estado}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1 mb-3">
                      <p>🕐 {r.hora_inicio} – {r.hora_fin}</p>
                      <p>📞 {r.telefono}</p>
                      {r.notas && <p className="italic">💬 {r.notas}</p>}
                    </div>
                    <div className="flex gap-2">
                      {r.estado === 'pendiente' && (
                        <button
                          onClick={() => onUpdateEstado(r.id, 'confirmada')}
                          disabled={loading}
                          className="flex-1 text-xs py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                        >
                          {loading ? '…' : 'Confirmar'}
                        </button>
                      )}
                      {r.estado !== 'cancelada' && (
                        <button
                          onClick={() => onUpdateEstado(r.id, 'cancelada')}
                          disabled={loading}
                          className="flex-1 text-xs py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                        >
                          {loading ? '…' : 'Cancelar'}
                        </button>
                      )}
                      <a
                        href={`tel:${r.telefono}`}
                        className="text-xs py-1.5 px-3 rounded-lg border border-gray-600 text-gray-400 hover:text-white transition"
                      >
                        📞
                      </a>
                    </div>
                  </div>
                )
              })
          )}
        </div>

        {/* Footer: bloquear */}
        <div className="p-5 border-t border-gray-800 shrink-0">
          <button
            onClick={onBloquear}
            className="w-full py-2.5 rounded-xl bg-amber-600/20 border border-amber-600/30 text-amber-400 hover:bg-amber-600/30 transition text-sm font-medium"
          >
            🔒 Bloquear franja horaria
          </button>
        </div>
      </div>
    </>
  )
}
