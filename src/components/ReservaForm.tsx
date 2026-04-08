'use client'

import { useState, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Mesa } from '@/types'
import { getMesaTipo } from './MesaCard'

interface Props {
  mesa: Mesa
  onSuccess: () => void
  onCancel: () => void
}

interface SuccessData {
  id: string
  mesaNumero: number
  mesaTipo: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  nombre_cliente: string
  telefono: string
}

// 17:00 → 03:00 (cubre el horario real del local, incluyendo madrugada)
const HORAS = [
  '17:00', '18:00', '19:00', '20:00', '21:00',
  '22:00', '23:00', '00:00', '01:00', '02:00', '03:00',
]

// Convierte HH:MM a minutos normalizando las horas de madrugada (00-06 → +24h)
function toMinutes(h: string): number {
  const hh = parseInt(h.split(':')[0], 10)
  return (hh < 10 ? hh + 24 : hh) * 60
}

function buildWhatsAppUrl(data: SuccessData): string {
  const fechaTexto = format(parseISO(data.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
  const tipoLabel = data.mesaTipo === 'grande' ? 'Grande' : 'Pequeña'

  const mensaje =
    `Hola! Acabo de reservar en StrikePool 🎱\n` +
    `Mesa ${data.mesaNumero} (${tipoLabel})\n` +
    `📅 ${fechaTexto}\n` +
    `🕐 De ${data.hora_inicio} a ${data.hora_fin}\n` +
    `👤 ${data.nombre_cliente}\n` +
    `📞 ${data.telefono}\n` +
    `ID reserva: ${data.id}`

  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}

export function ReservaForm({ mesa, onSuccess, onCancel }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError]           = useState<string | null>(null)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  const tipo  = getMesaTipo(mesa.numero)
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    mesa_id:        mesa.id,
    nombre_cliente: '',
    telefono:       '',
    fecha:          '',
    hora_inicio:    '17:00',
    hora_fin:       '18:00',
    notas:          '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'hora_inicio') {
        if (toMinutes(next.hora_fin) <= toMinutes(value)) {
          const idx = HORAS.indexOf(value)
          next.hora_fin = HORAS[Math.min(idx + 1, HORAS.length - 1)]
        }
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.fecha)                 { setError('Selecciona una fecha.'); return }
    if (!form.nombre_cliente.trim()) { setError('Introduce tu nombre.'); return }
    if (!form.telefono.trim())       { setError('Introduce tu teléfono.'); return }

    startTransition(async () => {
      try {
        const res  = await fetch('/api/reservas', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Error al crear la reserva.'); return }

        const sd: SuccessData = {
          id:             data.id,
          mesaNumero:     data.mesas?.numero ?? mesa.numero,
          mesaTipo:       tipo,
          fecha:          data.fecha,
          hora_inicio:    data.hora_inicio,
          hora_fin:       data.hora_fin,
          nombre_cliente: data.nombre_cliente,
          telefono:       data.telefono,
        }
        setSuccessData(sd)

        // Abrir WhatsApp automáticamente
        const waUrl = buildWhatsAppUrl(sd)
        window.open(waUrl, '_blank', 'noopener,noreferrer')
      } catch {
        setError('Error de conexión. Inténtalo de nuevo.')
      }
    })
  }

  // ── Pantalla de éxito ───────────────────────────────────────
  if (successData) {
    const fechaTexto = format(parseISO(successData.fecha), "EEEE d 'de' MMMM", { locale: es })
    const tipoLabel  = successData.mesaTipo === 'grande' ? 'Grande' : 'Pequeña'

    return (
      <div className="text-center space-y-5">
        <div className="text-5xl">✅</div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">¡Reserva enviada!</h3>
          <p className="text-gray-400 text-sm">Se ha abierto WhatsApp con el resumen.</p>
        </div>

        {/* Resumen */}
        <div className="bg-gray-800 rounded-xl p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Mesa</span>
            <span className="text-white font-medium">
              {successData.mesaNumero} <span className="text-gray-500">({tipoLabel})</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fecha</span>
            <span className="text-white font-medium capitalize">{fechaTexto}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Hora</span>
            <span className="text-white font-medium">
              {successData.hora_inicio} – {successData.hora_fin}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Nombre</span>
            <span className="text-white font-medium">{successData.nombre_cliente}</span>
          </div>
          <div className="border-t border-gray-700 pt-2 flex justify-between">
            <span className="text-gray-500 text-xs">ID</span>
            <span className="text-gray-500 text-xs font-mono">{successData.id.slice(0, 8)}…</span>
          </div>
        </div>

        {/* Botón abrir WhatsApp (por si el popup fue bloqueado) */}
        <a
          href={buildWhatsAppUrl(successData)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold transition"
        >
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Abrir WhatsApp
        </a>

        <button
          onClick={onSuccess}
          className="w-full py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition text-sm"
        >
          Nueva reserva
        </button>
      </div>
    )
  }

  // ── Formulario ──────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cabecera mesa */}
      <div className="bg-gray-800 rounded-lg p-3 text-center">
        <p className="text-sm text-gray-400">Reservando</p>
        <p className="text-xl font-bold text-white">
          Mesa {mesa.numero}
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({tipo === 'grande' ? 'Grande' : 'Pequeña'})
          </span>
        </p>
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
              {HORAS.slice(0, -1).map(h => (
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
              {HORAS.filter(h => toMinutes(h) > toMinutes(form.hora_inicio)).map(h => (
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
