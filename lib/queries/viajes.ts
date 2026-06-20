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
      vehiculos(id, marca, modelo, placas, anio, color, vin, transmision, tipo_vehiculo, alias, observaciones),
      tipos_servicio(nombre)
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
      vehiculos(id, marca, modelo, anio, color, placas, vin, transmision, tipo_vehiculo, alias, observaciones),
      tipos_servicio(nombre),
      evidencias(*),
      incidencias(*),
      timeline_viaje(evento, actor, actor_tipo, created_at),
      notas_internas(autor_nombre, texto, created_at)
    `)
    .eq('id', id)
    .order('created_at', { ascending: true, foreignTable: 'timeline_viaje' })
    .order('created_at', { ascending: true, foreignTable: 'notas_internas' })
    .single()

  if (error) throw error
  return data
}

// ── CREAR ───────────────────────────────────────────────────

export async function createViaje(payload: {
  usuario_id?: string | null
  empresa_id?: string | null
  conductor_id?: string | null
  vehiculo_id?: string | null
  tipo_servicio_id?: string | null
  origen_calle: string | null
  origen_numero?: string | null
  origen_colonia?: string | null
  origen_estado?: string | null
  origen_cp?: string | null
  origen_contacto?: string | null
  origen_telefono?: string | null
  destino_calle: string | null
  destino_numero?: string | null
  destino_colonia?: string | null
  destino_estado?: string | null
  destino_cp?: string | null
  destino_contacto?: string | null
  destino_telefono?: string | null
  referencias?: string | null
  instrucciones?: string | null
  fecha_programada?: string | null
  hora_programada?: string | null
  tarifa_cliente?: number
  pago_conductor?: number
  gastos_autorizados?: number
  // No hay un default razonable aquí: el admin crea viajes que pueden
  // arrancar directo en "Pendiente de asignación" (o "Conductor asignado"
  // si ya eligió conductor), mientras que la solicitud de un usuario final
  // siempre arranca en "Solicitud recibida". Cada llamador decide.
  status: EstatusViaje
}, opts?: { evento?: string; actor?: string }) {
  const { data, error } = await supabase
    .from('viajes')
    .insert(payload)
    .select()
    .single()

  if (error) throw error

  // Registrar en timeline
  await supabase.from('timeline_viaje').insert({
    viaje_id: data.id,
    evento: opts?.evento ?? 'Solicitud creada',
    actor: opts?.actor ?? 'Admin',
    actor_tipo: 'admin',
  })

  return data
}

// ── ACTUALIZAR ──────────────────────────────────────────────

export async function updateViajeStatus(
  id: string,
  status: EstatusViaje,
  opts?: { actor?: string; evento?: string }
) {
  const { data, error } = await supabase
    .from('viajes')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Registrar en timeline. Si no se pasa un evento explícito, se usa el
  // texto genérico — pero la mayoría de los llamadores (finalizar,
  // cancelar) sí pasan su propio texto para que el historial sea legible.
  await supabase.from('timeline_viaje').insert({
    viaje_id: id,
    evento: opts?.evento ?? `Estatus cambiado a: ${status}`,
    actor: opts?.actor ?? 'Admin',
    actor_tipo: 'admin',
  })

  return data
}

export async function asignarConductor(
  viajeId: string,
  conductorId: string,
  opts: { statusActual: EstatusViaje; teniaConductorPrevio: boolean; actorNombre?: string }
) {
  // Solo se fuerza el estatus a "Conductor asignado" si el viaje todavía
  // no había avanzado operativamente. Si ya estaba en curso (reasignación
  // a mitad de viaje), se conserva el estatus actual para no retroceder
  // el progreso ya hecho.
  const estatusesTempranos: EstatusViaje[] = [
    'Solicitud recibida', 'Pendiente de revisión', 'Pendiente de asignación',
  ]
  const nuevoStatus: EstatusViaje = estatusesTempranos.includes(opts.statusActual)
    ? 'Conductor asignado'
    : opts.statusActual

  const { data, error } = await supabase
    .from('viajes')
    .update({ conductor_id: conductorId, status: nuevoStatus })
    .eq('id', viajeId)
    .select()
    .single()

  if (error) throw error

  await supabase.from('timeline_viaje').insert({
    viaje_id: viajeId,
    evento: opts.teniaConductorPrevio ? 'Conductor reasignado' : 'Conductor asignado',
    actor: opts.actorNombre ?? 'Admin',
    actor_tipo: 'admin',
  })

  return data
}

export async function actualizarFechaViaje(id: string, fecha: string, hora: string, actor = 'Admin') {
  const { data, error } = await supabase
    .from('viajes')
    .update({ fecha_programada: fecha, hora_programada: hora })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await supabase.from('timeline_viaje').insert({
    viaje_id: id,
    evento: 'Fecha y hora actualizadas',
    actor,
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