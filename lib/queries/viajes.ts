// lib/queries/viajes.ts — admin-web
// Reemplaza todos los arrays TRIPS hardcodeados

import { supabase } from '@/lib/supabase'
import type { EstatusViaje } from '@/lib/supabase'

// ── LEER ────────────────────────────────────────────────────

export async function getViajes(filtros?: {
  status?: EstatusViaje
  conductor_id?: string
  usuario_id?: string
}) {
  let query = supabase
    .from('viajes')
    .select(`
      *,
      conductores(id, nombre, apellido, telefono),
      usuarios(id, nombre, apellido, email, telefono),
      empresas(id, nombre_comercial),
      vehiculos(id, marca, modelo, placas, transmision)
    `)
    .order('created_at', { ascending: false })

  if (filtros?.status) query = query.eq('status', filtros.status)
  if (filtros?.conductor_id) query = query.eq('conductor_id', filtros.conductor_id)
  if (filtros?.usuario_id) query = query.eq('usuario_id', filtros.usuario_id)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getViaje(id: string) {
  const { data, error } = await supabase
    .from('viajes')
    .select(`
      *,
      conductores(id, nombre, apellido, telefono, calificacion, certificacion),
      usuarios(id, nombre, apellido, email, telefono),
      empresas(id, nombre_comercial, rfc),
      vehiculos(id, marca, modelo, anio, color, placas, vin, transmision, observaciones),
      evidencias(*),
      incidencias(*),
      timeline_viaje(evento, actor, actor_tipo, created_at),
      notas_internas(autor_nombre, texto, created_at)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ── CREAR ───────────────────────────────────────────────────

export async function createViaje(payload: {
  usuario_id?: string
  empresa_id?: string
  vehiculo_id?: string
  origen_calle: string
  origen_numero?: string
  origen_colonia?: string
  origen_estado?: string
  origen_cp?: string
  origen_contacto?: string
  origen_telefono?: string
  destino_calle: string
  destino_numero?: string
  destino_colonia?: string
  destino_estado?: string
  destino_cp?: string
  destino_contacto?: string
  destino_telefono?: string
  referencias?: string
  instrucciones?: string
  fecha_programada?: string
  hora_programada?: string
  tarifa_cliente?: number
  pago_conductor?: number
  gastos_autorizados?: number
}) {
  const { data, error } = await supabase
    .from('viajes')
    .insert({ ...payload, status: 'Solicitud recibida' })
    .select()
    .single()

  if (error) throw error

  // Registrar en timeline
  await supabase.from('timeline_viaje').insert({
    viaje_id: data.id,
    evento: 'Solicitud creada',
    actor: 'Admin',
    actor_tipo: 'admin',
  })

  return data
}

// ── ACTUALIZAR ──────────────────────────────────────────────

export async function updateViajeStatus(id: string, status: EstatusViaje, actor = 'Admin') {
  const { data, error } = await supabase
    .from('viajes')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Registrar en timeline
  await supabase.from('timeline_viaje').insert({
    viaje_id: id,
    evento: `Estatus cambiado a: ${status}`,
    actor,
    actor_tipo: 'admin',
  })

  return data
}

export async function asignarConductor(viajeId: string, conductorId: string) {
  const { data, error } = await supabase
    .from('viajes')
    .update({ conductor_id: conductorId, status: 'Conductor asignado' })
    .eq('id', viajeId)
    .select()
    .single()

  if (error) throw error

  await supabase.from('timeline_viaje').insert({
    viaje_id: viajeId,
    evento: 'Conductor asignado',
    actor: 'Admin',
    actor_tipo: 'admin',
  })

  return data
}

// ── NOTAS ───────────────────────────────────────────────────

export async function agregarNota(viajeId: string, texto: string, autorNombre = 'Admin') {
  const { data, error } = await supabase
    .from('notas_internas')
    .insert({
      entidad_id: viajeId,
      entidad_tipo: 'viaje',
      autor_nombre: autorNombre,
      texto,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ── REALTIME ────────────────────────────────────────────────

export function suscribirViajes(callback: (payload: any) => void) {
  return supabase
    .channel('viajes-cambios')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'viajes' }, callback)
    .subscribe()
}

export function suscribirViaje(viajeId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`viaje-${viajeId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'viajes', filter: `id=eq.${viajeId}` },
      callback
    )
    .subscribe()
}
