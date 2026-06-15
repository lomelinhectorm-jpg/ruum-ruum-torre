// lib/queries/conductores.ts — admin-web

import { supabase } from '@/lib/supabase'

export async function getConductores(filtros?: {
  certificacion?: string
  disponibilidad?: string
}) {
  let query = supabase
    .from('conductores')
    .select('*')
    .order('nombre')

  if (filtros?.certificacion) query = query.eq('certificacion', filtros.certificacion)
  if (filtros?.disponibilidad) query = query.eq('disponibilidad', filtros.disponibilidad)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getConductoresDisponibles() {
  const { data, error } = await supabase
    .from('conductores')
    .select('id, nombre, apellido, calificacion, disponibilidad')
    .eq('disponibilidad', 'Disponible')
    .eq('certificacion', 'Activo')
    .order('calificacion', { ascending: false })

  if (error) throw error
  return data
}

export async function updateDisponibilidad(
  conductorId: string,
  disponibilidad: 'Disponible' | 'No disponible' | 'En viaje' | 'Pausado'
) {
  const { data, error } = await supabase
    .from('conductores')
    .update({ disponibilidad })
    .eq('id', conductorId)
    .select()
    .single()

  if (error) throw error
  return data
}
