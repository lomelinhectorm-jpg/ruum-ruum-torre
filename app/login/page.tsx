// app/login/page.tsx
'use client'

import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Correo o contraseña incorrectos')
        setLoading(false)
        return
      }

      if (data.session) {
        // Reload completo para que el middleware lea las cookies de sesión
        window.location.href = '/'
      }

    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#151515' }}>
      <div className="w-full max-w-sm">

        {/* Logo brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ backgroundColor: '#FFC400' }}>
            <span className="font-black text-2xl" style={{ color: '#151515', fontFamily: 'Space Grotesk, sans-serif' }}>
              RR
            </span>
          </div>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Ruum Ruum Torre de Control
          </h1>
          <p className="text-sm mt-1" style={{ color: '#5F6368' }}>
            by MoviliaX · Torre de Control
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}
          className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#5F6368' }}>
              Correo electrónico
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@ruumruum.com" required autoComplete="email"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#FFC400' } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#5F6368' }}>
              Contraseña
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#FFC400', color: '#151515', fontFamily: 'Space Grotesk, sans-serif' }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Verificando...
              </span>
            ) : 'Ingresar al panel'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: '#5F6368' }}>
          Acceso restringido · Solo equipo MoviliaX
        </p>
      </div>
    </div>
  )
}