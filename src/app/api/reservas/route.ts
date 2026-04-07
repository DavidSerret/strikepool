import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ReservaFormData } from '@/types'

// POST /api/reservas — crear nueva reserva
export async function POST(request: Request) {
  const body: ReservaFormData = await request.json()

  const { mesa_id, nombre_cliente, telefono, email, fecha, hora_inicio, hora_fin, notas } = body

  // Validaciones básicas
  if (!mesa_id || !nombre_cliente || !telefono || !fecha || !hora_inicio || !hora_fin) {
    return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
  }

  if (hora_fin <= hora_inicio) {
    return NextResponse.json({ error: 'La hora de fin debe ser posterior a la de inicio.' }, { status: 400 })
  }

  const supabase = await createClient()

  // Comprobar disponibilidad con la función SQL
  const { data: disponible, error: fnError } = await supabase.rpc('mesa_disponible', {
    p_mesa_id:     mesa_id,
    p_fecha:       fecha,
    p_hora_inicio: hora_inicio,
    p_hora_fin:    hora_fin,
  })

  if (fnError) {
    return NextResponse.json({ error: 'Error al comprobar disponibilidad.' }, { status: 500 })
  }

  if (!disponible) {
    return NextResponse.json(
      { error: 'La mesa no está disponible en ese horario. Elige otro tramo.' },
      { status: 409 }
    )
  }

  // Insertar reserva
  const { data: reserva, error: insertError } = await supabase
    .from('reservas')
    .insert({
      mesa_id,
      nombre_cliente: nombre_cliente.trim(),
      telefono: telefono.trim(),
      email: email?.trim() || null,
      fecha,
      hora_inicio,
      hora_fin,
      estado: 'pendiente',
      notas: notas?.trim() || null,
    })
    .select('*, mesas(numero)')
    .single()

  if (insertError) {
    return NextResponse.json({ error: 'Error al guardar la reserva.' }, { status: 500 })
  }

  // Enviar email de confirmación si tiene email
  if (reserva.email) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'confirmacion', reservaId: reserva.id }),
      })
    } catch {
      // No bloquear la respuesta si el email falla
    }
  }

  return NextResponse.json(reserva, { status: 201 })
}

// GET /api/reservas — listar (sólo admin, por fecha)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fecha = searchParams.get('fecha')

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  let query = supabase
    .from('reservas')
    .select('*, mesas(numero)')
    .order('fecha')
    .order('hora_inicio')

  if (fecha) query = query.eq('fecha', fecha)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
