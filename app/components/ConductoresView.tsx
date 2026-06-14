'use client'

import { useState } from 'react'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  PaperAirplaneIcon,
  StarIcon,
  TruckIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type EstatusDisponibilidad = 'Disponible' | 'No disponible' | 'En viaje'
type EstatusCertificacion  = 'Pendiente de validación' | 'Activo' | 'Suspendido' | 'Bloqueado' | 'Documentación incompleta'

interface Documento {
  tipo: string
  numero: string
  vencimiento: string
  estado: 'Vigente' | 'Por vencer' | 'Vencido' | 'Pendiente'
}

interface ViajeResumen {
  id: string
  fecha: string
  origen: string
  destino: string
  tarifa: number
  estatus: string
}

interface Incidencia {
  id: string
  tipo: string
  fecha: string
  estatus: string
}

interface Ganancia {
  periodo: string
  viajes: number
  monto: number
  estatus: string
}

interface NotaInterna {
  autor: string
  texto: string
  hora: string
}

interface Conductor {
  id: string
  nombre: string
  apellido: string
  curp: string
  telefono: string
  email: string
  municipio: string
  estado: string
  foto: string
  disponibilidad: EstatusDisponibilidad
  certificacion: EstatusCertificacion
  calificacion: number
  viajesRealizados: number
  gananciasTotal: number
  cuentaBanco: string
  cuentaClabe: string
  cuentaTitular: string
  documentos: Documento[]
  viajes: ViajeResumen[]
  incidencias: Incidencia[]
  ganancias: Ganancia[]
  notas: NotaInterna[]
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CONDUCTORES: Conductor[] = [
  {
    id: 'CON-001',
    nombre: 'Carlos',
    apellido: 'Méndez Ruiz',
    curp: 'MERC870415HDFNZRA3',
    telefono: '+52 55 1111 2222',
    email: 'carlos.m@email.com',
    municipio: 'Gustavo A. Madero',
    estado: 'Ciudad de México',
    foto: 'CM',
    disponibilidad: 'En viaje',
    certificacion: 'Activo',
    calificacion: 4.9,
    viajesRealizados: 142,
    gananciasTotal: 49700,
    cuentaBanco: 'BBVA',
    cuentaClabe: '012345678901234567',
    cuentaTitular: 'Carlos Méndez Ruiz',
    documentos: [
      { tipo: 'Licencia de conducir', numero: 'LIC-2021-CX9842', vencimiento: '15 Ene 2026', estado: 'Vigente' },
      { tipo: 'INE / IFE', numero: 'OCRD000000000', vencimiento: '10 Jun 2029', estado: 'Vigente' },
      { tipo: 'Constancia Fiscal (CSF)', numero: 'MERC870415XXX', vencimiento: '31 Dic 2025', estado: 'Vigente' },
      { tipo: 'Antecedentes no penales', numero: 'AP-2024-001', vencimiento: '05 Mar 2025', estado: 'Por vencer' },
    ],
    viajes: [
      { id: '#TR-8848', fecha: '14 Jun 2025', origen: 'Av. Reforma 222', destino: 'Taller Norte', tarifa: 700, estatus: 'Traslado en curso' },
      { id: '#TR-8830', fecha: '10 Jun 2025', origen: 'Taller Sur', destino: 'Agencia Norte', tarifa: 560, estatus: 'Finalizado' },
      { id: '#TR-8815', fecha: '07 Jun 2025', origen: 'Distribuidora Bajío', destino: 'CDMX Centro', tarifa: 1300, estatus: 'Finalizado' },
    ],
    incidencias: [],
    ganancias: [
      { periodo: '1-14 Jun 2025', viajes: 8, monto: 4200, estatus: 'Pendiente' },
      { periodo: '15-31 May 2025', viajes: 18, monto: 9100, estatus: 'Pagado' },
    ],
    notas: [
      { autor: 'Ops. Central', texto: 'Conductor estrella. Prioridad en asignaciones largas.', hora: '01 Ene 2025' },
    ],
  },
  {
    id: 'CON-002',
    nombre: 'Ana',
    apellido: 'Rodríguez López',
    curp: 'ROLA920821MDFDRNA8',
    telefono: '+52 55 3333 4444',
    email: 'ana.r@email.com',
    municipio: 'Benito Juárez',
    estado: 'Ciudad de México',
    foto: 'AR',
    disponibilidad: 'Disponible',
    certificacion: 'Activo',
    calificacion: 4.7,
    viajesRealizados: 87,
    gananciasTotal: 30450,
    cuentaBanco: 'Santander',
    cuentaClabe: '014580123456789012',
    cuentaTitular: 'Ana Rodríguez López',
    documentos: [
      { tipo: 'Licencia de conducir', numero: 'LIC-2022-AR5531', vencimiento: '20 Mar 2027', estado: 'Vigente' },
      { tipo: 'INE / IFE', numero: 'OCRD000000001', vencimiento: '01 Feb 2028', estado: 'Vigente' },
      { tipo: 'Constancia Fiscal (CSF)', numero: 'ROLA920821XXX', vencimiento: '31 Dic 2025', estado: 'Vigente' },
      { tipo: 'Antecedentes no penales', numero: 'AP-2024-002', vencimiento: '15 Ago 2025', estado: 'Vigente' },
    ],
    viajes: [
      { id: '#TR-8841', fecha: '13 Jun 2025', origen: 'Taller Oriente', destino: 'Roma Norte', tarifa: 380, estatus: 'Finalizado' },
      { id: '#TR-8820', fecha: '08 Jun 2025', origen: 'Agencia Sur', destino: 'Satélite', tarifa: 500, estatus: 'Finalizado' },
    ],
    incidencias: [
      { id: '#INC-001', tipo: 'Daño vehicular', fecha: '13 Jun 2025', estatus: 'Cerrada' },
    ],
    ganancias: [
      { periodo: '1-14 Jun 2025', viajes: 6, monto: 2280, estatus: 'Pendiente' },
      { periodo: '15-31 May 2025', viajes: 14, monto: 5600, estatus: 'Pagado' },
    ],
    notas: [],
  },
  {
    id: 'CON-003',
    nombre: 'Mario',
    apellido: 'García Vega',
    curp: 'GAVM910305HDFRCRA6',
    telefono: '+52 55 5555 6666',
    email: 'mario.g@email.com',
    municipio: 'Tlalnepantla',
    estado: 'Estado de México',
    foto: 'MG',
    disponibilidad: 'Disponible',
    certificacion: 'Activo',
    calificacion: 4.5,
    viajesRealizados: 63,
    gananciasTotal: 22050,
    cuentaBanco: 'Banamex',
    cuentaClabe: '002670700000000000',
    cuentaTitular: 'Mario García Vega',
    documentos: [
      { tipo: 'Licencia de conducir', numero: 'LIC-2020-MG3310', vencimiento: '19 Jun 2025', estado: 'Por vencer' },
      { tipo: 'INE / IFE', numero: 'OCRD000000002', vencimiento: '15 May 2027', estado: 'Vigente' },
      { tipo: 'Constancia Fiscal (CSF)', numero: 'GAVM910305XXX', vencimiento: '31 Dic 2025', estado: 'Vigente' },
      { tipo: 'Antecedentes no penales', numero: 'AP-2023-003', vencimiento: '10 Ene 2024', estado: 'Vencido' },
    ],
    viajes: [
      { id: '#TR-8847', fecha: '15 Jun 2025', origen: 'Distribuidora Bajío', destino: 'CDMX', tarifa: 1300, estatus: 'Conductor asignado' },
    ],
    incidencias: [],
    ganancias: [
      { periodo: '1-14 Jun 2025', viajes: 2, monto: 1300, estatus: 'Pendiente' },
      { periodo: '15-31 May 2025', viajes: 11, monto: 4950, estatus: 'Pagado' },
    ],
    notas: [
      { autor: 'Admin', texto: 'Antecedentes penales vencidos. Solicitar renovación antes de asignar viajes.', hora: '12 Jun 2025' },
    ],
  },
  {
    id: 'CON-004',
    nombre: 'Sandra',
    apellido: 'Pérez Castillo',
    curp: 'PECS850930MDFRCNA2',
    telefono: '+52 55 7777 8888',
    email: 'sandra.p@email.com',
    municipio: 'Naucalpan',
    estado: 'Estado de México',
    foto: 'SP',
    disponibilidad: 'No disponible',
    certificacion: 'Pendiente de validación',
    calificacion: 0,
    viajesRealizados: 0,
    gananciasTotal: 0,
    cuentaBanco: 'HSBC',
    cuentaClabe: '021690040000000001',
    cuentaTitular: 'Sandra Pérez Castillo',
    documentos: [
      { tipo: 'Licencia de conducir', numero: 'LIC-2023-SP8821', vencimiento: '30 Nov 2028', estado: 'Vigente' },
      { tipo: 'INE / IFE', numero: 'OCRD000000003', vencimiento: '20 Apr 2029', estado: 'Vigente' },
      { tipo: 'Constancia Fiscal (CSF)', numero: '—', vencimiento: '—', estado: 'Pendiente' },
      { tipo: 'Antecedentes no penales', numero: '—', vencimiento: '—', estado: 'Pendiente' },
    ],
    viajes: [],
    incidencias: [],
    ganancias: [],
    notas: [
      { autor: 'Admin', texto: 'Conductor nuevo. Pendiente CSF y antecedentes para activar.', hora: '10 Jun 2025' },
    ],
  },
  {
    id: 'CON-005',
    nombre: 'Pedro',
    apellido: 'Castillo Mora',
    curp: 'CAMP930711HDFSTDA4',
    telefono: '+52 55 9999 0000',
    email: 'pedro.c@email.com',
    municipio: 'Iztapalapa',
    estado: 'Ciudad de México',
    foto: 'PC',
    disponibilidad: 'No disponible',
    certificacion: 'Suspendido',
    calificacion: 3.8,
    viajesRealizados: 31,
    gananciasTotal: 10850,
    cuentaBanco: 'Banorte',
    cuentaClabe: '072580000000000001',
    cuentaTitular: 'Pedro Castillo Mora',
    documentos: [
      { tipo: 'Licencia de conducir', numero: 'LIC-2019-PC2241', vencimiento: '05 Ago 2024', estado: 'Vencido' },
      { tipo: 'INE / IFE', numero: 'OCRD000000004', vencimiento: '10 Mar 2026', estado: 'Vigente' },
      { tipo: 'Constancia Fiscal (CSF)', numero: 'CAMP930711XXX', vencimiento: '31 Dic 2025', estado: 'Vigente' },
      { tipo: 'Antecedentes no penales', numero: 'AP-2022-005', vencimiento: '20 Feb 2023', estado: 'Vencido' },
    ],
    viajes: [
      { id: '#TR-8844', fecha: '14 Jun 2025', origen: 'Taller Sur', destino: 'Agencia Norte', tarifa: 560, estatus: 'En revisión por incidencia' },
    ],
    incidencias: [
      { id: '#INC-005', tipo: 'Daño vehicular', fecha: '14 Jun 2025', estatus: 'Abierta' },
      { id: '#INC-006', tipo: 'Retraso', fecha: '14 Jun 2025', estatus: 'En seguimiento' },
    ],
    ganancias: [
      { periodo: '1-14 Jun 2025', viajes: 1, monto: 560, estatus: 'En revisión' },
    ],
    notas: [
      { autor: 'Coordinador', texto: 'Suspendido por 2 incidencias en el mismo viaje. Revisar antes de reactivar.', hora: '14 Jun 2025' },
    ],
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const avatarColors = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
]

const certStyle: Record<EstatusCertificacion, string> = {
  'Activo':                   'bg-green-100 text-green-700',
  'Pendiente de validación':  'bg-amber-100 text-amber-700',
  'Suspendido':               'bg-red-100 text-red-700',
  'Bloqueado':                'bg-slate-900 text-white',
  'Documentación incompleta': 'bg-orange-100 text-orange-700',
}

const dispStyle: Record<EstatusDisponibilidad, string> = {
  'Disponible':    'bg-green-50 text-green-600',
  'No disponible': 'bg-slate-100 text-slate-500',
  'En viaje':      'bg-blue-50 text-blue-600',
}

const dispDot: Record<EstatusDisponibilidad, string> = {
  'Disponible':    'bg-green-500',
  'No disponible': 'bg-slate-400',
  'En viaje':      'bg-blue-500',
}

const docStyle: Record<string, string> = {
  Vigente:     'bg-green-50 text-green-700',
  'Por vencer':'bg-amber-50 text-amber-700',
  Vencido:     'bg-red-50 text-red-700',
  Pendiente:   'bg-slate-100 text-slate-500',
}

const gananciaStyle: Record<string, string> = {
  Pagado:       'bg-green-50 text-green-700',
  Pendiente:    'bg-amber-50 text-amber-700',
  'En revisión':'bg-blue-50 text-blue-700',
}

function Stars({ rating }: { rating: number }) {
  if (rating === 0) return <span className="text-xs text-slate-400 italic">Sin calificación</span>
  return (
    <span className="flex items-center gap-1">
      <span className="font-semibold text-sm text-slate-800">{rating.toFixed(1)}</span>
      <span className="flex">
        {[1,2,3,4,5].map(i => (
          i <= Math.round(rating)
            ? <StarSolid key={i} className="w-3.5 h-3.5 text-amber-400" />
            : <StarIcon key={i} className="w-3.5 h-3.5 text-slate-300" />
        ))}
      </span>
    </span>
  )
}

function DocsBadge({ docs }: { docs: Documento[] }) {
  const vencidos = docs.filter(d => d.estado === 'Vencido').length
  const porVencer = docs.filter(d => d.estado === 'Por vencer').length
  const pendientes = docs.filter(d => d.estado === 'Pendiente').length
  const ok = docs.filter(d => d.estado === 'Vigente').length
  if (vencidos > 0) return <span className="text-xs text-red-600 font-medium">{vencidos} vencido{vencidos>1?'s':''}</span>
  if (porVencer > 0) return <span className="text-xs text-amber-600 font-medium">{porVencer} por vencer</span>
  if (pendientes > 0) return <span className="text-xs text-slate-500 font-medium">{pendientes} pendiente{pendientes>1?'s':''}</span>
  return <span className="text-xs text-green-600 font-medium">{ok}/{docs.length} vigentes</span>
}

// ─── DETALLE CONDUCTOR ────────────────────────────────────────────────────────
type DetailTab = 'perfil' | 'documentos' | 'viajes' | 'ganancias' | 'incidencias' | 'notas'

function ConductorDetalle({
  conductor, idx, onClose, onUpdate,
}: {
  conductor: Conductor
  idx: number
  onClose: () => void
  onUpdate: (c: Conductor) => void
}) {
  const [tab, setTab] = useState<DetailTab>('perfil')
  const [cert, setCert] = useState<EstatusCertificacion>(conductor.certificacion)
  const [disp, setDisp] = useState<EstatusDisponibilidad>(conductor.disponibilidad)
  const [notas, setNotas] = useState(conductor.notas)
  const [nuevaNota, setNuevaNota] = useState('')
  const color = avatarColors[idx % avatarColors.length]

  const addNota = () => {
    if (!nuevaNota.trim()) return
    setNotas(n => [...n, { autor: 'Admin', texto: nuevaNota.trim(), hora: 'Ahora' }])
    setNuevaNota('')
  }

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'perfil',      label: 'Perfil' },
    { id: 'documentos',  label: `Documentos (${conductor.documentos.length})` },
    { id: 'viajes',      label: `Viajes (${conductor.viajes.length})` },
    { id: 'ganancias',   label: `Ganancias (${conductor.ganancias.length})` },
    { id: 'incidencias', label: `Incidencias (${conductor.incidencias.length})` },
    { id: 'notas',       label: `Notas (${notas.length})` },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl">

        {/* Header */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
                <ChevronLeftIcon className="w-4 h-4 text-slate-500" />
              </button>
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {conductor.foto}
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">{conductor.nombre} {conductor.apellido}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${certStyle[cert]}`}>{cert}</span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${dispStyle[disp]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dispDot[disp]}`} />
                    {disp}
                  </span>
                  <Stars rating={conductor.calificacion} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {cert === 'Pendiente de validación' && (
                <button onClick={() => setCert('Activo')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <CheckCircleIcon className="w-3.5 h-3.5" />Validar
                </button>
              )}
              {cert === 'Activo' && (
                <button onClick={() => setCert('Suspendido')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />Suspender
                </button>
              )}
              {(cert === 'Suspendido' || cert === 'Bloqueado') && (
                <button onClick={() => setCert('Activo')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <CheckCircleIcon className="w-3.5 h-3.5" />Reactivar
                </button>
              )}
              <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-3 overflow-x-auto border-t border-slate-100 pt-1 -mx-6 px-6">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>{t.label}</button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* ── PERFIL ── */}
          {tab === 'perfil' && (
            <div className="space-y-4">
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Viajes realizados', value: conductor.viajesRealizados, color: 'text-blue-600' },
                  { label: 'Ganancias totales', value: `$${conductor.gananciasTotal.toLocaleString()}`, color: 'text-emerald-600' },
                  { label: 'Incidencias', value: conductor.incidencias.length, color: conductor.incidencias.length > 0 ? 'text-red-600' : 'text-slate-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Info principal */}
              <SectionCard title="Información Principal" icon="👤">
                <Grid2>
                  <Field label="Nombre completo" value={`${conductor.nombre} ${conductor.apellido}`} />
                  <Field label="CURP" value={conductor.curp} mono />
                  <Field label="Teléfono" value={conductor.telefono} />
                  <Field label="Correo electrónico" value={conductor.email} />
                  <Field label="Municipio" value={conductor.municipio} />
                  <Field label="Estado" value={conductor.estado} />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Disponibilidad</p>
                    <select value={disp} onChange={e => setDisp(e.target.value as EstatusDisponibilidad)}
                      className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      {(['Disponible','No disponible','En viaje'] as EstatusDisponibilidad[]).map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Certificación</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${certStyle[cert]}`}>{cert}</span>
                  </div>
                  <Field label="Calificación" value={<Stars rating={conductor.calificacion} />} />
                </Grid2>
              </SectionCard>

              {/* Cuenta bancaria */}
              <SectionCard title="Cuenta Bancaria" icon="🏦">
                <Grid2>
                  <Field label="Banco" value={conductor.cuentaBanco} />
                  <Field label="Titular" value={conductor.cuentaTitular} />
                  <Field label="CLABE interbancaria" value={conductor.cuentaClabe} mono />
                </Grid2>
              </SectionCard>
            </div>
          )}

          {/* ── DOCUMENTOS ── */}
          {tab === 'documentos' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Documentos del conductor</p>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                    <CheckCircleIcon className="w-3.5 h-3.5" />Aprobar todos
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                    <XCircleIcon className="w-3.5 h-3.5" />Rechazar
                  </button>
                </div>
              </div>
              {conductor.documentos.map((doc, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${doc.estado === 'Vigente' ? 'bg-green-50' : doc.estado === 'Vencido' ? 'bg-red-50' : doc.estado === 'Por vencer' ? 'bg-amber-50' : 'bg-slate-100'}`}>
                      <DocumentTextIcon className={`w-5 h-5 ${doc.estado === 'Vigente' ? 'text-green-500' : doc.estado === 'Vencido' ? 'text-red-500' : doc.estado === 'Por vencer' ? 'text-amber-500' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{doc.tipo}</p>
                      <p className="text-xs text-slate-400 font-mono">{doc.numero !== '—' ? doc.numero : 'Sin número'}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${docStyle[doc.estado]}`}>{doc.estado}</span>
                    {doc.vencimiento !== '—' && <p className="text-xs text-slate-400">Vence: {doc.vencimiento}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── VIAJES ── */}
          {tab === 'viajes' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 text-sm font-semibold text-slate-700">Historial de viajes realizados</div>
              {conductor.viajes.length === 0
                ? <p className="p-8 text-center text-sm text-slate-400 italic">Sin viajes registrados.</p>
                : <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Ruta</th>
                      <th className="px-4 py-3 text-right">Pago</th>
                      <th className="px-4 py-3">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {conductor.viajes.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-blue-600">{v.id}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{v.fecha}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{v.origen} → {v.destino}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">${v.tarifa.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{v.estatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          )}

          {/* ── GANANCIAS ── */}
          {tab === 'ganancias' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Total acumulado</p>
                  <p className="text-2xl font-bold text-emerald-600">${conductor.gananciasTotal.toLocaleString()} MXN</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Viajes totales</p>
                  <p className="text-2xl font-bold text-slate-800">{conductor.viajesRealizados}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {conductor.ganancias.length === 0
                  ? <p className="p-8 text-center text-sm text-slate-400 italic">Sin registros de ganancias.</p>
                  : <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3">Periodo</th>
                        <th className="px-4 py-3 text-center">Viajes</th>
                        <th className="px-4 py-3 text-right">Monto</th>
                        <th className="px-4 py-3">Estatus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {conductor.ganancias.map((g, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-700">{g.periodo}</td>
                          <td className="px-4 py-3 text-center font-semibold">{g.viajes}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">${g.monto.toLocaleString()}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${gananciaStyle[g.estatus] ?? 'bg-slate-100 text-slate-500'}`}>{g.estatus}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              </div>
            </div>
          )}

          {/* ── INCIDENCIAS ── */}
          {tab === 'incidencias' && (
            <div className="space-y-3">
              {conductor.incidencias.length === 0
                ? <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                    <ShieldCheckIcon className="w-10 h-10 text-green-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 italic">Sin incidencias registradas.</p>
                  </div>
                : conductor.incidencias.map((inc, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 rounded-lg">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{inc.id}</p>
                        <p className="text-xs text-slate-500">{inc.tipo} · {inc.fecha}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      inc.estatus === 'Abierta' ? 'bg-red-100 text-red-700' :
                      inc.estatus === 'En seguimiento' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>{inc.estatus}</span>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── NOTAS ── */}
          {tab === 'notas' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 italic">Visibles únicamente para el equipo de operaciones.</p>
              {notas.length === 0 && <p className="text-center text-sm text-slate-400 italic py-6">Sin notas aún.</p>}
              {notas.map((n, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700">{n.autor} · {n.hora}</p>
                  <p className="text-sm text-slate-700 mt-1">{n.texto}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input type="text" placeholder="Agregar nota interna..." value={nuevaNota}
                  onChange={e => setNuevaNota(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNota()}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                <button onClick={addNota} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg transition-colors">
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ACTION MENU ──────────────────────────────────────────────────────────────
function AccionesMenu({
  conductor, onClose, onOpenDetail,
}: {
  conductor: Conductor
  onClose: () => void
  onOpenDetail: (tab: DetailTab) => void
}) {
  const acciones: { label: string; color: string; tab?: DetailTab }[] = [
    { label: 'Ver perfil completo',          color: 'blue',   tab: 'perfil' },
    { label: 'Validar conductor',            color: 'green',  tab: 'perfil' },
    { label: 'Aprobar documentos',           color: 'green',  tab: 'documentos' },
    { label: 'Rechazar documentos',          color: 'red',    tab: 'documentos' },
    { label: 'Ver historial de viajes',      color: 'slate',  tab: 'viajes' },
    { label: 'Ver ganancias',                color: 'emerald',tab: 'ganancias' },
    { label: 'Ver incidencias',              color: 'amber',  tab: 'incidencias' },
    { label: 'Agregar nota interna',         color: 'amber',  tab: 'notas' },
    { label: 'Asignar viaje',                color: 'indigo', tab: 'viajes' },
    { label: conductor.certificacion === 'Suspendido' ? 'Reactivar conductor' : 'Suspender conductor',
      color: conductor.certificacion === 'Suspendido' ? 'green' : 'red', tab: 'perfil' },
  ]
  const cls: Record<string, string> = {
    blue:   'text-blue-600 hover:bg-blue-50',
    green:  'text-green-600 hover:bg-green-50',
    red:    'text-red-600 hover:bg-red-50',
    slate:  'text-slate-600 hover:bg-slate-50',
    amber:  'text-amber-600 hover:bg-amber-50',
    emerald:'text-emerald-600 hover:bg-emerald-50',
    indigo: 'text-indigo-600 hover:bg-indigo-50',
  }
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-4 w-68" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <p className="font-semibold text-slate-800 text-sm">{conductor.nombre} {conductor.apellido}</p>
          <button onClick={onClose}><XMarkIcon className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="space-y-0.5">
          {acciones.map((a, i) => (
            <button key={i} onClick={() => { onClose(); if (a.tab) onOpenDetail(a.tab) }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${cls[a.color]}`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── NUEVO CONDUCTOR FORM ─────────────────────────────────────────────────────
function NuevoConductorForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    nombre: '', apellido: '', curp: '', telefono: '', email: '',
    municipio: '', estado: '', banco: '', clabe: '', titular: '',
  })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.nombre)    e.nombre    = 'Requerido'
    if (!form.apellido)  e.apellido  = 'Requerido'
    if (!form.telefono)  e.telefono  = 'Requerido'
    if (!form.email)     e.email     = 'Requerido'
    if (!form.municipio) e.municipio = 'Requerido'
    if (!form.estado)    e.estado    = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const I = (k: keyof typeof form) => `w-full border ${errors[k] ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`
  const E = ({ k }: { k: keyof typeof form }) => errors[k] ? <p className="text-xs text-red-500 mt-0.5">{errors[k]}</p> : null
  const L = ({ c, req }: { c: React.ReactNode; req?: boolean }) => (
    <label className="block text-xs font-medium text-slate-500 mb-1">{c}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Nuevo Conductor</h2>
            <p className="text-xs text-slate-400">Se registrará en estado "Pendiente de validación"</p>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">👤 Datos personales</p>
            <div className="grid grid-cols-2 gap-4">
              <div><L c="Nombre" req /><input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} className={I('nombre')} /><E k="nombre" /></div>
              <div><L c="Apellido(s)" req /><input type="text" value={form.apellido} onChange={e => set('apellido', e.target.value)} className={I('apellido')} /><E k="apellido" /></div>
              <div><L c="CURP" /><input type="text" value={form.curp} onChange={e => set('curp', e.target.value.toUpperCase())} placeholder="18 caracteres" className={I('curp')} /></div>
              <div><L c="Teléfono" req /><input type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+52 55 0000 0000" className={I('telefono')} /><E k="telefono" /></div>
              <div className="col-span-2"><L c="Correo electrónico" req /><input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="correo@ejemplo.com" className={I('email')} /><E k="email" /></div>
              <div><L c="Municipio" req /><input type="text" value={form.municipio} onChange={e => set('municipio', e.target.value)} placeholder="Municipio o alcaldía" className={I('municipio')} /><E k="municipio" /></div>
              <div><L c="Estado" req /><input type="text" value={form.estado} onChange={e => set('estado', e.target.value)} placeholder="Estado de la república" className={I('estado')} /><E k="estado" /></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">🏦 Cuenta bancaria</p>
            <div className="grid grid-cols-2 gap-4">
              <div><L c="Banco" /><input type="text" value={form.banco} onChange={e => set('banco', e.target.value)} placeholder="BBVA, Santander..." className={I('banco')} /></div>
              <div><L c="Titular de la cuenta" /><input type="text" value={form.titular} onChange={e => set('titular', e.target.value)} placeholder="Nombre completo" className={I('titular')} /></div>
              <div className="col-span-2"><L c="CLABE interbancaria" /><input type="text" value={form.clabe} onChange={e => set('clabe', e.target.value)} placeholder="18 dígitos" className={I('clabe')} /></div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            ⚠️ El conductor quedará en estado <strong>Pendiente de validación</strong>. Para activarlo deberás aprobar sus documentos desde su perfil.
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={() => { if (validate()) onClose() }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckCircleIcon className="w-4 h-4" />
            Registrar conductor
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-800 text-sm">{icon} {title}</h3>
      {children}
    </div>
  )
}
function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">{children}</div>
}
function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <div className={`text-sm text-slate-700 ${mono ? 'font-mono text-xs' : ''}`}>{value}</div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ConductoresView() {
  const [search, setSearch] = useState('')
  const [certFiltro, setCertFiltro] = useState<EstatusCertificacion | 'Todos'>('Todos')
  const [dispFiltro, setDispFiltro] = useState<EstatusDisponibilidad | 'Todos'>('Todos')
  const [actionConductor, setActionConductor] = useState<{ conductor: Conductor; idx: number } | null>(null)
  const [detailConductor, setDetailConductor] = useState<{ conductor: Conductor; idx: number; tab: DetailTab } | null>(null)
  const [showForm, setShowForm] = useState(false)

  const filtered = CONDUCTORES.filter((c, ) => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    const matchCert = certFiltro === 'Todos' || c.certificacion === certFiltro
    const matchDisp = dispFiltro === 'Todos' || c.disponibilidad === dispFiltro
    return matchSearch && matchCert && matchDisp
  })

  const counts = {
    total:      CONDUCTORES.length,
    activos:    CONDUCTORES.filter(c => c.certificacion === 'Activo').length,
    disponibles:CONDUCTORES.filter(c => c.disponibilidad === 'Disponible').length,
    pendientes: CONDUCTORES.filter(c => c.certificacion === 'Pendiente de validación').length,
    suspendidos:CONDUCTORES.filter(c => c.certificacion === 'Suspendido').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showForm && <NuevoConductorForm onClose={() => setShowForm(false)} />}
      {detailConductor && (
        <ConductorDetalle
          conductor={detailConductor.conductor}
          idx={detailConductor.idx}
          onClose={() => setDetailConductor(null)}
          onUpdate={() => {}}
        />
      )}
      {actionConductor && (
        <AccionesMenu
          conductor={actionConductor.conductor}
          onClose={() => setActionConductor(null)}
          onOpenDetail={(tab) => {
            setDetailConductor({ conductor: actionConductor.conductor, idx: actionConductor.idx, tab })
            setActionConductor(null)
          }}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'text-slate-800' },
          { label: 'Activos', value: counts.activos, color: 'text-green-600' },
          { label: 'Disponibles ahora', value: counts.disponibles, color: 'text-blue-600' },
          { label: 'Pendientes validación', value: counts.pendientes, color: 'text-amber-600' },
          { label: 'Suspendidos', value: counts.suspendidos, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros + tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 space-y-3">
          {/* Certificación chips */}
          <div className="flex flex-wrap gap-1.5">
            {(['Todos','Activo','Pendiente de validación','Suspendido','Bloqueado','Documentación incompleta'] as (EstatusCertificacion | 'Todos')[]).map(c => (
              <button key={c} onClick={() => setCertFiltro(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  certFiltro === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>{c}</button>
            ))}
          </div>
          {/* Disponibilidad + search + new */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2">
              {(['Todos','Disponible','No disponible','En viaje'] as (EstatusDisponibilidad | 'Todos')[]).map(d => (
                <button key={d} onClick={() => setDispFiltro(d)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    dispFiltro === d ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>{d}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar conductor..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
              </div>
              <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />Nuevo
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3">Conductor</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Certificación</th>
                <th className="px-4 py-3">Disponibilidad</th>
                <th className="px-4 py-3">Documentos</th>
                <th className="px-4 py-3 text-center">Viajes</th>
                <th className="px-4 py-3">Calificación</th>
                <th className="px-4 py-3 text-right">Ganancias</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 italic text-sm">Sin resultados.</td></tr>
              )}
              {filtered.map((c, i) => {
                const globalIdx = CONDUCTORES.indexOf(c)
                const color = avatarColors[globalIdx % avatarColors.length]
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setDetailConductor({ conductor: c, idx: globalIdx, tab: 'perfil' })}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {c.foto}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{c.nombre} {c.apellido}</div>
                          <div className="text-xs text-slate-400">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-600">{c.municipio}</div>
                      <div className="text-xs text-slate-400">{c.estado}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${certStyle[c.certificacion]}`}>{c.certificacion}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold w-fit ${dispStyle[c.disponibilidad]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dispDot[c.disponibilidad]}`} />
                        {c.disponibilidad}
                      </span>
                    </td>
                    <td className="px-4 py-3"><DocsBadge docs={c.documentos} /></td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{c.viajesRealizados}</td>
                    <td className="px-4 py-3"><Stars rating={c.calificacion} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 text-xs">${c.gananciasTotal.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setActionConductor({ conductor: c, idx: globalIdx })}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        Acciones ▾
                      </button>
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
