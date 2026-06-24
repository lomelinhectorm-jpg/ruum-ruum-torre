// lib/supabase.ts — admin-web
// Singleton con cookies para que el middleware y el browser client
// compartan la misma sesión en Next.js 16 + @supabase/ssr
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton — una sola instancia en todo el browser
let _client: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

// Alias para compatibilidad con todos los imports existentes
export const supabase = getSupabaseBrowserClient()
export const createClient = getSupabaseBrowserClient

// ─── TIPOS COMPARTIDOS ────────────────────────────────────────────────────────
export type EstatusViaje =
  | 'Solicitud recibida' | 'Pendiente de asignación'
  | 'Conductor asignado' | 'Conductor en camino' | 'Recolección en proceso'
  | 'Evidencia inicial pendiente' | 'Traslado en curso' | 'Entrega en proceso'
  | 'Evidencia final pendiente' | 'Finalizado' | 'Cancelado' | 'En revisión por incidencia'

export type DisponibilidadConductor =
  | 'Disponible' | 'No disponible' | 'En viaje' | 'Pausado'

export interface Viaje {
  id: string; folio: string | null; usuario_id: string | null
  empresa_id: string | null; conductor_id: string | null; vehiculo_id: string | null
  origen_calle: string | null; origen_numero: string | null; origen_colonia: string | null
  origen_estado: string | null; origen_cp: string | null
  origen_contacto: string | null; origen_telefono: string | null
  destino_calle: string | null; destino_numero: string | null; destino_colonia: string | null
  destino_estado: string | null; destino_cp: string | null
  destino_contacto: string | null; destino_telefono: string | null
  referencias: string | null; instrucciones: string | null
  fecha_programada: string | null; hora_programada: string | null
  status: EstatusViaje; tarifa_cliente: number; pago_conductor: number
  gastos_autorizados: number; ajustes: number
  observaciones_conductor: string | null; revision_admin: string | null
  // Descubiertas al recuperar el cuerpo de cancelar_viaje_usuario — no
  // estaban en este tipo aunque sí existen en la tabla real.
  cancelacion_penalizacion: number | null; cancelado_por: string | null; cancelado_at: string | null
  created_at: string; updated_at: string
}

export interface Conductor {
  id: string; auth_id: string | null; nombre: string; apellido: string
  email: string; telefono: string; municipio: string | null; estado_geo: string | null
  disponibilidad: DisponibilidadConductor; certificacion: string
  calificacion: number; viajes_realizados: number; ganancias_total: number
  cuenta_banco: string | null; cuenta_clabe: string | null; cuenta_titular: string | null
  created_at: string
}

export interface Usuario {
  id: string; auth_id: string | null; empresa_id: string | null
  nombre: string; apellido: string; email: string; telefono: string | null
  tipo: string; estatus: string; viajes_solicitados: number; created_at: string
}
