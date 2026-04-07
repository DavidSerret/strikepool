import { createClient } from '@/lib/supabase/server'
import type { Mesa } from '@/types'
import { PublicView } from './PublicView'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: mesas } = await supabase
    .from('mesas')
    .select('*')
    .order('numero')

  return <PublicView initialMesas={(mesas as Mesa[]) ?? []} />
}
