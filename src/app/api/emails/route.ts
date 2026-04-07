import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendConfirmacionReserva, sendRecordatorioReserva } from '@/lib/email'
import type { Reserva, Mesa } from '@/types'

// POST /api/emails — enviar email de confirmación o recordatorio
export async function POST(request: Request) {
  const body: { type: 'confirmacion' | 'recordatorio'; reservaId: string } = await request.json()

  if (!body.type || !body.reservaId) {
    return NextResponse.json({ error: 'Faltan parámetros.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: reserva, error } = await supabase
    .from('reservas')
    .select('*, mesas(numero)')
    .eq('id', body.reservaId)
    .single()

  if (error || !reserva) {
    return NextResponse.json({ error: 'Reserva no encontrada.' }, { status: 404 })
  }

  if (!reserva.email) {
    return NextResponse.json({ message: 'Sin email, no se envía nada.' })
  }

  try {
    if (body.type === 'confirmacion') {
      await sendConfirmacionReserva(reserva as Reserva & { mesas: { numero: number } })
    } else {
      await sendRecordatorioReserva(reserva as Reserva & { mesas: { numero: number } })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error enviando email:', err)
    return NextResponse.json({ error: 'Error al enviar el email.' }, { status: 500 })
  }
}
