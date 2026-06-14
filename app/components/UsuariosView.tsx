'use client'

import { useState } from 'react'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  TruckIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type TipoUsuario =
  | 'Personal'
  | 'Empresarial'
  | 'Agencia'
  | 'Lote'
  | 'Flotilla'
  | 'Arrendadora'
  | 'Taller'
  | 'Aseguradora'
  | 'Entrega al cliente'

type Estatus = 'Activo' | 'Suspendido' | 'Pendiente' | 'Inactivo'

interface Vehiculo { modelo: string; placas: string; anio: string }
interface Pago { fecha: string; monto: number; concepto: string; estatus: string }
interface Viaje { id: string; fecha: string; origen: string; destino: string; estatus: string }
interface NotaInterna { autor: string; texto: string; hora: string }

interface Usuario {
  id: string
  nombre: string
  apellido: string
  curp: string
  email: string
  telefono: string
  tipo: TipoUsuario
  fechaRegistro: string
  estatus: Estatus
  viajesSolicitados: number
  razonSocial: string
  rfc: string
  regimenFiscal: string
  domicilioFiscal: string
  cfdi: string
  vehiculos: Vehiculo[]
  pagos: Pago[]
  viajes: Viaje[]
  notas: NotaInterna[]
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const USUARIOS: Usuario[] = [
  {
    id: 'USR-001',
    nombre: 'Ricardo',
    apellido: 'Torres Mendoza',
    curp: 'TOMR850312HDFRRCA2',
    email: 'rtorres@grupologistico.com',
    telefono: '+52 55 1234 5678',
    tipo: 'Flotilla',
    fechaRegistro: '10 Mar 2023',
    estatus: 'Activo',
    viajesSolicitados: 148,
    razonSocial: 'Grupo Logístico CDMX SA de CV',
    rfc: 'GLC230310XX1',
    regimenFiscal: '601 - General de Ley',
    domicilioFiscal: 'Av. Insurgentes Sur 1234, CDMX',
    cfdi: 'G03 - Gastos en general',
    vehiculos: [
      { modelo: 'Toyota Hilux 2022', placas: 'XYZ-987', anio: '2022' },
      { modelo: 'Ford F-150 2021', placas: 'GHI-321', anio: '2021' },
      { modelo: 'Nissan NP300 2020', placas: 'PQR-111', anio: '2020' },
    ],
    pagos: [
      { fecha: '01 Jun 2025', monto: 8400, concepto: 'Traslados mayo', estatus: 'Pagado' },
      { fecha: '01 May 2025', monto: 6200, concepto: 'Traslados abril', estatus: 'Pagado' },
      { fecha: '14 Jun 2025', monto: 3100, concepto: 'Traslados jun (parcial)', estatus: 'Pendiente' },
    ],
    viajes: [
      { id: '#TR-8848', fecha: '14 Jun 2025', origen: 'Av. Reforma 222', destino: 'Taller Norte', estatus: 'Traslado en curso' },
      { id: '#TR-8830', fecha: '10 Jun 2025', origen: 'Taller Sur', destino: 'Agencia Norte', estatus: 'Finalizado' },
    ],
    notas: [{ autor: 'Ops. Central', texto: 'Cliente VIP. Trato preferencial en asignación de conductores.', hora: '10 Mar 2023' }],
  },
  {
    id: 'USR-002',
    nombre: 'Fernanda',
    apellido: 'López Ríos',
    curp: 'LORF900621MDFPZRA5',
    email: 'flopez@autonorte.mx',
    telefono: '+52 81 9876 5432',
    tipo: 'Agencia',
    fechaRegistro: '15 Jun 2023',
    estatus: 'Activo',
    viajesSolicitados: 93,
    razonSocial: 'AutoMóviles del Norte SA de CV',
    rfc: 'ANO230615YZ2',
    regimenFiscal: '601 - General de Ley',
    domicilioFiscal: 'Blvd. Díaz Ordaz 500, Monterrey',
    cfdi: 'G03 - Gastos en general',
    vehiculos: [
      { modelo: 'Honda Civic 2020', placas: 'DEF-456', anio: '2020' },
      { modelo: 'Chevrolet Trax 2022', placas: 'MNO-789', anio: '2022' },
    ],
    pagos: [
      { fecha: '01 Jun 2025', monto: 4800, concepto: 'Traslados mayo', estatus: 'Pagado' },
      { fecha: '14 Jun 2025', monto: 950, concepto: 'Viaje #TR-8844', estatus: 'En revisión' },
    ],
    viajes: [
      { id: '#TR-8844', fecha: '14 Jun 2025', origen: 'Taller Sur', destino: 'Agencia Norte', estatus: 'En revisión por incidencia' },
    ],
    notas: [],
  },
  {
    id: 'USR-003',
    nombre: 'Luis',
    apellido: 'Hernández Vega',
    curp: 'HEVL921105HDFRGA9',
    email: 'lhernandez@gmail.com',
    telefono: '+52 55 5555 4444',
    tipo: 'Personal',
    fechaRegistro: '20 Ene 2024',
    estatus: 'Inactivo',
    viajesSolicitados: 3,
    razonSocial: '—',
    rfc: 'HEVL921105XXX',
    regimenFiscal: '605 - Sueldos y salarios',
    domicilioFiscal: 'Calle Roble 45, CDMX',
    cfdi: 'D10 - Pago de servicios educativos',
    vehiculos: [{ modelo: 'Nissan Versa 2021', placas: 'ABC-123', anio: '2021' }],
    pagos: [{ fecha: '13 Jun 2025', monto: 650, concepto: 'Viaje #TR-8841', estatus: 'Pagado' }],
    viajes: [{ id: '#TR-8841', fecha: '13 Jun 2025', origen: 'Taller Oriente', destino: 'Roma Norte', estatus: 'Finalizado' }],
    notas: [],
  },
  {
    id: 'USR-004',
    nombre: 'Claudia',
    apellido: 'Ríos Pacheco',
    curp: 'RIPC880914MGTPCLA7',
    email: 'crios@bajio.com.mx',
    telefono: '+52 46 2222 3333',
    tipo: 'Empresarial',
    fechaRegistro: '05 May 2024',
    estatus: 'Pendiente',
    viajesSolicitados: 7,
    razonSocial: 'Distribuidora Bajío SA de CV',
    rfc: 'DBA240505AB3',
    regimenFiscal: '601 - General de Ley',
    domicilioFiscal: 'Av. Constituyentes 200, Querétaro',
    cfdi: 'G03 - Gastos en general',
    vehiculos: [{ modelo: 'Ford F-150 2023', placas: 'GHI-321', anio: '2023' }],
    pagos: [{ fecha: '15 Jun 2025', monto: 2200, concepto: 'Viaje #TR-8847', estatus: 'Pendiente' }],
    viajes: [{ id: '#TR-8847', fecha: '15 Jun 2025', origen: 'Distribuidora Bajío', destino: 'Agencia CDMX', estatus: 'Conductor asignado' }],
    notas: [{ autor: 'Admin', texto: 'Pendiente validar RFC y datos fiscales antes de activar cuenta.', hora: '05 May 2024' }],
  },
  {
    id: 'USR-005',
    nombre: 'Seguros',
    apellido: 'Primero Nacional',
    curp: '—',
    email: 'siniestros@primeronal.com.mx',
    telefono: '+52 55 8000 1111',
    tipo: 'Aseguradora',
    fechaRegistro: '01 Feb 2024',
    estatus: 'Activo',
    viajesSolicitados: 22,
    razonSocial: 'Seguros Primero Nacional SA de CV',
    rfc: 'SPN240201XY9',
    regimenFiscal: '601 - General de Ley',
    domicilioFiscal: 'Paseo de la Reforma 300, CDMX',
    cfdi: 'G03 - Gastos en general',
    vehiculos: [],
    pagos: [{ fecha: '01 Jun 2025', monto: 12400, concepto: 'Traslados siniestros mayo', estatus: 'Pagado' }],
    viajes: [],
    notas: [],
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const TIPOS: TipoUsuario[] = ['Personal','Empresarial','Agencia','Lote','Flotilla','Arrendadora','Taller','Aseguradora','Entrega al cliente']

const tipoColor: Record<TipoUsuario, string> = {
  Personal:            'bg-purple-50 text-purple-700',
  Empresarial:         'bg-blue-50 text-blue-700',
  Agencia:             'bg-indigo-50 text-indigo-700',
  Lote:                'bg-cyan-50 text-cyan-700',
  Flotilla:            'bg-sky-50 text-sky-700',
  Arrendadora:         'bg-teal-50 text-teal-700',
  Taller:              'bg-orange-50 text-orange-700',
  Aseguradora:         'bg-rose-50 text-rose-700',
  'Entrega al cliente':'bg-green-50 text-green-700',
}

const estatusStyle: Record<Estatus, string> = {
  Activo:     'bg-green-100 text-green-700',
  Suspendido: 'bg-red-100 text-red-700',
  Pendiente:  'bg-amber-100 text-amber-700',
  Inactivo:   'bg-slate-100 text-slate-500',
}

const pagoEstatusStyle: Record<string, string> = {
  Pagado:      'bg-green-50 text-green-700',
  Pendiente:   'bg-amber-50 text-amber-700',
  'En revisión': 'bg-blue-50 text-blue-700',
}

// ─── PANEL DETALLE ────────────────────────────────────────────────────────────
type DetailTab = 'perfil' | 'viajes' | 'vehiculos' | 'pagos' | 'notas'

function UsuarioDetalle({ usuario, onClose }: { usuario: Usuario; onClose: () => void }) {
  const [tab, setTab] = useState<DetailTab>('perfil')
  const [editMode, setEditMode] = useState(false)
  const [notas, setNotas] = useState(usuario.notas)
  const [nuevaNota, setNuevaNota] = useState('')
  const [estatus, setEstatus] = useState<Estatus>(usuario.estatus)

  const addNota = () => {
    if (!nuevaNota.trim()) return
    setNotas(n => [...n, { autor: 'Admin', texto: nuevaNota.trim(), hora: 'Ahora' }])
    setNuevaNota('')
  }

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'perfil',    label: 'Perfil',    icon: <UserCircleIcon className="w-4 h-4" /> },
    { id: 'viajes',    label: `Viajes (${usuario.viajes.length})`,     icon: <TruckIcon className="w-4 h-4" /> },
    { id: 'vehiculos', label: `Vehículos (${usuario.vehiculos.length})`, icon: <BuildingOfficeIcon className="w-4 h-4" /> },
    { id: 'pagos',     label: `Pagos (${usuario.pagos.length})`,       icon: <BanknotesIcon className="w-4 h-4" /> },
    { id: 'notas',     label: `Notas (${notas.length})`,               icon: <PencilSquareIcon className="w-4 h-4" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl">

        {/* Header */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
              <ChevronLeftIcon className="w-4 h-4 text-slate-500" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {usuario.nombre[0]}{usuario.apellido[0]}
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{usuario.nombre} {usuario.apellido}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tipoColor[usuario.tipo]}`}>{usuario.tipo}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estatusStyle[estatus]}`}>{estatus}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Acciones rápidas estatus */}
            {estatus === 'Activo' && (
              <button onClick={() => setEstatus('Suspendido')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                Suspender
              </button>
            )}
            {estatus === 'Suspendido' && (
              <button onClick={() => setEstatus('Activo')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 transition-colors">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Reactivar
              </button>
            )}
            <button onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${editMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <PencilSquareIcon className="w-3.5 h-3.5" />
              {editMode ? 'Guardando...' : 'Editar datos'}
            </button>
            <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">

          {/* ── PERFIL ── */}
          {tab === 'perfil' && (
            <div className="space-y-4">
              {/* Información principal */}
              <Section title="Información Principal" icon="👤">
                <Grid2>
                  <Field label="Nombre" editable={editMode} value={usuario.nombre} />
                  <Field label="Apellido" editable={editMode} value={usuario.apellido} />
                  <Field label="CURP" editable={editMode} value={usuario.curp} mono />
                  <Field label="Correo electrónico" editable={editMode} value={usuario.email} />
                  <Field label="Teléfono" editable={editMode} value={usuario.telefono} />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Tipo de usuario</p>
                    {editMode ? (
                      <select defaultValue={usuario.tipo} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        {TIPOS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${tipoColor[usuario.tipo]}`}>{usuario.tipo}</span>
                    )}
                  </div>
                  <Field label="Fecha de registro" value={usuario.fechaRegistro} />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Estatus</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estatusStyle[estatus]}`}>{estatus}</span>
                  </div>
                </Grid2>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { label: 'Viajes solicitados', value: usuario.viajesSolicitados, color: 'text-blue-600' },
                    { label: 'Vehículos', value: usuario.vehiculos.length, color: 'text-indigo-600' },
                    { label: 'Pagos registrados', value: usuario.pagos.length, color: 'text-emerald-600' },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Información fiscal */}
              <Section title="Información Fiscal" icon="🧾">
                <Grid2>
                  <Field label="Razón Social" editable={editMode} value={usuario.razonSocial} />
                  <Field label="RFC" editable={editMode} value={usuario.rfc} mono />
                  <Field label="Régimen Fiscal" editable={editMode} value={usuario.regimenFiscal} />
                  <Field label="CFDI" editable={editMode} value={usuario.cfdi} />
                </Grid2>
                <Field label="Domicilio Fiscal" editable={editMode} value={usuario.domicilioFiscal} />
              </Section>

              {editMode && (
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditMode(false)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">Cancelar</button>
                  <button onClick={() => setEditMode(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Guardar cambios</button>
                </div>
              )}
            </div>
          )}

          {/* ── VIAJES ── */}
          {tab === 'viajes' && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-100 text-sm font-semibold text-slate-700">Historial de viajes</div>
              {usuario.viajes.length === 0
                ? <p className="text-sm text-slate-400 italic p-6 text-center">Sin viajes registrados.</p>
                : <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Origen → Destino</th>
                      <th className="px-4 py-3">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usuario.viajes.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-blue-600">{v.id}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{v.fecha}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{v.origen} → {v.destino}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{v.estatus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          )}

          {/* ── VEHÍCULOS ── */}
          {tab === 'vehiculos' && (
            <div className="space-y-3">
              {usuario.vehiculos.length === 0
                ? <p className="text-sm text-slate-400 italic text-center py-8">Sin vehículos registrados.</p>
                : usuario.vehiculos.map((v, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <TruckIcon className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{v.modelo}</p>
                        <p className="text-xs text-slate-400">Placas: <span className="font-mono">{v.placas}</span> · {v.anio}</p>
                      </div>
                    </div>
                    <button className="text-xs text-blue-600 hover:underline">Ver viajes</button>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── PAGOS ── */}
          {tab === 'pagos' && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-100 text-sm font-semibold text-slate-700">Historial de pagos</div>
              {usuario.pagos.length === 0
                ? <p className="text-sm text-slate-400 italic p-6 text-center">Sin pagos registrados.</p>
                : <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Concepto</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usuario.pagos.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.fecha}</td>
                        <td className="px-4 py-3 text-slate-700">{p.concepto}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">${p.monto.toLocaleString()} MXN</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pagoEstatusStyle[p.estatus] ?? 'bg-slate-100 text-slate-500'}`}>{p.estatus}</span>
                        </td>
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
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Agregar nota interna..."
                  value={nuevaNota}
                  onChange={e => setNuevaNota(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNota()}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
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
  usuario, onClose, onOpenDetail,
}: { usuario: Usuario; onClose: () => void; onOpenDetail: (tab: DetailTab) => void }) {
  const acciones: { label: string; color: string; tab?: DetailTab; action?: () => void }[] = [
    { label: 'Ver perfil completo',   color: 'blue',   tab: 'perfil' },
    { label: 'Editar datos',          color: 'indigo', tab: 'perfil' },
    { label: 'Ver viajes',            color: 'slate',  tab: 'viajes' },
    { label: 'Ver vehículos',         color: 'slate',  tab: 'vehiculos' },
    { label: 'Ver pagos',             color: 'slate',  tab: 'pagos' },
    { label: 'Agregar nota interna',  color: 'amber',  tab: 'notas' },
    { label: usuario.estatus === 'Suspendido' ? 'Reactivar cuenta' : 'Suspender cuenta',
      color: usuario.estatus === 'Suspendido' ? 'green' : 'red' },
  ]
  const colorCls: Record<string, string> = {
    blue:   'text-blue-600 hover:bg-blue-50',
    indigo: 'text-indigo-600 hover:bg-indigo-50',
    slate:  'text-slate-600 hover:bg-slate-50',
    amber:  'text-amber-600 hover:bg-amber-50',
    green:  'text-green-600 hover:bg-green-50',
    red:    'text-red-600 hover:bg-red-50',
  }
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-4 w-64" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <p className="font-semibold text-slate-800 text-sm">{usuario.nombre} {usuario.apellido}</p>
          <button onClick={onClose}><XMarkIcon className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="space-y-0.5">
          {acciones.map((a, i) => (
            <button key={i}
              onClick={() => { onClose(); if (a.tab) onOpenDetail(a.tab) }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${colorCls[a.color]}`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SUB-COMPONENTES ──────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">{icon} {title}</h3>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">{children}</div>
}

function Field({ label, value, editable, mono }: { label: string; value: string | React.ReactNode; editable?: boolean; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      {editable && typeof value === 'string'
        ? <input type="text" defaultValue={value} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        : <div className={`text-sm text-slate-700 ${mono ? 'font-mono' : ''}`}>{value}</div>
      }
    </div>
  )
}

// ─── NUEVO USUARIO FORM ───────────────────────────────────────────────────────
function NuevoUsuarioForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ nombre: '', apellido: '', curp: '', email: '', telefono: '', tipo: '' as TipoUsuario | '', razonSocial: '', rfc: '', regimenFiscal: '', domicilioFiscal: '', cfdi: '' })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.nombre) e.nombre = 'Requerido'
    if (!form.apellido) e.apellido = 'Requerido'
    if (!form.email) e.email = 'Requerido'
    if (!form.telefono) e.telefono = 'Requerido'
    if (!form.tipo) e.tipo = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => { if (validate()) onClose() }

  const InputCls = (k: keyof typeof form) => `w-full border ${errors[k] ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`
  const Err = ({ k }: { k: keyof typeof form }) => errors[k] ? <p className="text-xs text-red-500 mt-0.5">{errors[k]}</p> : null
  const Label = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
    <label className="block text-xs font-medium text-slate-500 mb-1">{children}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  )

  const needsFiscal = form.tipo && form.tipo !== 'Personal'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Nuevo Usuario</h2>
            <p className="text-xs text-slate-400">Registra un nuevo cliente en el sistema</p>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Datos personales */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">👤 Datos personales</p>
            <div className="grid grid-cols-2 gap-4">
              <div><Label req>Nombre</Label><input type="text" placeholder="Nombre(s)" value={form.nombre} onChange={e => set('nombre', e.target.value)} className={InputCls('nombre')} /><Err k="nombre" /></div>
              <div><Label req>Apellido(s)</Label><input type="text" placeholder="Apellidos" value={form.apellido} onChange={e => set('apellido', e.target.value)} className={InputCls('apellido')} /><Err k="apellido" /></div>
              <div><Label>CURP</Label><input type="text" placeholder="18 caracteres" value={form.curp} onChange={e => set('curp', e.target.value.toUpperCase())} className={InputCls('curp')} /></div>
              <div><Label req>Tipo de usuario</Label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={InputCls('tipo')}>
                  <option value="">Seleccionar...</option>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
                <Err k="tipo" />
              </div>
              <div><Label req>Correo electrónico</Label><input type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={e => set('email', e.target.value)} className={InputCls('email')} /><Err k="email" /></div>
              <div><Label req>Teléfono</Label><input type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => set('telefono', e.target.value)} className={InputCls('telefono')} /><Err k="telefono" /></div>
            </div>
          </div>

          {/* Información fiscal */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">
              🧾 Información fiscal {!needsFiscal && <span className="font-normal normal-case text-slate-400">(opcional para usuario Personal)</span>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Razón social</Label><input type="text" placeholder="Nombre o empresa" value={form.razonSocial} onChange={e => set('razonSocial', e.target.value)} className={InputCls('razonSocial')} /></div>
              <div><Label>RFC</Label><input type="text" placeholder="RFC 12 o 13 dígitos" value={form.rfc} onChange={e => set('rfc', e.target.value.toUpperCase())} className={InputCls('rfc')} /></div>
              <div><Label>CFDI</Label><input type="text" placeholder="Ej. G03 - Gastos generales" value={form.cfdi} onChange={e => set('cfdi', e.target.value)} className={InputCls('cfdi')} /></div>
              <div><Label>Régimen fiscal</Label><input type="text" placeholder="601 - General de Ley..." value={form.regimenFiscal} onChange={e => set('regimenFiscal', e.target.value)} className={InputCls('regimenFiscal')} /></div>
              <div><Label>Domicilio fiscal</Label><input type="text" placeholder="Calle, número, ciudad" value={form.domicilioFiscal} onChange={e => set('domicilioFiscal', e.target.value)} className={InputCls('domicilioFiscal')} /></div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckCircleIcon className="w-4 h-4" />
            Registrar usuario
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function UsuariosView() {
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<TipoUsuario | 'Todos'>('Todos')
  const [estatusFiltro, setEstatusFiltro] = useState<Estatus | 'Todos'>('Todos')
  const [actionUser, setActionUser] = useState<Usuario | null>(null)
  const [detailUser, setDetailUser] = useState<{ usuario: Usuario; tab: DetailTab } | null>(null)
  const [showForm, setShowForm] = useState(false)

  const filtered = USUARIOS.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
    const matchTipo = tipoFiltro === 'Todos' || u.tipo === tipoFiltro
    const matchEstatus = estatusFiltro === 'Todos' || u.estatus === estatusFiltro
    return matchSearch && matchTipo && matchEstatus
  })

  const counts = {
    total: USUARIOS.length,
    activos: USUARIOS.filter(u => u.estatus === 'Activo').length,
    pendientes: USUARIOS.filter(u => u.estatus === 'Pendiente').length,
    suspendidos: USUARIOS.filter(u => u.estatus === 'Suspendido').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showForm && <NuevoUsuarioForm onClose={() => setShowForm(false)} />}
      {detailUser && <UsuarioDetalle usuario={detailUser.usuario} onClose={() => setDetailUser(null)} />}
      {actionUser && (
        <AccionesMenu
          usuario={actionUser}
          onClose={() => setActionUser(null)}
          onOpenDetail={(tab) => { setDetailUser({ usuario: actionUser!, tab }); setActionUser(null) }}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total usuarios', value: counts.total, color: 'text-slate-800' },
          { label: 'Activos', value: counts.activos, color: 'text-green-600' },
          { label: 'Pendientes', value: counts.pendientes, color: 'text-amber-600' },
          { label: 'Suspendidos', value: counts.suspendidos, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 space-y-3">
          {/* Tipo filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {(['Todos', ...TIPOS] as (TipoUsuario | 'Todos')[]).map(t => (
              <button key={t} onClick={() => setTipoFiltro(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  tipoFiltro === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>{t}</button>
            ))}
          </div>
          {/* Search + estatus + new */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-2">
              {(['Todos', 'Activo', 'Pendiente', 'Suspendido', 'Inactivo'] as (Estatus | 'Todos')[]).map(e => (
                <button key={e} onClick={() => setEstatusFiltro(e)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    estatusFiltro === e ? 'bg-slate-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>{e}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
              </div>
              <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />
                Nuevo
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3 text-center">Viajes</th>
                <th className="px-4 py-3 text-center">Vehículos</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 italic text-sm">Sin resultados.</td></tr>
              )}
              {filtered.map((u, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setDetailUser({ usuario: u, tab: 'perfil' })}>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{u.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.nombre[0]}{u.apellido[0]}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{u.nombre} {u.apellido}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${tipoColor[u.tipo]}`}>{u.tipo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">{u.telefono}</div>
                    {u.razonSocial !== '—' && <div className="text-xs text-slate-400 truncate max-w-[120px]">{u.razonSocial}</div>}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{u.viajesSolicitados}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{u.vehiculos.length}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{u.fechaRegistro}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estatusStyle[u.estatus]}`}>{u.estatus}</span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setActionUser(u)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                      Acciones ▾
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
