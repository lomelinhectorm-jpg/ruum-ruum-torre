'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { getViajes, getViaje, createViaje, updateViajeStatus, asignarConductor, actualizarFechaViaje, agregarNota } from '@/lib/queries/viajes'
import { getConductores } from '@/lib/queries/conductores'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  UserPlusIcon,
  ArrowsRightLeftIcon,
  CalendarDaysIcon,
  CameraIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TabId = 'todos' | 'pendientes' | 'programados' | 'en-curso' | 'finalizados' | 'cancelados' | 'revision'

type StatusKey =
  | 'Solicitud recibida'
  | 'Pendiente de asignación'
  | 'Conductor asignado'
  | 'Conductor en camino'
  | 'Recolección en proceso'
  | 'Evidencia inicial pendiente'
  | 'Traslado en curso'
  | 'Entrega en proceso'
  | 'Evidencia final pendiente'
  | 'Finalizado'
  | 'Cancelado'
  | 'En revisión por incidencia'

interface DireccionDetalle {
  calle: string
  numero: string
  colonia: string
  estado: string
  cp: string
  contacto: string
  telefono: string
}

interface Trip {
  id: string
  dbId: string
  usuario: string
  empresa: string
  vehiculo: { marca: string; modelo: string; anio: string; color: string; placas: string; vin: string; transmision: string; observaciones: string }
  origen: string
  origenDetalle: DireccionDetalle
  origenContacto: string
  destino: string
  destinoDetalle: DireccionDetalle
  destinoContacto: string
  referencias: string
  instrucciones: string
  fecha: string
  hora: string
  conductor: string | null
  conductorId: string | null
  status: StatusKey
  tarifaCliente: number
  pagoConductor: number
  gastosExtra: number
  gastosAutorizados: number
  ajustes: number
  evidencia: 'Completa' | 'Incompleta' | 'Pendiente'
  incidencias: number
  tipoServicio: string
  tipoVehiculo: string
  vehiculoAlias: string
  usuarioId: string | null
  empresaId: string | null
  vehiculoId: string | null
  timeline: { evento: string; hora: string; actor: string }[]
  notas: { autor: string; texto: string; hora: string }[]
  observacionesConductor: string
  revisionAdmin: string
}

const tabStatusMap: Record<TabId, StatusKey[]> = {
  todos: [],
  pendientes: ['Solicitud recibida', 'Pendiente de asignación'],
  programados: ['Conductor asignado'],
  'en-curso': ['Conductor en camino', 'Recolección en proceso', 'Evidencia inicial pendiente', 'Traslado en curso', 'Entrega en proceso', 'Evidencia final pendiente'],
  finalizados: ['Finalizado'],
  cancelados: ['Cancelado'],
  revision: ['En revisión por incidencia'],
}

const statusStyle: Record<string, string> = {
  'Solicitud recibida': 'bg-slate-100 text-slate-600',
  'Pendiente de asignación': 'bg-amber-100 text-amber-700',
  'Conductor asignado': 'bg-[#E8EFFF] text-rr-traceDeep',
  'Conductor en camino': 'bg-[#E8EFFF] text-rr-traceDeep',
  'Recolección en proceso': 'bg-indigo-100 text-indigo-700',
  'Evidencia inicial pendiente': 'bg-orange-100 text-orange-700',
  'Traslado en curso': 'bg-purple-100 text-purple-700',
  'Entrega en proceso': 'bg-violet-100 text-violet-700',
  'Evidencia final pendiente': 'bg-orange-100 text-orange-700',
  Finalizado: 'bg-green-100 text-green-700',
  Cancelado: 'bg-red-100 text-red-600',
  'En revisión por incidencia': 'bg-rose-100 text-rose-700',
}

const evidenciaStyle: Record<string, string> = {
  Completa: 'bg-green-50 text-green-700',
  Incompleta: 'bg-amber-50 text-amber-700',
  Pendiente: 'bg-slate-100 text-slate-500',
}

const TERMINAL_STATUSES: StatusKey[] = ['Finalizado', 'Cancelado']
const REASSIGNABLE_STATUSES: StatusKey[] = [
  'Conductor en camino', 'Recolección en proceso', 'Evidencia inicial pendiente',
  'Traslado en curso', 'Entrega en proceso', 'Evidencia final pendiente',
]

// ─── ACTION TYPES ─────────────────────────────────────────────────────────────
type ActionId =
  | 'detalle' | 'asignar-conductor' | 'editar-fecha' | 'incidencia'
  | 'finalizar' | 'nota' | 'cancelar'

