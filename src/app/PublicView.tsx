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
  const [mobileStep, setMobileStep]     = useState<1 | 2>(1)

  function handleMesaSelect(mesa: Mesa) {
    setSelectedMesa(mesa)
    setMobileStep(2)
  }

  function handleCancel() {
    setSelectedMesa(null)
    setMobileStep(1)
  }

  function handleSuccess() {
    setSelectedMesa(null)
    setMobileStep(1)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Strike Pool"
              className="h-16 w-auto"
            />
            <div className="hidden sm:block">
              <p className="text-xs text-gray-400">C/Arquímedes 239, Terrassa</p>
              <p className="text-xs text-gray-500">Billars · Bar · Cocteleria</p>
            </div>
          </div>

          {/* Indicador de paso en mobile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 md:hidden">
              <span className={`w-2 h-2 rounded-full transition-colors ${mobileStep === 1 ? 'bg-emerald-400' : 'bg-gray-600'}`} />
              <span className={`w-2 h-2 rounded-full transition-colors ${mobileStep === 2 ? 'bg-emerald-400' : 'bg-gray-600'}`} />
            </div>
            <a href="/admin" className="text-xs text-gray-500 hover:text-gray-300 transition">
              Administración →
            </a>
          </div>
        </div>
      </header>

      {/* Hero: foto del local */}
      <div className="relative h-40 sm:h-52 overflow-hidden">
        <img
          src="/bar.webp"
          alt="Strike Pool — sala de billar"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-950" />
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">

        {/* ── DESKTOP: dos columnas ─────────────────────────── */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {/* Grid de mesas */}
          <div className="md:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Reserva tu mesa</h2>
              <p className="text-gray-400">Selecciona una mesa disponible.</p>
            </div>
            <MesaGrid
              initialMesas={initialMesas}
              selectedMesa={selectedMesa}
              onSelect={handleMesaSelect}
            />
          </div>

          {/* Formulario / placeholder */}
          <div className="md:col-span-1">
            <div className="sticky top-24">
              {selectedMesa ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Datos de la reserva</h3>
                  <ReservaForm
                    mesa={selectedMesa}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">🎱</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Selecciona una mesa</h3>
                  <p className="text-gray-400 text-sm">
                    Haz clic en cualquier mesa verde para iniciar tu reserva.
                  </p>
                </div>
              )}
              <InfoHorarios />
            </div>
          </div>
        </div>

        {/* ── MOBILE: pasos secuenciales ────────────────────── */}
        <div className="md:hidden">

          {/* Paso 1 — seleccionar mesa */}
          {mobileStep === 1 && (
            <div>
              <div className="mb-5">
                <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">
                  Paso 1 de 2
                </p>
                <h2 className="text-xl font-bold text-white mb-1">Elige tu mesa</h2>
                <p className="text-gray-400 text-sm">Toca una mesa verde para reservarla.</p>
              </div>
              <MesaGrid
                initialMesas={initialMesas}
                selectedMesa={selectedMesa}
                onSelect={handleMesaSelect}
              />
              <InfoHorarios className="mt-6" />
            </div>
          )}

          {/* Paso 2 — formulario */}
          {mobileStep === 2 && selectedMesa && (
            <div>
              {/* Botón volver */}
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-5 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Cambiar mesa
              </button>

              <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">
                Paso 2 de 2
              </p>
              <h2 className="text-xl font-bold text-white mb-5">Tus datos</h2>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <ReservaForm
                  mesa={selectedMesa}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

function InfoHorarios({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-4 text-sm text-gray-400 mt-4 ${className}`}>
      <p className="font-medium text-gray-300 mb-2">Horario</p>
      <p>Lunes — Jueves: 17:00 – 00:00</p>
      <p>Viernes — Sábado: 17:00 – 03:00</p>
      <p>Domingo: 17:00 – 23:00</p>
      <p className="mt-2 text-xs text-gray-500">Reservas mínimo 1 hora.</p>
    </div>
  )
}
