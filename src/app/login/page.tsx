'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Credenciales incorrectas.')
        return
      }
      router.push('/admin')
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Strike Pool" className="h-28 w-auto mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Panel de administración</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
          >
            {isPending ? 'Accediendo...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center mt-4">
          <a href="/" className="text-gray-500 text-sm hover:text-gray-300 transition">
            ← Volver a reservas
          </a>
        </p>
      </div>
    </div>
  )
}
