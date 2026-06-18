// lib/queries/dashboard.ts — KPIs reales para el Dashboard

import { supabase } from '@/lib/supabase'

export async function getKPIsDashboard() {
  const hoy = new Date().toISOString().split('T')[0]

  const [
    { count: viajesActivos },
    { count: finalizadosHoy },
    { count: programadosHoy },
    { count: pendientesAsignacion },
    { count: conductoresDisponibles },
    { count: conductoresEnViaje },
    { count: docsRevisión },
    { count: incidenciasAbiertas },
  ] = await Promise.all([
    supabase.from('viajes').select('*', { count: 'exact', head: true })
      .in('status', ['Conductor en camino','Recolección en proceso','Traslado en curso','Entrega en proceso']),
    supabase.from('viajes').select('*', { count: 'exact', head: true })
      .eq('status', 'Finalizado').gte('updated_at', `${hoy}T00:00:00`),
    supabase.from('viajes').select('*', { count: 'exact', head: true })
      .eq('fecha_programada', hoy),
    supabase.from('viajes').select('*', { count: 'exact', head: true })
      .eq('status', 'Pendiente de asignación'),
    supabase.from('conductores').select('*', { count: 'exact', head: true })
      .eq('disponibilidad', 'Disponible').eq('certificacion', 'Activo'),
    supabase.from('conductores').select('*', { count: 'exact', head: true })
      .eq('disponibilidad', 'En viaje'),
    supabase.from('documentos').select('*', { count: 'exact', head: true })
      .eq('estatus', 'En revisión'),
    supabase.from('incidencias').select('*', { count: 'exact', head: true })
      .in('estatus', ['Nueva','En revisión','En seguimiento','Escalada']),
  ])

  return {
    viajesActivos: viajesActivos ?? 0,
    finalizadosHoy: finalizadosHoy ?? 0,
    programadosHoy: programadosHoy ?? 0,
    pendientesAsignacion: pendientesAsignacion ?? 0,
    conductoresDisponibles: conductoresDisponibles ?? 0,
    conductoresEnViaje: conductoresEnViaje ?? 0,
    docsRevision: docsRevisión ?? 0,
    incidenciasAbiertas: incidenciasAbiertas ?? 0,
  }
}

export async function getViajesRecientes(limite = 5) {
  const { data, error } = await supabase
    .from('viajes')
    .select(`
      id, folio, status, fecha_programada, hora_programada,
      origen_calle, destino_calle, tarifa_cliente,
      conductores(nombre, apellido),
      usuarios(nombre, apellido)
    `)
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) throw error
  return data
}

export async function getAlertasOperativas() {
  const [sinConductor, evIncompleta, incidencias, docsVencidos] = await Promise.all([
    supabase.from('viajes').select('id, folio, hora_programada')
      .eq('status', 'Pendiente de asignación').limit(5),
    supabase.from('evidencias').select('id, viaje_id, estatus')
      .eq('estatus', 'Incompleta').limit(5),
    supabase.from('incidencias').select('id, tipo, estatus')
      .in('estatus', ['Nueva', 'Escalada']).limit(5),
    supabase.from('documentos').select('id, tipo_doc, entidad_tipo, entidad_id')
      .in('estatus', ['Vencido', 'Pendiente', 'En revisión', 'Suspendido']).limit(5),
  ])

  return {
    sinConductor: sinConductor.data ?? [],
    evIncompleta: evIncompleta.data ?? [],
    incidencias: incidencias.data ?? [],
    docsVencidos: docsVencidos.data ?? [],
  }
}
