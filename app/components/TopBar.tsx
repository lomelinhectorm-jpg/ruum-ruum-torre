'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bars3Icon, BellIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase'

interface TopBarProps {
  title: string
  onMenuClick: () => void
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  const router = useRouter()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  const cerrarSesion = async () => {
    if (cerrandoSesion) return
    setCerrandoSesion(true)
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-[#EAE7DD] h-16 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden text-rr-steel hover:text-rr-asphalt"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <h2 className="font-display text-xl font-bold text-rr-asphalt">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-rr-steel hover:text-rr-trace transition-colors">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rr-route rounded-full"></span>
        </button>
        <button
          onClick={cerrarSesion}
          disabled={cerrandoSesion}
          className="bg-rr-asphalt hover:bg-rr-asphalt3 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          {cerrandoSesion ? 'Cerrando...' : 'Cerrar Sesión'}
        </button>
      </div>
    </header>
  )
}
