'use client'

import { useState } from 'react'
import type { Mesa } from '@/types'
import { MesaGrid } from '@/components/MesaGrid'
import { ReservaForm } from '@/components/ReservaForm'

interface Props {
  initialMesas: Mesa[]
}

export function PublicView({ initialMesas }: Props) {
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSuccess() {
    setSuccess(true)
    setSelectedMesa(null)
    setTimeout(() => setSuccess(false), 6000)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎱</span>
            <div>
              <h1 className="text-xl font-bold text-white">StrikePool</h1>
              <p className="text-xs text-gray-400">Bar de Billar</p>
            </div>
          </div>
          <a
            href="/admin"
            className="text-xs text-gray-500 hover:text-gray-300 transition"
          >
            Administración →
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Banner de éxito */}
        {success && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-center">
            ¡Reserva creada con éxito! Recibirás una confirmación si proporcionaste tu email.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda — grid de mesas */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Reserva tu mesa</h2>
              <p className="text-gray-400">
                Selecciona una mesa disponible para hacer tu reserva.
              </p>
            </div>
            <MesaGrid
              initialMesas={initialMesas}
              selectedMesa={selectedMesa}
              onSelect={setSelectedMesa}
            />
          </div>

          {/* Columna derecha — formulario */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {selectedMesa ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Datos de la reserva</h3>
                  <ReservaForm
                    mesa={selectedMesa}
                    onSuccess={handleSuccess}
                    onCancel={() => setSelectedMesa(null)}
                  />
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">🎱</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Selecciona una mesa
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Haz clic en cualquier mesa verde para iniciar tu reserva.
                  </p>
                </div>
              )}

              {/* Info horarios */}
              <div className="mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-4 text-sm text-gray-400">
                <p className="font-medium text-gray-300 mb-2">Horario</p>
                <p>Lunes — Jueves: 10:00 – 00:00</p>
                <p>Viernes — Domingo: 10:00 – 02:00</p>
                <p className="mt-2 text-xs text-gray-500">Reservas mínimo 1 hora.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
