'use client'

import { useState, useTransition } from 'react'
import type { Mesa, ReservaFormData } from '@/types'

interface Props {
  mesa: Mesa
  onSuccess: () => void
  onCancel: () => void
}

const HORAS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 9  // 09:00 — 23:00
  return `${String(h).padStart(2, '0')}:00`
})

export function ReservaForm({ mesa, onSuccess, onCancel }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ReservaFormData>({
    mesa_id: mesa.id,
    nombre_cliente: '',
    telefono: '',
    email: '',
    fecha: '',
    hora_inicio: '10:00',
    hora_fin: '11:00',
    notas: '',
  })

  const today = new Date().toISOString().split('T')[0]

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      // Auto-ajustar hora_fin si hora_inicio >= hora_fin
      if (name === 'hora_inicio') {
        const idxInicio = HORAS.indexOf(value)
        const idxFin    = HORAS.indexOf(next.hora_fin)
        if (idxFin <= idxInicio) {
          next.hora_fin = HORAS[Math.min(idxInicio + 1, HORAS.length - 1)]
        }
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.fecha) { setError('Selecciona una fecha.'); return }
    if (!form.nombre_cliente.trim()) { setError('Introduce tu nombre.'); return }
    if (!form.telefono.trim()) { setError('Introduce tu teléfono.'); return }

    startTransition(async () => {
      try {
        const res = await fetch('/api/reservas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Error al crear la reserva.'); return }
        onSuccess()
      } catch {
        setError('Error de conexión. Inténtalo de nuevo.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-3 text-center">
        <p className="text-sm text-gray-400">Reservando</p>
        <p className="text-xl font-bold text-white">Mesa {mesa.numero}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
          <input
            type="text"
            name="nombre_cliente"
            value={form.nombre_cliente}
            onChange={handleChange}
            placeholder="Tu nombre completo"
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Teléfono *</label>
          <input
            type="tel"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            placeholder="600 000 000"
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Email <span className="text-gray-600">(para confirmación)</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Fecha *</label>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            min={today}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Horas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Hora inicio *</label>
            <select
              name="hora_inicio"
              value={form.hora_inicio}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition"
            >
              {HORAS.slice(0, -1).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Hora fin *</label>
            <select
              name="hora_fin"
              value={form.hora_fin}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition"
            >
              {HORAS.filter((h) => h > form.hora_inicio).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Notas</label>
          <textarea
            name="notas"
            value={form.notas}
            onChange={handleChange}
            placeholder="Alguna petición especial..."
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
        >
          {isPending ? 'Reservando...' : 'Confirmar reserva'}
        </button>
      </div>
    </form>
  )
}
