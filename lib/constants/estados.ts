export const CERTIFICACION_CONDUCTOR = [
  'Borrador',
  'Pendiente de documentos',
  'En revision',
  'Correccion requerida',
  'Certificado',
  'Suspendido',
  'Bloqueado',
] as const

export const DISPONIBILIDAD_CONDUCTOR = [
  'Disponible',
  'No disponible',
  'Ocupado',
  'Pausado por sistema',
] as const

export const ESTADOS_VIAJE = [
  'Solicitud recibida',
  'Pendiente de asignacion',
  'Oferta enviada',
  'Conductor asignado',
  'Aceptado',
  'En camino al origen',
  'En origen',
  'Inspeccion inicial',
  'Evidencia inicial pendiente',
  'Listo para traslado',
  'Traslado en curso',
  'En destino',
  'Inspeccion final',
  'Evidencia final pendiente',
  'Entrega pendiente',
  'Finalizado',
  'Cancelado',
  'En revision por incidencia',
] as const

export const OFERTA_STATUS = ['Enviada', 'Aceptada', 'Rechazada', 'Expirada', 'Cancelada'] as const
export const EVIDENCIA_STATUS = ['Pendiente', 'En captura', 'Completa', 'Rechazada', 'Complemento solicitado', 'Validada'] as const
export const INCIDENCIA_STATUS = ['Nueva', 'En revision', 'Requiere informacion', 'En atencion', 'Escalada', 'Resuelta', 'Cancelada'] as const
export const PAGO_STATUS = ['Por calcular', 'Calculado', 'En revision', 'Aprobado', 'Programado', 'Pagado', 'Retenido', 'Disputado', 'Ajustado', 'Cancelado'] as const

export type CertificacionConductor = typeof CERTIFICACION_CONDUCTOR[number]
export type DisponibilidadConductor = typeof DISPONIBILIDAD_CONDUCTOR[number]
export type EstatusViaje = typeof ESTADOS_VIAJE[number]
export type OfertaStatus = typeof OFERTA_STATUS[number]
export type EvidenciaStatus = typeof EVIDENCIA_STATUS[number]
export type IncidenciaStatus = typeof INCIDENCIA_STATUS[number]
export type PagoStatus = typeof PAGO_STATUS[number]

export const VIAJE_STATUS_COMPAT: Record<string, EstatusViaje> = {
  'Pendiente de asignación': 'Pendiente de asignacion',
  'Conductor en camino': 'En camino al origen',
  'Recolección en proceso': 'En origen',
  'Entrega en proceso': 'En destino',
  'En revisión por incidencia': 'En revision por incidencia',
}

export function normalizarEstatusViaje(status: string | null | undefined): EstatusViaje | null {
  if (!status) return null
  return (VIAJE_STATUS_COMPAT[status] ?? status) as EstatusViaje
}
