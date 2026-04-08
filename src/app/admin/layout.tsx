import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Strike Pool" className="h-14 w-auto" />
            <p className="text-xs text-gray-400 hidden sm:block">Panel de administración</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 hidden sm:block">{user.email}</span>
            <a
              href="/api/auth/signout"
              className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition"
            >
              Cerrar sesión
            </a>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
