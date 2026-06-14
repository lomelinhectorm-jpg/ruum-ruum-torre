'use client'

import { useState } from 'react'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  BellAlertIcon,
  ArrowUpCircleIcon,
  DocumentArrowUpIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TipoIncidencia =
  | 'Daños reportados'
  | 'Retraso'
  | 'Falta de evidencia'
  | 'Contacto no disponible'
  | 'Problema con documentación'
  | 'Problema con pago'
  | 'Cancelación'
  | 'Diferencia de kilometraje'
  | 'Diferencia de combustible'
  | 'Problema con conductor'
  | 'Problema con usuario'
  | 'Otro'

type EstatusIncidencia =
  | 'Nueva'
  | 'En revisión'
  | 'Requiere información'
  | 'En seguimiento'
  | 'Resuelta'
  | 'Cerrada'
  | 'Escalada'

type Prioridad = 'Alta' | 'Media' | 'Baja'

interface NotaIncidencia { autor: string; texto: string; hora: string }
interface EventoTimeline { evento: string; hora: string; actor: string; tipo: 'sistema' | 'admin' | 'conductor' | 'usuario' }

interface Incidencia {
  id: string
  viajeId: string
  usuario: string
  conductor: string
  tipo: TipoIncidencia
  fecha: string
  hora: string
  descripcion: string
  evidenciaAsociada: string
  responsable: string
  estatus: EstatusIncidencia
  prioridad: Prioridad
  resolucion: string
  notas: NotaIncidencia[]
  documentos: string[]
  timeline: EventoTimeline[]
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const TIPOS: TipoIncidencia[] = [
  'Daños reportados','Retraso','Falta de evidencia','Contacto no disponible',
  'Problema con documentación','Problema con pago','Cancelación',
  'Diferencia de kilometraje','Diferencia de combustible',
  'Problema con conductor','Problema con usuario','Otro',
]

const RESPONSABLES = ['Ops. Central','Coordinador','Admin','Finanzas','Soporte']

const INCIDENCIAS: Incidencia[] = [
  {
    id: '#INC-001',
    viajeId: '#TR-8841',
    usuario: 'Luis Hernández',
    conductor: 'Ana Rodríguez',
    tipo: 'Daños reportados',
    fecha: '13 Jun 2025',
    hora: '16:30',
    descripcion: 'Rayón en puerta delantera derecha reportado por el conductor al recibir el vehículo. Cliente alega que el daño no existía antes del traslado.',
    evidenciaAsociada: 'EV-002',
    responsable: 'Ops. Central',
    estatus: 'Cerrada',
    prioridad: 'Alta',
    resolucion: 'Se revisaron fotografías de evidencia inicial y final. El rayón aparece en la foto inicial. Caso cerrado sin cargo.',
    notas: [
      { autor: 'Ops. Central', texto: 'Revisión de evidencia confirma que el daño preexistía.', hora: '17:00' },
      { autor: 'Admin', texto: 'Se notificó al cliente y al conductor. Caso cerrado.', hora: '17:35' },
    ],
    documentos: ['Fotos evidencia inicial', 'Fotos evidencia final'],
    timeline: [
      { evento: 'Incidencia creada', hora: '16:30', actor: 'Ana R.', tipo: 'conductor' },
      { evento: 'Asignada a Ops. Central', hora: '16:35', actor: 'Sistema', tipo: 'sistema' },
      { evento: 'Revisión de evidencia fotográfica', hora: '17:00', actor: 'Ops. Central', tipo: 'admin' },
      { evento: 'Conductor notificado', hora: '17:30', actor: 'Admin', tipo: 'admin' },
      { evento: 'Usuario notificado', hora: '17:32', actor: 'Admin', tipo: 'admin' },
      { evento: 'Resolución registrada', hora: '17:35', actor: 'Admin', tipo: 'admin' },
      { evento: 'Incidencia cerrada', hora: '17:35', actor: 'Admin', tipo: 'admin' },
    ],
  },
  {
    id: '#INC-002',
    viajeId: '#TR-8839',
    usuario: 'Ricardo Torres',
    conductor: 'Mario García',
    tipo: 'Retraso',
    fecha: '13 Jun 2025',
    hora: '14:45',
    descripcion: 'Retraso de 45 minutos en llegada al origen por tráfico en Periférico Norte. Cliente solicitó compensación.',
    evidenciaAsociada: '—',
    responsable: 'Coordinador',
    estatus: 'Resuelta',
    prioridad: 'Media',
    resolucion: 'Se ofreció descuento del 10% en próximo servicio. Cliente aceptó.',
    notas: [
      { autor: 'Coordinador', texto: 'El conductor avisó con 20 min de anticipación del retraso.', hora: '15:00' },
    ],
    documentos: [],
    timeline: [
      { evento: 'Incidencia creada', hora: '14:45', actor: 'Sistema', tipo: 'sistema' },
      { evento: 'Asignada a Coordinador', hora: '14:50', actor: 'Sistema', tipo: 'sistema' },
      { evento: 'Contacto con usuario', hora: '15:05', actor: 'Coordinador', tipo: 'admin' },
      { evento: 'Resolución: descuento en próximo servicio', hora: '15:20', actor: 'Coordinador', tipo: 'admin' },
      { evento: 'Incidencia resuelta', hora: '15:25', actor: 'Coordinador', tipo: 'admin' },
    ],
  },
  {
    id: '#INC-003',
    viajeId: '#TR-8838',
    usuario: 'Pedro Castillo',
    conductor: 'Sandra Pérez',
    tipo: 'Cancelación',
    fecha: '12 Jun 2025',
    hora: '10:00',
    descripcion: 'Cliente canceló el servicio con menos de 30 minutos de anticipación. Conductor ya se encontraba en camino.',
    evidenciaAsociada: '—',
    responsable: 'Admin',
    estatus: 'Cerrada',
    prioridad: 'Baja',
    resolucion: 'Se aplicó política de cancelación. Cliente acepta cargo del 50% de la tarifa.',
    notas: [
      { autor: 'Admin', texto: 'Revisar política de cancelación tardía con el cliente.', hora: '10:10' },
    ],
    documentos: ['Política de cancelación'],
    timeline: [
      { evento: 'Cancelación registrada', hora: '10:00', actor: 'Sistema', tipo: 'sistema' },
      { evento: 'Incidencia creada automáticamente', hora: '10:01', actor: 'Sistema', tipo: 'sistema' },
      { evento: 'Política de cancelación aplicada', hora: '10:10', actor: 'Admin', tipo: 'admin' },
      { evento: 'Usuario notificado del cargo', hora: '10:15', actor: 'Admin', tipo: 'admin' },
      { evento: 'Incidencia cerrada', hora: '10:30', actor: 'Admin', tipo: 'admin' },
    ],
  },
  {
    id: '#INC-004',
    viajeId: '#TR-8845',
    usuario: 'Fernanda López',
    conductor: 'Ana Rodríguez',
    tipo: 'Retraso',
    fecha: '14 Jun 2025',
    hora: '11:20',
    descripcion: 'Conductor lleva 20 minutos de retraso en llegada al origen. No hay respuesta en llamadas.',
    evidenciaAsociada: '—',
    responsable: 'Coordinador',
    estatus: 'En seguimiento',
    prioridad: 'Alta',
    resolucion: '',
    notas: [
      { autor: 'Coordinador', texto: 'Se intentó contactar al conductor 3 veces sin respuesta.', hora: '11:25' },
    ],
    documentos: [],
    timeline: [
      { evento: 'Alerta de retraso generada', hora: '11:10', actor: 'Sistema', tipo: 'sistema' },
      { evento: 'Incidencia creada', hora: '11:20', actor: 'Coordinador', tipo: 'admin' },
      { evento: 'Intentos de contacto al conductor (x3)', hora: '11:25', actor: 'Coordinador', tipo: 'admin' },
    ],
  },
  {
    id: '#INC-005',
    viajeId: '#TR-8844',
    usuario: 'Sandra Pérez (Empresa)',
    conductor: 'Pedro Castillo',
    tipo: 'Daños reportados',
    fecha: '14 Jun 2025',
    hora: '11:40',
    descripcion: 'Fisura en parabrisas se extendió durante el traslado. El conductor reporta que la fisura preexistía pero se agravó por las condiciones del camino.',
    evidenciaAsociada: 'EV-003',
    responsable: 'Ops. Central',
    estatus: 'En revisión',
    prioridad: 'Alta',
    resolucion: '',
    notas: [
      { autor: 'Coordinador', texto: 'En espera de respuesta de aseguradora antes de resolver.', hora: '12:10' },
      { autor: 'Ops. Central', texto: 'Se solicitó cotización de reparación al taller destino.', hora: '12:30' },
    ],
    documentos: ['Fotos evidencia EV-003', 'Solicitud cotización taller'],
    timeline: [
      { evento: 'Incidencia reportada por conductor', hora: '11:40', actor: 'Pedro C.', tipo: 'conductor' },
      { evento: 'Evidencia vinculada (EV-003)', hora: '12:05', actor: 'Coordinador', tipo: 'admin' },
      { evento: 'Asignada a Ops. Central', hora: '12:08', actor: 'Admin', tipo: 'admin' },
      { evento: 'Contacto con aseguradora iniciado', hora: '12:25', actor: 'Ops. Central', tipo: 'admin' },
      { evento: 'Cotización solicitada a taller', hora: '12:30', actor: 'Ops. Central', tipo: 'admin' },
    ],
  },
  {
    id: '#INC-006',
    viajeId: '#TR-8844',
    usuario: 'Sandra Pérez (Empresa)',
    conductor: 'Pedro Castillo',
    tipo: 'Diferencia de kilometraje',
    fecha: '14 Jun 2025',
    hora: '12:00',
    descripcion: 'El kilometraje final no fue registrado correctamente. Falta evidencia del odómetro al finalizar.',
    evidenciaAsociada: 'EV-003',
    responsable: 'Admin',
    estatus: 'Requiere información',
    prioridad: 'Media',
    resolucion: '',
    notas: [],
    documentos: [],
    timeline: [
      { evento: 'Incidencia creada', hora: '12:00', actor: 'Sistema', tipo: 'sistema' },
      { evento: 'Aclaración solicitada al conductor', hora: '12:05', actor: 'Admin', tipo: 'admin' },
    ],
  },
  {
    id: '#INC-007',
    viajeId: '#TR-8847',
    usuario: 'Claudia Ríos',
    conductor: 'Mario García',
    tipo: 'Problema con documentación',
    fecha: '14 Jun 2025',
    hora: '08:50',
    descripcion: 'Los antecedentes penales del conductor están vencidos. Viaje programado para mañana pero el documento no está vigente.',
    evidenciaAsociada: '—',
    responsable: 'Admin',
    estatus: 'Escalada',
    prioridad: 'Alta',
    resolucion: '',
    notas: [
      { autor: 'Admin', texto: 'Se escaló a coordinación para decidir si reasignar el viaje.', hora: '09:00' },
    ],
    documentos: ['Copia licencia vencida'],
    timeline: [
      { evento: 'Alerta de documento vencido detectada', hora: '08:45', actor: 'Sistema', tipo: 'sistema' },
      { evento: 'Incidencia creada', hora: '08:50', actor: 'Admin', tipo: 'admin' },
      { evento: 'Escalada a coordinación', hora: '09:00', actor: 'Admin', tipo: 'admin' },
    ],
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const estatusStyle: Record<EstatusIncidencia, string> = {
  'Nueva':                'bg-blue-100 text-blue-700',
  'En revisión':          'bg-purple-100 text-purple-700',
  'Requiere información': 'bg-amber-100 text-amber-700',
  'En seguimiento':       'bg-sky-100 text-sky-700',
  'Resuelta':             'bg-green-100 text-green-700',
  'Cerrada':              'bg-slate-100 text-slate-500',
  'Escalada':             'bg-red-100 text-red-700',
}

const estatusDot: Record<EstatusIncidencia, string> = {
  'Nueva':                'bg-blue-500',
  'En revisión':          'bg-purple-500',
  'Requiere información': 'bg-amber-500',
  'En seguimiento':       'bg-sky-500',
  'Resuelta':             'bg-green-500',
  'Cerrada':              'bg-slate-400',
  'Escalada':             'bg-red-500',
}

const prioridadStyle: Record<Prioridad, string> = {
  Alta:  'bg-red-50 text-red-700 border border-red-200',
  Media: 'bg-amber-50 text-amber-700 border border-amber-200',
  Baja:  'bg-slate-50 text-slate-500 border border-slate-200',
}

const tipoIcon: Record<TipoIncidencia, string> = {
  'Daños reportados':          '🚗',
  'Retraso':                   '⏱️',
  'Falta de evidencia':        '📷',
  'Contacto no disponible':    '📵',
  'Problema con documentación':'📄',
  'Problema con pago':         '💳',
  'Cancelación':               '🚫',
  'Diferencia de kilometraje': '🛣️',
  'Diferencia de combustible': '⛽',
  'Problema con conductor':    '👤',
  'Problema con usuario':      '👥',
  'Otro':                      '❓',
}

const timelineColor: Record<string, string> = {
  sistema:   'bg-slate-400',
  admin:     'bg-blue-500',
  conductor: 'bg-purple-500',
  usuario:   'bg-green-500',
}

const TODOS_ESTATUS: (EstatusIncidencia | 'Todos')[] = [
  'Todos','Nueva','En revisión','Requiere información','En seguimiento','Resuelta','Cerrada','Escalada',
]

// ─── MODAL DETALLE ────────────────────────────────────────────────────────────
function IncidenciaDetalle({ inc, onClose }: { inc: Incidencia; onClose: () => void }) {
  const [estatus, setEstatus]       = useState<EstatusIncidencia>(inc.estatus)
  const [responsable, setResponsable] = useState(inc.responsable)
  const [resolucion, setResolucion] = useState(inc.resolucion)
  const [editRes, setEditRes]       = useState(false)
  const [notas, setNotas]           = useState(inc.notas)
  const [nuevaNota, setNuevaNota]   = useState('')
  const [docs, setDocs]             = useState(inc.documentos)
  const [nuevoDoc, setNuevoDoc]     = useState('')
  const [timeline, setTimeline]     = useState(inc.timeline)
  const [showNotif, setShowNotif]   = useState<'usuario' | 'conductor' | null>(null)
  const [notifMsg, setNotifMsg]     = useState('')

  const addTimeline = (evento: string, tipo: 'admin' | 'sistema' = 'admin') =>
    setTimeline(t => [...t, { evento, hora: 'Ahora', actor: 'Admin', tipo }])

  const addNota = () => {
    if (!nuevaNota.trim()) return
    setNotas(n => [...n, { autor: 'Admin', texto: nuevaNota.trim(), hora: 'Ahora' }])
    addTimeline('Nota interna agregada')
    setNuevaNota('')
  }

  const addDoc = () => {
    if (!nuevoDoc.trim()) return
    setDocs(d => [...d, nuevoDoc.trim()])
    addTimeline(`Documento asociado: ${nuevoDoc.trim()}`)
    setNuevoDoc('')
  }

  const cambiarEstatus = (e: EstatusIncidencia) => {
    setEstatus(e)
    addTimeline(`Estatus cambiado a: ${e}`)
  }

  const enviarNotif = (dest: 'usuario' | 'conductor') => {
    if (!notifMsg.trim()) return
    addTimeline(`${dest === 'usuario' ? 'Usuario' : 'Conductor'} notificado`)
    setNotifMsg('')
    setShowNotif(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl">

        {/* Header */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
                <ChevronLeftIcon className="w-4 h-4 text-slate-500" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-slate-800 text-lg">{inc.id}</h2>
                  <span className="text-2xl">{tipoIcon[inc.tipo]}</span>
                  <span className="font-medium text-slate-600 text-sm">{inc.tipo}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${estatusStyle[estatus]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${estatusDot[estatus]}`} />
                    {estatus}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${prioridadStyle[inc.prioridad]}`}>
                    {inc.prioridad} prioridad
                  </span>
                  <span className="text-xs text-slate-400">{inc.viajeId} · {inc.fecha} {inc.hora}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
          </div>

          {/* Acciones rápidas */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            <button onClick={() => { }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
              <UserPlusIcon className="w-3.5 h-3.5" />Asignar responsable
            </button>
            <button onClick={() => setEditRes(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <CheckCircleIcon className="w-3.5 h-3.5" />Registrar resolución
            </button>
            <button onClick={() => setShowNotif('usuario')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <BellAlertIcon className="w-3.5 h-3.5" />Notificar usuario
            </button>
            <button onClick={() => setShowNotif('conductor')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <BellAlertIcon className="w-3.5 h-3.5" />Notificar conductor
            </button>
            <button onClick={() => cambiarEstatus('Escalada')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <ArrowUpCircleIcon className="w-3.5 h-3.5" />Escalar
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Notificación modal inline */}
          {showNotif && (
            <div className="bg-white rounded-xl border-2 border-blue-200 p-5 space-y-3">
              <p className="font-semibold text-slate-800 text-sm">
                Notificar al {showNotif === 'usuario' ? `usuario — ${inc.usuario}` : `conductor — ${inc.conductor}`}
              </p>
              <textarea rows={3} value={notifMsg} onChange={e => setNotifMsg(e.target.value)}
                placeholder={`Escribe el mensaje para el ${showNotif}...`}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowNotif(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button onClick={() => enviarNotif(showNotif)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors">
                  <PaperAirplaneIcon className="w-3.5 h-3.5" />Enviar notificación
                </button>
              </div>
            </div>
          )}

          {/* ── INFO PRINCIPAL ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">📋 Información de la Incidencia</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
              <F label="ID Interno" value={inc.id} />
              <F label="Viaje relacionado" value={<span className="font-semibold text-blue-600">{inc.viajeId}</span>} />
              <F label="Tipo" value={<span className="flex items-center gap-1">{tipoIcon[inc.tipo]} {inc.tipo}</span>} />
              <F label="Usuario" value={inc.usuario} />
              <F label="Conductor" value={inc.conductor} />
              <F label="Fecha y hora" value={`${inc.fecha} · ${inc.hora}`} />
              <F label="Evidencia asociada" value={inc.evidenciaAsociada !== '—'
                ? <span className="text-purple-600 font-semibold">{inc.evidenciaAsociada}</span>
                : <span className="text-slate-300">Sin evidencia</span>} />
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Responsable interno</p>
                <select value={responsable} onChange={e => { setResponsable(e.target.value); addTimeline(`Responsable cambiado a ${e.target.value}`) }}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full">
                  {RESPONSABLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <F label="Prioridad" value={<span className={`px-2 py-1 rounded text-xs font-semibold ${prioridadStyle[inc.prioridad]}`}>{inc.prioridad}</span>} />
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Descripción</p>
              <p className="text-sm text-slate-700 leading-relaxed">{inc.descripcion}</p>
            </div>
          </div>

          {/* ── ESTATUS ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <ArrowPathIcon className="w-4 h-4 text-slate-400" />
              Cambiar Estatus
            </h3>
            <div className="flex flex-wrap gap-2">
              {(['Nueva','En revisión','Requiere información','En seguimiento','Resuelta','Cerrada','Escalada'] as EstatusIncidencia[]).map(e => (
                <button key={e} onClick={() => cambiarEstatus(e)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    estatus === e
                      ? estatusStyle[e] + ' border-current shadow-sm'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${estatusDot[e]}`} />
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* ── RESOLUCIÓN ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              Resolución
            </h3>
            {editRes ? (
              <div className="space-y-3">
                <textarea rows={3} value={resolucion} onChange={e => setResolucion(e.target.value)}
                  placeholder="Describe cómo se resolvió la incidencia..."
                  className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditRes(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button onClick={() => {
                    setEditRes(false)
                    cambiarEstatus('Resuelta')
                    addTimeline('Resolución registrada')
                  }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors">
                    <CheckCircleIcon className="w-3.5 h-3.5" />Guardar resolución
                  </button>
                </div>
              </div>
            ) : (
              <div className={`rounded-xl border p-3 text-sm cursor-pointer transition-colors hover:border-green-300 ${resolucion ? 'bg-green-50 border-green-100 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-400 italic'}`}
                onClick={() => setEditRes(true)}>
                {resolucion || 'Sin resolución registrada. Clic para agregar.'}
              </div>
            )}
          </div>

          {/* ── NOTAS ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-slate-400" />
              Notas Internas
            </h3>
            <div className="space-y-2 mb-4">
              {notas.length === 0 && <p className="text-xs text-slate-400 italic">Sin notas aún.</p>}
              {notas.map((n, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700">{n.autor} · {n.hora}</p>
                  <p className="text-sm text-slate-700 mt-0.5">{n.texto}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={nuevaNota} onChange={e => setNuevaNota(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNota()}
                placeholder="Agregar nota interna..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <button onClick={addNota} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg transition-colors">
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── DOCUMENTOS ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <DocumentArrowUpIcon className="w-4 h-4 text-slate-400" />
              Documentos Asociados
            </h3>
            <div className="space-y-2 mb-4">
              {docs.length === 0 && <p className="text-xs text-slate-400 italic">Sin documentos asociados.</p>}
              {docs.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-700">📎 {d}</span>
                  <button className="text-xs text-blue-600 hover:underline">Ver</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={nuevoDoc} onChange={e => setNuevoDoc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDoc()}
                placeholder="Nombre del documento..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={addDoc} className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-lg transition-colors">
                <DocumentArrowUpIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── TIMELINE ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-slate-400" />
              Historial de Actividad
            </h3>
            <ol className="relative border-l-2 border-slate-200 space-y-4 ml-3">
              {timeline.map((t, i) => (
                <li key={i} className="ml-5">
                  <span className={`absolute -left-2 w-4 h-4 rounded-full flex items-center justify-center ${timelineColor[t.tipo]}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                  <p className="text-sm font-medium text-slate-800">{t.evento}</p>
                  <p className="text-xs text-slate-400">{t.hora} · <span className={`font-medium ${
                    t.tipo === 'conductor' ? 'text-purple-600' :
                    t.tipo === 'usuario' ? 'text-green-600' :
                    t.tipo === 'sistema' ? 'text-slate-500' : 'text-blue-600'
                  }`}>{t.actor}</span></p>
                </li>
              ))}
            </ol>
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-slate-400">
              {[['admin','bg-blue-500','Admin'],['conductor','bg-purple-500','Conductor'],['usuario','bg-green-500','Usuario'],['sistema','bg-slate-400','Sistema']].map(([tipo, color, label]) => (
                <span key={tipo} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── NUEVA INCIDENCIA FORM ────────────────────────────────────────────────────
function NuevaIncidenciaForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    viajeId: '', usuario: '', conductor: '', tipo: '' as TipoIncidencia | '',
    fecha: '', hora: '', descripcion: '', evidencia: '', responsable: '', prioridad: '' as Prioridad | '',
  })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.viajeId)     e.viajeId     = 'Requerido'
    if (!form.tipo)        e.tipo        = 'Requerido'
    if (!form.fecha)       e.fecha       = 'Requerido'
    if (!form.descripcion) e.descripcion = 'Requerido'
    if (!form.prioridad)   e.prioridad   = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const I = (k: keyof typeof form) =>
    `w-full border ${errors[k] ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`
  const E = ({ k }: { k: keyof typeof form }) => errors[k] ? <p className="text-xs text-red-500 mt-0.5">{errors[k]}</p> : null
  const L = ({ c, req }: { c: React.ReactNode; req?: boolean }) => (
    <label className="block text-xs font-medium text-slate-500 mb-1">{c}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Registrar Incidencia</h2>
            <p className="text-xs text-slate-400">Se creará en estatus "Nueva"</p>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <L c="Viaje relacionado" req />
              <input type="text" value={form.viajeId} onChange={e => set('viajeId', e.target.value)} placeholder="#TR-0000" className={I('viajeId')} />
              <E k="viajeId" />
            </div>
            <div>
              <L c="Tipo de incidencia" req />
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={I('tipo')}>
                <option value="">Seleccionar...</option>
                {TIPOS.map(t => <option key={t} value={t}>{tipoIcon[t]} {t}</option>)}
              </select>
              <E k="tipo" />
            </div>
            <div>
              <L c="Usuario" />
              <input type="text" value={form.usuario} onChange={e => set('usuario', e.target.value)} placeholder="Nombre del usuario" className={I('usuario')} />
            </div>
            <div>
              <L c="Conductor" />
              <input type="text" value={form.conductor} onChange={e => set('conductor', e.target.value)} placeholder="Nombre del conductor" className={I('conductor')} />
            </div>
            <div>
              <L c="Fecha" req />
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className={I('fecha')} />
              <E k="fecha" />
            </div>
            <div>
              <L c="Hora" />
              <input type="time" value={form.hora} onChange={e => set('hora', e.target.value)} className={I('hora')} />
            </div>
            <div>
              <L c="Prioridad" req />
              <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)} className={I('prioridad')}>
                <option value="">Seleccionar...</option>
                {(['Alta','Media','Baja'] as Prioridad[]).map(p => <option key={p}>{p}</option>)}
              </select>
              <E k="prioridad" />
            </div>
            <div>
              <L c="Responsable" />
              <select value={form.responsable} onChange={e => set('responsable', e.target.value)} className={I('responsable')}>
                <option value="">Sin asignar</option>
                {RESPONSABLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <L c="Evidencia asociada" />
              <input type="text" value={form.evidencia} onChange={e => set('evidencia', e.target.value)} placeholder="Ej. EV-001" className={I('evidencia')} />
            </div>
          </div>
          <div>
            <L c="Descripción" req />
            <textarea rows={4} value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Describe con detalle lo ocurrido..."
              className={I('descripcion')} />
            <E k="descripcion" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={() => { if (validate()) onClose() }}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <ExclamationTriangleIcon className="w-4 h-4" />
            Registrar incidencia
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function F({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm text-slate-700">{value}</div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function IncidenciasView() {
  const [search, setSearch]         = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusIncidencia | 'Todos'>('Todos')
  const [filtroTipo, setFiltroTipo] = useState<TipoIncidencia | 'Todos'>('Todos')
  const [filtroPrio, setFiltroPrio] = useState<Prioridad | 'Todos'>('Todos')
  const [detalle, setDetalle]       = useState<Incidencia | null>(null)
  const [showForm, setShowForm]     = useState(false)

  const filtered = INCIDENCIAS.filter(inc => {
    const q = search.toLowerCase()
    const matchSearch = !q || inc.id.toLowerCase().includes(q) || inc.viajeId.toLowerCase().includes(q) ||
      inc.usuario.toLowerCase().includes(q) || inc.conductor.toLowerCase().includes(q) || inc.tipo.toLowerCase().includes(q)
    const matchEstatus = filtroEstatus === 'Todos' || inc.estatus === filtroEstatus
    const matchTipo    = filtroTipo    === 'Todos' || inc.tipo    === filtroTipo
    const matchPrio    = filtroPrio    === 'Todos' || inc.prioridad === filtroPrio
    return matchSearch && matchEstatus && matchTipo && matchPrio
  })

  const counts = TODOS_ESTATUS.reduce((acc, e) => {
    acc[e] = e === 'Todos' ? INCIDENCIAS.length : INCIDENCIAS.filter(i => i.estatus === e).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6 animate-fade-in">
      {showForm && <NuevaIncidenciaForm onClose={() => setShowForm(false)} />}
      {detalle && <IncidenciaDetalle inc={detalle} onClose={() => setDetalle(null)} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {([
          ['Total',                INCIDENCIAS.length,                                        'text-slate-800'],
          ['Nuevas',               counts['Nueva'],                                            'text-blue-600'],
          ['En revisión',          counts['En revisión'],                                      'text-purple-600'],
          ['Requiere info',        counts['Requiere información'],                             'text-amber-600'],
          ['En seguimiento',       counts['En seguimiento'],                                   'text-sky-600'],
          ['Resueltas',            counts['Resuelta'],                                         'text-green-600'],
          ['Escaladas',            counts['Escalada'],                                         'text-red-600'],
        ] as [string,number,string][]).map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros + tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 space-y-3">
          {/* Estatus chips */}
          <div className="flex flex-wrap gap-1.5">
            {TODOS_ESTATUS.map(e => (
              <button key={e} onClick={() => setFiltroEstatus(e as EstatusIncidencia | 'Todos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filtroEstatus === e ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {e !== 'Todos' && <span className={`w-1.5 h-1.5 rounded-full ${filtroEstatus === e ? 'bg-white' : estatusDot[e as EstatusIncidencia]}`} />}
                {e} <span className={`text-xs ${filtroEstatus === e ? 'text-white/60' : 'text-slate-400'}`}>{counts[e]}</span>
              </button>
            ))}
          </div>

          {/* Tipo + prioridad + search + new */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as TipoIncidencia | 'Todos')}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="Todos">Todos los tipos</option>
                {TIPOS.map(t => <option key={t} value={t}>{tipoIcon[t]} {t}</option>)}
              </select>
              <select value={filtroPrio} onChange={e => setFiltroPrio(e.target.value as Prioridad | 'Todos')}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="Todos">Toda prioridad</option>
                {(['Alta','Media','Baja'] as Prioridad[]).map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar incidencia..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
              </div>
              <button onClick={() => setShowForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />Nueva
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Viaje</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Usuario / Conductor</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3">Evidencia</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-slate-400 italic text-sm">Sin incidencias en esta categoría.</td></tr>
              )}
              {filtered.map((inc, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setDetalle(inc)}>
                  <td className="px-4 py-3 font-semibold text-slate-700">{inc.id}</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">{inc.viajeId}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                      <span>{tipoIcon[inc.tipo]}</span>{inc.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-slate-700">{inc.usuario}</div>
                    <div className="text-xs text-slate-400">{inc.conductor}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{inc.fecha}<br />{inc.hora}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{inc.responsable}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${prioridadStyle[inc.prioridad]}`}>{inc.prioridad}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${estatusStyle[inc.estatus]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${estatusDot[inc.estatus]}`} />
                      {inc.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inc.evidenciaAsociada !== '—'
                      ? <span className="text-purple-600 font-semibold text-xs">{inc.evidenciaAsociada}</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setDetalle(inc)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
