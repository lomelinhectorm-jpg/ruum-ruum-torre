'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
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
          {([
            ['🌙 Horario nocturno', nocturno, setNocturno],
            ['⚡ Servicio urgente',  urgente,  setUrgente],
            ['🗺️ Viaje foráneo',    foraneo,  setForaneo],
          ] as [string, boolean, (value: boolean) => void][]).map(([label, val, fn]) => (
            <label key={label as string} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={val as boolean} onChange={e => fn(e.target.checked)} className="w-4 h-4 accent-white" />
              {label as string}
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-2 justify-center">
          {([
            ['🛣️ Peaje / Casetas',    peaje,       setPeaje],
            ['⛽ Combustible extra',  combustible, setCombustible],
          ] as [string, boolean, (value: boolean) => void][]).map(([label, val, fn]) => (
            <label key={label as string} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={val as boolean} onChange={e => fn(e.target.checked)} className="w-4 h-4 accent-white" />
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
  const [editData, setEditData] = useState<Record<string, unknown>>({})
  const [guardando, setGuardando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [tarifasBase, setTarifasBase]         = useState<TarifaBase[]>([])
  const [recargos, setRecargos]               = useState<Recargo[]>([])
  const [pagosConductor, setPagosConductor]   = useState<PagoConductor[]>([])
  const [tarifasEmp, setTarifasEmp]           = useState<TarifaEmpresarial[]>([])
  const [rutasFrecuentes, setRutasFrecuentes] = useState<RutaFrecuente[]>([])
  const [cargando, setCargando]               = useState(true)

  // ── SUPABASE HELPER ──────────────────────────────────────────────────────
  const getSb = async () => {
  return getSupabaseBrowserClient()
  }

  // ── CARGA INICIAL ────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    const sb = await getSb()
    const [tb, rc, pc, te, rf] = await Promise.all([
      sb.from('tarifas_base').select('*').order('created_at'),
      sb.from('recargos').select('*').order('created_at'),
      sb.from('tarifas_conductor').select('*').order('created_at'),
      sb.from('tarifas_empresariales').select('*').order('created_at'),
      sb.from('rutas_frecuentes').select('*').order('created_at'),
    ])

    // Mapear BD → interfaces
    if (tb.data) setTarifasBase(tb.data.map((r: Record<string,unknown>) => ({
      id: String(r.id), nombre: String(r.nombre ?? ''),
      tipoVehiculo: (r.tipo_vehiculo as TipoVehiculo) ?? 'Todos',
      tipoServicio: (r.tipo_servicio as TipoServicio) ?? 'Traslado local',
      tarifaBase: Number(r.tarifa_base ?? 0), porKm: Number(r.por_km ?? 0),
      tarifaMinima: Number(r.tarifa_minima ?? 0), tiempoEstimado: Number(r.tiempo_estimado ?? 0),
      activa: Boolean(r.activa),
    })))
    if (rc.data) setRecargos(rc.data.map((r: Record<string,unknown>) => ({
      id: String(r.id), nombre: String(r.nombre ?? ''),
      tipo: (r.tipo as 'porcentaje' | 'fijo') ?? 'porcentaje',
      valor: Number(r.valor ?? 0), aplica: String(r.aplica ?? ''), activo: Boolean(r.activo),
    })))
    if (pc.data) setPagosConductor(pc.data.map((r: Record<string,unknown>) => ({
      id: String(r.id),
      tipoServicio: (r.tipo_servicio as TipoServicio) ?? 'Traslado local',
      tipoVehiculo: (r.tipo_vehiculo as TipoVehiculo) ?? 'Todos',
      pagoBase: Number(r.pago_base ?? 0), porKm: Number(r.por_km ?? 0),
      gastosAutorizados: Number(r.gastos_autorizados ?? 0), viaticos: Number(r.viaticos ?? 0),
      activo: Boolean(r.activo),
    })))
    if (te.data) setTarifasEmp(te.data.map((r: Record<string,unknown>) => ({
      id: String(r.id), empresa: String(r.empresa ?? ''),
      descuento: Number(r.descuento ?? 0),
      tarifaFija: r.tarifa_fija != null ? Number(r.tarifa_fija) : null,
      vigenciaDesde: String(r.vigencia_desde ?? ''), vigenciaHasta: String(r.vigencia_hasta ?? ''),
      serviciosIncluidos: (r.servicios_incluidos as TipoServicio[]) ?? [], activa: Boolean(r.activa),
    })))
    if (rf.data) setRutasFrecuentes(rf.data.map((r: Record<string,unknown>) => ({
      id: String(r.id), nombre: String(r.nombre ?? ''),
      origen: String(r.origen ?? ''), destino: String(r.destino ?? ''),
      distanciaKm: Number(r.distancia_km ?? 0), tarifaFija: Number(r.tarifa_fija ?? 0),
      pagoConductor: Number(r.pago_conductor ?? 0), tiempoEst: Number(r.tiempo_est ?? 0),
      tipoVehiculo: (r.tipo_vehiculo as TipoVehiculo) ?? 'Todos', activa: Boolean(r.activa),
    })))

    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── EDICIÓN ──────────────────────────────────────────────────────────────
  const startEdit = (id: string, data: object) => { setEditId(id); setEditData({ ...data } as Record<string, unknown>) }
  const cancelEdit = () => { setEditId(null); setEditData({}) }

  const TABLA: Record<MainTab, string> = {
    bases: 'tarifas_base', recargos: 'recargos', conductores: 'tarifas_conductor',
    empresariales: 'tarifas_empresariales', rutas: 'rutas_frecuentes',
  }

  const COL_MAP: Record<string, string> = {
    tarifaBase: 'tarifa_base', porKm: 'por_km', tarifaMinima: 'tarifa_minima',
    tiempoEstimado: 'tiempo_estimado', tipoVehiculo: 'tipo_vehiculo',
    tipoServicio: 'tipo_servicio', pagoBase: 'pago_base',
    gastosAutorizados: 'gastos_autorizados', tarifaFija: 'tarifa_fija',
    vigenciaDesde: 'vigencia_desde', vigenciaHasta: 'vigencia_hasta',
    serviciosIncluidos: 'servicios_incluidos', distanciaKm: 'distancia_km',
    pagoConductor: 'pago_conductor', tiempoEst: 'tiempo_est',
  }

  const saveEdit = async (section: MainTab) => {
    setGuardando(true)
    const sb = await getSb()
    // Convertir camelCase → snake_case
    const payload: Record<string,unknown> = {}
    for (const [k, v] of Object.entries(editData)) {
      payload[COL_MAP[k] ?? k] = v
    }
    delete payload.id
    await sb.from(TABLA[section]).update(payload).eq('id', editId!)
    // Actualizar estado local
    if (section === 'bases') setTarifasBase(prev => prev.map(r => r.id === editId ? { ...r, ...editData } : r))
    if (section === 'recargos') setRecargos(prev => prev.map(r => r.id === editId ? { ...r, ...editData } : r))
    if (section === 'conductores') setPagosConductor(prev => prev.map(r => r.id === editId ? { ...r, ...editData } : r))
    if (section === 'empresariales') setTarifasEmp(prev => prev.map(r => r.id === editId ? { ...r, ...editData } : r))
    if (section === 'rutas') setRutasFrecuentes(prev => prev.map(r => r.id === editId ? { ...r, ...editData } : r))
    cancelEdit()
    setGuardando(false)
  }

  const toggleActiva = async (section: MainTab, id: string) => {
    const sb = await getSb()
    const getActual = () => {
      if (section === 'bases') return tarifasBase.find(r => r.id === id)?.activa
      if (section === 'recargos') return recargos.find(r => r.id === id)?.activo
      if (section === 'conductores') return pagosConductor.find(r => r.id === id)?.activo
      if (section === 'empresariales') return tarifasEmp.find(r => r.id === id)?.activa
      if (section === 'rutas') return rutasFrecuentes.find(r => r.id === id)?.activa
    }
    const actual = getActual()
    const col = (section === 'recargos' || section === 'conductores') ? 'activo' : 'activa'
    await sb.from(TABLA[section]).update({ [col]: !actual }).eq('id', id)
    const toggle = (list: (TarifaBase | Recargo | PagoConductor | TarifaEmpresarial | RutaFrecuente)[]) =>
      list.map(r => r.id === id ? { ...r, activa: !actual, activo: !actual } : r)
    if (section === 'bases') setTarifasBase(prev => toggle(prev) as TarifaBase[])
    if (section === 'recargos') setRecargos(prev => toggle(prev) as Recargo[])
    if (section === 'conductores') setPagosConductor(prev => toggle(prev) as PagoConductor[])
    if (section === 'empresariales') setTarifasEmp(prev => toggle(prev) as TarifaEmpresarial[])
    if (section === 'rutas') setRutasFrecuentes(prev => toggle(prev) as RutaFrecuente[])
  }

  const DEFAULTS: Record<MainTab, Record<string, unknown>> = {
    bases: { nombre: 'Nueva tarifa', tipo_vehiculo: 'Todos', tipo_servicio: 'Traslado local', tarifa_base: 0, por_km: 0, tarifa_minima: 0, tiempo_estimado: 0, activa: true },
    recargos: { nombre: 'Nuevo recargo', tipo: 'porcentaje', valor: 0, aplica: '', activo: true },
    conductores: { tipo_servicio: 'Traslado local', tipo_vehiculo: 'Todos', pago_base: 0, por_km: 0, gastos_autorizados: 0, viaticos: 0, activo: true },
    empresariales: { empresa: 'Nueva empresa', descuento: 0, tarifa_fija: null, vigencia_desde: new Date().toISOString().slice(0,10), vigencia_hasta: '', servicios_incluidos: [], activa: true },
    rutas: { nombre: 'Nueva ruta', origen: '', destino: '', distancia_km: 0, tarifa_fija: 0, pago_conductor: 0, tiempo_est: 0, tipo_vehiculo: 'Todos', activa: true },
  }

  const addNuevo = async (section: MainTab) => {
    setGuardando(true)
    const sb = await getSb()
    const { data } = await sb.from(TABLA[section]).insert(DEFAULTS[section]).select().single()
    if (data) await cargar()
    setGuardando(false)
  }

  const eliminar = async (section: MainTab, id: string) => {
    setGuardando(true)
    const sb = await getSb()
    await sb.from(TABLA[section]).delete().eq('id', id)
    if (section === 'bases') setTarifasBase(prev => prev.filter(r => r.id !== id))
    if (section === 'recargos') setRecargos(prev => prev.filter(r => r.id !== id))
    if (section === 'conductores') setPagosConductor(prev => prev.filter(r => r.id !== id))
    if (section === 'empresariales') setTarifasEmp(prev => prev.filter(r => r.id !== id))
    if (section === 'rutas') setRutasFrecuentes(prev => prev.filter(r => r.id !== id))
    setGuardando(false)
  }

  const E = (id: string) => editId === id
  const set = (k: string, v: unknown) => setEditData(d => ({ ...d, [k]: v }))
  const str = (v: unknown) => String(v ?? '')
  const num = (v: unknown) => Number(v ?? 0)

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
        {cargando ? (
          [1,2,3,4,5].map(i => <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse h-16" />)
        ) : (
          [
            { label: 'Tarifas base activas',   value: tarifasBase.filter(t => t.activa).length,      total: tarifasBase.length },
            { label: 'Recargos activos',        value: recargos.filter(r => r.activo).length,          total: recargos.length },
            { label: 'Reglas de pago',          value: pagosConductor.filter(p => p.activo).length,   total: pagosConductor.length },
            { label: 'Convenios empresariales', value: tarifasEmp.filter(t => t.activa).length,       total: tarifasEmp.length },
            { label: 'Rutas frecuentes',        value: rutasFrecuentes.filter(r => r.activa).length,  total: rutasFrecuentes.length },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{k.value}<span className="text-sm text-slate-400 font-normal">/{k.total}</span></p>
              <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
            </div>
          ))
        )}
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

        {guardando && (
          <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-600 font-medium">
            Guardando cambios en Supabase...
          </div>
        )}

        {/* ── TAB: TARIFAS BASE ── */}
        {tab === 'bases' && (
          <div className="overflow-x-auto">
            <div className="p-4 flex justify-end border-b border-slate-100">
              <button onClick={() => addNuevo('bases')} disabled={guardando} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-medium transition-colors">
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
                    <td className={tdCls + ' font-medium'}>{E(t.id) ? <InlineInput value={str(editData.nombre)} onChange={v => set('nombre', v)} type="text" /> : t.nombre}</td>
                    <td className={tdCls}>
                      {E(t.id) ? (
                        <select value={str(editData.tipoVehiculo)} onChange={e => set('tipoVehiculo', e.target.value)} className="border border-blue-400 rounded px-2 py-1 text-sm w-28">
                          {TIPOS_VEHICULO.map(v => <option key={v}>{v}</option>)}
                        </select>
                      ) : <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">{t.tipoVehiculo}</span>}
                    </td>
                    <td className={tdCls}>
                      {E(t.id) ? (
                        <select value={str(editData.tipoServicio)} onChange={e => set('tipoServicio', e.target.value)} className="border border-blue-400 rounded px-2 py-1 text-sm w-36">
                          {TIPOS_SERVICIO.map(v => <option key={v}>{v}</option>)}
                        </select>
                      ) : <span className="text-slate-600 text-xs">{t.tipoServicio}</span>}
                    </td>
                    <td className={tdCls + ' text-right font-semibold'}>
                      {E(t.id) ? <InlineInput value={num(editData.tarifaBase)} onChange={v => set('tarifaBase', v)} /> : `$${t.tarifaBase.toLocaleString()}`}
                    </td>
                    <td className={tdCls + ' text-right'}>
                      {E(t.id) ? <InlineInput value={num(editData.porKm)} onChange={v => set('porKm', v)} small /> : `$${t.porKm}`}
                    </td>
                    <td className={tdCls + ' text-right text-slate-500'}>
                      {E(t.id) ? <InlineInput value={num(editData.tarifaMinima)} onChange={v => set('tarifaMinima', v)} /> : `$${t.tarifaMinima.toLocaleString()}`}
                    </td>
                    <td className={tdCls + ' text-center text-slate-500'}>
                      {E(t.id) ? <InlineInput value={num(editData.tiempoEstimado)} onChange={v => set('tiempoEstimado', v)} small /> : `${t.tiempoEstimado} min`}
                    </td>
                    <td className={tdCls + ' text-center'}><Toggle value={t.activa} onChange={() => toggleActiva('bases', t.id)} /></td>
                    <td className={tdCls + ' text-right'}>
                      {E(t.id) ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit('bases')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : confirmDelete === t.id ? (
                        <span className="inline-flex items-center gap-1.5 justify-end">
                          <button onClick={() => { eliminar('bases', t.id); setConfirmDelete(null) }} className="text-xs text-red-600 font-medium hover:underline">Sí</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:underline">No</button>
                        </span>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => startEdit(t.id, t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setConfirmDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
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
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">Los recargos se aplican sobre la tarifa base según las condiciones del viaje.</p>
              <button onClick={() => addNuevo('recargos')} disabled={guardando} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0">
                <PlusIcon className="w-3.5 h-3.5" />Nuevo recargo
              </button>
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
                    <td className={tdCls + ' font-medium'}>{E(r.id) ? <InlineInput value={str(editData.nombre)} onChange={v => set('nombre', v)} type="text" /> : r.nombre}</td>
                    <td className={tdCls + ' text-xs text-slate-500 max-w-[180px]'}>{E(r.id) ? <InlineInput value={str(editData.aplica)} onChange={v => set('aplica', v)} type="text" /> : r.aplica}</td>
                    <td className={tdCls}>
                      {E(r.id) ? (
                        <select value={str(editData.tipo)} onChange={e => set('tipo', e.target.value)} className="border border-blue-400 rounded px-2 py-1 text-sm">
                          <option value="porcentaje">Porcentaje</option>
                          <option value="fijo">Fijo</option>
                        </select>
                      ) : <span className={`text-xs px-2 py-1 rounded font-medium ${r.tipo === 'porcentaje' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{r.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo'}</span>}
                    </td>
                    <td className={tdCls + ' text-right font-semibold'}>
                      {E(r.id)
                        ? <InlineInput value={num(editData.valor)} onChange={v => set('valor', v)} small />
                        : r.tipo === 'porcentaje' ? `+${r.valor}%` : `+$${r.valor}`}
                    </td>
                    <td className={tdCls + ' text-center'}><Toggle value={r.activo} onChange={() => toggleActiva('recargos', r.id)} /></td>
                    <td className={tdCls + ' text-right'}>
                      {E(r.id) ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit('recargos')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckIcon className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                      ) : confirmDelete === r.id ? (
                        <span className="inline-flex items-center gap-1.5 justify-end">
                          <button onClick={() => { eliminar('recargos', r.id); setConfirmDelete(null) }} className="text-xs text-red-600 font-medium hover:underline">Sí</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:underline">No</button>
                        </span>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => startEdit(r.id, r)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setConfirmDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
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
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">Configura el pago base, por kilómetro, gastos autorizados y viáticos por tipo de servicio y vehículo.</p>
              <button onClick={() => addNuevo('conductores')} disabled={guardando} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0">
                <PlusIcon className="w-3.5 h-3.5" />Nueva regla
              </button>
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
                          <select value={str(editData.tipoServicio)} onChange={e => set('tipoServicio', e.target.value)} className="border border-blue-400 rounded px-2 py-1 text-sm w-36">
                            {TIPOS_SERVICIO.map(v => <option key={v}>{v}</option>)}
                          </select>
                        ) : <span className="text-xs font-medium text-slate-700">{p.tipoServicio}</span>}
                      </td>
                      <td className={tdCls}>
                        {E(p.id) ? (
                          <select value={str(editData.tipoVehiculo)} onChange={e => set('tipoVehiculo', e.target.value)} className="border border-blue-400 rounded px-2 py-1 text-sm w-24">
                            {TIPOS_VEHICULO.map(v => <option key={v}>{v}</option>)}
                          </select>
                        ) : <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{p.tipoVehiculo}</span>}
                      </td>
                      <td className={tdCls + ' text-right font-semibold text-slate-800'}>
                        {E(p.id) ? <InlineInput value={num(editData.pagoBase)} onChange={v => set('pagoBase', v)} /> : `$${p.pagoBase.toLocaleString()}`}
                      </td>
                      <td className={tdCls + ' text-right text-slate-600'}>
                        {E(p.id) ? <InlineInput value={num(editData.porKm)} onChange={v => set('porKm', v)} small /> : `$${p.porKm}`}
                      </td>
                      <td className={tdCls + ' text-right text-green-700'}>
                        {E(p.id) ? <InlineInput value={num(editData.gastosAutorizados)} onChange={v => set('gastosAutorizados', v)} /> : `$${p.gastosAutorizados}`}
                      </td>
                      <td className={tdCls + ' text-right text-blue-700'}>
                        {E(p.id) ? <InlineInput value={num(editData.viaticos)} onChange={v => set('viaticos', v)} /> : `$${p.viaticos}`}
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
                        ) : confirmDelete === p.id ? (
                          <span className="inline-flex items-center gap-1.5 justify-end">
                            <button onClick={() => { eliminar('conductores', p.id); setConfirmDelete(null) }} className="text-xs text-red-600 font-medium hover:underline">Sí</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:underline">No</button>
                          </span>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => startEdit(p.id, p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => setConfirmDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                              <TrashIcon className="w-4 h-4" />
                            </button>
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

        {/* ── TAB: EMPRESARIALES ── */}
        {tab === 'empresariales' && (
          <div className="overflow-x-auto">
            <div className="p-4 flex justify-end border-b border-slate-100">
              <button onClick={() => addNuevo('empresariales')} disabled={guardando} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-medium transition-colors">
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
                      {E(t.id) ? <InlineInput value={num(editData.descuento)} onChange={v => set('descuento', v)} small />
                        : t.descuento > 0 ? <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">{t.descuento}% dto.</span> : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className={tdCls + ' text-right'}>
                      {E(t.id) ? <InlineInput value={num(editData.tarifaFija)} onChange={v => set('tarifaFija', v)} />
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
                      ) : confirmDelete === t.id ? (
                        <span className="inline-flex items-center gap-1.5 justify-end">
                          <button onClick={() => { eliminar('empresariales', t.id); setConfirmDelete(null) }} className="text-xs text-red-600 font-medium hover:underline">Sí</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:underline">No</button>
                        </span>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => startEdit(t.id, t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><PencilSquareIcon className="w-4 h-4" /></button>
                          <button onClick={() => setConfirmDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
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
              <button onClick={() => addNuevo('rutas')} disabled={guardando} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-medium transition-colors">
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
                        {E(r.id) ? <InlineInput value={str(editData.nombre)} onChange={v => set('nombre', v)} type="text" /> : r.nombre}
                      </td>
                      <td className={tdCls + ' text-xs text-slate-600'}>
                        <div>{r.origen}</div>
                        <div className="text-slate-400">→ {r.destino}</div>
                      </td>
                      <td className={tdCls + ' text-center font-mono text-xs'}>
                        {E(r.id) ? <InlineInput value={num(editData.distanciaKm)} onChange={v => set('distanciaKm', v)} small /> : `${r.distanciaKm} km`}
                      </td>
                      <td className={tdCls + ' text-center text-xs text-slate-500'}>
                        {E(r.id) ? <InlineInput value={num(editData.tiempoEst)} onChange={v => set('tiempoEst', v)} small /> : `${r.tiempoEst} min`}
                      </td>
                      <td className={tdCls}><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{r.tipoVehiculo}</span></td>
                      <td className={tdCls + ' text-right font-bold text-slate-800'}>
                        {E(r.id) ? <InlineInput value={num(editData.tarifaFija)} onChange={v => set('tarifaFija', v)} /> : `$${r.tarifaFija.toLocaleString()}`}
                      </td>
                      <td className={tdCls + ' text-right text-slate-600'}>
                        {E(r.id) ? <InlineInput value={num(editData.pagoConductor)} onChange={v => set('pagoConductor', v)} /> : `$${r.pagoConductor.toLocaleString()}`}
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
                        ) : confirmDelete === r.id ? (
                          <span className="inline-flex items-center gap-1.5 justify-end">
                            <button onClick={() => { eliminar('rutas', r.id); setConfirmDelete(null) }} className="text-xs text-red-600 font-medium hover:underline">Sí</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:underline">No</button>
                          </span>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => startEdit(r.id, r)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><PencilSquareIcon className="w-4 h-4" /></button>
                            <button onClick={() => setConfirmDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
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
