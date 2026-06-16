'use client'

import { useState, useEffect } from 'react'
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
  | 'Pendiente de revisión'
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

interface Trip {
  id: string
  usuario: string
  empresa: string
  vehiculo: { marca: string; modelo: string; anio: string; color: string; placas: string; vin: string; transmision: string; observaciones: string }
  origen: string
  origenContacto: string
  destino: string
  destinoContacto: string
  referencias: string
  instrucciones: string
  fecha: string
  hora: string
  conductor: string | null
  status: StatusKey
  tarifaCliente: number
  pagoConductor: number
  gastosExtra: number
  gastosAutorizados: number
  ajustes: number
  evidencia: 'Completa' | 'Incompleta' | 'Pendiente'
  incidencias: number
  tipoServicio: string
  timeline: { evento: string; hora: string; actor: string }[]
  notas: { autor: string; texto: string; hora: string }[]
  observacionesConductor: string
  revisionAdmin: string
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const TRIPS: Trip[] = [
  {
    id: '#TR-8848',
    usuario: 'Fernanda López',
    empresa: 'AutoMóviles del Norte SA',
    vehiculo: { marca: 'Toyota', modelo: 'Hilux', anio: '2022', color: 'Blanco', placas: 'XYZ-987', vin: '1HGBH41JXMN109186', transmision: 'Automática', observaciones: 'Ligero raspón en defensa trasera' },
    origen: 'Av. Reforma 222, CDMX',
    origenContacto: 'Jorge Reyes · +52 55 1111 2222',
    destino: 'Taller Norte, Satélite',
    destinoContacto: 'Recepción Taller · +52 55 3333 4444',
    referencias: 'Frente a la estación de metro Hidalgo',
    instrucciones: 'Llamar al contacto 10 min antes de llegar.',
    fecha: '14 Jun 2025',
    hora: '12:00',
    conductor: 'Carlos Méndez',
    status: 'Traslado en curso',
    tarifaCliente: 1200,
    pagoConductor: 700,
    gastosExtra: 50,
    gastosAutorizados: 50,
    ajustes: 0,
    evidencia: 'Completa',
    incidencias: 0,
    tipoServicio: 'Traslado de vehículo',
    timeline: [
      { evento: 'Solicitud creada', hora: '08:15', actor: 'Sistema' },
      { evento: 'Viaje revisado por operaciones', hora: '08:30', actor: 'Admin' },
      { evento: 'Conductor asignado', hora: '08:45', actor: 'Admin' },
      { evento: 'Conductor aceptó el viaje', hora: '09:00', actor: 'Carlos M.' },
      { evento: 'Llegada al origen', hora: '11:45', actor: 'Carlos M.' },
      { evento: 'Evidencia inicial cargada', hora: '11:55', actor: 'Carlos M.' },
      { evento: 'Traslado iniciado', hora: '12:00', actor: 'Carlos M.' },
    ],
    notas: [
      { autor: 'Ops. Central', texto: 'Cliente VIP. Prioridad en atención.', hora: '08:20' },
    ],
    observacionesConductor: 'Vehículo entregado con lleno de gasolina.',
    revisionAdmin: '',
  },
  {
    id: '#TR-8849',
    usuario: 'Ricardo Torres',
    empresa: 'Grupo Logístico CDMX',
    vehiculo: { marca: 'Honda', modelo: 'Civic', anio: '2020', color: 'Gris', placas: 'DEF-456', vin: '2T1BURHE0JC016885', transmision: 'Manual', observaciones: '' },
    origen: 'Agencia Sur, Coyoacán',
    origenContacto: 'Sofía Luna · +52 55 5555 6666',
    destino: 'Domicilio Cliente, Tlalpan',
    destinoContacto: 'Ricardo Torres · +52 55 7777 8888',
    referencias: 'Casa color beige, portón azul',
    instrucciones: 'No hay estacionamiento frente al domicilio.',
    fecha: '14 Jun 2025',
    hora: '13:00',
    conductor: null,
    status: 'Pendiente de asignación',
    tarifaCliente: 850,
    pagoConductor: 500,
    gastosExtra: 0,
    gastosAutorizados: 0,
    ajustes: 0,
    evidencia: 'Pendiente',
    incidencias: 0,
    tipoServicio: 'Entrega de vehículo',
    timeline: [
      { evento: 'Solicitud creada', hora: '10:00', actor: 'Sistema' },
      { evento: 'Viaje revisado por operaciones', hora: '10:20', actor: 'Admin' },
    ],
    notas: [],
    observacionesConductor: '',
    revisionAdmin: '',
  },
  {
    id: '#TR-8841',
    usuario: 'Luis Hernández',
    empresa: '—',
    vehiculo: { marca: 'Nissan', modelo: 'Versa', anio: '2021', color: 'Rojo', placas: 'ABC-123', vin: '3VWSE69M77M000001', transmision: 'Automática', observaciones: '' },
    origen: 'Taller Oriente, Iztapalapa',
    origenContacto: 'Marco López · +52 55 2222 3333',
    destino: 'Estacionamiento Central, Roma Norte',
    destinoContacto: 'Luis H. · +52 55 9999 0000',
    referencias: 'Estacionamiento público subterráneo',
    instrucciones: 'Preguntar por Diego en la caseta.',
    fecha: '13 Jun 2025',
    hora: '16:00',
    conductor: 'Ana Rodríguez',
    status: 'Finalizado',
    tarifaCliente: 650,
    pagoConductor: 380,
    gastosExtra: 30,
    gastosAutorizados: 30,
    ajustes: -50,
    evidencia: 'Completa',
    incidencias: 1,
    tipoServicio: 'Traslado de vehículo',
    timeline: [
      { evento: 'Solicitud creada', hora: '12:00', actor: 'Sistema' },
      { evento: 'Viaje revisado por operaciones', hora: '12:15', actor: 'Admin' },
      { evento: 'Conductor asignado', hora: '12:30', actor: 'Admin' },
      { evento: 'Conductor aceptó el viaje', hora: '12:45', actor: 'Ana R.' },
      { evento: 'Llegada al origen', hora: '15:50', actor: 'Ana R.' },
      { evento: 'Evidencia inicial cargada', hora: '15:58', actor: 'Ana R.' },
      { evento: 'Traslado iniciado', hora: '16:00', actor: 'Ana R.' },
      { evento: 'Incidencia reportada (#INC-001)', hora: '16:30', actor: 'Ana R.' },
      { evento: 'Llegada a destino', hora: '17:10', actor: 'Ana R.' },
      { evento: 'Evidencia final cargada', hora: '17:18', actor: 'Ana R.' },
      { evento: 'Entrega confirmada', hora: '17:20', actor: 'Ana R.' },
      { evento: 'Viaje cerrado', hora: '17:25', actor: 'Admin' },
    ],
    notas: [
      { autor: 'Ops. Central', texto: 'Ajuste de $50 aplicado por retraso.', hora: '17:26' },
    ],
    observacionesConductor: 'El vehículo presentaba el tanque vacío al recibirlo.',
    revisionAdmin: 'Incidencia validada. Ajuste aprobado.',
  },
  {
    id: '#TR-8847',
    usuario: 'Claudia Ríos',
    empresa: 'Distribuidora Bajío',
    vehiculo: { marca: 'Ford', modelo: 'F-150', anio: '2023', color: 'Negro', placas: 'GHI-321', vin: '1FTFW1ET5DFB08474', transmision: 'Automática', observaciones: 'Llantas nuevas instaladas esta semana' },
    origen: 'Distribuidora Bajío, Querétaro',
    origenContacto: 'Claudia Ríos · +52 46 2222 3333',
    destino: 'Agencia Principal, CDMX',
    destinoContacto: 'Recepción · +52 55 4444 5555',
    referencias: 'Entrada por calle lateral',
    instrucciones: 'Solicitar firma de recepción obligatoria.',
    fecha: '15 Jun 2025',
    hora: '09:00',
    conductor: 'Mario García',
    status: 'Conductor asignado',
    tarifaCliente: 2200,
    pagoConductor: 1300,
    gastosExtra: 0,
    gastosAutorizados: 150,
    ajustes: 0,
    evidencia: 'Pendiente',
    incidencias: 0,
    tipoServicio: 'Traslado largo recorrido',
    timeline: [
      { evento: 'Solicitud creada', hora: 'Ayer 17:00', actor: 'Sistema' },
      { evento: 'Viaje revisado por operaciones', hora: 'Ayer 17:30', actor: 'Admin' },
      { evento: 'Conductor asignado', hora: 'Ayer 18:00', actor: 'Admin' },
      { evento: 'Conductor aceptó el viaje', hora: 'Ayer 18:15', actor: 'Mario G.' },
    ],
    notas: [
      { autor: 'Coordinador', texto: 'Autorizar $150 de casetas y gasolina.', hora: 'Ayer 18:05' },
    ],
    observacionesConductor: '',
    revisionAdmin: '',
  },
  {
    id: '#TR-8838',
    usuario: 'Pedro Castillo',
    empresa: '—',
    vehiculo: { marca: 'Volkswagen', modelo: 'Jetta', anio: '2019', color: 'Azul', placas: 'JKL-654', vin: '9BWZZZ377VT004251', transmision: 'Manual', observaciones: '' },
    origen: 'Col. Del Valle, CDMX',
    origenContacto: 'Pedro C. · +52 55 6666 7777',
    destino: 'Taller Express, Naucalpan',
    destinoContacto: 'Taller · +52 55 8888 9999',
    referencias: 'A un costado del Walmart',
    instrucciones: '',
    fecha: '12 Jun 2025',
    hora: '10:30',
    conductor: 'Sandra Pérez',
    status: 'Cancelado',
    tarifaCliente: 550,
    pagoConductor: 0,
    gastosExtra: 0,
    gastosAutorizados: 0,
    ajustes: -550,
    evidencia: 'Pendiente',
    incidencias: 0,
    tipoServicio: 'Traslado de vehículo',
    timeline: [
      { evento: 'Solicitud creada', hora: '09:00', actor: 'Sistema' },
      { evento: 'Viaje revisado por operaciones', hora: '09:15', actor: 'Admin' },
      { evento: 'Conductor asignado', hora: '09:30', actor: 'Admin' },
      { evento: 'Viaje cancelado por cliente', hora: '10:00', actor: 'Pedro C.' },
    ],
    notas: [
      { autor: 'Admin', texto: 'Cliente canceló con menos de 30 min. Revisar política de cobro.', hora: '10:05' },
    ],
    observacionesConductor: '',
    revisionAdmin: 'Cancelación aceptada sin cargo.',
  },
  {
    id: '#TR-8844',
    usuario: 'Sandra Pérez',
    empresa: 'AutoMóviles del Norte SA',
    vehiculo: { marca: 'Chevrolet', modelo: 'Trax', anio: '2022', color: 'Plata', placas: 'MNO-789', vin: '3GNKBCRSXGS500001', transmision: 'Automática', observaciones: 'Parabrisas con fisura leve' },
    origen: 'Taller Sur, Xochimilco',
    origenContacto: 'Taller Sur · +52 55 1234 0000',
    destino: 'Agencia Norte, Gustavo A. Madero',
    destinoContacto: 'Agencia · +52 55 0000 9999',
    referencias: 'Edificio rojo frente al metro',
    instrucciones: 'Verificar fisura con el responsable de agencia al entregar.',
    fecha: '14 Jun 2025',
    hora: '11:00',
    conductor: 'Pedro Castillo',
    status: 'En revisión por incidencia',
    tarifaCliente: 950,
    pagoConductor: 560,
    gastosExtra: 80,
    gastosAutorizados: 0,
    ajustes: 0,
    evidencia: 'Incompleta',
    incidencias: 2,
    tipoServicio: 'Traslado de vehículo',
    timeline: [
      { evento: 'Solicitud creada', hora: '07:00', actor: 'Sistema' },
      { evento: 'Viaje revisado por operaciones', hora: '07:20', actor: 'Admin' },
      { evento: 'Conductor asignado', hora: '07:35', actor: 'Admin' },
      { evento: 'Conductor aceptó el viaje', hora: '07:50', actor: 'Pedro C.' },
      { evento: 'Llegada al origen', hora: '10:55', actor: 'Pedro C.' },
      { evento: 'Evidencia inicial cargada', hora: '11:02', actor: 'Pedro C.' },
      { evento: 'Traslado iniciado', hora: '11:05', actor: 'Pedro C.' },
      { evento: 'Incidencia reportada (#INC-005)', hora: '11:40', actor: 'Pedro C.' },
      { evento: 'Incidencia reportada (#INC-006)', hora: '12:00', actor: 'Pedro C.' },
    ],
    notas: [
      { autor: 'Coordinador', texto: 'En espera de resolución de incidencias antes de cerrar viaje.', hora: '12:10' },
    ],
    observacionesConductor: 'La fisura del parabrisas se amplió durante el traslado. Reporté al cliente de destino.',
    revisionAdmin: 'Pendiente de validación con aseguradora.',
  },
]

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const statusStyle: Record<string, string> = {
  'Solicitud recibida': 'bg-slate-100 text-slate-600',
  'Pendiente de revisión': 'bg-slate-100 text-slate-600',
  'Pendiente de asignación': 'bg-amber-100 text-amber-700',
  'Conductor asignado': 'bg-blue-100 text-blue-700',
  'Conductor en camino': 'bg-blue-100 text-blue-700',
  'Recolección en proceso': 'bg-indigo-100 text-indigo-700',
  'Evidencia inicial pendiente': 'bg-orange-100 text-orange-700',
  'Traslado en curso': 'bg-purple-100 text-purple-700',
  'Entrega en proceso': 'bg-violet-100 text-violet-700',
  'Evidencia final pendiente': 'bg-orange-100 text-orange-700',
  'Finalizado': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-600',
  'En revisión por incidencia': 'bg-rose-100 text-rose-700',
}

const tabStatusMap: Record<TabId, StatusKey[]> = {
  todos: [],
  pendientes: ['Solicitud recibida', 'Pendiente de revisión', 'Pendiente de asignación'],
  programados: ['Conductor asignado'],
  'en-curso': ['Conductor en camino', 'Recolección en proceso', 'Evidencia inicial pendiente', 'Traslado en curso', 'Entrega en proceso', 'Evidencia final pendiente'],
  finalizados: ['Finalizado'],
  cancelados: ['Cancelado'],
  revision: ['En revisión por incidencia'],
}

const evidenciaStyle: Record<string, string> = {
  Completa: 'bg-green-50 text-green-700',
  Incompleta: 'bg-amber-50 text-amber-700',
  Pendiente: 'bg-slate-100 text-slate-500',
}

// ─── ALL STATUS OPTIONS ───────────────────────────────────────────────────────
const ALL_STATUSES: StatusKey[] = [
  'Solicitud recibida', 'Pendiente de revisión', 'Pendiente de asignación',
  'Conductor asignado', 'Conductor en camino', 'Recolección en proceso',
  'Evidencia inicial pendiente', 'Traslado en curso', 'Entrega en proceso',
  'Evidencia final pendiente', 'Finalizado', 'Cancelado', 'En revisión por incidencia',
]

// ─── MODAL COMPONENTS ─────────────────────────────────────────────────────────
function ActionMenu({ trip, onClose, onOpenDetail }: { trip: Trip; onClose: () => void; onOpenDetail: () => void }) {
  const actions = [
    { icon: EyeIcon, label: 'Ver detalle completo', action: () => { onClose(); onOpenDetail() }, color: 'blue' },
    { icon: UserPlusIcon, label: 'Asignar conductor', action: onClose, color: 'indigo' },
    { icon: ArrowsRightLeftIcon, label: 'Cambiar conductor', action: onClose, color: 'indigo' },
    { icon: CalendarDaysIcon, label: 'Editar fecha y hora', action: onClose, color: 'slate' },
    { icon: CameraIcon, label: 'Revisar evidencia', action: onClose, color: 'purple' },
    { icon: ExclamationTriangleIcon, label: 'Registrar incidencia', action: onClose, color: 'amber' },
    { icon: CheckCircleIcon, label: 'Marcar como finalizado', action: onClose, color: 'green' },
    { icon: DocumentTextIcon, label: 'Agregar nota interna', action: onClose, color: 'slate' },
    { icon: XCircleIcon, label: 'Cancelar viaje', action: onClose, color: 'red' },
  ]
  const colorCls: Record<string, string> = {
    blue: 'text-blue-600 hover:bg-blue-50', indigo: 'text-indigo-600 hover:bg-indigo-50',
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
          {actions.map((a, i) => {
            const Icon = a.icon
            return (
              <button key={i} onClick={a.action}
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

function TripDetail({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState(trip.notas)

  const addNote = () => {
    if (!newNote.trim()) return
    setNotes([...notes, { autor: 'Admin', texto: newNote.trim(), hora: 'Ahora' }])
    setNewNote('')
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
              <Field label="Usuario solicitante" value={trip.usuario} />
              <Field label="Empresa" value={trip.empresa} />
              <Field label="Conductor asignado" value={trip.conductor ?? <span className="text-red-500 italic">Sin asignar</span>} />
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
            </Grid2>
            {trip.vehiculo.observaciones && <Field label="Observaciones" value={trip.vehiculo.observaciones} />}
          </Section>

          {/* 3. Ruta */}
          <Section title="3. Ruta" icon="📍">
            <Grid2>
              <Field label="Dirección origen" value={trip.origen} />
              <Field label="Contacto en origen" value={trip.origenContacto} />
              <Field label="Dirección destino" value={trip.destino} />
              <Field label="Contacto en destino" value={trip.destinoContacto} />
            </Grid2>
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
                const real = trip.timeline.find(t =>
                  t.evento.toLowerCase().includes(evento.toLowerCase().split(' ')[0]) ||
                  evento.toLowerCase().includes(t.evento.toLowerCase().split(' ')[0])
                )
                const isIncidencia = evento === 'Incidencias reportadas'
                if (isIncidencia && trip.incidencias === 0) return null
                return (
                  <li key={i} className="ml-5">
                    <span className={`absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full ${real ? 'bg-blue-500' : 'bg-slate-200'}`}>
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
              {notes.length === 0 && <p className="text-sm text-slate-400 italic">Sin notas aún.</p>}
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
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button onClick={addNote}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg transition-colors">
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
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
const CONDUCTORES = ['Carlos Méndez', 'Ana Rodríguez', 'Mario García', 'Sandra Pérez', 'Pedro Castillo']
const VEHICULOS_LISTA = [
  { label: 'Toyota Hilux · XYZ-987', value: 'hilux' },
  { label: 'Honda Civic · DEF-456', value: 'civic' },
  { label: 'Nissan Versa · ABC-123', value: 'versa' },
  { label: 'Ford F-150 · GHI-321', value: 'f150' },
  { label: 'Chevrolet Trax · MNO-789', value: 'trax' },
]
const EMPRESAS = ['AutoMóviles del Norte SA', 'Grupo Logístico CDMX', 'Distribuidora Bajío', '— Particular —']
const TIPOS_SERVICIO = ['Traslado de vehículo', 'Entrega de vehículo', 'Recolección de vehículo', 'Traslado largo recorrido']
const TRANSMISIONES = ['Automática', 'Manual', 'CVT', 'Secuencial']

type Step = 1 | 2 | 3 | 4

interface FormData {
  // Step 1 – Cliente y servicio
  tipoServicio: string
  empresa: string
  usuarioNombre: string
  usuarioApellido: string
  telefono: string
  email: string
  // Step 2 – Vehículo
  vehiculoId: string
  marca: string
  modelo: string
  anio: string
  color: string
  placas: string
  vin: string
  transmision: string
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
  conductor: string
  tarifaCliente: string
  pagoConductor: string
  gastosAutorizados: string
  notaInterna: string
}

const EMPTY_FORM: FormData = {
  tipoServicio: '', empresa: '', usuarioNombre: '', usuarioApellido: '', telefono: '', email: '',
  vehiculoId: '', marca: '', modelo: '', anio: '', color: '', placas: '', vin: '', transmision: '', obsVehiculo: '',
  fecha: '', hora: '',
  origenCalle: '', origenNumero: '', origenColonia: '', origenMunicipio: '', origenEstado: '', origenCp: '',
  origenContactoNombre: '', origenContactoTel: '',
  destinoCalle: '', destinoNumero: '', destinoColonia: '', destinoMunicipio: '', destinoEstado: '', destinoCp: '',
  destinoContactoNombre: '', destinoContactoTel: '',
  referencias: '', instrucciones: '',
  conductor: '', tarifaCliente: '', pagoConductor: '', gastosAutorizados: '', notaInterna: '',
}

function NuevoViajeForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const set = (field: keyof FormData, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (step === 1) {
      if (!form.tipoServicio) newErrors.tipoServicio = 'Requerido'
      if (!form.empresa) newErrors.empresa = 'Requerido'
      if (!form.usuarioNombre) newErrors.usuarioNombre = 'Requerido'
      if (!form.usuarioApellido) newErrors.usuarioApellido = 'Requerido'
    }
    if (step === 2) {
      if (!form.marca) newErrors.marca = 'Requerido'
      if (!form.modelo) newErrors.modelo = 'Requerido'
      if (!form.placas) newErrors.placas = 'Requerido'
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
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // 1. Buscar o crear vehículo
      let vehiculoId: string | null = null
      if (form.placas) {
        const { data: vExistente } = await sb
          .from('vehiculos')
          .select('id')
          .eq('placas', form.placas.toUpperCase())
          .single()

        if (vExistente) {
          vehiculoId = vExistente.id
        } else {
          const { data: vNuevo } = await sb
            .from('vehiculos')
            .insert({
              marca: form.marca.toUpperCase() || null,
              modelo: form.modelo.toUpperCase() || null,
              anio: form.anio || null,
              color: form.color.toUpperCase() || null,
              placas: form.placas.toUpperCase(),
              vin: form.vin.toUpperCase() || null,
              transmision: form.transmision || null,
            })
            .select('id')
            .single()
          vehiculoId = vNuevo?.id ?? null
        }
      }

      // 2. Buscar conductor por nombre si se capturó
      let conductorId: string | null = null
      if (form.conductor) {
        const parts = form.conductor.trim().split(' ')
        const { data: cond } = await sb
          .from('conductores')
          .select('id')
          .ilike('nombre', `%${parts[0]}%`)
          .single()
        conductorId = cond?.id ?? null
      }

      // 3. Buscar usuario por email
      let usuarioId: string | null = null
      if (form.email) {
        const { data: usr } = await sb
          .from('usuarios')
          .select('id')
          .eq('email', form.email.toLowerCase())
          .single()
        usuarioId = usr?.id ?? null
      }

      // 4. Buscar empresa
      let empresaId: string | null = null
      if (form.empresa) {
        const { data: emp } = await sb
          .from('empresas')
          .select('id')
          .ilike('nombre_comercial', `%${form.empresa}%`)
          .single()
        empresaId = emp?.id ?? null
      }

      // 5. Crear el viaje
      const origenCalle = [form.origenCalle, form.origenNumero].filter(Boolean).join(' ').toUpperCase()
      const destinoCalle = [form.destinoCalle, form.destinoNumero].filter(Boolean).join(' ').toUpperCase()

      const { data: viaje, error } = await sb
        .from('viajes')
        .insert({
          usuario_id: usuarioId,
          empresa_id: empresaId,
          conductor_id: conductorId,
          vehiculo_id: vehiculoId,
          origen_calle: origenCalle || null,
          origen_colonia: form.origenColonia.toUpperCase() || null,
          origen_estado: [form.origenMunicipio, form.origenEstado].filter(Boolean).join(', ').toUpperCase() || null,
          origen_cp: form.origenCp || null,
          origen_contacto: form.origenContactoNombre.toUpperCase() || null,
          origen_telefono: form.origenContactoTel || null,
          destino_calle: destinoCalle || null,
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
        })
        .select('id')
        .single()

      if (error) throw error

      // 6. Timeline y nota interna
      await sb.from('timeline_viaje').insert({
        viaje_id: viaje.id,
        evento: 'Viaje registrado por operaciones',
        actor: 'Admin',
        actor_tipo: 'admin',
      })

      if (form.notaInterna) {
        await sb.from('notas_internas').insert({
          entidad_tipo: 'viaje',
          entidad_id: viaje.id,
          nota: form.notaInterna,
          autor: 'Admin',
        })
      }

      onSave()
      onClose()

    } catch (e: unknown) {
      console.error('Error guardando viaje:', e)
      setErrorGuardar('Ocurrió un error al guardar. Verifica los datos e intenta de nuevo.')
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
    `w-full border ${errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`

  const SelectCls = (field: keyof FormData) =>
    `w-full border ${errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`

  const Err = ({ field }: { field: keyof FormData }) =>
    errors[field] ? <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p> : null

  const Label = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
    <label className="block text-xs font-medium text-slate-500 mb-1">
      {children}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )

  const margen = (parseFloat(form.tarifaCliente) || 0) - (parseFloat(form.pagoConductor) || 0) - (parseFloat(form.gastosAutorizados) || 0)

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
                    step === s.n ? 'border-blue-600 bg-blue-600 text-white'
                    : step > s.n ? 'border-green-500 bg-green-500 text-white'
                    : 'border-slate-300 bg-white text-slate-400'
                  }`}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span className={`text-xs mt-1 font-medium whitespace-nowrap ${step === s.n ? 'text-blue-600' : step > s.n ? 'text-green-600' : 'text-slate-400'}`}>
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
                <select value={form.tipoServicio} onChange={e => set('tipoServicio', e.target.value.toUpperCase())} className={SelectCls('tipoServicio')}>
                  <option value="">Seleccionar...</option>
                  {TIPOS_SERVICIO.map(t => <option key={t}>{t}</option>)}
                </select>
                <Err field="tipoServicio" />
              </div>
              <div>
                <Label req>Empresa / Cliente</Label>
                <select value={form.empresa} onChange={e => set('empresa', e.target.value.toUpperCase())} className={SelectCls('empresa')}>
                  <option value="">Seleccionar...</option>
                  {EMPRESAS.map(e => <option key={e}>{e}</option>)}
                </select>
                <Err field="empresa" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label req>Nombre(s) del solicitante</Label>
                  <input type="text" placeholder="NOMBRE(S)" value={form.usuarioNombre} onChange={e => set('usuarioNombre', e.target.value.toUpperCase())} className={InputCls('usuarioNombre')} />
                  <Err field="usuarioNombre" />
                </div>
                <div>
                  <Label req>Apellido(s)</Label>
                  <input type="text" placeholder="APELLIDO(S)" value={form.usuarioApellido} onChange={e => set('usuarioApellido', e.target.value.toUpperCase())} className={InputCls('usuarioApellido')} />
                  <Err field="usuarioApellido" />
                </div>
                <div>
                  <Label>Teléfono de contacto</Label>
                  <input type="tel" placeholder="55-0000-0000" maxLength={12} value={form.telefono} onChange={e => { const d = e.target.value.replace(/[^0-9]/g,'').slice(0,10); set('telefono', d.length<=3?d:d.length<=6?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`) }} className={InputCls('telefono')} />
                </div>
                <div>
                  <Label>Correo electrónico</Label>
                  <input type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={e => set('email', e.target.value)} className={InputCls('email')} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Vehículo ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Vehículo registrado (opcional)</Label>
                <select value={form.vehiculoId} onChange={e => set('vehiculoId', e.target.value.toUpperCase())} className={SelectCls('vehiculoId')}>
                  <option value="">Ingresar manualmente...</option>
                  {VEHICULOS_LISTA.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">Selecciona un vehículo de la flota o llena los datos abajo.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label req>Marca</Label>
                  <input type="text" placeholder="Toyota, Honda, Ford..." value={form.marca} onChange={e => set('marca', e.target.value.toUpperCase())} className={InputCls('marca')} />
                  <Err field="marca" />
                </div>
                <div>
                  <Label req>Modelo</Label>
                  <input type="text" placeholder="Hilux, Civic, F-150..." value={form.modelo} onChange={e => set('modelo', e.target.value.toUpperCase())} className={InputCls('modelo')} />
                  <Err field="modelo" />
                </div>
                <div>
                  <Label>Año</Label>
                  <input type="text" placeholder="2022" value={form.anio} onChange={e => set('anio', e.target.value.toUpperCase())} className={InputCls('anio')} />
                </div>
                <div>
                  <Label>Color</Label>
                  <input type="text" placeholder="Blanco, Gris, Negro..." value={form.color} onChange={e => set('color', e.target.value.toUpperCase())} className={InputCls('color')} />
                </div>
                <div>
                  <Label req>Placas</Label>
                  <input type="text" placeholder="XYZ-987" value={form.placas} onChange={e => set('placas', e.target.value.toUpperCase())} className={InputCls('placas')} />
                  <Err field="placas" />
                </div>
                <div>
                  <Label>VIN</Label>
                  <input type="text" placeholder="17 caracteres" value={form.vin} onChange={e => set('vin', e.target.value.toUpperCase())} className={InputCls('vin')} />
                </div>
                <div>
                  <Label>Transmisión</Label>
                  <select value={form.transmision} onChange={e => set('transmision', e.target.value.toUpperCase())} className={SelectCls('transmision')}>
                    <option value="">Seleccionar...</option>
                    {TRANSMISIONES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Observaciones del vehículo</Label>
                <textarea rows={2} placeholder="Rasguños, daños preexistentes, equipo especial..." value={form.obsVehiculo} onChange={e => set('obsVehiculo', e.target.value.toUpperCase())} className={InputCls('obsVehiculo')} />
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
                    <Label>Nombre del responsable</Label>
                    <input type="text" placeholder="NOMBRE(S) APELLIDO(S)" value={form.origenContactoNombre} onChange={e => set('origenContactoNombre', e.target.value.toUpperCase())} className={InputCls('origenContactoNombre')} />
                  </div>
                  <div>
                    <Label>Teléfono del responsable</Label>
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
                    <Label>Nombre del responsable</Label>
                    <input type="text" placeholder="NOMBRE(S) APELLIDO(S)" value={form.destinoContactoNombre} onChange={e => set('destinoContactoNombre', e.target.value.toUpperCase())} className={InputCls('destinoContactoNombre')} />
                  </div>
                  <div>
                    <Label>Teléfono del responsable</Label>
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
                <select value={form.conductor} onChange={e => set('conductor', e.target.value.toUpperCase())} className={SelectCls('conductor')}>
                  <option value="">Asignar después...</option>
                  {CONDUCTORES.map(c => <option key={c}>{c}</option>)}
                </select>
                {!form.conductor && <p className="text-xs text-amber-500 mt-0.5">El viaje quedará en "Pendiente de asignación" si no se selecciona conductor.</p>}
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
                  ['Servicio', form.tipoServicio || '—'],
                  ['Cliente', `${[form.usuarioNombre, form.usuarioApellido].filter(Boolean).join(' ') || '—'} · ${form.empresa || '—'}`],
                  ['Vehículo', form.marca ? `${form.marca} ${form.modelo} · ${form.placas}` : '—'],
                  ['Fecha / Hora', form.fecha ? `${form.fecha} · ${form.hora}` : '—'],
                  ['Ruta', form.origenCalle ? `${form.origenCalle} → ${form.destinoCalle}` : '—'],
                  ['Conductor', form.conductor || 'Sin asignar'],
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
              ? <button onClick={next} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
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
interface ViajeDB {
  id: string
  folio: string | null
  status: StatusKey
  fecha_programada: string | null
  hora_programada: string | null
  origen_calle: string | null
  origen_colonia: string | null
  destino_calle: string | null
  destino_colonia: string | null
  tarifa_cliente: number
  pago_conductor: number
  conductores: { nombre: string; apellido: string }[] | null
  usuarios: { nombre: string; apellido: string }[] | null
  empresas: { nombre_comercial: string }[] | null
  vehiculos: { marca: string; modelo: string; placas: string }[] | null
}

function viajeDBaTrip(v: ViajeDB): Trip {
  const conductor = v.conductores?.[0] ?? null
  const usuario = v.usuarios?.[0] ?? null
  const empresa = v.empresas?.[0] ?? null
  const vehiculo = v.vehiculos?.[0] ?? null

  return {
    id: v.folio ?? v.id.slice(0, 8).toUpperCase(),
    usuario: usuario ? `${usuario.nombre} ${usuario.apellido}` : '—',
    empresa: empresa?.nombre_comercial ?? '—',
    vehiculo: {
      marca: vehiculo?.marca ?? '—',
      modelo: vehiculo?.modelo ?? '—',
      anio: '—', color: '—',
      placas: vehiculo?.placas ?? '—',
      vin: '—', transmision: '—', observaciones: '',
    },
    origen: [v.origen_calle, v.origen_colonia].filter(Boolean).join(', '),
    origenContacto: '—',
    destino: [v.destino_calle, v.destino_colonia].filter(Boolean).join(', '),
    destinoContacto: '—',
    referencias: '', instrucciones: '',
    fecha: v.fecha_programada ?? '—',
    hora: v.hora_programada ?? '—',
    conductor: conductor ? `${conductor.nombre} ${conductor.apellido}` : null,
    status: v.status,
    tarifaCliente: v.tarifa_cliente ?? 0,
    pagoConductor: v.pago_conductor ?? 0,
    gastosExtra: 0,
    gastosAutorizados: 0,
    ajustes: 0,
    evidencia: 'Pendiente',
    incidencias: 0,
    tipoServicio: '—',
    timeline: [], notas: [],
    observacionesConductor: '', revisionAdmin: '',
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ViajesView() {
  const [activeTab, setActiveTab] = useState<TabId>('todos')
  const [search, setSearch] = useState('')
  const [actionTrip, setActionTrip] = useState<Trip | null>(null)
  const [detailTrip, setDetailTrip] = useState<Trip | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [cargando, setCargando] = useState(true)

  const cargarViajes = async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await sb
      .from('viajes')
      .select(`
        id, folio, status, fecha_programada, hora_programada,
        origen_calle, origen_colonia, destino_calle, destino_colonia,
        tarifa_cliente, pago_conductor,
        conductores(nombre, apellido),
        usuarios(nombre, apellido),
        empresas(nombre_comercial),
        vehiculos(marca, modelo, placas)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTrips((data as ViajeDB[]).map(viajeDBaTrip))
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
      {actionTrip && (
        <ActionMenu
          trip={actionTrip}
          onClose={() => setActionTrip(null)}
          onOpenDetail={() => setDetailTrip(actionTrip)}
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
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
              </div>
              <button onClick={() => setShowNewForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />Nuevo viaje
              </button>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="py-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
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
                    <td className="px-4 py-3 font-semibold text-blue-600 whitespace-nowrap">{trip.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{trip.usuario}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[120px]">{trip.empresa}</div>
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