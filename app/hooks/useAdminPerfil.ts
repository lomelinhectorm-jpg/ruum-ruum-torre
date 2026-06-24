// app/hooks/useAdminPerfil.ts
'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { MODULOS_SISTEMA, ROLES_ACCESO_TOTAL, normalizarRol } from '@/lib/modulosSistema'

export interface AdminPerfil {
  cargando: boolean
  /** false mientras carga o si no hay sesión de Supabase Auth activa. */
  autenticado: boolean
  nombre: string
  apellido: string
  rolNombre: string
  permisos: string[]
  /** true para roles en ROLES_ACCESO_TOTAL (ven todo, sin filtrar por permisos). */
  esAccesoTotal: boolean
  /** ids de vista (los mismos que usan Sidebar/page.tsx) que este usuario puede ver. */
  vistasPermitidas: string[]
  tienePermiso: (vistaId: string) => boolean
}

const SIN_ACCESO: Omit<AdminPerfil, 'cargando' | 'autenticado' | 'tienePermiso'> = {
  nombre: '', apellido: '', rolNombre: '', permisos: [], esAccesoTotal: false, vistasPermitidas: [],
}

export function useAdminPerfil(): AdminPerfil {
  const [cargando, setCargando] = useState(true)
  const [autenticado, setAutenticado] = useState(false)
  const [estado, setEstado] = useState(SIN_ACCESO)

  useEffect(() => {
    let vigente = true
    const cargar = async () => {
      const sb = getSupabaseBrowserClient()
      const { data: authData } = await sb.auth.getUser()
      const authId = authData.user?.id ?? null

      if (!authId) {
        if (vigente) { setAutenticado(false); setEstado(SIN_ACCESO); setCargando(false) }
        return
      }
      if (vigente) setAutenticado(true)

      const { data: interno } = await sb
        .from('usuarios_internos')
        .select('nombre, apellido, activo, roles(nombre, permisos, activo)')
        .eq('auth_id', authId)
        .maybeSingle()

      if (!vigente) return

      const rol = (interno?.roles ?? null) as { nombre?: string; permisos?: string[]; activo?: boolean } | null
      // Usuario interno y rol deben estar activos — mismo criterio que public.is_admin().
      const activo = Boolean(interno?.activo) && (rol?.activo ?? true)

      if (!activo || !interno) {
        setEstado(SIN_ACCESO)
        setCargando(false)
        return
      }

      const permisos = Array.isArray(rol?.permisos) ? (rol!.permisos as string[]) : []
      const esAccesoTotal = ROLES_ACCESO_TOTAL.includes(normalizarRol(rol?.nombre))
      const vistasPermitidas = esAccesoTotal
        ? MODULOS_SISTEMA.map(m => m.id)
        : MODULOS_SISTEMA.filter(m => permisos.includes(m.label)).map(m => m.id)

      setEstado({
        nombre: String(interno.nombre ?? ''),
        apellido: String(interno.apellido ?? ''),
        rolNombre: String(rol?.nombre ?? ''),
        permisos,
        esAccesoTotal,
        vistasPermitidas,
      })
      setCargando(false)
    }
    cargar()
    return () => { vigente = false }
  }, [])

  return {
    cargando,
    autenticado,
    ...estado,
    tienePermiso: (vistaId: string) => estado.esAccesoTotal || estado.vistasPermitidas.includes(vistaId),
  }
}
