'use client'

import { useState } from 'react'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  TruckIcon,
  BanknotesIcon,
  DocumentTextIcon,
  UsersIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TipoEmpresa =
  | 'Agencia automotriz'
  | 'Lote de autos'
  | 'Arrendadora'
  | 'Flotilla'
  | 'Taller'
  | 'Aseguradora'
  | 'Grupo automotriz'
  | 'Empresa general'

type EstatusEmpresa = 'Activa' | 'Suspendida' | 'Pendiente' | 'Inactiva'

interface UsuarioVinculado { nombre: string; rol: string; email: string }
interface VehiculoFrecuente { modelo: string; placas: string; anio: string }
interface ViajeResumen { id: string; fecha: string; ruta: string; monto: number; estatus: string }
interface NotaInterna { autor: string; texto: string; hora: string }

interface Empresa {
  id: string
  razonSocial: string
  nombreComercial: string
  tipo: TipoEmpresa
  rfc: string
  regimenFiscal: string
  domicilioFiscal: string
  cfdi: string
  contactoPrincipal: string
  telefono: string
  correo: string
  direccion: string
  estatus: EstatusEmpresa
  fechaRegistro: string
  // condiciones comerciales
  descuento: number
  creditoDias: number
  limiteCredito: number
  convenio: string
  vigenciaConvenio: string
  // resumen
  usuariosVinculados: UsuarioVinculado[]
  vehiculosFrecuentes: VehiculoFrecuente[]
  historialViajes: ViajeResumen[]
  notas: NotaInterna[]
  totalFacturado: number
  viajesTotal: number
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const EMPRESAS: Empresa[] = [
  {
    id: 'EMP-001',
    razonSocial: 'Grupo Logístico CDMX SA de CV',
    nombreComercial: 'Grupo Logístico CDMX',
    tipo: 'Flotilla',
    rfc: 'GLC230310XX1',
    regimenFiscal: '601 - General de Ley Personas Morales',
    domicilioFiscal: 'Av. Insurgentes Sur 1234, Benito Juárez, CDMX',
    cfdi: 'G03 - Gastos en general',
    contactoPrincipal: 'Ricardo Torres Mendoza',
    telefono: '+52 55 1234 5678',
    correo: 'rtorres@grupologistico.com',
    direccion: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',
    estatus: 'Activa',
    fechaRegistro: '10 Mar 2023',
    descuento: 10,
    creditoDias: 30,
    limiteCredito: 50000,
    convenio: 'CONV-GLC-2023-001',
    vigenciaConvenio: '10 Mar 2026',
    usuariosVinculados: [
      { nombre: 'Ricardo Torres', rol: 'Administrador', email: 'rtorres@grupologistico.com' },
      { nombre: 'Ana Morales', rol: 'Coordinador', email: 'amorales@grupologistico.com' },
    ],
    vehiculosFrecuentes: [
      { modelo: 'Toyota Hilux 2022', placas: 'XYZ-987', anio: '2022' },
      { modelo: 'Ford F-150 2021', placas: 'GHI-321', anio: '2021' },
      { modelo: 'Nissan NP300 2020', placas: 'PQR-111', anio: '2020' },
    ],
    historialViajes: [
      { id: '#TR-8848', fecha: '14 Jun 2025', ruta: 'Reforma → Taller Norte', monto: 1200, estatus: 'Traslado en curso' },
      { id: '#TR-8830', fecha: '10 Jun 2025', ruta: 'Taller Sur → Agencia Norte', monto: 1800, estatus: 'Finalizado' },
    ],
    notas: [{ autor: 'Ops. Central', texto: 'Cliente VIP. Prioridad máxima en asignaciones.', hora: '10 Mar 2023' }],
    totalFacturado: 148000,
    viajesTotal: 148,
  },
  {
    id: 'EMP-002',
    razonSocial: 'AutoMóviles del Norte SA de CV',
    nombreComercial: 'AutoNorte',
    tipo: 'Agencia automotriz',
    rfc: 'ANO230615YZ2',
    regimenFiscal: '601 - General de Ley Personas Morales',
    domicilioFiscal: 'Blvd. Díaz Ordaz 500, Monterrey, NL',
    cfdi: 'G03 - Gastos en general',
    contactoPrincipal: 'Fernanda López Ríos',
    telefono: '+52 81 9876 5432',
    correo: 'flopez@autonorte.mx',
    direccion: 'Blvd. Díaz Ordaz 500, Col. Santa María, Monterrey, NL',
    estatus: 'Activa',
    fechaRegistro: '15 Jun 2023',
    descuento: 8,
    creditoDias: 15,
    limiteCredito: 30000,
    convenio: 'CONV-ANO-2023-002',
    vigenciaConvenio: '15 Jun 2025',
    usuariosVinculados: [
      { nombre: 'Fernanda López', rol: 'Administrador', email: 'flopez@autonorte.mx' },
    ],
    vehiculosFrecuentes: [
      { modelo: 'Honda Civic 2020', placas: 'DEF-456', anio: '2020' },
      { modelo: 'Chevrolet Trax 2022', placas: 'MNO-789', anio: '2022' },
    ],
    historialViajes: [
      { id: '#TR-8844', fecha: '14 Jun 2025', ruta: 'Taller Sur → Agencia Norte', monto: 950, estatus: 'En revisión' },
    ],
    notas: [{ autor: 'Admin', texto: 'Convenio próximo a vencer en Jun 2025. Renovar.', hora: '01 Jun 2025' }],
    totalFacturado: 93000,
    viajesTotal: 93,
  },
  {
    id: 'EMP-003',
    razonSocial: 'Distribuidora Bajío SA de CV',
    nombreComercial: 'Distribuidora Bajío',
    tipo: 'Empresa general',
    rfc: 'DBA240505AB3',
    regimenFiscal: '601 - General de Ley Personas Morales',
    domicilioFiscal: 'Av. Constituyentes 200, Querétaro, QRO',
    cfdi: 'G03 - Gastos en general',
    contactoPrincipal: 'Claudia Ríos Pacheco',
    telefono: '+52 46 2222 3333',
    correo: 'crios@bajio.com.mx',
    direccion: 'Av. Constituyentes 200, Centro, Querétaro, QRO',
    estatus: 'Pendiente',
    fechaRegistro: '05 May 2024',
    descuento: 0,
    creditoDias: 0,
    limiteCredito: 0,
    convenio: '—',
    vigenciaConvenio: '—',
    usuariosVinculados: [
      { nombre: 'Claudia Ríos', rol: 'Administrador', email: 'crios@bajio.com.mx' },
    ],
    vehiculosFrecuentes: [
      { modelo: 'Ford F-150 2023', placas: 'GHI-321', anio: '2023' },
    ],
    historialViajes: [
      { id: '#TR-8847', fecha: '15 Jun 2025', ruta: 'Querétaro → CDMX', monto: 2200, estatus: 'Conductor asignado' },
    ],
    notas: [{ autor: 'Admin', texto: 'Cuenta pendiente de activar. Faltan CSF y datos fiscales.', hora: '05 May 2024' }],
    totalFacturado: 2200,
    viajesTotal: 1,
  },
  {
    id: 'EMP-004',
    razonSocial: 'Seguros Primero Nacional SA de CV',
    nombreComercial: 'Seguros Primero',
    tipo: 'Aseguradora',
    rfc: 'SPN240201XY9',
    regimenFiscal: '601 - General de Ley Personas Morales',
    domicilioFiscal: 'Paseo de la Reforma 300, Cuauhtémoc, CDMX',
    cfdi: 'G03 - Gastos en general',
    contactoPrincipal: 'Marcos Villanueva',
    telefono: '+52 55 8000 1111',
    correo: 'siniestros@primeronal.com.mx',
    direccion: 'Paseo de la Reforma 300, Piso 12, CDMX',
    estatus: 'Activa',
    fechaRegistro: '01 Feb 2024',
    descuento: 12,
    creditoDias: 30,
    limiteCredito: 100000,
    convenio: 'CONV-SPN-2024-001',
    vigenciaConvenio: '31 Jan 2026',
    usuariosVinculados: [
      { nombre: 'Marcos Villanueva', rol: 'Coordinador siniestros', email: 'mvillanueva@primeronal.com.mx' },
      { nombre: 'Laura Soto', rol: 'Asistente', email: 'lsoto@primeronal.com.mx' },
    ],
    vehiculosFrecuentes: [],
    historialViajes: [
      { id: '#TR-8800', fecha: '01 Jun 2025', ruta: 'CDMX → Taller Siniestros', monto: 800, estatus: 'Finalizado' },
    ],
    notas: [],
    totalFacturado: 62000,
    viajesTotal: 22,
  },
  {
    id: 'EMP-005',
    razonSocial: 'Renta Wheels de México SA de CV',
    nombreComercial: 'RentaWheels',
    tipo: 'Arrendadora',
    rfc: 'RWM210315ZZ5',
    regimenFiscal: '601 - General de Ley Personas Morales',
    domicilioFiscal: 'Blvd. Manuel Ávila Camacho 3130, Tlalnepantla, EdoMex',
    cfdi: 'G03 - Gastos en general',
    contactoPrincipal: 'Jorge Elizondo',
    telefono: '+52 55 3300 8800',
    correo: 'operaciones@rentawheels.mx',
    direccion: 'Blvd. Manuel Ávila Camacho 3130, Tlalnepantla, Estado de México',
    estatus: 'Activa',
    fechaRegistro: '15 Mar 2021',
    descuento: 15,
    creditoDias: 45,
    limiteCredito: 80000,
    convenio: 'CONV-RWM-2021-001',
    vigenciaConvenio: '15 Mar 2027',
    usuariosVinculados: [
      { nombre: 'Jorge Elizondo', rol: 'Director Operativo', email: 'jelizondo@rentawheels.mx' },
      { nombre: 'Patricia Nava', rol: 'Coordinador', email: 'pnava@rentawheels.mx' },
      { nombre: 'Carlos Vega', rol: 'Asistente', email: 'cvega@rentawheels.mx' },
    ],
    vehiculosFrecuentes: [
      { modelo: 'Nissan Versa 2022', placas: 'RWA-100', anio: '2022' },
      { modelo: 'Toyota Corolla 2023', placas: 'RWB-200', anio: '2023' },
      { modelo: 'Honda HR-V 2021', placas: 'RWC-300', anio: '2021' },
    ],
    historialViajes: [
      { id: '#TR-8790', fecha: '05 Jun 2025', ruta: 'Aeropuerto → Sucursal Centro', monto: 750, estatus: 'Finalizado' },
      { id: '#TR-8775', fecha: '01 Jun 2025', ruta: 'Sucursal Norte → Taller', monto: 600, estatus: 'Finalizado' },
    ],
    notas: [{ autor: 'Coordinador', texto: 'Cuenta con descuento especial negociado en 2024. No modificar sin autorización.', hora: '15 Ene 2024' }],
    totalFacturado: 215000,
    viajesTotal: 310,
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const TIPOS_EMPRESA: TipoEmpresa[] = [
  'Agencia automotriz','Lote de autos','Arrendadora','Flotilla',
  'Taller','Aseguradora','Grupo automotriz','Empresa general',
]

const tipoColor: Record<TipoEmpresa, string> = {
  'Agencia automotriz': 'bg-blue-50 text-blue-700',
  'Lote de autos':      'bg-sky-50 text-sky-700',
  'Arrendadora':        'bg-teal-50 text-teal-700',
  'Flotilla':           'bg-indigo-50 text-indigo-700',
  'Taller':             'bg-orange-50 text-orange-700',
  'Aseguradora':        'bg-rose-50 text-rose-700',
  'Grupo automotriz':   'bg-violet-50 text-violet-700',
  'Empresa general':    'bg-slate-100 text-slate-600',
}

const tipoIcon: Record<TipoEmpresa, string> = {
  'Agencia automotriz': '🏪',
  'Lote de autos':      '🚗',
  'Arrendadora':        '🔑',
  'Flotilla':           '🚛',
  'Taller':             '🔧',
  'Aseguradora':        '🛡️',
  'Grupo automotriz':   '🏭',
  'Empresa general':    '🏢',
}

const estatusStyle: Record<EstatusEmpresa, string> = {
  Activa:     'bg-green-100 text-green-700',
  Suspendida: 'bg-red-100 text-red-700',
  Pendiente:  'bg-amber-100 text-amber-700',
  Inactiva:   'bg-slate-100 text-slate-500',
}

function initials(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const gradients = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
]

// ─── DETALLE EMPRESA ──────────────────────────────────────────────────────────
type DetailTab = 'info' | 'usuarios' | 'vehiculos' | 'viajes' | 'comercial' | 'notas'

function EmpresaDetalle({ empresa, idx, onClose }: {
  empresa: Empresa; idx: number; onClose: () => void
}) {
  const [tab, setTab]           = useState<DetailTab>('info')
  const [editMode, setEditMode] = useState(false)
  const [estatus, setEstatus]   = useState<EstatusEmpresa>(empresa.estatus)
  const [notas, setNotas]       = useState(empresa.notas)
  const [nuevaNota, setNuevaNota] = useState('')
  const grad = gradients[idx % gradients.length]

  const addNota = () => {
    if (!nuevaNota.trim()) return
    setNotas(n => [...n, { autor: 'Admin', texto: nuevaNota.trim(), hora: 'Ahora' }])
    setNuevaNota('')
  }

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'info',      label: 'Información',      icon: <BuildingOfficeIcon className="w-3.5 h-3.5" /> },
    { id: 'comercial', label: 'Condiciones comerciales', icon: <BanknotesIcon className="w-3.5 h-3.5" /> },
    { id: 'usuarios',  label: `Usuarios (${empresa.usuariosVinculados.length})`, icon: <UsersIcon className="w-3.5 h-3.5" /> },
    { id: 'vehiculos', label: `Vehículos (${empresa.vehiculosFrecuentes.length})`, icon: <TruckIcon className="w-3.5 h-3.5" /> },
    { id: 'viajes',    label: `Viajes (${empresa.historialViajes.length})`,    icon: <DocumentTextIcon className="w-3.5 h-3.5" /> },
    { id: 'notas',     label: `Notas (${notas.length})`,                       icon: <PencilSquareIcon className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl">

        {/* Header */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeftIcon className="w-4 h-4 text-slate-500" /></button>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {initials(empresa.nombreComercial)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-slate-800 text-lg leading-tight">{empresa.nombreComercial}</h2>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoColor[empresa.tipo]}`}>{tipoIcon[empresa.tipo]} {empresa.tipo}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estatusStyle[estatus]}`}>{estatus}</span>
                  <span className="text-xs text-slate-400">RFC: {empresa.rfc}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {estatus === 'Activa' && (
                <button onClick={() => setEstatus('Suspendida')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />Suspender
                </button>
              )}
              {(estatus === 'Suspendida' || estatus === 'Inactiva') && (
                <button onClick={() => setEstatus('Activa')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <CheckCircleIcon className="w-3.5 h-3.5" />Reactivar
                </button>
              )}
              <button onClick={() => setEditMode(e => !e)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${editMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <PencilSquareIcon className="w-3.5 h-3.5" />{editMode ? 'Guardando...' : 'Editar'}
              </button>
              <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
            </div>
          </div>

          {/* Quick KPIs */}
          <div className="grid grid-cols-3 gap-3 mt-4 pb-1">
            {[
              { label: 'Total facturado', value: `$${empresa.totalFacturado.toLocaleString()}`, color: 'text-emerald-600' },
              { label: 'Viajes totales',  value: empresa.viajesTotal,  color: 'text-blue-600' },
              { label: 'Usuarios vinculados', value: empresa.usuariosVinculados.length, color: 'text-indigo-600' },
            ].map((k, i) => (
              <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-center">
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-slate-400">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-3 overflow-x-auto border-t border-slate-100 pt-1 -mx-6 px-6">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* ── INFO ── */}
          {tab === 'info' && (
            <div className="space-y-4">
              <SCard title="🏢 Datos de la Empresa">
                <G2>
                  <F label="Razón social" value={empresa.razonSocial} editable={editMode} />
                  <F label="Nombre comercial" value={empresa.nombreComercial} editable={editMode} />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Tipo de empresa</p>
                    {editMode ? (
                      <select defaultValue={empresa.tipo} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full">
                        {TIPOS_EMPRESA.map(t => <option key={t}>{t}</option>)}
                      </select>
                    ) : <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${tipoColor[empresa.tipo]}`}>{tipoIcon[empresa.tipo]} {empresa.tipo}</span>}
                  </div>
                  <F label="Fecha de registro" value={empresa.fechaRegistro} />
                </G2>
              </SCard>

              <SCard title="📞 Contacto">
                <G2>
                  <F label="Contacto principal" value={empresa.contactoPrincipal} editable={editMode} />
                  <F label="Teléfono" value={empresa.telefono} editable={editMode} />
                  <F label="Correo electrónico" value={empresa.correo} editable={editMode} />
                  <F label="Dirección" value={empresa.direccion} editable={editMode} />
                </G2>
              </SCard>

              <SCard title="🧾 Datos de Facturación">
                <G2>
                  <F label="RFC" value={<span className="font-mono text-xs">{empresa.rfc}</span>} />
                  <F label="Régimen fiscal" value={empresa.regimenFiscal} editable={editMode} />
                  <F label="CFDI" value={empresa.cfdi} editable={editMode} />
                  <F label="Domicilio fiscal" value={empresa.domicilioFiscal} editable={editMode} />
                </G2>
              </SCard>

              {editMode && (
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditMode(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button onClick={() => setEditMode(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Guardar cambios</button>
                </div>
              )}
            </div>
          )}

          {/* ── CONDICIONES COMERCIALES ── */}
          {tab === 'comercial' && (
            <div className="space-y-4">
              <SCard title="📋 Condiciones Comerciales">
                <G2>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Descuento aplicado</p>
                    {editMode
                      ? <input type="number" defaultValue={empresa.descuento} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                      : <span className="text-xl font-bold text-green-600">{empresa.descuento}%</span>}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Crédito (días)</p>
                    {editMode
                      ? <input type="number" defaultValue={empresa.creditoDias} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                      : <span className="text-xl font-bold text-blue-600">{empresa.creditoDias} días</span>}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Límite de crédito</p>
                    {editMode
                      ? <input type="number" defaultValue={empresa.limiteCredito} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                      : <span className="text-xl font-bold text-slate-800">${empresa.limiteCredito.toLocaleString()} MXN</span>}
                  </div>
                  <F label="Convenio" value={<span className="font-mono text-xs text-blue-600">{empresa.convenio}</span>} />
                  <F label="Vigencia del convenio" value={empresa.vigenciaConvenio} />
                </G2>
              </SCard>

              {/* Facturación resumen */}
              <SCard title="💰 Resumen Financiero">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Total facturado</p>
                    <p className="text-2xl font-bold text-emerald-700">${empresa.totalFacturado.toLocaleString()}</p>
                    <p className="text-xs text-emerald-500 mt-0.5">MXN acumulado</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-blue-600 font-medium mb-1">Promedio por viaje</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ${empresa.viajesTotal > 0 ? Math.round(empresa.totalFacturado / empresa.viajesTotal).toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-blue-500 mt-0.5">en {empresa.viajesTotal} viajes</p>
                  </div>
                </div>
              </SCard>

              {editMode && (
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditMode(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button onClick={() => setEditMode(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Guardar</button>
                </div>
              )}
            </div>
          )}

          {/* ── USUARIOS VINCULADOS ── */}
          {tab === 'usuarios' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-700">Usuarios con acceso a esta cuenta</p>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                  <PlusIcon className="w-3.5 h-3.5" />Vincular usuario
                </button>
              </div>
              {empresa.usuariosVinculados.length === 0
                ? <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400 italic">Sin usuarios vinculados.</div>
                : empresa.usuariosVinculados.map((u, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white text-xs font-bold`}>
                        {initials(u.nombre)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{u.nombre}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-medium">{u.rol}</span>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── VEHÍCULOS FRECUENTES ── */}
          {tab === 'vehiculos' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-700">Vehículos asociados a esta empresa</p>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                  <PlusIcon className="w-3.5 h-3.5" />Agregar vehículo
                </button>
              </div>
              {empresa.vehiculosFrecuentes.length === 0
                ? <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400 italic">Sin vehículos frecuentes registrados.</div>
                : empresa.vehiculosFrecuentes.map((v, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg"><TruckIcon className="w-5 h-5 text-blue-500" /></div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{v.modelo}</p>
                        <p className="text-xs text-slate-400">Placas: <span className="font-mono">{v.placas}</span> · {v.anio}</p>
                      </div>
                    </div>
                    <button className="text-xs text-blue-600 hover:underline">Ver viajes</button>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── HISTORIAL VIAJES ── */}
          {tab === 'viajes' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 text-sm font-semibold text-slate-700">Historial de viajes de esta empresa</div>
              {empresa.historialViajes.length === 0
                ? <p className="p-8 text-center text-sm text-slate-400 italic">Sin viajes registrados.</p>
                : <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Ruta</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empresa.historialViajes.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-blue-600">{v.id}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{v.fecha}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{v.ruta}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">${v.monto.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{v.estatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          )}

          {/* ── NOTAS ── */}
          {tab === 'notas' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 italic">Visibles únicamente para el equipo de operaciones.</p>
              {notas.length === 0 && <p className="text-sm text-slate-400 italic text-center py-6">Sin notas aún.</p>}
              {notas.map((n, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700">{n.autor} · {n.hora}</p>
                  <p className="text-sm text-slate-700 mt-1">{n.texto}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input type="text" value={nuevaNota} onChange={e => setNuevaNota(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNota()}
                  placeholder="Agregar nota interna..."
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

// ─── NUEVA EMPRESA FORM ───────────────────────────────────────────────────────
function NuevaEmpresaForm({ onClose }: { onClose: () => void }) {
  const [tipo, setTipo] = useState<TipoEmpresa | ''>('')
  const iCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const L = ({ c, req }: { c: React.ReactNode; req?: boolean }) => (
    <label className="block text-xs font-medium text-slate-500 mb-1">{c}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Nueva Empresa</h2>
            <p className="text-xs text-slate-400">Registrar cuenta corporativa</p>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Tipo */}
          <div>
            <L c="Tipo de empresa" req />
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_EMPRESA.map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border-2 transition-colors text-left ${tipo === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <span className="text-base">{tipoIcon[t]}</span>{t}
                </button>
              ))}
            </div>
          </div>

          {/* Datos empresa */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">🏢 Datos de la empresa</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><L c="Razón social" req /><input type="text" className={iCls} /></div>
              <div><L c="Nombre comercial" /><input type="text" className={iCls} /></div>
              <div><L c="RFC" req /><input type="text" placeholder="12 o 13 caracteres" className={iCls} /></div>
              <div><L c="Contacto principal" req /><input type="text" className={iCls} /></div>
              <div><L c="Teléfono" req /><input type="tel" className={iCls} /></div>
              <div className="col-span-2"><L c="Correo electrónico" req /><input type="email" className={iCls} /></div>
              <div className="col-span-2"><L c="Dirección" /><input type="text" className={iCls} /></div>
            </div>
          </div>

          {/* Facturación */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">🧾 Facturación</p>
            <div className="grid grid-cols-2 gap-4">
              <div><L c="Régimen fiscal" /><input type="text" placeholder="601 - General de Ley..." className={iCls} /></div>
              <div><L c="CFDI" /><input type="text" placeholder="G03 - Gastos en general" className={iCls} /></div>
              <div className="col-span-2"><L c="Domicilio fiscal" /><input type="text" className={iCls} /></div>
            </div>
          </div>

          {/* Condiciones */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">📋 Condiciones comerciales</p>
            <div className="grid grid-cols-3 gap-4">
              <div><L c="Descuento (%)" /><input type="number" min="0" max="100" defaultValue={0} className={iCls} /></div>
              <div><L c="Crédito (días)" /><input type="number" min="0" defaultValue={0} className={iCls} /></div>
              <div><L c="Límite crédito ($)" /><input type="number" min="0" defaultValue={0} className={iCls} /></div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckCircleIcon className="w-4 h-4" />Registrar empresa
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function SCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      {children}
    </div>
  )
}
function G2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">{children}</div>
}
function F({ label, value, editable }: { label: string; value: React.ReactNode; editable?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      {editable && typeof value === 'string'
        ? <input type="text" defaultValue={value} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        : <div className="text-sm text-slate-700">{value}</div>}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function EmpresasView() {
  const [search, setSearch]         = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoEmpresa | 'Todos'>('Todos')
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusEmpresa | 'Todos'>('Todos')
  const [detalle, setDetalle]       = useState<{ empresa: Empresa; idx: number } | null>(null)
  const [showForm, setShowForm]     = useState(false)

  const filtered = EMPRESAS.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.nombreComercial.toLowerCase().includes(q) || e.razonSocial.toLowerCase().includes(q) || e.rfc.toLowerCase().includes(q) || e.contactoPrincipal.toLowerCase().includes(q)
    const matchTipo    = filtroTipo    === 'Todos' || e.tipo    === filtroTipo
    const matchEstatus = filtroEstatus === 'Todos' || e.estatus === filtroEstatus
    return matchSearch && matchTipo && matchEstatus
  })

  const counts = {
    total:     EMPRESAS.length,
    activas:   EMPRESAS.filter(e => e.estatus === 'Activa').length,
    pendientes:EMPRESAS.filter(e => e.estatus === 'Pendiente').length,
    suspendidas:EMPRESAS.filter(e => e.estatus === 'Suspendida').length,
    totalFacturado: EMPRESAS.reduce((s, e) => s + e.totalFacturado, 0),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {detalle  && <EmpresaDetalle empresa={detalle.empresa} idx={detalle.idx} onClose={() => setDetalle(null)} />}
      {showForm && <NuevaEmpresaForm onClose={() => setShowForm(false)} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total empresas',    value: counts.total,         color: 'text-slate-800' },
          { label: 'Activas',           value: counts.activas,       color: 'text-green-600' },
          { label: 'Pendientes',        value: counts.pendientes,    color: 'text-amber-600' },
          { label: 'Suspendidas',       value: counts.suspendidas,   color: 'text-red-600' },
          { label: 'Total facturado',   value: `$${(counts.totalFacturado / 1000).toFixed(0)}k`, color: 'text-emerald-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 space-y-3">
          {/* Tipo chips */}
          <div className="flex flex-wrap gap-1.5">
            {(['Todos', ...TIPOS_EMPRESA] as (TipoEmpresa | 'Todos')[]).map(t => (
              <button key={t} onClick={() => setFiltroTipo(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  filtroTipo === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {t !== 'Todos' && tipoIcon[t as TipoEmpresa]}{t}
              </button>
            ))}
          </div>
          {/* Estatus + search + new */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              {(['Todos','Activa','Pendiente','Suspendida','Inactiva'] as (EstatusEmpresa | 'Todos')[]).map(e => (
                <button key={e} onClick={() => setFiltroEstatus(e)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    filtroEstatus === e ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>{e}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar empresa..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
              </div>
              <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />Nueva empresa
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">RFC</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3 text-center">Usuarios</th>
                <th className="px-4 py-3 text-center">Viajes</th>
                <th className="px-4 py-3 text-right">Facturado</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 italic text-sm">Sin resultados.</td></tr>
              )}
              {filtered.map((empresa, i) => {
                const globalIdx = EMPRESAS.indexOf(empresa)
                const grad = gradients[globalIdx % gradients.length]
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setDetalle({ empresa, idx: globalIdx })}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {initials(empresa.nombreComercial)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{empresa.nombreComercial}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[140px]">{empresa.razonSocial}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${tipoColor[empresa.tipo]}`}>
                        {tipoIcon[empresa.tipo]}{empresa.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{empresa.rfc}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-700">{empresa.contactoPrincipal}</div>
                      <div className="text-xs text-slate-400">{empresa.telefono}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{empresa.usuariosVinculados.length}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{empresa.viajesTotal}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">${empresa.totalFacturado.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estatusStyle[empresa.estatus]}`}>{empresa.estatus}</span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDetalle({ empresa, idx: globalIdx })}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        Ver perfil
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
