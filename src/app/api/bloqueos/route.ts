import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { BloqueoFormData } from '@/types'

// POST /api/bloqueos — crear bloqueo (admin)
export async function POST(request: Request) {
  const body: BloqueoFormData = await request.json()

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const { mesa_id, fecha, hora_inicio, hora_fin, motivo } = body

  if (!fecha || !hora_inicio || !hora_fin) {
    return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
  }

  if (hora_fin <= hora_inicio) {
    return NextResponse.json({ error: 'La hora de fin debe ser posterior a la de inicio.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('horarios_bloqueo')
    .insert({
      mesa_id: mesa_id || null,
      fecha,
      hora_inicio,
      hora_fin,
      motivo: motivo?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

// GET /api/bloqueos — listar bloqueos (admin)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fecha = searchParams.get('fecha')

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  let query = supabase
    .from('horarios_bloqueo')
    .select('*')
    .order('fecha')
    .order('hora_inicio')

  if (fecha) query = query.eq('fecha', fecha)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
