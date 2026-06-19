'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import {
  TruckIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface KPIs {
  viajesActivos: number
  finalizadosHoy: number
  programadosHoy: number
  pendientesAsignacion: number
  conductoresDisponibles: number
  conductoresEnViaje: number
  docsRevision: number
  incidenciasAbiertas: number
  ingresosHoy: number
}

interface ViajeReciente {
  id: string
  folio: string | null
  status: string
  fecha_programada: string | null
  hora_programada: string | null
  origen_calle: string | null
  destino_calle: string | null
  tarifa_cliente: number
  conductores: { nombre: string; apellido: string } | null
  usuarios: { nombre: string; apellido: string } | null
}

interface Alerta {
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  blue:    { bg: 'bg-[#E8EFFF]',  text: 'text-rr-traceDeep', icon: 'text-rr-trace' },
  green:   { bg: 'bg-green-50',   text: 'text-green-600',   icon: 'text-green-600' },
  indigo:  { bg: 'bg-[#E8EFFF]',  text: 'text-rr-traceDeep', icon: 'text-rr-trace' },
  purple:  { bg: 'bg-[#FFF4CC]',  text: 'text-[#7A5600]',    icon: 'text-rr-routeDark' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-600' },
  red:     { bg: 'bg-red-50',     text: 'text-red-600',     icon: 'text-red-600' },
}

const alertStyles: Record<string, string> = {
  error:   'bg-red-50 border-red-100 text-red-800',
  warning: 'bg-amber-50 border-amber-100 text-amber-800',
  info:    'bg-[#E8EFFF] border-[#C7D7FF] text-rr-traceDeep',
}
const alertDot: Record<string, string> = {
  error:   'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-rr-trace',
}

const statusStyle: Record<string, string> = {
  'Solicitud recibida':         'bg-slate-100 text-slate-600',
  'Pendiente de revisión':      'bg-slate-100 text-slate-600',
  'Pendiente de asignación':    'bg-amber-100 text-amber-700',
  'Conductor asignado':         'bg-[#E8EFFF] text-rr-traceDeep',
  'Conductor en camino':        'bg-[#E8EFFF] text-rr-traceDeep',
  'Recolección en proceso':     'bg-[#E8EFFF] text-rr-traceDeep',
  'Evidencia inicial pendiente':'bg-orange-100 text-orange-700',
  'Traslado en curso':          'bg-[#FFF4CC] text-[#7A5600]',
  'Entrega en proceso':         'bg-[#FFF4CC] text-[#7A5600]',
  'Evidencia final pendiente':  'bg-orange-100 text-orange-700',
  'Finalizado':                 'bg-green-100 text-green-700',
  'Cancelado':                  'bg-red-100 text-red-600',
  'En revisión por incidencia': 'bg-rose-100 text-rose-700',
}

// ─── MAPA SVG (estático — se actualiza cuando haya GPS real) ──────────────────
function MapaOperacion({ viajesActivos }: { viajesActivos: number }) {
  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-[#EAE7DD] shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#EAE7DD] flex items-center justify-between">
        <h3 className="font-semibold text-rr-asphalt flex items-center gap-2">
          <MapPinIcon className="w-5 h-5 text-rr-trace" />
          Mapa de Operación
        </h3>
        <span className="text-xs text-slate-400">{viajesActivos} viaje{viajesActivos !== 1 ? 's' : ''} activo{viajesActivos !== 1 ? 's' : ''} en ruta</span>
      </div>
      <div className="relative bg-slate-100" style={{ height: 280 }}>
        <svg viewBox="0 0 600 280" className="w-full h-full">
          <rect width="600" height="280" fill="#F4F2EC" />
          {[60,120,180,240,300,360,420,480,540].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="280" stroke="#d1d9e3" strokeWidth="1" />
          ))}
          {[40,80,120,160,200,240].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="600" y2={y} stroke="#d1d9e3" strokeWidth="1" />
          ))}
          <line x1="0" y1="140" x2="600" y2="140" stroke="#c4cdd8" strokeWidth="3" />
          <line x1="300" y1="0" x2="300" y2="280" stroke="#c4cdd8" strokeWidth="3" />
          <ellipse cx="300" cy="140" rx="200" ry="110" fill="#3D7BFF" fillOpacity="0.07" stroke="#3D7BFF" strokeWidth="1.5" strokeDasharray="6 4" />
          <path d="M 140 90 Q 220 70 300 140" stroke="#FFC400" strokeWidth="3" fill="none" strokeDasharray="8 5" opacity="0.9" />
          <path d="M 380 80 Q 420 140 460 180" stroke="#3D7BFF" strokeWidth="2.5" fill="none" strokeDasharray="6 3" opacity="0.75" />
          <circle cx="220" cy="75" r="10" fill="#FFC400" />
          <text x="220" y="79" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">C</text>
          <circle cx="420" cy="130" r="10" fill="#8b5cf6" />
          <text x="420" y="134" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">A</text>
          <text x="300" y="255" textAnchor="middle" fill="#94a3b8" fontSize="10">Zona Metropolitana CDMX · GPS en tiempo real próximamente</text>
        </svg>
      </div>
      <div className="p-3 border-t border-[#EAE7DD] bg-[#E8EFFF]">
        <p className="text-xs text-rr-traceDeep text-center">
          Tracking GPS en tiempo real se activará cuando los conductores usen la app
        </p>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DashboardView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [kpis, setKpis] = useState<KPIs>({
    viajesActivos: 0, finalizadosHoy: 0, programadosHoy: 0,
    pendientesAsignacion: 0, conductoresDisponibles: 0,
    conductoresEnViaje: 0, docsRevision: 0, incidenciasAbiertas: 0, ingresosHoy: 0,
  })
  const [viajesRecientes, setViajesRecientes] = useState<ViajeReciente[]>([])
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [cargando, setCargando] = useState(true)

  const cargarDashboard = async () => {
    const sb = getSupabaseBrowserClient()

    const hoy = new Date().toISOString().split('T')[0]

    const [
      { count: activos },
      { count: finalizados },
      { count: programados },
      { count: pendientes },
      { count: disponibles },
      { count: enViaje },
      { count: docs },
      { count: incidencias },
      { data: recientes },
      { data: sinConductor },
      { data: evIncompleta },
      { data: tarifasHoy },
    ] = await Promise.all([
      sb.from('viajes').select('*', { count: 'exact', head: true })
        .in('status', ['Conductor en camino','Recolección en proceso','Traslado en curso','Entrega en proceso']),
      sb.from('viajes').select('*', { count: 'exact', head: true })
        .eq('status', 'Finalizado').gte('updated_at', `${hoy}T00:00:00`),
      sb.from('viajes').select('*', { count: 'exact', head: true })
        .eq('fecha_programada', hoy),
      sb.from('viajes').select('*', { count: 'exact', head: true })
        .eq('status', 'Pendiente de asignación'),
      sb.from('conductores').select('*', { count: 'exact', head: true })
        .eq('disponibilidad', 'Disponible').eq('certificacion', 'Activo'),
      sb.from('conductores').select('*', { count: 'exact', head: true })
        .eq('disponibilidad', 'En viaje'),
      sb.from('documentos').select('*', { count: 'exact', head: true })
        .eq('estatus', 'En revisión'),
      sb.from('incidencias').select('*', { count: 'exact', head: true })
        .in('estatus', ['Nueva','En revisión','En seguimiento','Escalada']),
      sb.from('viajes').select(`
        id, folio, status, fecha_programada, hora_programada,
        origen_calle, destino_calle, tarifa_cliente,
        conductores(nombre, apellido),
        usuarios(nombre, apellido)
      `).order('created_at', { ascending: false }).limit(5),
      sb.from('viajes').select('id, folio, hora_programada')
        .eq('status', 'Pendiente de asignación').limit(3),
      sb.from('evidencias').select('id, viaje_id')
        .eq('estatus', 'Incompleta').limit(3),
      sb.from('viajes').select('tarifa_cliente').eq('fecha_programada', hoy),
    ])

    const ingresosHoy = (tarifasHoy ?? []).reduce((s: number, v: { tarifa_cliente: number | null }) => s + Number(v.tarifa_cliente ?? 0), 0)

    setKpis({
      viajesActivos: activos ?? 0,
      finalizadosHoy: finalizados ?? 0,
      programadosHoy: programados ?? 0,
      pendientesAsignacion: pendientes ?? 0,
      conductoresDisponibles: disponibles ?? 0,
      conductoresEnViaje: enViaje ?? 0,
      docsRevision: docs ?? 0,
      incidenciasAbiertas: incidencias ?? 0,
      ingresosHoy,
    })

    setViajesRecientes((recientes as unknown as ViajeReciente[]) ?? [])

    // Construir alertas dinámicas
    const nuevasAlertas: Alerta[] = []
    if ((pendientes ?? 0) > 0) {
      nuevasAlertas.push({
        type: 'warning',
        title: 'Viajes sin conductor asignado',
        message: `${pendientes} viaje${(pendientes ?? 0) > 1 ? 's' : ''} esperando asignación`,
      })
    }
    if ((evIncompleta ?? []).length > 0) {
      nuevasAlertas.push({
        type: 'error',
        title: 'Evidencia incompleta',
        message: `${(evIncompleta ?? []).length} viaje${(evIncompleta ?? []).length > 1 ? 's' : ''} con evidencia incompleta`,
      })
    }
    if ((incidencias ?? 0) > 0) {
      nuevasAlertas.push({
        type: 'error',
        title: 'Incidencias abiertas',
        message: `${incidencias} incidencia${(incidencias ?? 0) > 1 ? 's' : ''} requieren atención`,
      })
    }
    if ((docs ?? 0) > 0) {
      nuevasAlertas.push({
        type: 'info',
        title: 'Documentos en revisión',
        message: `${docs} documento${(docs ?? 0) > 1 ? 's' : ''} pendientes de validar`,
      })
    }
    if (nuevasAlertas.length === 0) {
      nuevasAlertas.push({
        type: 'info',
        title: 'Todo en orden',
        message: 'No hay alertas operativas en este momento',
      })
    }
    setAlertas(nuevasAlertas)
    setCargando(false)
  }

  useEffect(() => {
    cargarDashboard()
    // Refrescar KPIs cada 30 segundos
    const interval = setInterval(cargarDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const kpiCards = [
    { title: 'Viajes activos ahora',      value: kpis.viajesActivos,          icon: TruckIcon,          color: 'blue',    trend: 'En ruta en este momento' },
    { title: 'Finalizados hoy',           value: kpis.finalizadosHoy,         icon: CheckCircleIcon,    color: 'green',   trend: 'Completados hoy' },
    { title: 'Programados hoy',           value: kpis.programadosHoy,         icon: CalendarDaysIcon,   color: 'indigo',  trend: 'Agendados para hoy' },
    { title: 'Conductores en viaje',      value: kpis.conductoresEnViaje,     icon: UserGroupIcon,      color: 'purple',  trend: 'Actualmente en traslado' },
    { title: 'Pendientes asignación',     value: kpis.pendientesAsignacion,   icon: ClockIcon,          color: 'amber',   trend: 'Sin conductor asignado' },
    { title: 'Conductores disponibles',   value: kpis.conductoresDisponibles, icon: UserGroupIcon,      color: 'emerald', trend: 'Listos para asignar' },
    { title: 'Docs. en revisión',         value: kpis.docsRevision,           icon: DocumentTextIcon,   color: 'amber',   trend: 'Pendientes de validar' },
    { title: 'Incidencias abiertas',      value: kpis.incidenciasAbiertas,    icon: ExclamationTriangleIcon, color: 'red', trend: 'Requieren atención' },
    { title: 'Ingresos estimados hoy',    value: `$${kpis.ingresosHoy.toLocaleString()}`, icon: CurrencyDollarIcon, color: 'emerald', trend: 'Basado en viajes del día' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-lg font-bold text-rr-asphalt">Panel de operaciones</h2>
          {cargando
            ? <p className="text-xs text-slate-400">Cargando datos...</p>
            : <p className="text-xs text-slate-400">Actualizado hace unos segundos · refresca cada 30s</p>
          }
        </div>
        <button
          onClick={() => onNavigate?.('viajes')}
          className="flex items-center gap-2 bg-rr-route hover:bg-rr-routeDark text-rr-asphalt px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <PlusIcon className="w-4 h-4" />
          Nuevo viaje
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon
          const c = colorMap[card.color] ?? colorMap.blue
          return (
            <div key={idx} className="bg-white p-4 rounded-xl border border-[#EAE7DD] shadow-sm flex flex-col gap-2 border-l-4 border-l-rr-route">
              <div className="flex justify-between items-start">
                <p className="text-xs text-slate-500 font-medium leading-tight">{card.title}</p>
                <div className={`p-1.5 ${c.bg} rounded-lg flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${c.icon}`} />
                </div>
              </div>
              {cargando
                ? <div className="h-8 bg-slate-100 animate-pulse rounded" />
                : <p className="font-display text-2xl font-bold text-rr-asphalt">{card.value}</p>
              }
              <p className="text-xs text-slate-400">{card.trend}</p>
            </div>
          )
        })}
      </div>

      {/* MAPA + ALERTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MapaOperacion viajesActivos={kpis.viajesActivos} />

        {/* ALERTAS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BellAlertIcon className="w-5 h-5 text-amber-500" />
            Alertas Operativas
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto" style={{ maxHeight: 320 }}>
            {cargando
              ? [1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-lg" />)
              : alertas.map((alert, idx) => (
                <div key={idx} className={`flex gap-3 p-3 border rounded-lg ${alertStyles[alert.type]}`}>
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alertDot[alert.type]}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-snug">{alert.title}</p>
                    <p className="text-xs mt-0.5 opacity-80 leading-snug">{alert.message}</p>
                  </div>
                </div>
              ))
            }
          </div>
          <button onClick={() => onNavigate?.('incidencias')}
            className="mt-4 text-xs text-rr-trace hover:text-rr-traceDeep font-medium text-center w-full">
            Ver todas las alertas →
          </button>
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE + PRÓXIMOS VIAJES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ACTIVIDAD RECIENTE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-slate-500" />
            Viajes Recientes
          </h3>
          {cargando
            ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-lg" />)}</div>
            : viajesRecientes.length === 0
              ? <p className="text-sm text-slate-400 italic text-center py-6">Sin viajes registrados aún</p>
              : <ol className="relative border-l border-slate-200 space-y-4 ml-2">
                  {viajesRecientes.map((v, idx) => (
                    <li key={idx} className="ml-4">
                      <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 text-xs font-bold text-rr-trace">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800">{v.folio ?? v.id.slice(0,8)}</p>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${statusStyle[v.status] ?? 'bg-slate-100 text-slate-500'}`}>
                            {v.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {v.origen_calle ?? '—'} → {v.destino_calle ?? '—'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {v.usuarios ? `${v.usuarios.nombre} ${v.usuarios.apellido}` : 'Sin usuario'}
                          {v.conductores ? ` · ${v.conductores.nombre} ${v.conductores.apellido}` : ' · Sin conductor'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
          }
          <button onClick={() => onNavigate?.('viajes')}
            className="mt-4 text-xs text-rr-trace hover:text-rr-traceDeep font-medium">
            Ver historial completo →
          </button>
        </div>

        {/* PRÓXIMOS VIAJES */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-indigo-500" />
            Próximos Viajes del Día
          </h3>
          {cargando
            ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-lg" />)}</div>
            : viajesRecientes.filter(v =>
                ['Pendiente de asignación','Conductor asignado','Conductor en camino'].includes(v.status)
              ).length === 0
              ? <div className="text-center py-8">
                  <CalendarDaysIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 italic">Sin viajes próximos programados</p>
                  <button onClick={() => onNavigate?.('viajes')}
                    className="mt-3 text-xs text-rr-trace hover:underline">
                    Crear nuevo viaje →
                  </button>
                </div>
              : <div className="space-y-3">
                  {viajesRecientes
                    .filter(v => ['Pendiente de asignación','Conductor asignado','Conductor en camino'].includes(v.status))
                    .map((v, idx) => (
                      <div key={idx} className="flex gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => onNavigate?.('viajes')}>
                        <div className="flex-shrink-0 text-center w-14">
                          <p className="text-sm font-bold text-slate-800">
                            {v.hora_programada ? v.hora_programada.slice(0,5) : '—'}
                          </p>
                          <p className="text-xs text-slate-400">{v.fecha_programada ?? ''}</p>
                        </div>
                        <div className="w-px bg-slate-200 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-rr-trace">{v.folio ?? v.id.slice(0,8)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[v.status] ?? ''}`}>
                              {v.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 truncate">
                            {v.origen_calle ?? '—'} → {v.destino_calle ?? '—'}
                          </p>
                          <p className={`text-xs font-medium mt-0.5 ${!v.conductores ? 'text-red-500' : 'text-slate-500'}`}>
                            {v.conductores ? `${v.conductores.nombre} ${v.conductores.apellido}` : 'Sin conductor asignado'}
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
          }
          <button onClick={() => onNavigate?.('viajes')}
            className="mt-4 text-xs text-rr-trace hover:text-rr-traceDeep font-medium">
            Ver todos los viajes →
          </button>
        </div>
      </div>
    </div>
  )
}
