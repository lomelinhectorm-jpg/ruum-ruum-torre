'use client'

import { useState } from 'react'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  EyeIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type EstatusDoc =
  | 'Pendiente de carga'
  | 'En revisión'
  | 'Aprobado'
  | 'Rechazado'
  | 'Vencido'
  | 'Pendiente de actualización'

type TipoEntidad = 'Conductor' | 'Usuario' | 'Empresa'

type TipoDocConductor =
  | 'Licencia de conducir'
  | 'Identificación oficial'
  | 'Comprobante de domicilio'
  | 'Constancia de situación fiscal'
  | 'Antecedentes no penales'
  | 'Fotografía'

type TipoDocUsuario =
  | 'Constancia de situación fiscal'
  | 'Datos fiscales'
  | 'Convenio comercial'
  | 'Documento de autorización'
  | 'Identificación representante'
  | 'Acta constitutiva'

type TipoDoc = TipoDocConductor | TipoDocUsuario

interface ComentarioInterno { autor: string; texto: string; hora: string }

interface Documento {
  id: string
  entidadId: string
  entidadNombre: string
  entidadTipo: TipoEntidad
  tipoDoc: TipoDoc
  folio: string
  fechaEmision: string
  fechaVencimiento: string
  cargadoEl: string
  revisadoPor: string
  estatus: EstatusDoc
  notaRechazo: string
  comentarios: ComentarioInterno[]
  historial: { evento: string; hora: string; actor: string }[]
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const DOCUMENTOS: Documento[] = [
  // Conductores
  {
    id: 'DOC-001', entidadId: 'CON-001', entidadNombre: 'Carlos Méndez Ruiz', entidadTipo: 'Conductor',
    tipoDoc: 'Licencia de conducir', folio: 'LIC-2021-CX9842',
    fechaEmision: '15 Ene 2021', fechaVencimiento: '15 Ene 2026', cargadoEl: '10 Mar 2023',
    revisadoPor: 'Admin', estatus: 'Aprobado', notaRechazo: '',
    comentarios: [{ autor: 'Admin', texto: 'Verificada físicamente. Todo en orden.', hora: '10 Mar 2023' }],
    historial: [
      { evento: 'Documento cargado', hora: '10 Mar 2023', actor: 'Carlos M.' },
      { evento: 'Enviado a revisión', hora: '10 Mar 2023', actor: 'Sistema' },
      { evento: 'Aprobado', hora: '11 Mar 2023', actor: 'Admin' },
    ],
  },
  {
    id: 'DOC-002', entidadId: 'CON-001', entidadNombre: 'Carlos Méndez Ruiz', entidadTipo: 'Conductor',
    tipoDoc: 'Antecedentes no penales', folio: 'AP-2024-001',
    fechaEmision: '01 Mar 2024', fechaVencimiento: '01 Mar 2025', cargadoEl: '02 Mar 2024',
    revisadoPor: 'Admin', estatus: 'Vencido', notaRechazo: '',
    comentarios: [],
    historial: [
      { evento: 'Documento cargado', hora: '02 Mar 2024', actor: 'Carlos M.' },
      { evento: 'Aprobado', hora: '03 Mar 2024', actor: 'Admin' },
      { evento: 'Marcado como vencido', hora: '02 Mar 2025', actor: 'Sistema' },
      { evento: 'Solicitud de actualización enviada', hora: '10 Jun 2025', actor: 'Admin' },
    ],
  },
  {
    id: 'DOC-003', entidadId: 'CON-002', entidadNombre: 'Ana Rodríguez López', entidadTipo: 'Conductor',
    tipoDoc: 'Licencia de conducir', folio: 'LIC-2022-AR5531',
    fechaEmision: '20 Mar 2022', fechaVencimiento: '20 Mar 2027', cargadoEl: '15 Jun 2023',
    revisadoPor: 'Ops. Central', estatus: 'Aprobado', notaRechazo: '',
    comentarios: [],
    historial: [
      { evento: 'Documento cargado', hora: '15 Jun 2023', actor: 'Ana R.' },
      { evento: 'Aprobado', hora: '16 Jun 2023', actor: 'Ops. Central' },
    ],
  },
  {
    id: 'DOC-004', entidadId: 'CON-003', entidadNombre: 'Mario García Vega', entidadTipo: 'Conductor',
    tipoDoc: 'Licencia de conducir', folio: 'LIC-2020-MG3310',
    fechaEmision: '19 Jun 2020', fechaVencimiento: '19 Jun 2025', cargadoEl: '01 Ago 2023',
    revisadoPor: 'Admin', estatus: 'Pendiente de actualización', notaRechazo: '',
    comentarios: [{ autor: 'Admin', texto: 'Licencia próxima a vencer. Se solicitó renovación.', hora: '12 Jun 2025' }],
    historial: [
      { evento: 'Documento cargado', hora: '01 Ago 2023', actor: 'Mario G.' },
      { evento: 'Aprobado', hora: '02 Ago 2023', actor: 'Admin' },
      { evento: 'Alerta: vence en 7 días', hora: '12 Jun 2025', actor: 'Sistema' },
      { evento: 'Actualización solicitada al conductor', hora: '12 Jun 2025', actor: 'Admin' },
    ],
  },
  {
    id: 'DOC-005', entidadId: 'CON-004', entidadNombre: 'Sandra Pérez Castillo', entidadTipo: 'Conductor',
    tipoDoc: 'Constancia de situación fiscal', folio: '—',
    fechaEmision: '—', fechaVencimiento: '—', cargadoEl: '—',
    revisadoPor: '—', estatus: 'Pendiente de carga', notaRechazo: '',
    comentarios: [{ autor: 'Admin', texto: 'Pendiente de carga para activar cuenta.', hora: '10 Jun 2025' }],
    historial: [{ evento: 'Documento solicitado', hora: '10 Jun 2025', actor: 'Admin' }],
  },
  {
    id: 'DOC-006', entidadId: 'CON-004', entidadNombre: 'Sandra Pérez Castillo', entidadTipo: 'Conductor',
    tipoDoc: 'Antecedentes no penales', folio: '—',
    fechaEmision: '—', fechaVencimiento: '—', cargadoEl: '—',
    revisadoPor: '—', estatus: 'Pendiente de carga', notaRechazo: '',
    comentarios: [],
    historial: [{ evento: 'Documento solicitado', hora: '10 Jun 2025', actor: 'Admin' }],
  },
  {
    id: 'DOC-007', entidadId: 'CON-005', entidadNombre: 'Pedro Castillo Mora', entidadTipo: 'Conductor',
    tipoDoc: 'Licencia de conducir', folio: 'LIC-2019-PC2241',
    fechaEmision: '05 Ago 2019', fechaVencimiento: '05 Ago 2024', cargadoEl: '10 Ene 2024',
    revisadoPor: 'Admin', estatus: 'Vencido', notaRechazo: '',
    comentarios: [{ autor: 'Coordinador', texto: 'Licencia vencida. No asignar viajes hasta renovar.', hora: '14 Jun 2025' }],
    historial: [
      { evento: 'Documento cargado', hora: '10 Ene 2024', actor: 'Pedro C.' },
      { evento: 'Aprobado', hora: '11 Ene 2024', actor: 'Admin' },
      { evento: 'Marcado como vencido', hora: '06 Ago 2024', actor: 'Sistema' },
    ],
  },
  {
    id: 'DOC-008', entidadId: 'CON-002', entidadNombre: 'Ana Rodríguez López', entidadTipo: 'Conductor',
    tipoDoc: 'Identificación oficial', folio: 'IFE-ROLA920821',
    fechaEmision: '01 Feb 2022', fechaVencimiento: '01 Feb 2028', cargadoEl: '15 Jun 2023',
    revisadoPor: 'Ops. Central', estatus: 'En revisión', notaRechazo: '',
    comentarios: [],
    historial: [
      { evento: 'Documento cargado', hora: '14 Jun 2025', actor: 'Ana R.' },
      { evento: 'Enviado a revisión', hora: '14 Jun 2025', actor: 'Sistema' },
    ],
  },
  // Usuarios / Empresas
  {
    id: 'DOC-009', entidadId: 'USR-001', entidadNombre: 'Grupo Logístico CDMX', entidadTipo: 'Empresa',
    tipoDoc: 'Constancia de situación fiscal', folio: 'GLC230310XX1',
    fechaEmision: '10 Mar 2023', fechaVencimiento: '31 Dic 2025', cargadoEl: '11 Mar 2023',
    revisadoPor: 'Finanzas', estatus: 'Aprobado', notaRechazo: '',
    comentarios: [],
    historial: [
      { evento: 'Documento cargado', hora: '11 Mar 2023', actor: 'Ricardo T.' },
      { evento: 'Aprobado', hora: '12 Mar 2023', actor: 'Finanzas' },
    ],
  },
  {
    id: 'DOC-010', entidadId: 'USR-001', entidadNombre: 'Grupo Logístico CDMX', entidadTipo: 'Empresa',
    tipoDoc: 'Convenio comercial', folio: 'CONV-GLC-2023-001',
    fechaEmision: '10 Mar 2023', fechaVencimiento: '10 Mar 2025', cargadoEl: '10 Mar 2023',
    revisadoPor: 'Admin', estatus: 'Pendiente de actualización', notaRechazo: '',
    comentarios: [{ autor: 'Admin', texto: 'Convenio vencido. Solicitar renovación.', hora: '11 Mar 2025' }],
    historial: [
      { evento: 'Convenio firmado y cargado', hora: '10 Mar 2023', actor: 'Ricardo T.' },
      { evento: 'Aprobado', hora: '10 Mar 2023', actor: 'Admin' },
      { evento: 'Vencido — renovación pendiente', hora: '11 Mar 2025', actor: 'Sistema' },
    ],
  },
  {
    id: 'DOC-011', entidadId: 'USR-002', entidadNombre: 'AutoMóviles del Norte SA', entidadTipo: 'Empresa',
    tipoDoc: 'Constancia de situación fiscal', folio: 'ANO230615YZ2',
    fechaEmision: '15 Jun 2023', fechaVencimiento: '31 Dic 2025', cargadoEl: '15 Jun 2023',
    revisadoPor: 'Finanzas', estatus: 'Aprobado', notaRechazo: '',
    comentarios: [],
    historial: [
      { evento: 'Documento cargado', hora: '15 Jun 2023', actor: 'Fernanda L.' },
      { evento: 'Aprobado', hora: '16 Jun 2023', actor: 'Finanzas' },
    ],
  },
  {
    id: 'DOC-012', entidadId: 'USR-004', entidadNombre: 'Distribuidora Bajío', entidadTipo: 'Empresa',
    tipoDoc: 'Constancia de situación fiscal', folio: '—',
    fechaEmision: '—', fechaVencimiento: '—', cargadoEl: '—',
    revisadoPor: '—', estatus: 'Pendiente de carga', notaRechazo: '',
    comentarios: [{ autor: 'Admin', texto: 'Pendiente para activar cuenta. RFC no validado.', hora: '05 May 2024' }],
    historial: [{ evento: 'Documento solicitado al usuario', hora: '05 May 2024', actor: 'Admin' }],
  },
  {
    id: 'DOC-013', entidadId: 'USR-002', entidadNombre: 'AutoMóviles del Norte SA', entidadTipo: 'Empresa',
    tipoDoc: 'Convenio comercial', folio: 'CONV-ANO-2023-002',
    fechaEmision: '15 Jun 2023', fechaVencimiento: '15 Jun 2026', cargadoEl: '15 Jun 2023',
    revisadoPor: 'Admin', estatus: 'En revisión', notaRechazo: '',
    comentarios: [],
    historial: [
      { evento: 'Convenio actualizado cargado', hora: '14 Jun 2025', actor: 'Fernanda L.' },
      { evento: 'Enviado a revisión', hora: '14 Jun 2025', actor: 'Sistema' },
    ],
  },
  {
    id: 'DOC-014', entidadId: 'USR-004', entidadNombre: 'Distribuidora Bajío', entidadTipo: 'Empresa',
    tipoDoc: 'Datos fiscales', folio: 'DF-BAJIO-001',
    fechaEmision: '05 May 2024', fechaVencimiento: '—', cargadoEl: '06 May 2024',
    revisadoPor: 'Finanzas', estatus: 'Rechazado', notaRechazo: 'Datos incompletos. Falta CFDI de uso y régimen fiscal.',
    comentarios: [{ autor: 'Finanzas', texto: 'Se rechazó por datos incompletos. Solicitar nueva versión.', hora: '07 May 2024' }],
    historial: [
      { evento: 'Documento cargado', hora: '06 May 2024', actor: 'Claudia R.' },
      { evento: 'Enviado a revisión', hora: '06 May 2024', actor: 'Sistema' },
      { evento: 'Rechazado por datos incompletos', hora: '07 May 2024', actor: 'Finanzas' },
    ],
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const TIPOS_CONDUCTOR: TipoDocConductor[] = [
  'Licencia de conducir','Identificación oficial','Comprobante de domicilio',
  'Constancia de situación fiscal','Antecedentes no penales','Fotografía',
]
const TIPOS_USUARIO: TipoDocUsuario[] = [
  'Constancia de situación fiscal','Datos fiscales','Convenio comercial',
  'Documento de autorización','Identificación representante','Acta constitutiva',
]

const estatusStyle: Record<EstatusDoc, string> = {
  'Pendiente de carga':         'bg-slate-100 text-slate-500',
  'En revisión':                'bg-purple-100 text-purple-700',
  'Aprobado':                   'bg-green-100 text-green-700',
  'Rechazado':                  'bg-red-100 text-red-700',
  'Vencido':                    'bg-orange-100 text-orange-700',
  'Pendiente de actualización': 'bg-amber-100 text-amber-700',
}

const estatusDot: Record<EstatusDoc, string> = {
  'Pendiente de carga':         'bg-slate-400',
  'En revisión':                'bg-purple-500',
  'Aprobado':                   'bg-green-500',
  'Rechazado':                  'bg-red-500',
  'Vencido':                    'bg-orange-500',
  'Pendiente de actualización': 'bg-amber-500',
}

const tipoEntidadStyle: Record<TipoEntidad, string> = {
  Conductor: 'bg-blue-50 text-blue-700',
  Usuario:   'bg-purple-50 text-purple-700',
  Empresa:   'bg-indigo-50 text-indigo-700',
}

const TODOS_ESTATUS: EstatusDoc[] = [
  'Pendiente de carga','En revisión','Aprobado','Rechazado','Vencido','Pendiente de actualización',
]

function EBadge({ e }: { e: EstatusDoc }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${estatusStyle[e]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${estatusDot[e]}`} />
      {e}
    </span>
  )
}

function diasHastaVencimiento(fecha: string): number | null {
  if (!fecha || fecha === '—') return null
  const partes = fecha.split(' ')
  const meses: Record<string, number> = {
    Ene:0,Feb:1,Mar:2,Abr:3,May:4,Jun:5,Jul:6,Ago:7,Sep:8,Oct:9,Nov:10,Dic:11,
  }
  const d = parseInt(partes[0])
  const m = meses[partes[1]]
  const y = parseInt(partes[2])
  if (isNaN(d) || m === undefined || isNaN(y)) return null
  const hoy = new Date(2025, 5, 14)
  const vence = new Date(y, m, d)
  return Math.floor((vence.getTime() - hoy.getTime()) / 86400000)
}

function VencimientoTag({ fecha }: { fecha: string }) {
  const dias = diasHastaVencimiento(fecha)
  if (dias === null) return <span className="text-slate-300 text-xs">—</span>
  if (dias < 0)   return <span className="text-xs text-red-600 font-semibold">Vencido hace {Math.abs(dias)} días</span>
  if (dias <= 30) return <span className="text-xs text-amber-600 font-semibold">Vence en {dias} días</span>
  return <span className="text-xs text-slate-500">{fecha}</span>
}

// ─── MODAL DETALLE ────────────────────────────────────────────────────────────
function DocumentoDetalle({ doc, onClose }: { doc: Documento; onClose: () => void }) {
  const [estatus, setEstatus]       = useState<EstatusDoc>(doc.estatus)
  const [comentarios, setComentarios] = useState(doc.comentarios)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [notaRechazo, setNotaRechazo] = useState(doc.notaRechazo)
  const [showRechazar, setShowRechazar] = useState(false)
  const [historial, setHistorial]   = useState(doc.historial)

  const addHistorial = (evento: string) =>
    setHistorial(h => [...h, { evento, hora: 'Ahora', actor: 'Admin' }])

  const aprobar = () => { setEstatus('Aprobado'); addHistorial('Documento aprobado') }
  const rechazar = () => {
    if (!notaRechazo.trim()) return
    setEstatus('Rechazado')
    addHistorial('Documento rechazado')
    setShowRechazar(false)
  }
  const solicitarActualizacion = () => {
    setEstatus('Pendiente de actualización')
    addHistorial('Actualización solicitada al titular')
  }
  const addComentario = () => {
    if (!nuevoComentario.trim()) return
    setComentarios(c => [...c, { autor: 'Admin', texto: nuevoComentario.trim(), hora: 'Ahora' }])
    addHistorial('Comentario interno agregado')
    setNuevoComentario('')
  }

  const dias = diasHastaVencimiento(doc.fechaVencimiento)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl">

        {/* Header */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeftIcon className="w-4 h-4 text-slate-500" /></button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-slate-800">{doc.tipoDoc}</h2>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tipoEntidadStyle[doc.entidadTipo]}`}>{doc.entidadTipo}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <EBadge e={estatus} />
                  <span className="text-xs text-slate-400">{doc.entidadNombre}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
          </div>

          {/* Acciones rápidas */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <EyeIcon className="w-3.5 h-3.5" />Ver documento
            </button>
            <button onClick={aprobar} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <CheckCircleIcon className="w-3.5 h-3.5" />Aprobar
            </button>
            <button onClick={() => setShowRechazar(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <XCircleIcon className="w-3.5 h-3.5" />Rechazar
            </button>
            <button onClick={solicitarActualizacion} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
              <ArrowPathIcon className="w-3.5 h-3.5" />Solicitar actualización
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />Descargar
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* Rechazo inline */}
          {showRechazar && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">Motivo del rechazo</p>
              <textarea rows={2} value={notaRechazo} onChange={e => setNotaRechazo(e.target.value)}
                placeholder="Describe la razón del rechazo para notificar al titular..."
                className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowRechazar(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-red-100 rounded-lg">Cancelar</button>
                <button onClick={rechazar} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 text-xs rounded-lg font-medium transition-colors">
                  Confirmar rechazo
                </button>
              </div>
            </div>
          )}

          {/* Nota de rechazo activa */}
          {estatus === 'Rechazado' && notaRechazo && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
              <p className="text-xs font-semibold mb-1 text-red-600">Motivo de rechazo</p>
              {notaRechazo}
            </div>
          )}

          {/* Alerta vencimiento */}
          {dias !== null && dias <= 30 && dias >= 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-sm text-amber-800">
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
              Este documento vence en <strong>{dias} días</strong>. Considera solicitar actualización.
            </div>
          )}
          {dias !== null && dias < 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-800">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
              Este documento venció hace <strong>{Math.abs(dias)} días</strong>.
            </div>
          )}

          {/* Info principal */}
          <SCard title="📄 Información del Documento">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <F label="Tipo de documento" value={doc.tipoDoc} />
              <F label="Titular" value={doc.entidadNombre} />
              <F label="Tipo de entidad" value={<span className={`px-2 py-0.5 rounded text-xs font-semibold ${tipoEntidadStyle[doc.entidadTipo]}`}>{doc.entidadTipo}</span>} />
              <F label="Folio / Número" value={<span className="font-mono text-xs">{doc.folio}</span>} />
              <F label="Fecha de emisión" value={doc.fechaEmision} />
              <F label="Fecha de vencimiento" value={<VencimientoTag fecha={doc.fechaVencimiento} />} />
              <F label="Fecha de carga" value={doc.cargadoEl} />
              <F label="Revisado por" value={doc.revisadoPor} />
              <F label="Estatus" value={<EBadge e={estatus} />} />
            </div>
          </SCard>

          {/* Selector de estatus */}
          <SCard title="⚙️ Cambiar Estatus">
            <div className="flex flex-wrap gap-2">
              {TODOS_ESTATUS.map(e => (
                <button key={e} onClick={() => { setEstatus(e); addHistorial(`Estatus cambiado a: ${e}`) }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    estatus === e ? `${estatusStyle[e]} border-current shadow-sm` : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${estatusDot[e]}`} />
                  {e}
                </button>
              ))}
            </div>
          </SCard>

          {/* Comentarios internos */}
          <SCard title="💬 Comentarios Internos">
            <p className="text-xs text-slate-400 italic -mt-2">Solo visibles para el equipo administrativo.</p>
            <div className="space-y-2">
              {comentarios.length === 0 && <p className="text-xs text-slate-400 italic">Sin comentarios aún.</p>}
              {comentarios.map((c, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700">{c.autor} · {c.hora}</p>
                  <p className="text-sm text-slate-700 mt-0.5">{c.texto}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input type="text" value={nuevoComentario} onChange={e => setNuevoComentario(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComentario()}
                placeholder="Agregar comentario interno..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <button onClick={addComentario} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg transition-colors">
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
          </SCard>

          {/* Historial */}
          <SCard title="⏱️ Historial del Documento">
            <ol className="relative border-l-2 border-slate-200 space-y-3 ml-3">
              {historial.map((h, i) => (
                <li key={i} className="ml-5">
                  <span className="absolute -left-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                  <p className="text-sm font-medium text-slate-800">{h.evento}</p>
                  <p className="text-xs text-slate-400">{h.hora} · {h.actor}</p>
                </li>
              ))}
            </ol>
          </SCard>
        </div>
      </div>
    </div>
  )
}

// ─── NUEVO DOCUMENTO FORM ─────────────────────────────────────────────────────
function NuevoDocumentoForm({ onClose }: { onClose: () => void }) {
  const [entidadTipo, setEntidadTipo] = useState<TipoEntidad>('Conductor')
  const iCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const sCls = `${iCls} bg-white`
  const L = ({ c, req }: { c: React.ReactNode; req?: boolean }) => (
    <label className="block text-xs font-medium text-slate-500 mb-1">{c}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  )
  const tiposActuales = entidadTipo === 'Conductor' ? TIPOS_CONDUCTOR : TIPOS_USUARIO

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Nuevo Documento</h2>
            <p className="text-xs text-slate-400">Registrar un documento en el sistema</p>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <L c="Tipo de entidad" req />
            <div className="flex gap-2">
              {(['Conductor','Usuario','Empresa'] as TipoEntidad[]).map(t => (
                <button key={t} onClick={() => setEntidadTipo(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${entidadTipo === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  {t === 'Conductor' ? '👤' : t === 'Usuario' ? '🧑' : '🏢'} {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <L c="Titular" req />
              <input type="text" placeholder="Nombre del conductor o empresa" className={iCls} />
            </div>
            <div>
              <L c="Tipo de documento" req />
              <select className={sCls}>
                <option value="">Seleccionar...</option>
                {tiposActuales.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <L c="Folio / Número" />
              <input type="text" placeholder="Número de documento" className={iCls} />
            </div>
            <div>
              <L c="Fecha de emisión" />
              <input type="date" className={iCls} />
            </div>
            <div>
              <L c="Fecha de vencimiento" />
              <input type="date" className={iCls} />
            </div>
            <div>
              <L c="Revisado por" />
              <select className={sCls}>
                <option value="">Sin asignar</option>
                {['Admin','Ops. Central','Finanzas','Coordinador'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <L c="Comentario inicial (opcional)" />
            <textarea rows={2} placeholder="Observaciones o instrucciones para este documento..." className={iCls} />
          </div>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <DocumentTextIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">Arrastra el archivo aquí o haz clic para subir</p>
            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — máx. 10 MB</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckCircleIcon className="w-4 h-4" />Registrar documento
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function SCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      {children}
    </div>
  )
}
function F({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm text-slate-700">{value}</div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
type MainTab = 'conductores' | 'usuarios'

export default function DocumentosView() {
  const [tab, setTab]             = useState<MainTab>('conductores')
  const [search, setSearch]       = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusDoc | 'Todos'>('Todos')
  const [filtroTipoDoc, setFiltroTipoDoc] = useState<TipoDoc | 'Todos'>('Todos')
  const [detalle, setDetalle]     = useState<Documento | null>(null)
  const [showForm, setShowForm]   = useState(false)

  const docsConductores = DOCUMENTOS.filter(d => d.entidadTipo === 'Conductor')
  const docsUsuarios    = DOCUMENTOS.filter(d => d.entidadTipo !== 'Conductor')
  const docsActivos     = tab === 'conductores' ? docsConductores : docsUsuarios
  const tiposActivos    = tab === 'conductores' ? TIPOS_CONDUCTOR : TIPOS_USUARIO

  const filtered = docsActivos.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !q || d.entidadNombre.toLowerCase().includes(q) || d.tipoDoc.toLowerCase().includes(q) || d.folio.toLowerCase().includes(q)
    const matchEstatus  = filtroEstatus  === 'Todos' || d.estatus   === filtroEstatus
    const matchTipoDoc  = filtroTipoDoc  === 'Todos' || d.tipoDoc   === filtroTipoDoc
    return matchSearch && matchEstatus && matchTipoDoc
  })

  // KPIs globales
  const pendCarga  = DOCUMENTOS.filter(d => d.estatus === 'Pendiente de carga').length
  const enRevision = DOCUMENTOS.filter(d => d.estatus === 'En revisión').length
  const aprobados  = DOCUMENTOS.filter(d => d.estatus === 'Aprobado').length
  const vencidos   = DOCUMENTOS.filter(d => d.estatus === 'Vencido').length
  const pendAct    = DOCUMENTOS.filter(d => d.estatus === 'Pendiente de actualización').length

  const contarEstatus = (e: EstatusDoc | 'Todos') =>
    e === 'Todos' ? docsActivos.length : docsActivos.filter(d => d.estatus === e).length

  return (
    <div className="space-y-6 animate-fade-in">
      {detalle   && <DocumentoDetalle   doc={detalle}   onClose={() => setDetalle(null)} />}
      {showForm  && <NuevoDocumentoForm onClose={() => setShowForm(false)} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Aprobados',           value: aprobados,  color: 'text-green-600',  bg: 'bg-green-50',  icon: <CheckCircleIcon className="w-5 h-5 text-green-500" /> },
          { label: 'En revisión',         value: enRevision, color: 'text-purple-600', bg: 'bg-purple-50', icon: <EyeIcon className="w-5 h-5 text-purple-500" /> },
          { label: 'Pendiente de carga',  value: pendCarga,  color: 'text-slate-600',  bg: 'bg-slate-50',  icon: <DocumentTextIcon className="w-5 h-5 text-slate-400" /> },
          { label: 'Pendiente actualiz.', value: pendAct,    color: 'text-amber-600',  bg: 'bg-amber-50',  icon: <ArrowPathIcon className="w-5 h-5 text-amber-500" /> },
          { label: 'Vencidos',            value: vencidos,   color: 'text-red-600',    bg: 'bg-red-50',    icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" /> },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-slate-500 font-medium">{k.label}</p>
              <div className={`p-1.5 ${k.bg} rounded-lg`}>{k.icon}</div>
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Card principal */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Tabs */}
        <div className="border-b border-slate-200 px-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <div className="flex gap-1">
              {([
                { id: 'conductores', label: 'Documentos de Conductores', icon: <UserCircleIcon className="w-4 h-4" />, count: docsConductores.length },
                { id: 'usuarios',    label: 'Documentos de Usuarios / Empresas', icon: <BuildingOfficeIcon className="w-4 h-4" />, count: docsUsuarios.length },
              ] as { id: MainTab; label: string; icon: React.ReactNode; count: number }[]).map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setFiltroEstatus('Todos'); setFiltroTipoDoc('Todos'); setSearch('') }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    tab === t.id ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}>
                  {t.icon}{t.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>{t.count}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 pb-1">
              <select value={filtroTipoDoc} onChange={e => setFiltroTipoDoc(e.target.value as TipoDoc | 'Todos')}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="Todos">Todos los tipos</option>
                {tiposActivos.map(t => <option key={t}>{t}</option>)}
              </select>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" />
              </div>
              <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />Nuevo
              </button>
            </div>
          </div>

          {/* Estatus chips */}
          <div className="flex flex-wrap gap-1.5 pb-4">
            {(['Todos', ...TODOS_ESTATUS] as (EstatusDoc | 'Todos')[]).map(e => (
              <button key={e} onClick={() => setFiltroEstatus(e)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filtroEstatus === e ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {e !== 'Todos' && <span className={`w-1.5 h-1.5 rounded-full ${filtroEstatus === e ? 'bg-white' : estatusDot[e as EstatusDoc]}`} />}
                {e}
                <span className="opacity-60">{contarEstatus(e)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Titular</th>
                <th className="px-4 py-3">Tipo de documento</th>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Emisión</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Revisado por</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 italic text-sm">Sin documentos en esta categoría.</td></tr>
              )}
              {filtered.map((doc, i) => {
                const dias = diasHastaVencimiento(doc.fechaVencimiento)
                return (
                  <tr key={i} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setDetalle(doc)}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{doc.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{doc.entidadNombre}</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${tipoEntidadStyle[doc.entidadTipo]}`}>{doc.entidadTipo}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">{doc.tipoDoc}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{doc.folio}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{doc.fechaEmision}</td>
                    <td className="px-4 py-3"><VencimientoTag fecha={doc.fechaVencimiento} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{doc.revisadoPor}</td>
                    <td className="px-4 py-3"><EBadge e={doc.estatus} /></td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setDetalle(doc)} title="Ver"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button title="Descargar"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDetalle(doc)} title="Comentar"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                        </button>
                        {(doc.estatus === 'Vencido' || doc.estatus === 'Pendiente de actualización' || (dias !== null && dias <= 30)) && (
                          <button onClick={() => setDetalle(doc)} title="Solicitar actualización"
                            className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
