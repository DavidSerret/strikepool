import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/reservas/[id] — actualizar estado (admin)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body: { estado: string } = await request.json()

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const estadosValidos = ['pendiente', 'confirmada', 'cancelada']
  if (!estadosValidos.includes(body.estado)) {
    return NextResponse.json({ error: 'Estado no válido.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reservas')
    .update({ estado: body.estado })
    .eq('id', id)
    .select('*, mesas(numero)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si se confirma y tiene email, enviar confirmación
  if (body.estado === 'confirmada' && data.email) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'confirmacion', reservaId: id }),
      })
    } catch { /* silencioso */ }
  }

  return NextResponse.json(data)
}

// DELETE /api/reservas/[id] — eliminar reserva (admin)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const { error } = await supabase.from('reservas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
