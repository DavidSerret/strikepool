import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/mesas/[id] — actualizar estado de mesa (admin)
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

  const estadosValidos = ['libre', 'ocupada', 'reservada']
  if (!estadosValidos.includes(body.estado)) {
    return NextResponse.json({ error: 'Estado no válido.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('mesas')
    .update({ estado: body.estado })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
