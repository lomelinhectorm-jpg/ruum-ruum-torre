// lib/supabase.ts — admin-web
// UN SOLO cliente singleton — resuelve el warning de múltiples GoTrueClient
'use client'

import { createBrowserClient } from '@supabase/ssr'

// Singleton — se crea una sola vez y se reutiliza
let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

// Alias para compatibilidad con imports existentes
export const supabase = getSupabaseBrowserClient()
export const createClient = getSupabaseBrowserClient

export type EstatusViaje =
  | 'Solicitud recibida' | 'Pendiente de revisión' | 'Pendiente de asignación'
  | 'Conductor asignado' | 'Conductor en camino' | 'Recolección en proceso'
  | 'Evidencia inicial pendiente' | 'Traslado en curso' | 'Entrega en proceso'
  | 'Evidencia final pendiente' | 'Finalizado' | 'Cancelado' | 'En revisión por incidencia'