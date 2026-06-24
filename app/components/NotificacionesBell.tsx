'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase'

interface Notificacion {
  id: string
  titulo: string
  cuerpo: string
  leida: boolean
  created_at: string
  viaje_id: string | null
}

// Notificaciones de admin son compartidas entre todo el staff (sin
// destinatario_id — ver docs/sql/notificaciones.sql): cualquier admin que
// las marque como leídas las marca para todos, como una bandeja
// compartida de alertas operativas (incidencias, cancelaciones, nuevas
// solicitudes).
export default function NotificacionesBell() {
  const [abierto, setAbierto] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const ref = useRef<HTMLDivElement>(null)

  // cargar() solo trae datos y los devuelve — el setState vive en el
  // .then() de quien la llama. Llamarla directo en el efecto y dejar que
  // ELLA haga el setState dispara react-hooks/set-state-in-effect en
  // proyectos con esa regla activa (no aquí, pero por consistencia con
  // usuario-ruum/conductor se deja igual en los 3).
  const cargar = useCallback(async (): Promise<Notificacion[]> => {
    const sb = getSupabaseBrowserClient()
    const { data } = await sb.from('notificaciones')
      .select('id,titulo,cuerpo,leida,created_at,viaje_id')
      .eq('destinatario_tipo', 'admin')
      .order('created_at', { ascending: false })
      .limit(30)
    return (data as Notificacion[]) ?? []
  }, [])

  useEffect(() => {
    let activo = true
    cargar().then(data => { if (activo) setNotificaciones(data) })
    const sb = getSupabaseBrowserClient()
    const channel = sb.channel('notificaciones-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: 'destinatario_tipo=eq.admin' }, () => {
        cargar().then(data => { if (activo) setNotificaciones(data) })
      })
      .subscribe()
    return () => { activo = false; void sb.removeChannel(channel) }
  }, [cargar])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const marcarLeida = async (id: string) => {
    const sb = getSupabaseBrowserClient()
    await sb.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  const marcarTodasLeidas = async () => {
    const sinLeer = notificaciones.filter(n => !n.leida)
    if (sinLeer.length === 0) return
    const sb = getSupabaseBrowserClient()
    await sb.from('notificaciones').update({ leida: true }).eq('destinatario_tipo', 'admin').in('id', sinLeer.map(n => n.id))
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }

  const noLeidas = notificaciones.filter(n => !n.leida).length

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAbierto(a => !a)} className="relative p-2 text-rr-steel hover:text-rr-asphalt transition-colors">
        <BellIcon className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>
      {abierto && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white">
            <p className="text-sm font-semibold text-slate-800">Notificaciones</p>
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas} className="text-xs text-rr-trace hover:underline">Marcar todas como leídas</button>
            )}
          </div>
          {notificaciones.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs italic">Sin notificaciones.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notificaciones.map(n => (
                <li key={n.id} onClick={() => !n.leida && marcarLeida(n.id)}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-slate-50 transition-colors ${!n.leida ? 'bg-[#E8EFFF]/40' : ''}`}>
                  <p className="font-medium text-slate-800">{n.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.cuerpo}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('es-MX')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
