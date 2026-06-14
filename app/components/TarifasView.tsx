'use client'

import { useState } from 'react'
import {
  PlusIcon,
  XMarkIcon,
  PencilSquareIcon,
  CheckIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TipoVehiculo = 'Sedán' | 'SUV' | 'Pick-up' | 'Van' | 'Camioneta' | 'Luxury' | 'Todos'
type TipoServicio = 'Traslado local' | 'Traslado foráneo' | 'Entrega al cliente' | 'Recolección' | 'Largo recorrido' | 'Urgente' | 'Todos'
type NivelRiesgo  = 'Bajo' | 'Medio' | 'Alto'

interface TarifaBase {
  id: string
  nombre: string
  tipoVehiculo: TipoVehiculo
  tipoServicio: TipoServicio
  tarifaBase: number
  porKm: number
  tarifaMinima: number
  tiempoEstimado: number // min
  activa: boolean
}

interface Recargo {
  id: string
  nombre: string
  tipo: 'porcentaje' | 'fijo'
  valor: number
  aplica: string
  activo: boolean
}

interface PagoConductor {
  id: string
  tipoServicio: TipoServicio
  tipoVehiculo: TipoVehiculo
  pagoBase: number
  porKm: number
  gastosAutorizados: number
  viaticos: number
  activo: boolean
}

interface TarifaEmpresarial {
  id: string
  empresa: string
  descuento: number
  tarifaFija: number | null
  vigenciaDesde: string
  vigenciaHasta: string
  serviciosIncluidos: TipoServicio[]
  activa: boolean
}

interface RutaFrecuente {
  id: string
  nombre: string
  origen: string
  destino: string
  distanciaKm: number
  tarifaFija: number
  pagoConductor: number
  tiempoEst: number
  tipoVehiculo: TipoVehiculo
  activa: boolean
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const TARIFAS_BASE_INIT: TarifaBase[] = [
  { id: 'TB-001', nombre: 'Local Sedán',    tipoVehiculo: 'Sedán',   tipoServicio: 'Traslado local',   tarifaBase: 350, porKm: 10, tarifaMinima: 250, tiempoEstimado: 30,  activa: true  },
  { id: 'TB-002', nombre: 'Local SUV',      tipoVehiculo: 'SUV',     tipoServicio: 'Traslado local',   tarifaBase: 450, porKm: 13, tarifaMinima: 350, tiempoEstimado: 35,  activa: true  },
  { id: 'TB-003', nombre: 'Local Pick-up',  tipoVehiculo: 'Pick-up', tipoServicio: 'Traslado local',   tarifaBase: 500, porKm: 15, tarifaMinima: 400, tiempoEstimado: 40,  activa: true  },
  { id: 'TB-004', nombre: 'Foráneo Sedán',  tipoVehiculo: 'Sedán',   tipoServicio: 'Traslado foráneo', tarifaBase: 800, porKm: 12, tarifaMinima: 800, tiempoEstimado: 120, activa: true  },
  { id: 'TB-005', nombre: 'Foráneo SUV',    tipoVehiculo: 'SUV',     tipoServicio: 'Traslado foráneo', tarifaBase: 1000, porKm: 14, tarifaMinima: 1000, tiempoEstimado: 120, activa: true },
  { id: 'TB-006', nombre: 'Largo Recorrido', tipoVehiculo: 'Todos',  tipoServicio: 'Largo recorrido',  tarifaBase: 1800, porKm: 11, tarifaMinima: 1800, tiempoEstimado: 240, activa: true },
  { id: 'TB-007', nombre: 'Urgente',        tipoVehiculo: 'Todos',   tipoServicio: 'Urgente',          tarifaBase: 600, porKm: 18, tarifaMinima: 500, tiempoEstimado: 20,  activa: false },
]

const RECARGOS_INIT: Recargo[] = [
  { id: 'RC-001', nombre: 'Recargo nocturno',     tipo: 'porcentaje', valor: 20, aplica: 'Viajes entre 22:00 y 06:00',    activo: true  },
  { id: 'RC-002', nombre: 'Recargo de urgencia',  tipo: 'porcentaje', valor: 30, aplica: 'Servicio urgente (<2h)',         activo: true  },
  { id: 'RC-003', nombre: 'Recargo viaje foráneo',tipo: 'porcentaje', valor: 15, aplica: 'Viajes fuera de zona metro.',    activo: true  },
  { id: 'RC-004', nombre: 'Peaje autopista',      tipo: 'fijo',       valor: 150, aplica: 'Viajes con autopista de cuota', activo: true  },
  { id: 'RC-005', nombre: 'Combustible extra',    tipo: 'fijo',       valor: 80,  aplica: 'Viajes > 200 km',               activo: true  },
  { id: 'RC-006', nombre: 'Alto riesgo',          tipo: 'porcentaje', valor: 25, aplica: 'Vehículos de nivel riesgo alto', activo: false },
  { id: 'RC-007', nombre: 'Viático conductor',    tipo: 'fijo',       valor: 300, aplica: 'Viajes con pernocta',           activo: true  },
]

const PAGOS_CONDUCTOR_INIT: PagoConductor[] = [
  { id: 'PC-001', tipoServicio: 'Traslado local',   tipoVehiculo: 'Sedán',   pagoBase: 200, porKm: 6, gastosAutorizados: 0,   viaticos: 0,   activo: true },
  { id: 'PC-002', tipoServicio: 'Traslado local',   tipoVehiculo: 'SUV',     pagoBase: 260, porKm: 7, gastosAutorizados: 0,   viaticos: 0,   activo: true },
  { id: 'PC-003', tipoServicio: 'Traslado local',   tipoVehiculo: 'Pick-up', pagoBase: 290, porKm: 8, gastosAutorizados: 0,   viaticos: 0,   activo: true },
  { id: 'PC-004', tipoServicio: 'Traslado foráneo', tipoVehiculo: 'Todos',   pagoBase: 480, porKm: 7, gastosAutorizados: 150, viaticos: 0,   activo: true },
  { id: 'PC-005', tipoServicio: 'Largo recorrido',  tipoVehiculo: 'Todos',   pagoBase: 1000, porKm: 6, gastosAutorizados: 300, viaticos: 300, activo: true },
  { id: 'PC-006', tipoServicio: 'Urgente',          tipoVehiculo: 'Todos',   pagoBase: 350, porKm: 10, gastosAutorizados: 0,  viaticos: 0,   activo: true },
]

const TARIFAS_EMPRESARIALES_INIT: TarifaEmpresarial[] = [
  {
    id: 'TE-001', empresa: 'Grupo Logístico CDMX', descuento: 10, tarifaFija: null,
    vigenciaDesde: '01 Mar 2023', vigenciaHasta: '28 Feb 2026',
    serviciosIncluidos: ['Traslado local', 'Traslado foráneo', 'Largo recorrido'],
    activa: true,
  },
  {
    id: 'TE-002', empresa: 'AutoMóviles del Norte SA', descuento: 8, tarifaFija: null,
    vigenciaDesde: '15 Jun 2023', vigenciaHasta: '15 Jun 2025',
    serviciosIncluidos: ['Traslado local', 'Entrega al cliente'],
    activa: true,
  },
  {
    id: 'TE-003', empresa: 'Distribuidora Bajío', descuento: 0, tarifaFija: 2000,
    vigenciaDesde: '05 May 2024', vigenciaHasta: '05 May 2025',
    serviciosIncluidos: ['Largo recorrido'],
    activa: false,
  },
  {
    id: 'TE-004', empresa: 'Seguros Primero Nacional', descuento: 12, tarifaFija: null,
    vigenciaDesde: '01 Feb 2024', vigenciaHasta: '31 Jan 2026',
    serviciosIncluidos: ['Traslado local', 'Traslado foráneo', 'Urgente'],
    activa: true,
  },
]

const RUTAS_FRECUENTES_INIT: RutaFrecuente[] = [
  { id: 'RF-001', nombre: 'CDMX → Querétaro', origen: 'CDMX Centro', destino: 'Querétaro Centro', distanciaKm: 215, tarifaFija: 2200, pagoConductor: 1300, tiempoEst: 150, tipoVehiculo: 'Todos', activa: true },
  { id: 'RF-002', nombre: 'CDMX → Satélite',  origen: 'Av. Reforma 222', destino: 'Ciudad Satélite', distanciaKm: 28, tarifaFija: 550, pagoConductor: 320, tiempoEst: 50, tipoVehiculo: 'Sedán', activa: true },
  { id: 'RF-003', nombre: 'Taller Sur → Roma Norte', origen: 'Taller Xochimilco', destino: 'Roma Norte', distanciaKm: 18, tarifaFija: 380, pagoConductor: 220, tiempoEst: 40, tipoVehiculo: 'Todos', activa: true },
  { id: 'RF-004', nombre: 'CDMX → Guadalajara', origen: 'CDMX Norte', destino: 'Guadalajara', distanciaKm: 540, tarifaFija: 4800, pagoConductor: 2800, tiempoEst: 360, tipoVehiculo: 'Todos', activa: false },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const TIPOS_VEHICULO: TipoVehiculo[]  = ['Sedán','SUV','Pick-up','Van','Camioneta','Luxury','Todos']
const TIPOS_SERVICIO: TipoServicio[]  = ['Traslado local','Traslado foráneo','Entrega al cliente','Recolección','Largo recorrido','Urgente','Todos']
const NIVELES_RIESGO: NivelRiesgo[]   = ['Bajo','Medio','Alto']

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-10 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-green-500' : 'bg-slate-300'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SectionHeader({ title, icon, count, open, onToggle, onAdd }: {
  title: string; icon: string; count: number; open: boolean; onToggle: () => void; onAdd?: () => void
}) {
  return (
    <div className="flex items-center justify-between p-5 cursor-pointer select-none" onClick={onToggle}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-400">{count} configuraciones</p>
        </div>
      </div>
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        {onAdd && (
          <button onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
            <PlusIcon className="w-3.5 h-3.5" />Agregar
          </button>
        )}
        <button onClick={onToggle} className="p-1 text-slate-400 hover:text-slate-600">
          {open ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function calcMargen(tarifa: number, pago: number) {
  const m = tarifa - pago
  const pct = tarifa > 0 ? ((m / tarifa) * 100).toFixed(0) : '0'
  return { monto: m, pct }
}

// ─── SIMULADOR ────────────────────────────────────────────────────────────────
function SimuladorTarifa({ tarifas, recargos, pagos }: {
  tarifas: TarifaBase[]; recargos: Recargo[]; pagos: PagoConductor[]
}) {
  const [km, setKm]               = useState(30)
  const [tipoVeh, setTipoVeh]     = useState<TipoVehiculo>('Sedán')
  const [tipoSvc, setTipoSvc]     = useState<TipoServicio>('Traslado local')
  const [nocturno, setNocturno]   = useState(false)
  const [urgente, setUrgente]     = useState(false)
  const [foraneo, setForaneo]     = useState(false)
  const [peaje, setPeaje]         = useState(false)
  const [combustible, setCombustible] = useState(false)
  const [riesgo, setRiesgo]       = useState<NivelRiesgo>('Bajo')

  const tarifa = tarifas.find(t =>
    (t.tipoVehiculo === tipoVeh || t.tipoVehiculo === 'Todos') &&
    (t.tipoServicio === tipoSvc || t.tipoServicio === 'Todos') &&
    t.activa
  )
  const pago = pagos.find(p =>
    (p.tipoServicio === tipoSvc || p.tipoServicio === 'Todos') &&
    (p.tipoVehiculo === tipoVeh || p.tipoVehiculo === 'Todos') &&
    p.activo
  )

  let total = tarifa ? Math.max(tarifa.tarifaBase + km * tarifa.porKm, tarifa.tarifaMinima) : 0
  let pagoTotal = pago ? pago.pagoBase + km * pago.porKm : 0
  const recargosList: { nombre: string; monto: number }[] = []

  if (nocturno && recargos.find(r => r.id === 'RC-001')?.activo) {
    const v = total * 0.2; recargosList.push({ nombre: 'Recargo nocturno', monto: v }); total += v
  }
  if (urgente && recargos.find(r => r.id === 'RC-002')?.activo) {
    const v = total * 0.3; recargosList.push({ nombre: 'Urgencia', monto: v }); total += v
  }
  if (foraneo && recargos.find(r => r.id === 'RC-003')?.activo) {
    const v = total * 0.15; recargosList.push({ nombre: 'Recargo foráneo', monto: v }); total += v
  }
  if (peaje) {
    const v = 150; recargosList.push({ nombre: 'Peaje', monto: v }); total += v; pagoTotal += 150
  }
  if (combustible) {
    const v = 80; recargosList.push({ nombre: 'Combustible extra', monto: v }); total += v
  }
  if (riesgo === 'Alto' && recargos.find(r => r.id === 'RC-006')?.activo) {
    const v = total * 0.25; recargosList.push({ nombre: 'Alto riesgo', monto: v }); total += v
  }
  if (pago) pagoTotal += pago.gastosAutorizados

  const margen = total - pagoTotal
  const margenPct = total > 0 ? ((margen / total) * 100).toFixed(1) : '0'

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
      <h3 className="font-bold text-lg mb-1">🧮 Simulador de Tarifa</h3>
      <p className="text-blue-200 text-xs mb-5">Estima el precio al cliente y el pago al conductor en tiempo real.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-xs font-medium text-blue-200 mb-1">Distancia (km)</label>
          <input type="range" min="1" max="600" value={km} onChange={e => setKm(+e.target.value)}
            className="w-full accent-white" />
          <p className="text-sm font-bold mt-0.5">{km} km</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-200 mb-1">Tipo de vehículo</label>
          <select value={tipoVeh} onChange={e => setTipoVeh(e.target.value as TipoVehiculo)}
            className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
            {TIPOS_VEHICULO.filter(t => t !== 'Todos').map(t => <option key={t} value={t} className="text-slate-800">{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-200 mb-1">Tipo de servicio</label>
          <select value={tipoSvc} onChange={e => setTipoSvc(e.target.value as TipoServicio)}
            className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
            {TIPOS_SERVICIO.filter(t => t !== 'Todos').map(t => <option key={t} value={t} className="text-slate-800">{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-200 mb-1">Nivel de riesgo</label>
          <select value={riesgo} onChange={e => setRiesgo(e.target.value as NivelRiesgo)}
            className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
            {NIVELES_RIESGO.map(r => <option key={r} value={r} className="text-slate-800">{r}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2 justify-center">
          {[
            ['🌙 Horario nocturno', nocturno, setNocturno],
            ['⚡ Servicio urgente',  urgente,  setUrgente],
            ['🗺️ Viaje foráneo',    foraneo,  setForaneo],
          ].map(([label, val, fn]) => (
            <label key={label as string} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={val as boolean} onChange={e => (fn as Function)(e.target.checked)} className="w-4 h-4 accent-white" />
              {label as string}
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-2 justify-center">
          {[
            ['🛣️ Peaje / Casetas',    peaje,       setPeaje],
            ['⛽ Combustible extra',  combustible, setCombustible],
          ].map(([label, val, fn]) => (
            <label key={label as string} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={val as boolean} onChange={e => (fn as Function)(e.target.checked)} className="w-4 h-4 accent-white" />
              {label as string}
            </label>
          ))}
        </div>
      </div>

      {/* Resultados */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-200 font-medium mb-1">Tarifa al cliente</p>
          <p className="text-2xl font-bold">${Math.round(total).toLocaleString()}</p>
          {recargosList.length > 0 && (
            <div className="mt-2 text-xs text-blue-200 space-y-0.5">
              {recargosList.map(r => <p key={r.nombre}>+${Math.round(r.monto)} {r.nombre}</p>)}
            </div>
          )}
        </div>
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-200 font-medium mb-1">Pago al conductor</p>
          <p className="text-2xl font-bold">${Math.round(pagoTotal).toLocaleString()}</p>
          {pago && pago.gastosAutorizados > 0 && <p className="text-xs text-blue-200 mt-1">+${pago.gastosAutorizados} gastos auto.</p>}
        </div>
        <div className={`rounded-xl p-4 text-center ${margen >= 0 ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
          <p className="text-xs text-blue-100 font-medium mb-1">Margen estimado</p>
          <p className="text-2xl font-bold">${Math.round(margen).toLocaleString()}</p>
          <p className="text-xs text-blue-200 mt-1">{margenPct}% del precio</p>
        </div>
      </div>
      {!tarifa && <p className="text-xs text-amber-300 mt-3 flex items-center gap-1"><ExclamationTriangleIcon className="w-3.5 h-3.5" />Sin tarifa configurada para esta combinación.</p>}
    </div>
  )
}

// ─── INLINE EDIT ROW ─────────────────────────────────────────────────────────
function InlineInput({ value, onChange, type = 'number', small }: { value: any; onChange: (v: any) => void; type?: string; small?: boolean }) {
  return (
    <input type={type} value={value} onChange={e => onChange(type === 'number' ? +e.target.value : e.target.value)}
      className={`border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${small ? 'w-20' : 'w-28'}`} />
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
type MainTab = 'bases' | 'recargos' | 'conductores' | 'empresariales' | 'rutas'

export default function TarifasView() {
  const [tab, setTab]           = useState<MainTab>('bases')
  const [open, setOpen]         = useState<Record<string, boolean>>({ sim: true })
  const [editId, setEditId]     = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})

  // Estado mutable de cada sección
  const [tarifasBase, setTarifasBase]     = useState<TarifaBase[]>(TARIFAS_BASE_INIT)
  const [recargos, setRecargos]           = useState<Recargo[]>(RECARGOS_INIT)
  const [pagosConductor, setPagosConductor] = useState<PagoConductor[]>(PAGOS_CONDUCTOR_INIT)
  const [tarifasEmp, setTarifasEmp]       = useState<TarifaEmpresarial[]>(TARIFAS_EMPRESARIALES_INIT)
  const [rutasFrecuentes, setRutasFrecuentes] = useState<RutaFrecuente[]>(RUTAS_FRECUENTES_INIT)

  const startEdit = (id: string, data: any) => { setEditId(id); setEditData({ ...data }) }
  const cancelEdit = () => { setEditId(null); setEditData({}) }

  const saveEdit = (section: MainTab) => {
    if (section === 'bases') setTarifasBase(prev => prev.map(r => r.id === editId ? { ...r, ...editData } : r))
    if (section === 'recargos') setRecargos(prev => prev.map(r => r.id === editId ? { ...r, ...editData } : r))
    if (section === 'conductores') setPagosConductor(prev => prev.map(r => r.id === editId ? { ...r, ...editData } : r))
    if (section === 'empresariales') setTarifasEmp(prev => prev.map(r => r.id === editId ? { ...r, ...editData } : r))
    if (section === 'rutas') setRutasFrecuentes(prev => prev.map(r => r.id === editId ? { ...r, ...editData } : r))
    cancelEdit()
  }

  const toggleActiva = (section: MainTab, id: string) => {
    const toggle = (list: any[]) => list.map(r => r.id === id ? { ...r, activa: !r.activa, activo: !r.activo } : r)
    if (section === 'bases') setTarifasBase(prev => toggle(prev))
    if (section === 'recargos') setRecargos(prev => toggle(prev))
    if (section === 'conductores') setPagosConductor(prev => toggle(prev))
    if (section === 'empresariales') setTarifasEmp(prev => toggle(prev))
    if (section === 'rutas') setRutasFrecuentes(prev => toggle(prev))
  }

  const E = (id: string) => editId === id
  const set = (k: string, v: any) => setEditData((d: any) => ({ ...d, [k]: v }))

  const mainTabs: { id: MainTab; label: string; icon: string }[] = [
    { id: 'bases',         label: 'Tarifas base',          icon: '💰' },
    { id: 'recargos',      label: 'Recargos y variables',  icon: '⚙️' },
    { id: 'conductores',   label: 'Pago al conductor',     icon: '👤' },
    { id: 'empresariales', label: 'Tarifas empresariales', icon: '🏢' },
    { id: 'rutas',         label: 'Rutas frecuentes',      icon: '🗺️' },
  ]

  const thCls = 'px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-left'
  const tdCls = 'px-4 py-3 text-sm'

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Simulador siempre visible */}
      <SimuladorTarifa tarifas={tarifasBase} recargos={recargos} pagos={pagosConductor} />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Tarifas base activas',    value: tarifasBase.filter(t => t.activa).length,        total: tarifasBase.length },
          { label: 'Recargos activos',         value: recargos.filter(r => r.activo).length,           total: recargos.length },
          { label: 'Reglas de pago',           value: pagosConductor.filter(p => p.activo).length,     total: pagosConductor.length },
          { label: 'Convenios empresariales',  value: tarifasEmp.filter(t => t.activa).length,         total: tarifasEmp.length },
          { label: 'Rutas frecuentes',         value: rutasFrecuentes.filter(r => r.activa).length,    total: rutasFrecuentes.length },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{k.value}<span className="text-sm text-slate-400 font-normal">/{k.total}</span></p>
            <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Tabs */}
        <div className="border-b border-slate-200 px-4 pt-4 flex gap-1 overflow-x-auto">
          {mainTabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); cancelEdit() }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: TARIFAS BASE ── */}
        {tab === 'bases' && (
          <div className="overflow-x-auto">
            <div className="p-4 flex justify-end border-b border-slate-100">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                <PlusIcon className="w-3.5 h-3.5" />Nueva tarifa base
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className={thCls}>Nombre</th>
                  <th className={thCls}>Vehículo</th>
                  <th className={thCls}>Servicio</th>
                  <th className={thCls + ' text-right'}>Tarifa base</th>
                  <th className={thCls + ' text-right'}>$/km</th>
                  <th className={thCls + ' text-right'}>Mínima</th>
                  <th className={thCls + ' text-center'}>Tiempo est.</th>
                  <th className={thCls + ' text-center'}>Activa</th>
                  <th className={thCls + ' text-right'}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tarifasBase.map(t => (
                  <tr key={t.id} className={`hover:bg-slate-50 ${!t.activa ? 'opacity-50' : ''}`}>
                    <td className={tdCls + ' font-medium'}>{E(t.id) ? <InlineInput value={editData.nombre} onChange={v => set('nombre', v)} type="text" /> : t.nombre}</td>
                    <td className={tdCls}>
                      {E(t.id) ? (
                        <select value={editData.tipoVehiculo} onChange={e => set('tipoVehiculo', e.target.value)} className="border border-blue-400 rounded px-2 py-1 text-sm w-28">
                          {TIPOS_VEHICULO.map(v => <option key={v}>{v}</option>)}
                        </select>
                      ) : <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">{t.tipoVehiculo}</span>}
                    </td>
                    <td className={tdCls}>
                      {E(t.id) ? (
                        <select value={editData.tipoServicio} onChange={e => set('tipoServicio', e.target.value)} className="border border-blue-400 rounded px-2 py-1 text-sm w-36">
                          {TIPOS_SERVICIO.map(v => <option key={v}>{v}</option>)}
                        </select>
                      ) : <span className="text-slate-600 text-xs">{t.tipoServicio}</span>}
                    </td>
                    <td className={tdCls + ' text-right font-semibold'}>
                      {E(t.id) ? <InlineInput value={editData.tarifaBase} onChange={v => set('tarifaBase', v)} /> : `$${t.tarifaBase.toLocaleString()}`}
                    </td>
                    <td className={tdCls + ' text-right'}>
                      {E(t.id) ? <InlineInput value={editData.porKm} onChange={v => set('porKm', v)} small /> : `$${t.porKm}`}
                    </td>
                    <td className={tdCls + ' text-right text-slate-500'}>
                      {E(t.id) ? <InlineInput value={editData.tarifaMinima} onChange={v => set('tarifaMinima', v)} /> : `$${t.tarifaMinima.toLocaleString()}`}
                    </td>
                    <td className={tdCls + ' text-center text-slate-500'}>
                      {E(t.id) ? <InlineInput value={editData.tiempoEstimado} onChange={v => set('tiempoEstimado', v)} small /> : `${t.tiempoEstimado} min`}
                    </td>
                    <td className={tdCls + ' text-center'}><Toggle value={t.activa} onChange={() => toggleActiva('bases', t.id)} /></td>
                    <td className={tdCls + ' text-right'}>
                      {E(t.id) ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit('bases')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(t.id, t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: RECARGOS ── */}
        {tab === 'recargos' && (
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs text-slate-500">Los recargos se aplican sobre la tarifa base según las condiciones del viaje.</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className={thCls}>Nombre del recargo</th>
                  <th className={thCls}>Variable / Condición</th>
                  <th className={thCls}>Tipo</th>
                  <th className={thCls + ' text-right'}>Valor</th>
                  <th className={thCls + ' text-center'}>Activo</th>
                  <th className={thCls + ' text-right'}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recargos.map(r => (
                  <tr key={r.id} className={`hover:bg-slate-50 ${!r.activo ? 'opacity-50' : ''}`}>
                    <td className={tdCls + ' font-medium'}>{E(r.id) ? <InlineInput value={editData.nombre} onChange={v => set('nombre', v)} type="text" /> : r.nombre}</td>
                    <td className={tdCls + ' text-xs text-slate-500 max-w-[180px]'}>{E(r.id) ? <InlineInput value={editData.aplica} onChange={v => set('aplica', v)} type="text" /> : r.aplica}</td>
                    <td className={tdCls}>
                      {E(r.id) ? (
                        <select value={editData.tipo} onChange={e => set('tipo', e.target.value)} className="border border-blue-400 rounded px-2 py-1 text-sm">
                          <option value="porcentaje">Porcentaje</option>
                          <option value="fijo">Fijo</option>
                        </select>
                      ) : <span className={`text-xs px-2 py-1 rounded font-medium ${r.tipo === 'porcentaje' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{r.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo'}</span>}
                    </td>
                    <td className={tdCls + ' text-right font-semibold'}>
                      {E(r.id)
                        ? <InlineInput value={editData.valor} onChange={v => set('valor', v)} small />
                        : r.tipo === 'porcentaje' ? `+${r.valor}%` : `+$${r.valor}`}
                    </td>
                    <td className={tdCls + ' text-center'}><Toggle value={r.activo} onChange={() => toggleActiva('recargos', r.id)} /></td>
                    <td className={tdCls + ' text-right'}>
                      {E(r.id) ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit('recargos')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(r.id, r)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: PAGO CONDUCTOR ── */}
        {tab === 'conductores' && (
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs text-slate-500">Configura el pago base, por kilómetro, gastos autorizados y viáticos por tipo de servicio y vehículo.</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className={thCls}>Tipo servicio</th>
                  <th className={thCls}>Vehículo</th>
                  <th className={thCls + ' text-right'}>Pago base</th>
                  <th className={thCls + ' text-right'}>$/km</th>
                  <th className={thCls + ' text-right'}>Gs. auto.</th>
                  <th className={thCls + ' text-right'}>Viáticos</th>
                  <th className={thCls + ' text-right'}>Margen aprox.</th>
                  <th className={thCls + ' text-center'}>Activo</th>
                  <th className={thCls + ' text-right'}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagosConductor.map(p => {
                  const tarifaRef = tarifasBase.find(t =>
                    (t.tipoServicio === p.tipoServicio || p.tipoServicio === 'Todos') &&
                    (t.tipoVehiculo === p.tipoVehiculo || p.tipoVehiculo === 'Todos') &&
                    t.activa
                  )
                  const margenEj = tarifaRef
                    ? calcMargen(tarifaRef.tarifaBase, p.pagoBase + p.gastosAutorizados + p.viaticos)
                    : null

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50 ${!p.activo ? 'opacity-50' : ''}`}>
                      <td className={tdCls}>
                        {E(p.id) ? (
                          <select value={editData.tipoServicio} onChange={e => set('tipoServicio', e.target.value)} className="border border-blue-400 rounded px-2 py-1 text-sm w-36">
                            {TIPOS_SERVICIO.map(v => <option key={v}>{v}</option>)}
                          </select>
                        ) : <span className="text-xs font-medium text-slate-700">{p.tipoServicio}</span>}
                      </td>
                      <td className={tdCls}>
                        {E(p.id) ? (
                          <select value={editData.tipoVehiculo} onChange={e => set('tipoVehiculo', e.target.value)} className="border border-blue-400 rounded px-2 py-1 text-sm w-24">
                            {TIPOS_VEHICULO.map(v => <option key={v}>{v}</option>)}
                          </select>
                        ) : <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{p.tipoVehiculo}</span>}
                      </td>
                      <td className={tdCls + ' text-right font-semibold text-slate-800'}>
                        {E(p.id) ? <InlineInput value={editData.pagoBase} onChange={v => set('pagoBase', v)} /> : `$${p.pagoBase.toLocaleString()}`}
                      </td>
                      <td className={tdCls + ' text-right text-slate-600'}>
                        {E(p.id) ? <InlineInput value={editData.porKm} onChange={v => set('porKm', v)} small /> : `$${p.porKm}`}
                      </td>
                      <td className={tdCls + ' text-right text-green-700'}>
                        {E(p.id) ? <InlineInput value={editData.gastosAutorizados} onChange={v => set('gastosAutorizados', v)} /> : `$${p.gastosAutorizados}`}
                      </td>
                      <td className={tdCls + ' text-right text-blue-700'}>
                        {E(p.id) ? <InlineInput value={editData.viaticos} onChange={v => set('viaticos', v)} /> : `$${p.viaticos}`}
                      </td>
                      <td className={tdCls + ' text-right'}>
                        {margenEj
                          ? <span className={`text-xs font-semibold ${margenEj.monto >= 0 ? 'text-green-600' : 'text-red-600'}`}>${margenEj.monto} ({margenEj.pct}%)</span>
                          : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className={tdCls + ' text-center'}><Toggle value={p.activo} onChange={() => toggleActiva('conductores', p.id)} /></td>
                      <td className={tdCls + ' text-right'}>
                        {E(p.id) ? (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => saveEdit('conductores')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckIcon className="w-4 h-4" /></button>
                            <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><XMarkIcon className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(p.id, p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: EMPRESARIALES ── */}
        {tab === 'empresariales' && (
          <div className="overflow-x-auto">
            <div className="p-4 flex justify-end border-b border-slate-100">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                <PlusIcon className="w-3.5 h-3.5" />Nuevo convenio
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className={thCls}>Empresa</th>
                  <th className={thCls + ' text-center'}>Descuento</th>
                  <th className={thCls + ' text-right'}>Tarifa fija</th>
                  <th className={thCls}>Servicios incluidos</th>
                  <th className={thCls}>Vigencia</th>
                  <th className={thCls + ' text-center'}>Activa</th>
                  <th className={thCls + ' text-right'}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tarifasEmp.map(t => (
                  <tr key={t.id} className={`hover:bg-slate-50 ${!t.activa ? 'opacity-50' : ''}`}>
                    <td className={tdCls + ' font-medium text-slate-800'}>{t.empresa}</td>
                    <td className={tdCls + ' text-center'}>
                      {E(t.id) ? <InlineInput value={editData.descuento} onChange={v => set('descuento', v)} small />
                        : t.descuento > 0 ? <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">{t.descuento}% dto.</span> : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className={tdCls + ' text-right'}>
                      {E(t.id) ? <InlineInput value={editData.tarifaFija ?? 0} onChange={v => set('tarifaFija', v)} />
                        : t.tarifaFija ? `$${t.tarifaFija.toLocaleString()}` : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className={tdCls}>
                      <div className="flex flex-wrap gap-1">
                        {t.serviciosIncluidos.map(s => <span key={s} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{s}</span>)}
                      </div>
                    </td>
                    <td className={tdCls + ' text-xs text-slate-500'}>{t.vigenciaDesde} → {t.vigenciaHasta}</td>
                    <td className={tdCls + ' text-center'}><Toggle value={t.activa} onChange={() => toggleActiva('empresariales', t.id)} /></td>
                    <td className={tdCls + ' text-right'}>
                      {E(t.id) ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit('empresariales')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => startEdit(t.id, t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><PencilSquareIcon className="w-4 h-4" /></button>
                          <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: RUTAS FRECUENTES ── */}
        {tab === 'rutas' && (
          <div className="overflow-x-auto">
            <div className="p-4 flex justify-end border-b border-slate-100">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                <PlusIcon className="w-3.5 h-3.5" />Nueva ruta
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className={thCls}>Nombre</th>
                  <th className={thCls}>Origen → Destino</th>
                  <th className={thCls + ' text-center'}>Distancia</th>
                  <th className={thCls + ' text-center'}>Tiempo est.</th>
                  <th className={thCls}>Vehículo</th>
                  <th className={thCls + ' text-right'}>Tarifa fija</th>
                  <th className={thCls + ' text-right'}>Pago conductor</th>
                  <th className={thCls + ' text-right'}>Margen</th>
                  <th className={thCls + ' text-center'}>Activa</th>
                  <th className={thCls + ' text-right'}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rutasFrecuentes.map(r => {
                  const m = calcMargen(r.tarifaFija, r.pagoConductor)
                  return (
                    <tr key={r.id} className={`hover:bg-slate-50 ${!r.activa ? 'opacity-50' : ''}`}>
                      <td className={tdCls + ' font-medium text-slate-800'}>
                        {E(r.id) ? <InlineInput value={editData.nombre} onChange={v => set('nombre', v)} type="text" /> : r.nombre}
                      </td>
                      <td className={tdCls + ' text-xs text-slate-600'}>
                        <div>{r.origen}</div>
                        <div className="text-slate-400">→ {r.destino}</div>
                      </td>
                      <td className={tdCls + ' text-center font-mono text-xs'}>
                        {E(r.id) ? <InlineInput value={editData.distanciaKm} onChange={v => set('distanciaKm', v)} small /> : `${r.distanciaKm} km`}
                      </td>
                      <td className={tdCls + ' text-center text-xs text-slate-500'}>
                        {E(r.id) ? <InlineInput value={editData.tiempoEst} onChange={v => set('tiempoEst', v)} small /> : `${r.tiempoEst} min`}
                      </td>
                      <td className={tdCls}><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{r.tipoVehiculo}</span></td>
                      <td className={tdCls + ' text-right font-bold text-slate-800'}>
                        {E(r.id) ? <InlineInput value={editData.tarifaFija} onChange={v => set('tarifaFija', v)} /> : `$${r.tarifaFija.toLocaleString()}`}
                      </td>
                      <td className={tdCls + ' text-right text-slate-600'}>
                        {E(r.id) ? <InlineInput value={editData.pagoConductor} onChange={v => set('pagoConductor', v)} /> : `$${r.pagoConductor.toLocaleString()}`}
                      </td>
                      <td className={tdCls + ' text-right'}>
                        <span className={`text-xs font-semibold ${m.monto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${m.monto.toLocaleString()} ({m.pct}%)
                        </span>
                      </td>
                      <td className={tdCls + ' text-center'}><Toggle value={r.activa} onChange={() => toggleActiva('rutas', r.id)} /></td>
                      <td className={tdCls + ' text-right'}>
                        {E(r.id) ? (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => saveEdit('rutas')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckIcon className="w-4 h-4" /></button>
                            <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><XMarkIcon className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => startEdit(r.id, r)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><PencilSquareIcon className="w-4 h-4" /></button>
                            <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
