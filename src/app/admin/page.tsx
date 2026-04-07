import { createClient } from '@/lib/supabase/server'
import type { Mesa, Reserva } from '@/types'
import { AdminView } from './AdminView'
import { startOfWeek } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Reservas de hoy
  const { data: reservasHoy } = await supabase
    .from('reservas')
    .select('*, mesas(numero)')
    .eq('fecha', today)
    .order('hora_inicio')

  // Reservas de la semana (para el calendario)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd   = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const { data: reservasSemana } = await supabase
    .from('reservas')
    .select('*, mesas(numero)')
    .gte('fecha', weekStart.toISOString().split('T')[0])
    .lte('fecha', weekEnd.toISOString().split('T')[0])
    .neq('estado', 'cancelada')
    .order('hora_inicio')

  // Todas las mesas
  const { data: mesas } = await supabase
    .from('mesas')
    .select('*')
    .order('numero')

  return (
    <AdminView
      reservasHoy={(reservasHoy as Reserva[]) ?? []}
      reservasSemana={(reservasSemana as Reserva[]) ?? []}
      mesas={(mesas as Mesa[]) ?? []}
      weekStart={weekStart.toISOString()}
      today={today}
    />
  )
}