// ─── MODAL COMPONENTS ─────────────────────────────────────────────────────────
function ActionMenu({ trip, onClose, onAction }: { trip: Trip; onClose: () => void; onAction: (a: ActionId) => void }) {
  const terminal = TERMINAL_STATUSES.includes(trip.status)
  const puedeCambiarConductor = !trip.conductorId || trip.status === 'Conductor asignado' || REASSIGNABLE_STATUSES.includes(trip.status)
  const actions: { id: ActionId; icon: typeof EyeIcon; label: string; color: string; hidden?: boolean }[] = [
    { id: 'detalle', icon: EyeIcon, label: 'Ver detalle completo', color: 'blue' },
    { id: 'asignar-conductor', icon: UserPlusIcon, label: 'Asignar conductor', color: 'indigo', hidden: terminal || !!trip.conductorId },
    { id: 'asignar-conductor', icon: ArrowsRightLeftIcon, label: 'Cambiar conductor', color: 'indigo', hidden: terminal || !trip.conductorId || !puedeCambiarConductor },
    { id: 'editar-fecha', icon: CalendarDaysIcon, label: 'Editar fecha y hora', color: 'slate', hidden: terminal },
    { id: 'incidencia', icon: ExclamationTriangleIcon, label: 'Registrar incidencia', color: 'amber', hidden: terminal },
    { id: 'finalizar', icon: CheckCircleIcon, label: 'Marcar como finalizado', color: 'green', hidden: terminal },
    { id: 'nota', icon: DocumentTextIcon, label: 'Agregar nota interna', color: 'slate', hidden: terminal },
    { id: 'cancelar', icon: XCircleIcon, label: 'Cancelar viaje', color: 'red', hidden: terminal },
  ]
  const colorCls: Record<string, string> = {
    blue: 'text-rr-trace hover:bg-[#E8EFFF]', indigo: 'text-indigo-600 hover:bg-indigo-50',
    slate: 'text-slate-600 hover:bg-slate-50', purple: 'text-purple-600 hover:bg-purple-50',
    amber: 'text-amber-600 hover:bg-amber-50', green: 'text-green-600 hover:bg-green-50',
    red: 'text-red-600 hover:bg-red-50',
  }
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-4 w-72" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <p className="font-semibold text-slate-800">Acciones · {trip.id}</p>
          <button onClick={onClose}><XMarkIcon className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="space-y-0.5">
          {actions.filter(a => !a.hidden).map((a, i) => {
            const Icon = a.icon
            return (
              <button key={i} onClick={() => onAction(a.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${colorCls[a.color]}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {a.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── ASIGNAR / CAMBIAR CONDUCTOR ───────────────────────────────────────────────
function AsignarConductorModal({ trip, onClose, onSaved }: { trip: Trip; onClose: () => void; onSaved: () => void }) {
  const [conductores, setConductores] = useState<{ id: string; nombre: string; apellido: string; disponibilidad: string }[]>([])
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState(trip.conductorId ?? '')
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [motivo, setMotivo] = useState('')
  const esReasignacion = !!trip.conductorId && REASSIGNABLE_STATUSES.includes(trip.status)
  const conductoresOrdenados = [...conductores].sort((a, b) => {
    const prioridadA = a.disponibilidad === 'Disponible' ? 0 : 1
    const prioridadB = b.disponibilidad === 'Disponible' ? 0 : 1
    if (prioridadA !== prioridadB) return prioridadA - prioridadB
    return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`, 'es')
  })
  const conductorSeleccionado = conductores.find(c => c.id === seleccionado)
  const disponibilidadAdvertida = conductorSeleccionado && ['No disponible', 'En viaje'].includes(conductorSeleccionado.disponibilidad)
    ? conductorSeleccionado.disponibilidad
    : null

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await getConductores()
        setConductores(data as { id: string; nombre: string; apellido: string; disponibilidad: string }[])
      } catch (e) {
        console.error('Error cargando conductores:', e)
      }
      setCargando(false)
    }
    cargar()
  }, [])

  const guardar = async () => {
    if (!seleccionado) { setErrorMsg('Selecciona un conductor'); return }
    if (seleccionado === trip.conductorId) { setErrorMsg('Selecciona un conductor diferente'); return }
    if (esReasignacion && !motivo.trim()) { setErrorMsg('Indica el motivo de la reasignación'); return }
    setGuardando(true)
    setErrorMsg('')
    try {
      const conductor = conductores.find(c => c.id === seleccionado)
      await asignarConductor(trip.dbId, seleccionado, {
        statusActual: trip.status,
        teniaConductorPrevio: !!trip.conductorId,
        actorNombre: conductor ? `${conductor.nombre} ${conductor.apellido}` : 'Admin',
        motivo: esReasignacion ? motivo.trim() : undefined,
      })

      onSaved()
      onClose()
    } catch (e) {
      console.error('Error asignando conductor:', e)
      setErrorMsg('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">{trip.conductorId ? 'Cambiar conductor' : 'Asignar conductor'} · {trip.id}</h2>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <select value={seleccionado} onChange={e => setSeleccionado(e.target.value)} disabled={cargando}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rr-route bg-white">
            <option value="">{cargando ? 'Cargando...' : 'Seleccionar conductor...'}</option>
            {conductoresOrdenados.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} {c.apellido} · {c.disponibilidad}</option>
            ))}
          </select>
          {disponibilidadAdvertida && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
              <p>
                Este conductor está <strong>{disponibilidadAdvertida.toLowerCase()}</strong>.
                Puedes continuar si existe una razón operativa.
              </p>
            </div>
          )}
          {esReasignacion && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Motivo de la reasignación</label>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
                placeholder="Ej. incapacidad médica del conductor original"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rr-route resize-none" />
              <p className="text-xs text-slate-400 mt-1">La evidencia y los pagos existentes conservarán al conductor original.</p>
            </div>
          )}
          {!cargando && conductores.length === 0 && (
            <p className="text-xs text-amber-500">No hay conductores capturados.</p>
          )}
          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100">Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="bg-rr-route hover:bg-rr-routeDark disabled:opacity-60 text-rr-asphalt px-4 py-2 rounded-lg text-sm font-medium">
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EDITAR FECHA Y HORA ───────────────────────────────────────────────────────
function EditarFechaModal({ trip, onClose, onSaved }: { trip: Trip; onClose: () => void; onSaved: () => void }) {
  const [fecha, setFecha] = useState(trip.fecha !== '—' ? trip.fecha : '')
  const [hora, setHora] = useState(trip.hora !== '—' ? trip.hora : '')
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const guardar = async () => {
    if (!fecha || !hora) { setErrorMsg('Fecha y hora son requeridas'); return }
    setGuardando(true)
    setErrorMsg('')
    try {
      await actualizarFechaViaje(trip.dbId, fecha, hora)
      onSaved()
      onClose()
    } catch (e) {
      console.error('Error editando fecha:', e)
      setErrorMsg('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Editar fecha y hora · {trip.id}</h2>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rr-route" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Hora</label>
            <input type="time" value={hora} onChange={e => setHora(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rr-route" />
          </div>
          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100">Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="bg-rr-route hover:bg-rr-routeDark disabled:opacity-60 text-rr-asphalt px-4 py-2 rounded-lg text-sm font-medium">
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── REGISTRAR INCIDENCIA ──────────────────────────────────────────────────────
const TIPOS_INCIDENCIA = [
  'Daños reportados', 'Retraso', 'Falta de evidencia', 'Contacto no disponible',
  'Problema con documentación', 'Problema con pago', 'Cancelación',
  'Diferencia de kilometraje', 'Diferencia de combustible',
  'Problema con conductor', 'Problema con usuario', 'Otro',
]
const PRIORIDADES_INCIDENCIA = ['Baja', 'Media', 'Alta']

function IncidenciaModal({ trip, onClose, onSaved }: { trip: Trip; onClose: () => void; onSaved: () => void }) {
  const [tipo, setTipo] = useState('')
  const [prioridad, setPrioridad] = useState('Media')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const guardar = async () => {
    if (!tipo) { setErrorMsg('Selecciona un tipo de incidencia'); return }
    if (!descripcion.trim()) { setErrorMsg('Describe la incidencia'); return }
    setGuardando(true)
    setErrorMsg('')
    try {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from('incidencias').insert({
        viaje_id: trip.dbId,
        conductor_id: trip.conductorId,
        tipo,
        descripcion: descripcion.trim(),
        prioridad,
        estatus: 'Nueva',
      })
      if (error) throw error

      await sb.from('viajes').update({ status: 'En revisión por incidencia' }).eq('id', trip.dbId)
      await sb.from('timeline_viaje').insert({
        viaje_id: trip.dbId,
        evento: 'Incidencia registrada',
        actor: 'Admin',
        actor_tipo: 'admin',
      })

      onSaved()
      onClose()
    } catch (e) {
      console.error('Error registrando incidencia:', e)
      setErrorMsg('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Registrar incidencia · {trip.id}</h2>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="">Seleccionar...</option>
              {TIPOS_INCIDENCIA.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Prioridad</label>
            <div className="flex gap-2">
              {PRIORIDADES_INCIDENCIA.map(p => (
                <button key={p} type="button" onClick={() => setPrioridad(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${prioridad === p ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3}
              placeholder="Describe lo ocurrido..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100">Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {guardando ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AGREGAR NOTA INTERNA (desde menú de acciones, fuera del detalle) ─────────
function NotaModal({ trip, onClose, onSaved }: { trip: Trip; onClose: () => void; onSaved: () => void }) {
  const [texto, setTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const guardar = async () => {
    if (!texto.trim()) { setErrorMsg('Escribe una nota'); return }
    setGuardando(true)
    setErrorMsg('')
    try {
      await agregarNota(trip.dbId, texto.trim())
      onSaved()
      onClose()
    } catch (e) {
      console.error('Error agregando nota:', e)
      setErrorMsg('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Nota interna · {trip.id}</h2>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={4}
            placeholder="Escribe una nota visible solo para el equipo de operaciones..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100">Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {guardando ? 'Guardando...' : 'Guardar nota'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CONFIRMACIÓN (finalizar / cancelar) ───────────────────────────────────────
function ConfirmModal({
  title, message, confirmLabel, color, onClose, onConfirm,
}: {
  title: string; message: string; confirmLabel: string; color: 'green' | 'red'
  onClose: () => void; onConfirm: () => Promise<void>
}) {
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleConfirm = async () => {
    setGuardando(true)
    setErrorMsg('')
    try {
      await onConfirm()
    } catch (e) {
      console.error('Error en confirmación:', e)
      setErrorMsg('No se pudo completar la acción. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  const colorCls = color === 'green'
    ? 'bg-green-600 hover:bg-green-700'
    : 'bg-red-600 hover:bg-red-700'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-5 space-y-3">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">{message}</p>
          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} disabled={guardando} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100">No</button>
          <button onClick={handleConfirm} disabled={guardando}
            className={`${colorCls} disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium`}>
            {guardando ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function TripDetail({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState(trip.notas)
  const [timeline, setTimeline] = useState(trip.timeline)
  const [cargandoExtras, setCargandoExtras] = useState(true)
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [errorNota, setErrorNota] = useState('')

  useEffect(() => {
    const cargarExtras = async () => {
      try {
        const data = await getViaje(trip.dbId) as { notas_internas?: Record<string, unknown>[]; timeline_viaje?: Record<string, unknown>[] }
        if (data.notas_internas) {
          setNotes(data.notas_internas.map((n) => ({
            autor: String(n.autor_nombre ?? 'Admin'),
            texto: String(n.texto ?? ''),
            hora: n.created_at ? new Date(String(n.created_at)).toLocaleString('es-MX') : '—',
          })))
        }
        if (data.timeline_viaje) {
          setTimeline(data.timeline_viaje.map((t) => ({
            evento: String(t.evento ?? ''),
            actor: String(t.actor ?? ''),
            hora: t.created_at ? new Date(String(t.created_at)).toLocaleString('es-MX') : '—',
          })))
        }
      } catch (e) {
        console.error('Error cargando detalle del viaje:', e)
      }
      setCargandoExtras(false)
    }
    cargarExtras()
  }, [trip.dbId])

  const addNote = async () => {
    if (!newNote.trim()) return
    setGuardandoNota(true)
    setErrorNota('')
    try {
      const texto = newNote.trim()
      const creada = await agregarNota(trip.dbId, texto) as { autor_nombre?: string; created_at?: string }
      const hora = creada.created_at ? new Date(creada.created_at).toLocaleString('es-MX') : 'Ahora'
      setNotes([...notes, { autor: creada.autor_nombre ?? 'Admin', texto, hora }])
      setNewNote('')
    } catch (e) {
      console.error('Error agregando nota:', e)
      setErrorNota('No se pudo guardar la nota. Intenta de nuevo.')
    } finally {
      setGuardandoNota(false)
    }
  }

  const margen = trip.tarifaCliente - trip.pagoConductor - trip.gastosAutorizados + trip.ajustes

  const TIMELINE_ALL = [
    'Solicitud creada', 'Viaje revisado', 'Conductor asignado', 'Conductor aceptó',
    'Llegada al origen', 'Evidencia inicial cargada', 'Traslado iniciado',
    'Incidencias reportadas', 'Llegada a destino', 'Evidencia final cargada',
    'Entrega confirmada', 'Viaje cerrado',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
              <ChevronLeftIcon className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">{trip.id}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[trip.status]}`}>{trip.status}</span>
            </div>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* 1. Resumen */}
          <Section title="1. Resumen del Viaje" icon="🗂️">
            <Grid2>
              <Field label="ID Interno" value={trip.id} />
              <Field label="Estatus" value={<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[trip.status]}`}>{trip.status}</span>} />
              <Field label="Tipo de servicio" value={trip.tipoServicio} />
              <Field label="Fecha y hora" value={`${trip.fecha} · ${trip.hora}`} />
              <Field label="Tipo de cliente" value={trip.empresaId ? 'Empresa' : trip.usuarioId ? 'Usuario particular' : '—'} />
              <Field label="Usuario solicitante" value={trip.usuario} />
              <Field label="Empresa" value={trip.empresa} />
              <Field label="Conductor asignado" value={trip.conductor ?? <span className="text-red-500 italic">Sin asignar</span>} />
              <Field label="ID Supabase viaje" value={<span className="font-mono text-xs">{trip.dbId}</span>} />
            </Grid2>
          </Section>

          {/* 2. Vehículo */}
          <Section title="2. Vehículo" icon="🚗">
            <Grid2>
              <Field label="Marca / Modelo" value={`${trip.vehiculo.marca} ${trip.vehiculo.modelo}`} />
              <Field label="Año" value={trip.vehiculo.anio} />
              <Field label="Color" value={trip.vehiculo.color} />
              <Field label="Placas" value={trip.vehiculo.placas} />
              <Field label="VIN" value={<span className="font-mono text-xs">{trip.vehiculo.vin}</span>} />
              <Field label="Transmisión" value={trip.vehiculo.transmision} />
              <Field label="Tipo de vehículo" value={trip.tipoVehiculo} />
              <Field label="Alias / apodo" value={trip.vehiculoAlias || '—'} />
              <Field label="ID Supabase vehículo" value={<span className="font-mono text-xs">{trip.vehiculoId ?? '—'}</span>} />
            </Grid2>
            {trip.vehiculo.observaciones && <Field label="Observaciones" value={trip.vehiculo.observaciones} />}
          </Section>

          {/* 3. Ruta */}
          <Section title="3. Ruta" icon="📍">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Origen</p>
                <Grid2>
                  <Field label="Calle" value={trip.origenDetalle.calle} />
                  <Field label="Número" value={trip.origenDetalle.numero} />
                  <Field label="Colonia" value={trip.origenDetalle.colonia} />
                  <Field label="CP" value={trip.origenDetalle.cp} />
                  <Field label="Municipio / Estado" value={trip.origenDetalle.estado} />
                </Grid2>
                <Field label="Contacto" value={trip.origenDetalle.contacto} />
                <Field label="Teléfono de contacto" value={trip.origenDetalle.telefono} />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Destino</p>
                <Grid2>
                  <Field label="Calle" value={trip.destinoDetalle.calle} />
                  <Field label="Número" value={trip.destinoDetalle.numero} />
                  <Field label="Colonia" value={trip.destinoDetalle.colonia} />
                  <Field label="CP" value={trip.destinoDetalle.cp} />
                  <Field label="Municipio / Estado" value={trip.destinoDetalle.estado} />
                </Grid2>
                <Field label="Contacto" value={trip.destinoDetalle.contacto} />
                <Field label="Teléfono de contacto" value={trip.destinoDetalle.telefono} />
              </div>
            </div>
            <Field label="Referencias" value={trip.referencias || '—'} />
            <Field label="Instrucciones especiales" value={trip.instrucciones || '—'} />
          </Section>

          {/* 4. Evidencia */}
          <Section title="4. Evidencia" icon="📷">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Evidencia inicial', 'Evidencia final'].map((label, i) => (
                <div key={i} className={`border-2 border-dashed rounded-xl p-6 text-center ${trip.evidencia === 'Completa' ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                  <CameraIcon className={`w-8 h-8 mx-auto mb-2 ${trip.evidencia === 'Completa' ? 'text-green-400' : 'text-slate-300'}`} />
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <p className={`text-xs mt-1 ${trip.evidencia === 'Completa' ? 'text-green-600 font-semibold' : 'text-slate-400'}`}>
                    {trip.evidencia === 'Completa' ? '✓ Cargada' : 'No disponible'}
                  </p>
                </div>
              ))}
            </div>
            <Field label="Observaciones del conductor" value={trip.observacionesConductor || '—'} />
            <Field label="Revisión administrativa" value={trip.revisionAdmin || '—'} />
          </Section>

          {/* 5. Pagos */}
          <Section title="5. Pagos" icon="💰">
            <Grid2>
              <Field label="Tarifa cobrada al cliente" value={<span className="font-bold text-slate-800">${trip.tarifaCliente.toLocaleString()} MXN</span>} />
              <Field label="Pago asignado al conductor" value={`$${trip.pagoConductor.toLocaleString()} MXN`} />
              <Field label="Gastos reportados" value={`$${trip.gastosExtra.toLocaleString()} MXN`} />
              <Field label="Gastos autorizados" value={`$${trip.gastosAutorizados.toLocaleString()} MXN`} />
              <Field label="Ajustes" value={<span className={trip.ajustes < 0 ? 'text-red-600' : 'text-green-600'}>{trip.ajustes >= 0 ? '+' : ''}${trip.ajustes.toLocaleString()} MXN</span>} />
              <Field label="Margen estimado" value={<span className={`font-bold ${margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>${margen.toLocaleString()} MXN</span>} />
            </Grid2>
            <Field label="Estatus financiero" value={
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trip.status === 'Finalizado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {trip.status === 'Finalizado' ? 'Cerrado' : 'Pendiente de cierre'}
              </span>
            } />
          </Section>

          {/* 6. Línea del tiempo */}
          <Section title="6. Línea del Tiempo" icon="⏱️">
            <ol className="relative border-l-2 border-slate-200 space-y-4 ml-3">
              {TIMELINE_ALL.map((evento, i) => {
                const real = timeline.find(t =>
                  t.evento.toLowerCase().includes(evento.toLowerCase().split(' ')[0]) ||
                  evento.toLowerCase().includes(t.evento.toLowerCase().split(' ')[0])
                )
                const isIncidencia = evento === 'Incidencias reportadas'
                if (isIncidencia && trip.incidencias === 0 && !real) return null
                return (
                  <li key={i} className="ml-5">
                    <span className={`absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full ${real ? 'bg-rr-trace' : 'bg-slate-200'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </span>
                    <p className={`text-sm font-semibold ${real ? 'text-slate-800' : 'text-slate-300'}`}>{evento}</p>
                    {real ? (
                      <p className="text-xs text-slate-400">{real.hora} · {real.actor}</p>
                    ) : (
                      <p className="text-xs text-slate-300">Pendiente</p>
                    )}
                  </li>
                )
              })}
            </ol>
          </Section>

          {/* 7. Notas internas */}
          <Section title="7. Notas Internas" icon="📝">
            <p className="text-xs text-slate-400 mb-3 italic">Visibles únicamente para el equipo de operaciones.</p>
            <div className="space-y-2 mb-4">
              {cargandoExtras && <p className="text-sm text-slate-400 italic">Cargando notas...</p>}
              {!cargandoExtras && notes.length === 0 && <p className="text-sm text-slate-400 italic">Sin notas aún.</p>}
              {notes.map((n, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700">{n.autor} · {n.hora}</p>
                  <p className="text-sm text-slate-700 mt-0.5">{n.texto}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Agregar nota interna..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                disabled={guardandoNota}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-50"
              />
              <button onClick={addNote} disabled={guardandoNota}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-3 py-2 rounded-lg transition-colors">
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
            {errorNota && <p className="text-xs text-red-500 mt-1.5">{errorNota}</p>}
          </Section>
        </div>
      </div>
    </div>
  )
}

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
        <span>{icon}</span>{title}
      </h3>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">{children}</div>
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <div className="text-sm text-slate-700 mt-0.5">{value}</div>
    </div>
  )
}

// ─── NUEVO VIAJE FORM ─────────────────────────────────────────────────────────
const TRANSMISIONES = ['Automática', 'Manual', 'CVT', 'Secuencial']
const TIPOS_USUARIO = ['Personal','Empresarial','Agencia','Lote','Flotilla','Arrendadora','Taller','Aseguradora','Entrega al cliente']
type TipoEmpresa =
  | 'Aseguradora'
  | 'Agencia'
  | 'Lote'
  | 'Flotilla'
  | 'Arrendadora'
  | 'Taller'
  | 'Empresa general'

const TIPOS_EMPRESA: TipoEmpresa[] = [
  'Aseguradora', 'Agencia', 'Lote', 'Flotilla', 'Arrendadora', 'Taller', 'Empresa general',
]

const tipoEmpresaIcon: Record<TipoEmpresa, string> = {
  Aseguradora: '🛡️',
  Agencia: '🏢',
  Lote: '🚗',
  Flotilla: '🚛',
  Arrendadora: '📋',
  Taller: '🔧',
  'Empresa general': '🏭',
}

const REGIMENES_FISCAL = [
  { clave: '601', desc: '601 - General de Ley Personas Morales' },
  { clave: '603', desc: '603 - Personas Morales con Fines no Lucrativos' },
  { clave: '605', desc: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { clave: '606', desc: '606 - Arrendamiento' },
  { clave: '607', desc: '607 - Régimen de Enajenación o Adquisición de Bienes' },
  { clave: '608', desc: '608 - Demás Ingresos' },
  { clave: '610', desc: '610 - Residentes en el Extranjero sin Establecimiento Permanente en México' },
  { clave: '611', desc: '611 - Ingresos por Dividendos (socios y accionistas)' },
  { clave: '612', desc: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
  { clave: '614', desc: '614 - Ingresos por intereses' },
  { clave: '615', desc: '615 - Régimen de los ingresos por obtención de premios' },
  { clave: '616', desc: '616 - Sin obligaciones fiscales' },
  { clave: '620', desc: '620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
  { clave: '621', desc: '621 - Incorporación Fiscal' },
  { clave: '622', desc: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { clave: '623', desc: '623 - Opcional para Grupos de Sociedades' },
  { clave: '624', desc: '624 - Coordinados' },
  { clave: '625', desc: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { clave: '626', desc: '626 - Régimen Simplificado de Confianza' },
]

const USOS_CFDI = [
  { clave: 'G01', desc: 'G01 - Adquisición de mercancias' },
  { clave: 'G02', desc: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { clave: 'G03', desc: 'G03 - Gastos en general' },
  { clave: 'I01', desc: 'I01 - Construcciones' },
  { clave: 'I02', desc: 'I02 - Mobilario y equipo de oficina por inversiones' },
  { clave: 'I03', desc: 'I03 - Equipo de transporte' },
  { clave: 'I04', desc: 'I04 - Equipo de computo y accesorios' },
  { clave: 'I05', desc: 'I05 - Dados, troqueles, moldes, matrices y herramental' },
  { clave: 'I06', desc: 'I06 - Comunicaciones telefónicas' },
  { clave: 'I07', desc: 'I07 - Comunicaciones satelitales' },
  { clave: 'I08', desc: 'I08 - Otra maquinaria y equipo' },
  { clave: 'D01', desc: 'D01 - Honorarios médicos, dentales y gastos hospitalarios' },
  { clave: 'D02', desc: 'D02 - Gastos médicos por incapacidad o discapacidad' },
  { clave: 'D03', desc: 'D03 - Gastos funerales' },
  { clave: 'D04', desc: 'D04 - Donativos' },
  { clave: 'D05', desc: 'D05 - Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)' },
  { clave: 'D06', desc: 'D06 - Aportaciones voluntarias al SAR' },
  { clave: 'D07', desc: 'D07 - Primas por seguros de gastos médicos' },
  { clave: 'D08', desc: 'D08 - Gastos de transportación escolar obligatoria' },
  { clave: 'D09', desc: 'D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones' },
  { clave: 'D10', desc: 'D10 - Pagos por servicios educativos (colegiaturas)' },
  { clave: 'S01', desc: 'S01 - Sin efectos fiscales' },
  { clave: 'CP01', desc: 'CP01 - Pagos' },
  { clave: 'CN01', desc: 'CN01 - Nómina' },
]

function supabaseErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) {
    const e = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown }
    return [e.message, e.details, e.hint, e.code ? `Código: ${e.code}` : null]
      .filter(Boolean)
      .map(String)
      .join(' · ')
  }
  return String(error)
}

type Step = 1 | 2 | 3 | 4

interface FormData {
  // Step 1 – Cliente y servicio
  tipoServicioId: string
  clienteTipo: '' | 'empresa' | 'usuario'
  clienteId: string
  empresaTipo: TipoEmpresa | ''
  empresaRazonSocial: string
  empresaNombreComercial: string
  empresaRfc: string
  empresaContacto: string
  empresaTelefono: string
  empresaEmail: string
  empresaRegimenFiscal: string
  empresaCfdi: string
  empresaDomicilioFiscal: string
  empresaDescuento: string
  empresaCreditoDias: string
  empresaLimiteCredito: string
  usuarioNombre: string
  usuarioApellido: string
  usuarioCurp: string
  usuarioTipo: string
  telefono: string
  email: string
  // Domicilio general del usuario nuevo (no fiscal)
  usuarioCalle: string
  usuarioNumero: string
  usuarioColonia: string
  usuarioMunicipio: string
  usuarioEstado: string
  usuarioCp: string
  // Facturación del usuario nuevo (condicional)
  requiereFactura: boolean
  razonSocial: string
  rfc: string
  regimenFiscal: string
  cfdi: string
  fiscalCalle: string
  fiscalNumero: string
  fiscalColonia: string
  fiscalMunicipio: string
  fiscalEstado: string
  fiscalCp: string
  // Step 2 – Vehículo
  vehiculoOrigen: 'flota' | 'manual'
  vehiculoId: string
  marca: string
  modelo: string
  anio: string
  color: string
  placas: string
  vin: string
  transmision: string
  tipoVehiculo: string
  alias: string
  obsVehiculo: string
  // Step 3 – Ruta y fecha
  fecha: string
  hora: string
  // Origen
  origenCalle: string
  origenNumero: string
  origenColonia: string
  origenMunicipio: string
  origenEstado: string
  origenCp: string
  origenContactoNombre: string
  origenContactoTel: string
  // Destino
  destinoCalle: string
  destinoNumero: string
  destinoColonia: string
  destinoMunicipio: string
  destinoEstado: string
  destinoCp: string
  destinoContactoNombre: string
  destinoContactoTel: string
  referencias: string
  instrucciones: string
  // Step 4 – Asignación y tarifas
  conductorId: string
  tarifaCliente: string
  pagoConductor: string
  gastosAutorizados: string
  notaInterna: string
}

const EMPTY_FORM: FormData = {
  tipoServicioId: '', clienteTipo: '', clienteId: '',
  empresaTipo: '', empresaRazonSocial: '', empresaNombreComercial: '', empresaRfc: '', empresaContacto: '', empresaTelefono: '', empresaEmail: '',
  empresaRegimenFiscal: '', empresaCfdi: '', empresaDomicilioFiscal: '', empresaDescuento: '0', empresaCreditoDias: '0', empresaLimiteCredito: '0',
  usuarioNombre: '', usuarioApellido: '', usuarioCurp: '', usuarioTipo: '', telefono: '', email: '',
  usuarioCalle: '', usuarioNumero: '', usuarioColonia: '', usuarioMunicipio: '', usuarioEstado: '', usuarioCp: '',
  requiereFactura: false, razonSocial: '', rfc: '', regimenFiscal: '', cfdi: '',
  fiscalCalle: '', fiscalNumero: '', fiscalColonia: '', fiscalMunicipio: '', fiscalEstado: '', fiscalCp: '',
  vehiculoOrigen: 'manual', vehiculoId: '', marca: '', modelo: '', anio: '', color: '', placas: '', vin: '', transmision: '',
  tipoVehiculo: '', alias: '', obsVehiculo: '',
  fecha: '', hora: '',
  origenCalle: '', origenNumero: '', origenColonia: '', origenMunicipio: '', origenEstado: '', origenCp: '',
  origenContactoNombre: '', origenContactoTel: '',
  destinoCalle: '', destinoNumero: '', destinoColonia: '', destinoMunicipio: '', destinoEstado: '', destinoCp: '',
  destinoContactoNombre: '', destinoContactoTel: '',
  referencias: '', instrucciones: '',
  conductorId: '', tarifaCliente: '', pagoConductor: '', gastosAutorizados: '', notaInterna: '',
}

function NuevoViajeForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [credencialesUsuarioNuevo, setCredencialesUsuarioNuevo] = useState<{ email: string; password: string } | null>(null)

  // ── Catálogos reales desde Supabase ──────────────────────────────────────
  const [tiposServicio, setTiposServicio] = useState<{ id: string; nombre: string }[]>([])
  const [empresasLista, setEmpresasLista] = useState<{ id: string; nombre: string }[]>([])
  const [usuariosLista, setUsuariosLista] = useState<{ id: string; nombre: string; apellido: string; telefono: string | null; email: string }[]>([])
  const [conductoresLista, setConductoresLista] = useState<{ id: string; nombre: string; apellido: string }[]>([])
  const [vehiculosLista, setVehiculosLista] = useState<{
    id: string; marca: string; modelo: string; placas: string; anio: string | null; color: string | null
    vin: string | null; transmision: string | null; tipoVehiculo: string | null
    alias: string | null; observaciones: string | null
    usuario_id: string | null; empresa_id: string | null
  }[]>([])
  const [tiposVehiculo, setTiposVehiculo] = useState<{ id: string; nombre: string }[]>([])
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)

  useEffect(() => {
    const cargarCatalogos = async () => {
      const sb = getSupabaseBrowserClient()
      const [tsRes, empRes, usrRes, condData, vehRes, tiposVehRes] = await Promise.all([
        sb.from('tipos_servicio').select('id, nombre').eq('activo', true).order('nombre'),
        sb.from('empresas').select('id, nombre_comercial').eq('estatus', 'Activa').order('nombre_comercial'),
        sb.from('usuarios').select('id, nombre, apellido, telefono, email').order('nombre'),
        getConductores().catch(() => []),
        sb.from('vehiculos').select(`
          id, marca, modelo, placas, anio, color, vin, transmision,
          tipo_vehiculo, alias, observaciones,
          usuario_id, empresa_id
        `).order('marca'),
        sb.from('configuracion').select('valor').eq('clave', 'tipos_vehiculo').maybeSingle(),
      ])
      if (tsRes.data) setTiposServicio(tsRes.data.map((t: Record<string, unknown>) => ({ id: String(t.id), nombre: String(t.nombre ?? '') })))
      if (empRes.data) setEmpresasLista(empRes.data.map((e: Record<string, unknown>) => ({ id: String(e.id), nombre: String(e.nombre_comercial ?? '') })))
      if (usrRes.data) setUsuariosLista(usrRes.data.map((u: Record<string, unknown>) => ({ id: String(u.id), nombre: String(u.nombre ?? ''), apellido: String(u.apellido ?? ''), telefono: u.telefono ? String(u.telefono) : null, email: String(u.email ?? '') })))
      if (condData) setConductoresLista((condData as Record<string, unknown>[]).map((c) => ({ id: String(c.id), nombre: String(c.nombre ?? ''), apellido: String(c.apellido ?? '') })))
      if (vehRes.data) setVehiculosLista(vehRes.data.map((v: Record<string, unknown>) => ({
        id: String(v.id), marca: String(v.marca ?? ''), modelo: String(v.modelo ?? ''), placas: String(v.placas ?? ''),
        anio: v.anio ? String(v.anio) : null, color: v.color ? String(v.color) : null, vin: v.vin ? String(v.vin) : null,
        transmision: v.transmision ? String(v.transmision) : null,
        tipoVehiculo: v.tipo_vehiculo ? String(v.tipo_vehiculo) : null,
        alias: v.alias ? String(v.alias) : null,
        observaciones: v.observaciones ? String(v.observaciones) : null,
        usuario_id: v.usuario_id ? String(v.usuario_id) : null, empresa_id: v.empresa_id ? String(v.empresa_id) : null,
      })))
      if (tiposVehRes.data?.valor) {
        try {
          const parsed = JSON.parse(String(tiposVehRes.data.valor))
          if (Array.isArray(parsed)) {
            setTiposVehiculo(
              parsed
                .filter((t: Record<string, unknown>) => t.activo !== false)
                .map((t: Record<string, unknown>) => ({ id: String(t.id ?? t.nombre), nombre: String(t.nombre ?? '') }))
                .filter(t => t.nombre)
            )
          }
        } catch {
          // catálogo vacío o corrupto: se deja vacío, el campo queda sin opciones
        }
      }
      setCargandoCatalogos(false)
    }
    cargarCatalogos()
  }, [])

  // Vehículos de la flota disponibles para el cliente seleccionado en el paso 1
  const vehiculosDelCliente = vehiculosLista.filter(v => {
    if (form.clienteTipo === 'empresa' && form.clienteId && form.clienteId !== 'nuevo') return v.empresa_id === form.clienteId
    if (form.clienteTipo === 'usuario' && form.clienteId && form.clienteId !== 'nuevo') return v.usuario_id === form.clienteId
    return false
  })

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  // Al elegir un vehículo de la flota, autocompletar sus datos; al pasar a manual, limpiarlos
  const elegirVehiculoFlota = (vehiculoId: string) => {
    const v = vehiculosLista.find(x => x.id === vehiculoId)
    setForm(f => ({
      ...f,
      vehiculoId,
      marca: v?.marca ?? '',
      modelo: v?.modelo ?? '',
      anio: v?.anio ?? '',
      color: v?.color ?? '',
      placas: v?.placas ?? '',
      vin: v?.vin ?? '',
      transmision: v?.transmision ?? '',
      tipoVehiculo: v?.tipoVehiculo ?? '',
      alias: v?.alias ?? '',
      obsVehiculo: v?.observaciones ?? '',
    }))
    setErrors(e => ({ ...e, marca: '', modelo: '', placas: '' }))
  }

  const cambiarVehiculoOrigen = (origen: 'flota' | 'manual') => {
    setForm(f => ({
      ...f,
      vehiculoOrigen: origen,
      vehiculoId: '',
      marca: origen === 'manual' ? '' : f.marca,
      modelo: origen === 'manual' ? '' : f.modelo,
      anio: origen === 'manual' ? '' : f.anio,
      color: origen === 'manual' ? '' : f.color,
      placas: origen === 'manual' ? '' : f.placas,
      vin: origen === 'manual' ? '' : f.vin,
      transmision: origen === 'manual' ? '' : f.transmision,
      tipoVehiculo: origen === 'manual' ? '' : f.tipoVehiculo,
      alias: origen === 'manual' ? '' : f.alias,
      obsVehiculo: origen === 'manual' ? '' : f.obsVehiculo,
    }))
  }

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (step === 1) {
      if (!form.tipoServicioId) newErrors.tipoServicioId = 'Requerido'
      if (!form.clienteTipo) newErrors.clienteTipo = 'Requerido'
      if (form.clienteTipo === 'empresa' && !form.clienteId) newErrors.clienteId = 'Requerido'
      if (form.clienteTipo === 'empresa' && form.clienteId === 'nuevo') {
        if (!form.empresaTipo) newErrors.empresaTipo = 'Requerido'
        if (!form.empresaRazonSocial) newErrors.empresaRazonSocial = 'Requerido'
        if (!form.empresaRfc) newErrors.empresaRfc = 'Requerido'
        if (!form.empresaContacto) newErrors.empresaContacto = 'Requerido'
        if (!form.empresaTelefono) newErrors.empresaTelefono = 'Requerido'
      }
      if (form.clienteTipo === 'usuario' && !form.clienteId) newErrors.clienteId = 'Requerido'
      if (form.clienteTipo === 'usuario' && form.clienteId === 'nuevo') {
        if (!form.usuarioNombre) newErrors.usuarioNombre = 'Requerido'
        if (!form.usuarioApellido) newErrors.usuarioApellido = 'Requerido'
        if (!form.email) newErrors.email = 'Requerido'
        if (!form.telefono) newErrors.telefono = 'Requerido'
        if (!form.usuarioTipo) newErrors.usuarioTipo = 'Requerido'
        if (form.requiereFactura) {
          if (!form.razonSocial) newErrors.razonSocial = 'Requerido'
          if (!form.rfc) newErrors.rfc = 'Requerido'
          if (!form.regimenFiscal) newErrors.regimenFiscal = 'Requerido'
          if (!form.cfdi) newErrors.cfdi = 'Requerido'
          if (!form.fiscalCalle) newErrors.fiscalCalle = 'Requerido'
          if (!form.fiscalCp) newErrors.fiscalCp = 'Requerido'
        }
      }
    }
    if (step === 2) {
      if (form.vehiculoOrigen === 'flota' && !form.vehiculoId) newErrors.vehiculoId = 'Selecciona un vehículo'
      if (form.vehiculoOrigen === 'manual') {
        if (!form.marca) newErrors.marca = 'Requerido'
        if (!form.modelo) newErrors.modelo = 'Requerido'
        if (!form.placas) newErrors.placas = 'Requerido'
      }
    }
    if (step === 3) {
      if (!form.fecha) newErrors.fecha = 'Requerido'
      if (!form.hora) newErrors.hora = 'Requerido'
      if (!form.origenCalle) newErrors.origenCalle = 'Requerido'
      if (!form.destinoCalle) newErrors.destinoCalle = 'Requerido'
    }
    if (step === 4) {
      if (!form.tarifaCliente) newErrors.tarifaCliente = 'Requerido'
      if (!form.pagoConductor) newErrors.pagoConductor = 'Requerido'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const next = () => { if (validateStep()) setStep(s => (s < 4 ? (s + 1) as Step : s)) }
  const prev = () => setStep(s => (s > 1 ? (s - 1) as Step : s))

  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')

  const handleSubmit = async () => {
    if (!validateStep()) return
    setGuardando(true)
    setErrorGuardar('')

    try {
    const sb = getSupabaseBrowserClient()
    let credencialesGeneradas: { email: string; password: string } | null = null

      // 1. Usuario / Empresa: resolver primero el cliente real para vincular vehículo y viaje.
      let usuarioId: string | null = null
      let empresaId: string | null = null
      if (form.clienteTipo === 'usuario') {
        if (form.clienteId === 'nuevo') {
          const domicilioFiscalNuevo = form.requiereFactura
            ? [form.fiscalCalle, form.fiscalNumero, form.fiscalColonia, form.fiscalMunicipio, form.fiscalEstado, form.fiscalCp]
                .filter(Boolean).join(', ').toUpperCase()
            : null

          const respUsuario = await fetch('/api/crear-usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              perfil: {
                nombre: form.usuarioNombre.toUpperCase(),
                apellido: form.usuarioApellido.toUpperCase(),
                curp: form.usuarioCurp.toUpperCase() || null,
                telefono: form.telefono || null,
                email: form.email.toLowerCase(),
                tipo: form.usuarioTipo || 'Personal',
                estatus: 'Activo',
                calle: form.usuarioCalle.toUpperCase() || null,
                numero: form.usuarioNumero.toUpperCase() || null,
                colonia: form.usuarioColonia.toUpperCase() || null,
                municipio: form.usuarioMunicipio.toUpperCase() || null,
                estado_geo: form.usuarioEstado.toUpperCase() || null,
                codigo_postal: form.usuarioCp || null,
                razon_social: form.requiereFactura ? form.razonSocial.toUpperCase() : null,
                rfc: form.requiereFactura ? form.rfc.toUpperCase() : null,
                regimen_fiscal: form.requiereFactura ? form.regimenFiscal : null,
                cfdi: form.requiereFactura ? form.cfdi : null,
                domicilio_fiscal: domicilioFiscalNuevo,
              },
            }),
          })
          const dataUsuario = await respUsuario.json().catch(() => null) as { error?: string; userId?: string; password?: string } | null
          if (!respUsuario.ok || !dataUsuario?.userId) {
            throw new Error(dataUsuario?.error ?? 'No se pudo crear el usuario.')
          }
          usuarioId = dataUsuario.userId
          if (dataUsuario.password) {
            credencialesGeneradas = { email: form.email.toLowerCase(), password: dataUsuario.password }
          }
        } else {
          usuarioId = form.clienteId
        }
      } else if (form.clienteTipo === 'empresa') {
        if (form.clienteId === 'nuevo') {
          const { data: empCreada, error: eError } = await sb.from('empresas').insert({
            tipo: form.empresaTipo,
            razon_social: form.empresaRazonSocial.toUpperCase(),
            nombre_comercial: form.empresaNombreComercial.toUpperCase() || form.empresaRazonSocial.toUpperCase(),
            rfc: form.empresaRfc.toUpperCase(),
            contacto_principal: form.empresaContacto.toUpperCase(),
            telefono: form.empresaTelefono,
            correo: form.empresaEmail.toLowerCase() || null,
            regimen_fiscal: form.empresaRegimenFiscal || null,
            cfdi: form.empresaCfdi || null,
            domicilio_fiscal: form.empresaDomicilioFiscal.toUpperCase() || null,
            descuento: parseFloat(form.empresaDescuento) || 0,
            credito_dias: parseInt(form.empresaCreditoDias) || 0,
            limite_credito: parseFloat(form.empresaLimiteCredito) || 0,
            estatus: 'Activa',
          }).select('id').single()
          if (eError) throw eError
          empresaId = empCreada.id
        } else {
          empresaId = form.clienteId
        }
      }

      // 2. Vehículo: de flota ya tiene id; manual se busca/crea por placas en la misma tabla vehiculos.
      let vehiculoId: string | null = form.vehiculoOrigen === 'flota' ? (form.vehiculoId || null) : null
      if (form.vehiculoOrigen === 'manual' && form.placas) {
        const { data: vExistente, error: vExistenteError } = await sb
          .from('vehiculos')
          .select('id')
          .eq('placas', form.placas.toUpperCase())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (vExistenteError) throw vExistenteError

        if (vExistente) {
          vehiculoId = vExistente.id
        } else {
          const { data: vCreado, error: vError } = await sb.from('vehiculos').insert({
            usuario_id: usuarioId,
            empresa_id: empresaId,
            marca: form.marca.toUpperCase() || null,
            modelo: form.modelo.toUpperCase() || null,
            anio: form.anio || null,
            color: form.color.toUpperCase() || null,
            placas: form.placas.toUpperCase(),
            vin: form.vin.toUpperCase() || null,
            transmision: form.transmision || null,
            tipo_vehiculo: form.tipoVehiculo || null,
            observaciones: form.obsVehiculo.toUpperCase() || null,
            alias: form.alias.toUpperCase() || null,
            activo: true,
          }).select('id').single()
          if (vError) throw vError
          vehiculoId = vCreado.id
        }
      }

      // 3. Conductor: ya viene como id real seleccionado del catálogo
      const conductorId: string | null = form.conductorId || null

      // 4. Crear el viaje
      const viaje = await createViaje({
        usuario_id: usuarioId,
        empresa_id: empresaId,
        conductor_id: conductorId,
        vehiculo_id: vehiculoId,
        tipo_servicio_id: form.tipoServicioId || null,
        origen_calle: form.origenCalle.toUpperCase() || null,
        origen_numero: form.origenNumero.toUpperCase() || null,
        origen_colonia: form.origenColonia.toUpperCase() || null,
        origen_estado: [form.origenMunicipio, form.origenEstado].filter(Boolean).join(', ').toUpperCase() || null,
        origen_cp: form.origenCp || null,
        origen_contacto: form.origenContactoNombre.toUpperCase() || null,
        origen_telefono: form.origenContactoTel || null,
        destino_calle: form.destinoCalle.toUpperCase() || null,
        destino_numero: form.destinoNumero.toUpperCase() || null,
        destino_colonia: form.destinoColonia.toUpperCase() || null,
        destino_estado: [form.destinoMunicipio, form.destinoEstado].filter(Boolean).join(', ').toUpperCase() || null,
        destino_cp: form.destinoCp || null,
        destino_contacto: form.destinoContactoNombre.toUpperCase() || null,
        destino_telefono: form.destinoContactoTel || null,
        referencias: form.referencias || null,
        instrucciones: form.instrucciones || null,
        fecha_programada: form.fecha || null,
        hora_programada: form.hora || null,
        status: conductorId ? 'Conductor asignado' : 'Pendiente de asignación',
        tarifa_cliente: parseFloat(form.tarifaCliente) || 0,
        pago_conductor: parseFloat(form.pagoConductor) || 0,
        gastos_autorizados: parseFloat(form.gastosAutorizados) || 0,
      }, { evento: 'Viaje registrado por operaciones' })

      // 5. Nota interna (si se capturó una)
      if (form.notaInterna) {
        await agregarNota(viaje.id, form.notaInterna)
      }

      onSave()
      if (credencialesGeneradas) {
        // No cerramos todavía: el admin debe ver y copiar la contraseña
        // provisional antes de perder la oportunidad (no se vuelve a
        // mostrar). onClose() ocurre cuando confirme desde esa pantalla.
        setCredencialesUsuarioNuevo(credencialesGeneradas)
      } else {
        onClose()
      }

    } catch (e: unknown) {
      console.error('Error guardando viaje:', e)
      setErrorGuardar(`No se pudo guardar: ${supabaseErrorMessage(e)}`)
    } finally {
      setGuardando(false)
    }
  }

  const steps = [
    { n: 1, label: 'Cliente y servicio' },
    { n: 2, label: 'Vehículo' },
    { n: 3, label: 'Ruta y fecha' },
    { n: 4, label: 'Asignación y tarifas' },
  ]

  const InputCls = (field: keyof FormData) =>
    `w-full border ${errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rr-route`

  const SelectCls = (field: keyof FormData) =>
    `w-full border ${errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rr-route bg-white`

  const Err = ({ field }: { field: keyof FormData }) =>
    errors[field] ? <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p> : null

  const Label = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
    <label className="block text-xs font-medium text-slate-500 mb-1">
      {children}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )

  const margen = (parseFloat(form.tarifaCliente) || 0) - (parseFloat(form.pagoConductor) || 0) - (parseFloat(form.gastosAutorizados) || 0)

  // ── Pantalla de credenciales (se muestra si el paso 1 creó un usuario nuevo) ──
  if (credencialesUsuarioNuevo) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">✓</div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Viaje y usuario creados</h2>
              <p className="text-xs text-slate-400">Comparte estas credenciales con el cliente de forma segura</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Correo</p>
                <p className="text-sm font-medium text-slate-800">{credencialesUsuarioNuevo.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Contraseña temporal</p>
                <p className="text-lg font-mono font-bold text-slate-800 tracking-wide">{credencialesUsuarioNuevo.password}</p>
              </div>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
              ⚠️ Esta contraseña no se mostrará de nuevo. El cliente deberá cambiarla en su primer inicio de sesión dentro de la app.
            </p>
            <button onClick={() => { navigator.clipboard.writeText(`Correo: ${credencialesUsuarioNuevo.email}\nContraseña temporal: ${credencialesUsuarioNuevo.password}`) }}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              Copiar credenciales
            </button>
            <button onClick={onClose}
              className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg text-sm transition-colors">
              Listo, ya las anoté
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Nuevo Viaje</h2>
            <p className="text-xs text-slate-400">Completa los 4 pasos para registrar el traslado</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <XMarkIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center">
            {steps.map((s, idx) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    step === s.n ? 'border-rr-route bg-rr-route text-rr-asphalt'
                    : step > s.n ? 'border-green-500 bg-green-500 text-white'
                    : 'border-slate-300 bg-white text-slate-400'
                  }`}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span className={`text-xs mt-1 font-medium whitespace-nowrap ${step === s.n ? 'text-rr-trace' : step > s.n ? 'text-green-600' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${step > s.n ? 'bg-green-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form body */}
        <div className="px-6 py-5 space-y-4">

          {/* ── STEP 1: Cliente y servicio ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label req>Tipo de servicio</Label>
                <select value={form.tipoServicioId} onChange={e => set('tipoServicioId', e.target.value)} className={SelectCls('tipoServicioId')} disabled={cargandoCatalogos}>
                  <option value="">{cargandoCatalogos ? 'Cargando...' : 'Seleccionar...'}</option>
                  {tiposServicio.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <Err field="tipoServicioId" />
                {!cargandoCatalogos && tiposServicio.length === 0 && (
                  <p className="text-xs text-amber-500 mt-0.5">No hay tipos de servicio activos. Configúralos en Configuración → Tipos de servicio.</p>
                )}
              </div>

              <div>
                <Label req>Empresa / Cliente</Label>
                <div className="flex gap-2 mb-2">
                  {([
                    { v: 'empresa', label: 'Empresa' },
                    { v: 'usuario', label: 'Usuario particular' },
                  ] as const).map(opt => (
                    <button key={opt.v} type="button"
                      onClick={() => setForm(f => ({ ...f, clienteTipo: opt.v, clienteId: '', usuarioNombre: '', usuarioApellido: '', telefono: '', email: '' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.clienteTipo === opt.v ? 'bg-rr-route border-rr-route text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <Err field="clienteTipo" />

                {form.clienteTipo === 'empresa' && (
                  <div>
                    <select value={form.clienteId} onChange={e => set('clienteId', e.target.value)} className={SelectCls('clienteId')} disabled={cargandoCatalogos}>
                      <option value="">{cargandoCatalogos ? 'Cargando...' : 'Seleccionar empresa...'}</option>
                      {empresasLista.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      <option value="nuevo">+ Capturar nueva empresa...</option>
                    </select>
                    <Err field="clienteId" />
                    {!cargandoCatalogos && empresasLista.length === 0 && (
                      <p className="text-xs text-amber-500 mt-0.5">No hay empresas activas capturadas. Incluye también la operación Ruum-Ruum si está registrada como empresa.</p>
                    )}
                    {form.clienteId === 'nuevo' && (
                      <div className="space-y-4 border border-slate-200 rounded-xl p-4 mt-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b pb-2">🏢 Datos de la empresa</p>
                        <div>
                          <Label req>Tipo de empresa</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {TIPOS_EMPRESA.map(t => (
                              <button key={t} type="button" onClick={() => set('empresaTipo', t)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border-2 transition-colors text-left ${form.empresaTipo === t ? 'border-rr-route bg-[#E8EFFF] text-rr-traceDeep' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                <span className="text-base">{tipoEmpresaIcon[t]}</span>{t}
                              </button>
                            ))}
                          </div>
                          <Err field="empresaTipo" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label req>Razón social</Label>
                            <input type="text" value={form.empresaRazonSocial} onChange={e => set('empresaRazonSocial', e.target.value.toUpperCase())} className={InputCls('empresaRazonSocial')} />
                            <Err field="empresaRazonSocial" />
                          </div>
                          <div>
                            <Label>Nombre comercial</Label>
                            <input type="text" value={form.empresaNombreComercial} onChange={e => set('empresaNombreComercial', e.target.value.toUpperCase())} className={InputCls('empresaNombreComercial')} />
                          </div>
                          <div>
                            <Label req>RFC</Label>
                            <input type="text" placeholder="12 O 13 CARACTERES" maxLength={13} value={form.empresaRfc} onChange={e => set('empresaRfc', e.target.value.toUpperCase())} className={InputCls('empresaRfc')} />
                            <Err field="empresaRfc" />
                          </div>
                          <div>
                            <Label req>Contacto principal</Label>
                            <input type="text" value={form.empresaContacto} onChange={e => set('empresaContacto', e.target.value.toUpperCase())} className={InputCls('empresaContacto')} />
                            <Err field="empresaContacto" />
                          </div>
                          <div>
                            <Label req>Teléfono</Label>
                            <input type="tel" placeholder="55-0000-0000" maxLength={12} value={form.empresaTelefono}
                              onChange={e => { const d = e.target.value.replace(/\D/g,'').slice(0,10); set('empresaTelefono', d.length<=3?d:d.length<=6?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`) }} className={InputCls('empresaTelefono')} />
                            <Err field="empresaTelefono" />
                          </div>
                          <div className="col-span-2">
                            <Label>Correo electrónico</Label>
                            <input type="email" value={form.empresaEmail} onChange={e => set('empresaEmail', e.target.value)} className={InputCls('empresaEmail')} />
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b pb-1">🧾 Facturación</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Régimen fiscal</Label>
                            <input type="text" placeholder="601 - GENERAL DE LEY..." value={form.empresaRegimenFiscal} onChange={e => set('empresaRegimenFiscal', e.target.value.toUpperCase())} className={InputCls('empresaRegimenFiscal')} />
                          </div>
                          <div>
                            <Label>CFDI</Label>
                            <input type="text" placeholder="G03 - GASTOS EN GENERAL" value={form.empresaCfdi} onChange={e => set('empresaCfdi', e.target.value.toUpperCase())} className={InputCls('empresaCfdi')} />
                          </div>
                          <div className="col-span-2">
                            <Label>Domicilio fiscal</Label>
                            <input type="text" value={form.empresaDomicilioFiscal} onChange={e => set('empresaDomicilioFiscal', e.target.value.toUpperCase())} className={InputCls('empresaDomicilioFiscal')} />
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b pb-1">📋 Condiciones comerciales</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div><Label>Descuento (%)</Label><input type="number" min="0" max="100" value={form.empresaDescuento} onChange={e => set('empresaDescuento', e.target.value)} className={InputCls('empresaDescuento')} /></div>
                          <div><Label>Crédito (días)</Label><input type="number" min="0" value={form.empresaCreditoDias} onChange={e => set('empresaCreditoDias', e.target.value)} className={InputCls('empresaCreditoDias')} /></div>
                          <div><Label>Límite crédito ($)</Label><input type="number" min="0" value={form.empresaLimiteCredito} onChange={e => set('empresaLimiteCredito', e.target.value)} className={InputCls('empresaLimiteCredito')} /></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {form.clienteTipo === 'usuario' && (
                  <div className="space-y-3">
                    <div>
                      <select value={form.clienteId} onChange={e => set('clienteId', e.target.value)} className={SelectCls('clienteId')} disabled={cargandoCatalogos}>
                        <option value="">{cargandoCatalogos ? 'Cargando...' : 'Seleccionar usuario capturado...'}</option>
                        {usuariosLista.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido} {u.email ? `· ${u.email}` : ''}</option>)}
                        <option value="nuevo">+ Capturar nuevo usuario...</option>
                      </select>
                      <Err field="clienteId" />
                    </div>

                    {form.clienteId === 'nuevo' && (
                      <div className="space-y-4 border border-slate-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b pb-2">👤 Datos personales</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label req>Nombre(s)</Label>
                            <input type="text" placeholder="NOMBRE(S)" value={form.usuarioNombre} onChange={e => set('usuarioNombre', e.target.value.toUpperCase())} className={InputCls('usuarioNombre')} />
                            <Err field="usuarioNombre" />
                          </div>
                          <div>
                            <Label req>Apellido(s)</Label>
                            <input type="text" placeholder="APELLIDO(S)" value={form.usuarioApellido} onChange={e => set('usuarioApellido', e.target.value.toUpperCase())} className={InputCls('usuarioApellido')} />
                            <Err field="usuarioApellido" />
                          </div>
                          <div>
                            <Label>CURP</Label>
                            <input type="text" placeholder="18 CARACTERES" maxLength={18} value={form.usuarioCurp} onChange={e => set('usuarioCurp', e.target.value.toUpperCase())} className={InputCls('usuarioCurp')} />
                          </div>
                          <div>
                            <Label req>Tipo de usuario</Label>
                            <select value={form.usuarioTipo} onChange={e => set('usuarioTipo', e.target.value)} className={SelectCls('usuarioTipo')}>
                              <option value="">Seleccionar...</option>
                              {TIPOS_USUARIO.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <Err field="usuarioTipo" />
                          </div>
                          <div>
                            <Label req>Teléfono de contacto</Label>
                            <input type="tel" placeholder="55-0000-0000" maxLength={12} value={form.telefono} onChange={e => { const d = e.target.value.replace(/[^0-9]/g,'').slice(0,10); set('telefono', d.length<=3?d:d.length<=6?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`) }} className={InputCls('telefono')} />
                            <Err field="telefono" />
                          </div>
                          <div>
                            <Label req>Correo electrónico</Label>
                            <input type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={e => set('email', e.target.value)} className={InputCls('email')} />
                            <Err field="email" />
                          </div>
                        </div>

                        {/* Domicilio general (no fiscal) */}
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-2">Domicilio</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 sm:col-span-1">
                              <Label>Calle</Label>
                              <input type="text" placeholder="NOMBRE DE LA CALLE" value={form.usuarioCalle} onChange={e => set('usuarioCalle', e.target.value.toUpperCase())} className={InputCls('usuarioCalle')} />
                            </div>
                            <div>
                              <Label>Número</Label>
                              <input type="text" placeholder="EXT / INT" value={form.usuarioNumero} onChange={e => set('usuarioNumero', e.target.value.toUpperCase())} className={InputCls('usuarioNumero')} />
                            </div>
                            <div>
                              <Label>Colonia</Label>
                              <input type="text" placeholder="COLONIA" value={form.usuarioColonia} onChange={e => set('usuarioColonia', e.target.value.toUpperCase())} className={InputCls('usuarioColonia')} />
                            </div>
                            <div>
                              <Label>Código Postal</Label>
                              <input type="text" placeholder="00000" maxLength={5} value={form.usuarioCp} onChange={e => set('usuarioCp', e.target.value.replace(/\D/g,'').slice(0,5))} className={InputCls('usuarioCp')} />
                            </div>
                            <div>
                              <Label>Municipio / Alcaldía</Label>
                              <input type="text" placeholder="MUNICIPIO" value={form.usuarioMunicipio} onChange={e => set('usuarioMunicipio', e.target.value.toUpperCase())} className={InputCls('usuarioMunicipio')} />
                            </div>
                            <div>
                              <Label>Estado</Label>
                              <input type="text" placeholder="ESTADO" value={form.usuarioEstado} onChange={e => set('usuarioEstado', e.target.value.toUpperCase())} className={InputCls('usuarioEstado')} />
                            </div>
                          </div>
                        </div>

                        {/* Toggle facturación */}
                        <button type="button" onClick={() => set('requiereFactura', !form.requiereFactura)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${form.requiereFactura ? 'border-rr-route bg-[#E8EFFF]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${form.requiereFactura ? 'bg-[#E8EFFF]' : 'bg-slate-200'}`}>🧾</div>
                            <div className="text-left">
                              <p className={`text-sm font-semibold ${form.requiereFactura ? 'text-rr-traceDeep' : 'text-slate-700'}`}>Requiere facturación</p>
                              <p className="text-xs text-slate-400">Activa para capturar datos fiscales del cliente</p>
                            </div>
                          </div>
                          <div className={`w-11 h-6 rounded-full transition-colors relative ${form.requiereFactura ? 'bg-rr-trace' : 'bg-slate-300'}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${form.requiereFactura ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </div>
                        </button>

                        {form.requiereFactura && (
                          <div className="space-y-4 border border-[#C7D7FF] bg-[#E8EFFF]/40 rounded-xl p-4">
                            <p className="text-xs font-semibold text-rr-traceDeep uppercase tracking-wide border-b border-[#C7D7FF] pb-2">🧾 Información fiscal</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="col-span-2">
                                <Label req>Razón social</Label>
                                <input type="text" placeholder="NOMBRE O RAZÓN SOCIAL COMPLETA" value={form.razonSocial} onChange={e => set('razonSocial', e.target.value.toUpperCase())} className={InputCls('razonSocial')} />
                                <Err field="razonSocial" />
                              </div>
                              <div>
                                <Label req>RFC</Label>
                                <input type="text" placeholder="RFC 12 O 13 CARACTERES" maxLength={13} value={form.rfc} onChange={e => set('rfc', e.target.value.toUpperCase())} className={InputCls('rfc')} />
                                <Err field="rfc" />
                              </div>
                              <div />
                              <div className="col-span-2">
                                <Label req>Régimen fiscal</Label>
                                <select value={form.regimenFiscal} onChange={e => set('regimenFiscal', e.target.value)} className={SelectCls('regimenFiscal')}>
                                  <option value="">Seleccionar régimen...</option>
                                  {REGIMENES_FISCAL.map(r => <option key={r.clave} value={r.clave}>{r.desc}</option>)}
                                </select>
                                <Err field="regimenFiscal" />
                              </div>
                              <div className="col-span-2">
                                <Label req>Uso de CFDI</Label>
                                <select value={form.cfdi} onChange={e => set('cfdi', e.target.value)} className={SelectCls('cfdi')}>
                                  <option value="">Seleccionar uso de CFDI...</option>
                                  {USOS_CFDI.map(c => <option key={c.clave} value={c.clave}>{c.desc}</option>)}
                                </select>
                                <Err field="cfdi" />
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-2">Domicilio fiscal</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 sm:col-span-1">
                                  <Label req>Calle</Label>
                                  <input type="text" placeholder="NOMBRE DE LA CALLE" value={form.fiscalCalle} onChange={e => set('fiscalCalle', e.target.value.toUpperCase())} className={InputCls('fiscalCalle')} />
                                  <Err field="fiscalCalle" />
                                </div>
                                <div>
                                  <Label>Número</Label>
                                  <input type="text" placeholder="EXT / INT" value={form.fiscalNumero} onChange={e => set('fiscalNumero', e.target.value.toUpperCase())} className={InputCls('fiscalNumero')} />
                                </div>
                                <div>
                                  <Label>Colonia</Label>
                                  <input type="text" placeholder="COLONIA" value={form.fiscalColonia} onChange={e => set('fiscalColonia', e.target.value.toUpperCase())} className={InputCls('fiscalColonia')} />
                                </div>
                                <div>
                                  <Label req>Código Postal</Label>
                                  <input type="text" placeholder="00000" maxLength={5} value={form.fiscalCp} onChange={e => set('fiscalCp', e.target.value.replace(/\D/g,'').slice(0,5))} className={InputCls('fiscalCp')} />
                                  <Err field="fiscalCp" />
                                </div>
                                <div>
                                  <Label>Municipio / Alcaldía</Label>
                                  <input type="text" placeholder="MUNICIPIO" value={form.fiscalMunicipio} onChange={e => set('fiscalMunicipio', e.target.value.toUpperCase())} className={InputCls('fiscalMunicipio')} />
                                </div>
                                <div>
                                  <Label>Estado</Label>
                                  <input type="text" placeholder="ESTADO" value={form.fiscalEstado} onChange={e => set('fiscalEstado', e.target.value.toUpperCase())} className={InputCls('fiscalEstado')} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Vehículo ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label req>Origen del vehículo</Label>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => cambiarVehiculoOrigen('flota')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.vehiculoOrigen === 'flota' ? 'bg-rr-route border-rr-route text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                    Vehículo ya capturado
                  </button>
                  <button type="button" onClick={() => cambiarVehiculoOrigen('manual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.vehiculoOrigen === 'manual' ? 'bg-rr-route border-rr-route text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                    Captura manual
                  </button>
                </div>

                {form.vehiculoOrigen === 'flota' && (
                  <div>
                    {!form.clienteTipo ? (
                      <p className="text-xs text-amber-500">Selecciona primero la empresa o el usuario en el paso 1 para ver sus vehículos registrados.</p>
                    ) : (
                      <>
                        <select value={form.vehiculoId} onChange={e => elegirVehiculoFlota(e.target.value)} className={SelectCls('vehiculoId')} disabled={cargandoCatalogos}>
                          <option value="">{cargandoCatalogos ? 'Cargando...' : 'Seleccionar vehículo...'}</option>
                          {vehiculosDelCliente.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} · {v.placas}</option>)}
                        </select>
                        <Err field="vehiculoId" />
                        {!cargandoCatalogos && vehiculosDelCliente.length === 0 && (
                          <p className="text-xs text-amber-500 mt-0.5">Este cliente no tiene vehículos registrados todavía. Usa "Captura manual".</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label req>Marca</Label>
                  <input type="text" placeholder="Toyota, Honda, Ford..." value={form.marca} disabled={form.vehiculoOrigen === 'flota'} onChange={e => set('marca', e.target.value.toUpperCase())} className={`${InputCls('marca')} ${form.vehiculoOrigen === 'flota' ? 'bg-slate-100 text-slate-500' : ''}`} />
                  <Err field="marca" />
                </div>
                <div>
                  <Label req>Modelo</Label>
                  <input type="text" placeholder="Hilux, Civic, F-150..." value={form.modelo} disabled={form.vehiculoOrigen === 'flota'} onChange={e => set('modelo', e.target.value.toUpperCase())} className={`${InputCls('modelo')} ${form.vehiculoOrigen === 'flota' ? 'bg-slate-100 text-slate-500' : ''}`} />
                  <Err field="modelo" />
                </div>
                <div>
                  <Label>Año</Label>
                  <input type="text" placeholder="2022" value={form.anio} disabled={form.vehiculoOrigen === 'flota'} onChange={e => set('anio', e.target.value.toUpperCase())} className={`${InputCls('anio')} ${form.vehiculoOrigen === 'flota' ? 'bg-slate-100 text-slate-500' : ''}`} />
                </div>
                <div>
                  <Label>Color</Label>
                  <input type="text" placeholder="Blanco, Gris, Negro..." value={form.color} disabled={form.vehiculoOrigen === 'flota'} onChange={e => set('color', e.target.value.toUpperCase())} className={`${InputCls('color')} ${form.vehiculoOrigen === 'flota' ? 'bg-slate-100 text-slate-500' : ''}`} />
                </div>
                <div>
                  <Label req>Placas</Label>
                  <input type="text" placeholder="XYZ-987" value={form.placas} disabled={form.vehiculoOrigen === 'flota'} onChange={e => set('placas', e.target.value.toUpperCase())} className={`${InputCls('placas')} ${form.vehiculoOrigen === 'flota' ? 'bg-slate-100 text-slate-500' : ''}`} />
                  <Err field="placas" />
                </div>
                <div>
                  <Label>VIN</Label>
                  <input type="text" placeholder="17 caracteres" value={form.vin} disabled={form.vehiculoOrigen === 'flota'} onChange={e => set('vin', e.target.value.toUpperCase())} className={`${InputCls('vin')} ${form.vehiculoOrigen === 'flota' ? 'bg-slate-100 text-slate-500' : ''}`} />
                </div>
                <div>
                  <Label>Transmisión</Label>
                  <select value={form.transmision} disabled={form.vehiculoOrigen === 'flota'} onChange={e => set('transmision', e.target.value)} className={`${SelectCls('transmision')} ${form.vehiculoOrigen === 'flota' ? 'bg-slate-100 text-slate-500' : ''}`}>
                    <option value="">Seleccionar...</option>
                    {TRANSMISIONES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Tipo de vehículo</Label>
                  <select value={form.tipoVehiculo} disabled={form.vehiculoOrigen === 'flota'} onChange={e => set('tipoVehiculo', e.target.value)} className={`${SelectCls('tipoVehiculo')} ${form.vehiculoOrigen === 'flota' ? 'bg-slate-100 text-slate-500' : ''}`}>
                    <option value="">Seleccionar...</option>
                    {tiposVehiculo.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                  </select>
                  {!cargandoCatalogos && tiposVehiculo.length === 0 && form.vehiculoOrigen === 'manual' && (
                    <p className="text-xs text-amber-500 mt-0.5">No hay tipos de vehículo capturados en Configuración.</p>
                  )}
                </div>
                <div>
                  <Label>Alias / Apodo</Label>
                  <input type="text" placeholder="Ej. Camioneta gris 1" value={form.alias} disabled={form.vehiculoOrigen === 'flota'} onChange={e => set('alias', e.target.value.toUpperCase())} className={`${InputCls('alias')} ${form.vehiculoOrigen === 'flota' ? 'bg-slate-100 text-slate-500' : ''}`} />
                </div>
              </div>
              <div>
                <Label>Observaciones del vehículo</Label>
                <textarea rows={2} placeholder="Rasguños, daños preexistentes, equipo especial..." value={form.obsVehiculo} disabled={form.vehiculoOrigen === 'flota'} onChange={e => set('obsVehiculo', e.target.value.toUpperCase())} className={`${InputCls('obsVehiculo')} ${form.vehiculoOrigen === 'flota' ? 'bg-slate-100 text-slate-500' : ''}`} />
              </div>
            </div>
          )}

          {/* ── STEP 3: Ruta y fecha ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label req>Fecha del viaje</Label>
                  <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className={InputCls('fecha')} />
                  <Err field="fecha" />
                </div>
                <div>
                  <Label req>Hora programada</Label>
                  <input type="time" value={form.hora} onChange={e => set('hora', e.target.value)} className={InputCls('hora')} />
                  <Err field="hora" />
                </div>
              </div>

              {/* Origen */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide border-b border-green-100 pb-1">📍 Origen</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label req>Calle</Label>
                    <input type="text" placeholder="AV. REFORMA" value={form.origenCalle} onChange={e => set('origenCalle', e.target.value.toUpperCase())} className={InputCls('origenCalle')} />
                    <Err field="origenCalle" />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <input type="text" placeholder="222" value={form.origenNumero} onChange={e => set('origenNumero', e.target.value.toUpperCase())} className={InputCls('origenNumero')} />
                  </div>
                  <div className="col-span-2">
                    <Label>Colonia</Label>
                    <input type="text" placeholder="CUAUHTÉMOC" value={form.origenColonia} onChange={e => set('origenColonia', e.target.value.toUpperCase())} className={InputCls('origenColonia')} />
                  </div>
                  <div>
                    <Label>CP</Label>
                    <input type="text" placeholder="06600" maxLength={5} value={form.origenCp} onChange={e => set('origenCp', e.target.value.replace(/\D/g,'').slice(0,5))} className={InputCls('origenCp')} />
                  </div>
                  <div>
                    <Label>Municipio</Label>
                    <input type="text" placeholder="CUAUHTÉMOC" value={form.origenMunicipio} onChange={e => set('origenMunicipio', e.target.value.toUpperCase())} className={InputCls('origenMunicipio')} />
                  </div>
                  <div className="col-span-2">
                    <Label>Estado</Label>
                    <input type="text" placeholder="CIUDAD DE MÉXICO" value={form.origenEstado} onChange={e => set('origenEstado', e.target.value.toUpperCase())} className={InputCls('origenEstado')} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Nombre del responsable de entrega</Label>
                    <input type="text" placeholder="NOMBRE(S) APELLIDO(S)" value={form.origenContactoNombre} onChange={e => set('origenContactoNombre', e.target.value.toUpperCase())} className={InputCls('origenContactoNombre')} />
                  </div>
                  <div>
                    <Label>Teléfono del responsable de entrega</Label>
                    <input type="tel" placeholder="55-0000-0000" maxLength={12} value={form.origenContactoTel} onChange={e => { const d = e.target.value.replace(/\D/g,'').slice(0,10); set('origenContactoTel', d.length<=3?d:d.length<=6?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`) }} className={InputCls('origenContactoTel')} />
                  </div>
                </div>
              </div>

              {/* Destino */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide border-b border-red-100 pb-1">🏁 Destino</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label req>Calle</Label>
                    <input type="text" placeholder="TALLER NORTE" value={form.destinoCalle} onChange={e => set('destinoCalle', e.target.value.toUpperCase())} className={InputCls('destinoCalle')} />
                    <Err field="destinoCalle" />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <input type="text" placeholder="100" value={form.destinoNumero} onChange={e => set('destinoNumero', e.target.value.toUpperCase())} className={InputCls('destinoNumero')} />
                  </div>
                  <div className="col-span-2">
                    <Label>Colonia</Label>
                    <input type="text" placeholder="SATÉLITE" value={form.destinoColonia} onChange={e => set('destinoColonia', e.target.value.toUpperCase())} className={InputCls('destinoColonia')} />
                  </div>
                  <div>
                    <Label>CP</Label>
                    <input type="text" placeholder="53100" maxLength={5} value={form.destinoCp} onChange={e => set('destinoCp', e.target.value.replace(/\D/g,'').slice(0,5))} className={InputCls('destinoCp')} />
                  </div>
                  <div>
                    <Label>Municipio</Label>
                    <input type="text" placeholder="NAUCALPAN" value={form.destinoMunicipio} onChange={e => set('destinoMunicipio', e.target.value.toUpperCase())} className={InputCls('destinoMunicipio')} />
                  </div>
                  <div className="col-span-2">
                    <Label>Estado</Label>
                    <input type="text" placeholder="ESTADO DE MÉXICO" value={form.destinoEstado} onChange={e => set('destinoEstado', e.target.value.toUpperCase())} className={InputCls('destinoEstado')} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Nombre del responsable de recepción</Label>
                    <input type="text" placeholder="NOMBRE(S) APELLIDO(S)" value={form.destinoContactoNombre} onChange={e => set('destinoContactoNombre', e.target.value.toUpperCase())} className={InputCls('destinoContactoNombre')} />
                  </div>
                  <div>
                    <Label>Teléfono del responsable de recepción</Label>
                    <input type="tel" placeholder="55-0000-0000" maxLength={12} value={form.destinoContactoTel} onChange={e => { const d = e.target.value.replace(/\D/g,'').slice(0,10); set('destinoContactoTel', d.length<=3?d:d.length<=6?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`) }} className={InputCls('destinoContactoTel')} />
                  </div>
                </div>
              </div>

              <div>
                <Label>Referencias del lugar</Label>
                <input type="text" placeholder="ENTRE CALLES, PUNTO DE REFERENCIA, COLOR DE FACHADA..." value={form.referencias} onChange={e => set('referencias', e.target.value.toUpperCase())} className={InputCls('referencias')} />
              </div>
              <div>
                <Label>Instrucciones especiales</Label>
                <textarea rows={2} placeholder="LLAMAR AL LLEGAR, PEDIR FIRMA, ACCESO RESTRINGIDO..." value={form.instrucciones} onChange={e => set('instrucciones', e.target.value.toUpperCase())} className={InputCls('instrucciones')} />
              </div>
            </div>
          )}

          {/* ── STEP 4: Asignación y tarifas ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label>Conductor asignado</Label>
                <select value={form.conductorId} onChange={e => set('conductorId', e.target.value)} className={SelectCls('conductorId')} disabled={cargandoCatalogos}>
                  <option value="">Asignar después...</option>
                  {conductoresLista.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                </select>
                {!form.conductorId && <p className="text-xs text-amber-500 mt-0.5">El viaje quedará en "Pendiente de asignación" si no se selecciona conductor.</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label req>Tarifa al cliente (MXN)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input type="number" min="0" placeholder="0.00" value={form.tarifaCliente} onChange={e => set('tarifaCliente', e.target.value.toUpperCase())} className={`${InputCls('tarifaCliente')} pl-7`} />
                  </div>
                  <Err field="tarifaCliente" />
                </div>
                <div>
                  <Label req>Pago al conductor (MXN)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input type="number" min="0" placeholder="0.00" value={form.pagoConductor} onChange={e => set('pagoConductor', e.target.value.toUpperCase())} className={`${InputCls('pagoConductor')} pl-7`} />
                  </div>
                  <Err field="pagoConductor" />
                </div>
                <div>
                  <Label>Gastos autorizados (MXN)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input type="number" min="0" placeholder="0.00" value={form.gastosAutorizados} onChange={e => set('gastosAutorizados', e.target.value.toUpperCase())} className={`${InputCls('gastosAutorizados')} pl-7`} />
                  </div>
                </div>
              </div>

              {/* Margen preview */}
              {(form.tarifaCliente || form.pagoConductor) && (
                <div className={`rounded-xl p-4 flex items-center justify-between border ${margen >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Margen estimado:</span>
                    <span className="text-xs text-slate-400 ml-2">${form.tarifaCliente || 0} − ${form.pagoConductor || 0} − ${form.gastosAutorizados || 0}</span>
                  </div>
                  <span className={`text-lg font-bold ${margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {margen >= 0 ? '+' : ''}${margen.toLocaleString()} MXN
                  </span>
                </div>
              )}

              <div>
                <Label>Nota interna</Label>
                <textarea rows={3} placeholder="Observaciones para el equipo de operaciones (no visible para el conductor o cliente)..." value={form.notaInterna} onChange={e => set('notaInterna', e.target.value)} className={InputCls('notaInterna')} />
              </div>

              {/* Resumen rápido */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Resumen del viaje a registrar</p>
                {[
                  ['Servicio', tiposServicio.find(t => t.id === form.tipoServicioId)?.nombre || '—'],
                  ['Cliente', form.clienteTipo === 'empresa'
                    ? (form.clienteId === 'nuevo'
                        ? (form.empresaNombreComercial || form.empresaRazonSocial || '—')
                        : empresasLista.find(e => e.id === form.clienteId)?.nombre || '—')
                    : form.clienteTipo === 'usuario'
                      ? (form.clienteId === 'nuevo'
                          ? [form.usuarioNombre, form.usuarioApellido].filter(Boolean).join(' ') || '—'
                          : (() => { const u = usuariosLista.find(x => x.id === form.clienteId); return u ? `${u.nombre} ${u.apellido}` : '—' })())
                      : '—'],
                  ['Vehículo', form.marca ? `${form.marca} ${form.modelo} · ${form.placas}` : '—'],
                  ['Fecha / Hora', form.fecha ? `${form.fecha} · ${form.hora}` : '—'],
                  ['Ruta', form.origenCalle ? `${form.origenCalle} → ${form.destinoCalle}` : '—'],
                  ['Conductor', (() => { const c = conductoresLista.find(x => x.id === form.conductorId); return c ? `${c.nombre} ${c.apellido}` : 'Sin asignar' })()],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start gap-2 text-xs">
                    <span className="text-slate-400 w-20 flex-shrink-0">{label}</span>
                    <span className="font-medium text-slate-700 truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
          <button onClick={step === 1 ? onClose : prev}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">
            {step === 1 ? 'Cancelar' : '← Anterior'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Paso {step} de 4</span>
            {step < 4
              ? <button onClick={next} className="bg-rr-route hover:bg-rr-routeDark text-rr-asphalt px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  Siguiente →
                </button>
              : <button onClick={handleSubmit} disabled={guardando} className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                  <CheckCircleIcon className="w-4 h-4" />
                  {guardando ? 'Guardando...' : 'Registrar Viaje'}
                </button>
            }
          </div>
          {errorGuardar && (
            <p className="text-xs text-red-500 text-right mt-2 pr-1">{errorGuardar}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

// ─── TIPOS SUPABASE ───────────────────────────────────────────────────────────
type JoinOne<T> = T | T[] | null

function firstJoin<T>(value: JoinOne<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

interface ViajeDB {
  id: string
  folio: string | null
  conductor_id: string | null
  usuario_id: string | null
  empresa_id: string | null
  vehiculo_id: string | null
  status: StatusKey
  fecha_programada: string | null
  hora_programada: string | null
  origen_calle: string | null
  origen_numero: string | null
  origen_colonia: string | null
  origen_estado: string | null
  origen_cp: string | null
  origen_contacto: string | null
  origen_telefono: string | null
  destino_calle: string | null
  destino_numero: string | null
  destino_colonia: string | null
  destino_estado: string | null
  destino_cp: string | null
  destino_contacto: string | null
  destino_telefono: string | null
  referencias: string | null
  instrucciones: string | null
  tarifa_cliente: number
  pago_conductor: number
  gastos_extra: number | null
  gastos_autorizados: number | null
  ajustes: number | null
  observaciones_conductor: string | null
  revision_admin: string | null
  conductores: JoinOne<{ nombre: string; apellido: string }>
  usuarios: JoinOne<{ nombre: string; apellido: string }>
  empresas: JoinOne<{ nombre_comercial: string }>
  vehiculos: JoinOne<{ marca: string; modelo: string; placas: string; anio: string | null; color: string | null; vin: string | null; transmision: string | null; tipo_vehiculo: string | null; alias: string | null; observaciones: string | null }>
  tipos_servicio: JoinOne<{ nombre: string }>
  evidencias: { id: string; estatus: string | null }[] | null
  incidencias: { id: string; estatus: string | null }[] | null
}

function resumenEvidencias(evidencias: ViajeDB['evidencias']): Trip['evidencia'] {
  if (!evidencias?.length) return 'Pendiente'

  const estatuses = evidencias.map(e => e.estatus ?? 'Pendiente')
  if (estatuses.some(e => ['Incompleta', 'Rechazada', 'Relacionada con incidencia'].includes(e))) {
    return 'Incompleta'
  }
  if (estatuses.every(e => ['Completa', 'Aprobada'].includes(e))) return 'Completa'
  return 'Pendiente'
}

function viajeDBaTrip(v: ViajeDB): Trip {
  const conductor = firstJoin(v.conductores)
  const usuario = firstJoin(v.usuarios)
  const empresa = firstJoin(v.empresas)
  const vehiculo = firstJoin(v.vehiculos)
  const tipoServicio = firstJoin(v.tipos_servicio)

  return {
    id: v.folio ?? v.id.slice(0, 8).toUpperCase(),
    dbId: v.id,
    usuarioId: v.usuario_id ?? null,
    empresaId: v.empresa_id ?? null,
    vehiculoId: v.vehiculo_id ?? null,
    usuario: usuario ? `${usuario.nombre} ${usuario.apellido}` : '—',
    empresa: empresa?.nombre_comercial ?? '—',
    vehiculo: {
      marca: vehiculo?.marca ?? '—',
      modelo: vehiculo?.modelo ?? '—',
      anio: vehiculo?.anio ?? '—',
      color: vehiculo?.color ?? '—',
      placas: vehiculo?.placas ?? '—',
      vin: vehiculo?.vin ?? '—',
      transmision: vehiculo?.transmision ?? '—',
      observaciones: vehiculo?.observaciones ?? '',
    },
    tipoVehiculo: vehiculo?.tipo_vehiculo ?? '—',
    vehiculoAlias: vehiculo?.alias ?? '',
    origen: [v.origen_calle, v.origen_colonia].filter(Boolean).join(', '),
    origenDetalle: {
      calle: v.origen_calle ?? '—',
      numero: v.origen_numero ?? '—',
      colonia: v.origen_colonia ?? '—',
      estado: v.origen_estado ?? '—',
      cp: v.origen_cp ?? '—',
      contacto: v.origen_contacto ?? '—',
      telefono: v.origen_telefono ?? '—',
    },
    origenContacto: v.origen_contacto ?? '—',
    destino: [v.destino_calle, v.destino_colonia].filter(Boolean).join(', '),
    destinoDetalle: {
      calle: v.destino_calle ?? '—',
      numero: v.destino_numero ?? '—',
      colonia: v.destino_colonia ?? '—',
      estado: v.destino_estado ?? '—',
      cp: v.destino_cp ?? '—',
      contacto: v.destino_contacto ?? '—',
      telefono: v.destino_telefono ?? '—',
    },
    destinoContacto: v.destino_contacto ?? '—',
    referencias: v.referencias ?? '',
    instrucciones: v.instrucciones ?? '',
    fecha: v.fecha_programada ?? '—',
    hora: v.hora_programada ?? '—',
    conductor: conductor ? `${conductor.nombre} ${conductor.apellido}` : null,
    conductorId: v.conductor_id ?? null,
    status: v.status,
    tarifaCliente: v.tarifa_cliente ?? 0,
    pagoConductor: v.pago_conductor ?? 0,
    gastosExtra: v.gastos_extra ?? 0,
    gastosAutorizados: v.gastos_autorizados ?? 0,
    ajustes: v.ajustes ?? 0,
    evidencia: resumenEvidencias(v.evidencias),
    incidencias: v.incidencias?.length ?? 0,
    tipoServicio: tipoServicio?.nombre ?? '—',
    timeline: [], notas: [],
    observacionesConductor: v.observaciones_conductor ?? '',
    revisionAdmin: v.revision_admin ?? '',
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ViajesView() {
  const [activeTab, setActiveTab] = useState<TabId>('todos')
  const [search, setSearch] = useState('')
  const [actionTrip, setActionTrip] = useState<Trip | null>(null)
  const [detailTrip, setDetailTrip] = useState<Trip | null>(null)
  const [activeAction, setActiveAction] = useState<ActionId | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [cargando, setCargando] = useState(true)

  const cargarViajes = async () => {
    try {
      const data = await getViajes()
      setTrips((data as ViajeDB[]).map(viajeDBaTrip))
    } catch (e) {
      console.error('Error cargando viajes:', e)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarViajes()
  }, [])

  const tabs: { id: TabId; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendientes', label: 'Pendientes' },
    { id: 'programados', label: 'Programados' },
    { id: 'en-curso', label: 'En curso' },
    { id: 'finalizados', label: 'Finalizados' },
    { id: 'cancelados', label: 'Cancelados' },
    { id: 'revision', label: 'En revisión' },
  ]

  const filtered = trips.filter(t => {
    const allowedStatuses = tabStatusMap[activeTab]
    const matchTab = allowedStatuses.length === 0 || allowedStatuses.includes(t.status)
    const q = search.toLowerCase()
    const matchSearch = !q ||
      t.id.toLowerCase().includes(q) ||
      t.usuario.toLowerCase().includes(q) ||
      t.vehiculo.placas.toLowerCase().includes(q) ||
      (t.conductor?.toLowerCase().includes(q) ?? false)
    return matchTab && matchSearch
  })

  const counts: Record<TabId, number> = {
    todos: trips.length,
    pendientes: trips.filter(t => tabStatusMap.pendientes.includes(t.status)).length,
    programados: trips.filter(t => tabStatusMap.programados.includes(t.status)).length,
    'en-curso': trips.filter(t => tabStatusMap['en-curso'].includes(t.status)).length,
    finalizados: trips.filter(t => tabStatusMap.finalizados.includes(t.status)).length,
    cancelados: trips.filter(t => tabStatusMap.cancelados.includes(t.status)).length,
    revision: trips.filter(t => tabStatusMap.revision.includes(t.status)).length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showNewForm && (
        <NuevoViajeForm
          onClose={() => setShowNewForm(false)}
          onSave={() => { setShowNewForm(false); cargarViajes() }}
        />
      )}
      {detailTrip && <TripDetail trip={detailTrip} onClose={() => setDetailTrip(null)} />}
      {actionTrip && !activeAction && (
        <ActionMenu
          trip={actionTrip}
          onClose={() => setActionTrip(null)}
          onAction={(a) => {
            if (a === 'detalle') {
              setDetailTrip(actionTrip)
              setActionTrip(null)
            } else {
              setActiveAction(a)
            }
          }}
        />
      )}

      {actionTrip && activeAction === 'asignar-conductor' && (
        <AsignarConductorModal
          trip={actionTrip}
          onClose={() => { setActiveAction(null); setActionTrip(null) }}
          onSaved={cargarViajes}
        />
      )}
      {actionTrip && activeAction === 'editar-fecha' && (
        <EditarFechaModal
          trip={actionTrip}
          onClose={() => { setActiveAction(null); setActionTrip(null) }}
          onSaved={cargarViajes}
        />
      )}
      {actionTrip && activeAction === 'incidencia' && (
        <IncidenciaModal
          trip={actionTrip}
          onClose={() => { setActiveAction(null); setActionTrip(null) }}
          onSaved={cargarViajes}
        />
      )}
      {actionTrip && activeAction === 'nota' && (
        <NotaModal
          trip={actionTrip}
          onClose={() => { setActiveAction(null); setActionTrip(null) }}
          onSaved={cargarViajes}
        />
      )}
      {actionTrip && activeAction === 'finalizar' && (
        <ConfirmModal
          title={`Marcar como finalizado · ${actionTrip.id}`}
          message="¿Confirmas que este viaje fue completado? Esta acción actualizará su estatus a Finalizado."
          confirmLabel="Sí, finalizar"
          color="green"
          onClose={() => { setActiveAction(null); setActionTrip(null) }}
          onConfirm={async () => {
            await updateViajeStatus(actionTrip.dbId, 'Finalizado', { evento: 'Viaje cerrado' })
            setActiveAction(null)
            setActionTrip(null)
            cargarViajes()
          }}
        />
      )}
      {actionTrip && activeAction === 'cancelar' && (
        <ConfirmModal
          title={`Cancelar viaje · ${actionTrip.id}`}
          message="¿Confirmas que deseas cancelar este viaje? Esta acción no se puede revertir desde aquí."
          confirmLabel="Sí, cancelar"
          color="red"
          onClose={() => { setActiveAction(null); setActionTrip(null) }}
          onConfirm={async () => {
            await updateViajeStatus(actionTrip.dbId, 'Cancelado', { evento: 'Viaje cancelado' })
            setActiveAction(null)
            setActionTrip(null)
            cargarViajes()
          }}
        />
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 pt-5 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <div className="flex gap-1.5 overflow-x-auto flex-wrap">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>{counts[tab.id]}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar por ID, placa o conductor..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rr-route w-64" />
              </div>
              <button onClick={() => setShowNewForm(true)}
                className="bg-rr-route hover:bg-rr-routeDark text-rr-asphalt px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />Nuevo viaje
              </button>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="py-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-rr-route border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">Cargando viajes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Cliente / Empresa</th>
                  <th className="px-4 py-3">Vehículo</th>
                  <th className="px-4 py-3">Origen → Destino</th>
                  <th className="px-4 py-3">Fecha / Hora</th>
                  <th className="px-4 py-3">Conductor</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3 text-right">Tarifa</th>
                  <th className="px-4 py-3 text-right">Pago</th>
                  <th className="px-4 py-3 text-center">Evidencia</th>
                  <th className="px-4 py-3 text-center">Inc.</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-center py-12 text-slate-400 text-sm italic">
                      Sin viajes en esta categoría.
                    </td>
                  </tr>
                )}
                {filtered.map((trip, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-rr-trace whitespace-nowrap">{trip.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{trip.usuario}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[120px]">{trip.empresa}</div>
                      <div className="text-xs text-rr-trace truncate max-w-[120px]">{trip.tipoServicio}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-xs">{trip.vehiculo.marca} {trip.vehiculo.modelo}</div>
                      <div className="text-xs text-slate-400">{trip.vehiculo.placas}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <div className="text-xs text-slate-600 truncate">{trip.origen}</div>
                      <div className="text-xs text-slate-400 truncate">→ {trip.destino}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium">{trip.fecha}</div>
                      <div className="text-xs text-slate-400">{trip.hora}</div>
                    </td>
                    <td className="px-4 py-3">
                      {trip.conductor
                        ? <span className="text-xs font-medium text-slate-700">{trip.conductor}</span>
                        : <span className="text-xs text-red-500 italic">Sin asignar</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusStyle[trip.status]}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-slate-800">
                      ${trip.tarifaCliente.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      ${trip.pagoConductor.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${evidenciaStyle[trip.evidencia]}`}>
                        {trip.evidencia}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {trip.incidencias > 0
                        ? <span className="bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs font-bold">{trip.incidencias}</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setActionTrip(trip)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        Acciones ▾
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}