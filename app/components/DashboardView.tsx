'use client'

import { useState } from 'react'
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

// ─── KPI DATA ─────────────────────────────────────────────────────────────────
const kpiCards = [
  {
    title: 'Viajes activos ahora',
    value: '12',
    icon: TruckIcon,
    color: 'blue',
    trend: '+3 vs ayer',
  },
  {
    title: 'Finalizados hoy',
    value: '8',
    icon: CheckCircleIcon,
    color: 'green',
    trend: '72 % de la meta diaria',
  },
  {
    title: 'Programados hoy',
    value: '23',
    icon: CalendarDaysIcon,
    color: 'indigo',
    trend: '15 pendientes de iniciar',
  },
  {
    title: 'Conductores en viaje',
    value: '12',
    icon: UserGroupIcon,
    color: 'purple',
    trend: '16 disponibles • 45 total',
  },
  {
    title: 'Pendientes asignación',
    value: '4',
    icon: ClockIcon,
    color: 'amber',
    trend: '2 sin conductor en <1h',
  },
  {
    title: 'Conductores disponibles',
    value: '16',
    icon: UserGroupIcon,
    color: 'emerald',
    trend: 'De 45 registrados',
  },
  {
    title: 'Docs. pendientes revisión',
    value: '4',
    icon: DocumentTextIcon,
    color: 'amber',
    trend: '1 vence en menos de 5 días',
  },
  {
    title: 'Ingresos estimados hoy',
    value: '$8,050',
    icon: CurrencyDollarIcon,
    color: 'emerald',
    trend: '23 viajes × tarifa promedio',
  },
  {
    title: 'Incidencias abiertas',
    value: '2',
    icon: ExclamationTriangleIcon,
    color: 'red',
    trend: '1 daño reportado · 1 retraso',
  },
]

// ─── ALERTS ───────────────────────────────────────────────────────────────────
const alerts = [
  {
    type: 'error',
    title: 'Evidencia incompleta',
    message: 'Viaje #TR-8842 · Falta foto interior final.',
    time: 'Hace 5 min',
  },
  {
    type: 'warning',
    title: 'Conductor retrasado',
    message: '#TR-8845 · Ana R. lleva 20 min de retraso.',
    time: 'Hace 12 min',
  },
  {
    type: 'error',
    title: 'Incidente reportado',
    message: 'Viaje #TR-8840 · Rayón en puerta delantera.',
    time: 'Hace 18 min',
  },
  {
    type: 'warning',
    title: 'Viaje sin conductor asignado',
    message: '#TR-8847 programado en 35 min.',
    time: 'Hace 20 min',
  },
  {
    type: 'info',
    title: 'Pago en revisión',
    message: 'Pago #PAG-062 de Ana R. requiere validación.',
    time: 'Hace 1 h',
  },
  {
    type: 'info',
    title: 'Documento por vencer',
    message: 'Licencia de J. Pérez vence en 5 días.',
    time: 'Hace 2 h',
  },
]

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
const activityFeed = [
  {
    icon: '🚗',
    event: 'Nuevo viaje solicitado',
    detail: '#TR-8848 · CDMX → Satélite · Toyota Hilux',
    time: 'Hace 3 min',
    color: 'blue',
  },
  {
    icon: '✅',
    event: 'Conductor aceptó viaje',
    detail: 'Carlos M. aceptó #TR-8847',
    time: 'Hace 8 min',
    color: 'green',
  },
  {
    icon: '📷',
    event: 'Evidencia cargada',
    detail: '#TR-8843 · Fotos inicial y final subidas',
    time: 'Hace 14 min',
    color: 'purple',
  },
  {
    icon: '🏁',
    event: 'Viaje finalizado',
    detail: '#TR-8841 · Carlos M. · Honda Civic',
    time: 'Hace 25 min',
    color: 'slate',
  },
  {
    icon: '⚠️',
    event: 'Incidencia creada',
    detail: '#INC-004 · Retraso en #TR-8845 (Alta)',
    time: 'Hace 30 min',
    color: 'red',
  },
  {
    icon: '💰',
    event: 'Pago generado',
    detail: '#PAG-063 · Mario G. · $3,150 MXN',
    time: 'Hace 45 min',
    color: 'emerald',
  },
]

// ─── UPCOMING TRIPS ──────────────────────────────────────────────────────────
const upcomingTrips = [
  {
    id: '#TR-8847',
    hora: '12:00',
    origen: 'Agencia Sur',
    destino: 'Domicilio Cliente',
    vehiculo: 'Honda Civic DEF-456',
    conductor: 'Carlos M.',
    status: 'Confirmado',
    statusColor: 'green',
    minutosRestantes: 28,
  },
  {
    id: '#TR-8848',
    hora: '12:30',
    origen: 'CDMX Centro',
    destino: 'Satélite, Edo. Méx.',
    vehiculo: 'Toyota Hilux XYZ-987',
    conductor: 'Sin asignar',
    status: 'Sin conductor',
    statusColor: 'red',
    minutosRestantes: 58,
  },
  {
    id: '#TR-8849',
    hora: '13:00',
    origen: 'Taller Norte',
    destino: 'Av. Reforma 222',
    vehiculo: 'Nissan Versa ABC-123',
    conductor: 'Ana R.',
    status: 'Confirmado',
    statusColor: 'green',
    minutosRestantes: 88,
  },
  {
    id: '#TR-8850',
    hora: '14:30',
    origen: 'Distribuidora Bajío',
    destino: 'Aeropuerto AICM',
    vehiculo: 'Ford F-150 GHI-321',
    conductor: 'Mario G.',
    status: 'Programado',
    statusColor: 'blue',
    minutosRestantes: 208,
  },
]

// ─── ACTIVE TRIPS FOR MAP ─────────────────────────────────────────────────────
const activeTripsMap = [
  { id: '#TR-8842', conductor: 'Ana R.', vehiculo: 'Toyota Hilux', origen: 'Av. Reforma 222', destino: 'Taller Norte', progreso: 60, color: '#3b82f6' },
  { id: '#TR-8844', conductor: 'Mario G.', vehiculo: 'Ford F-150', origen: 'Taller Sur', destino: 'Agencia Norte', progreso: 30, color: '#8b5cf6' },
  { id: '#TR-8846', conductor: 'Pedro C.', vehiculo: 'Nissan Versa', origen: 'Distribuidora', destino: 'Cliente Final', progreso: 80, color: '#10b981' },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    icon: 'text-blue-600' },
  green:   { bg: 'bg-green-50',   text: 'text-green-600',   icon: 'text-green-600' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  icon: 'text-indigo-600' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  icon: 'text-purple-600' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-600' },
  red:     { bg: 'bg-red-50',     text: 'text-red-600',     icon: 'text-red-600' },
}

const alertStyles: Record<string, string> = {
  error:   'bg-red-50 border-red-100 text-red-800',
  warning: 'bg-amber-50 border-amber-100 text-amber-800',
  info:    'bg-blue-50 border-blue-100 text-blue-800',
}

const alertDot: Record<string, string> = {
  error:   'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-blue-500',
}

const tripStatusStyle: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  red:   'bg-red-100 text-red-700',
  blue:  'bg-blue-100 text-blue-700',
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function DashboardView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [showNuevoViaje, setShowNuevoViaje] = useState(false)
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Nuevo viaje button */}
      <div className="flex justify-end">
        <button
          onClick={() => onNavigate ? onNavigate('viajes') : setShowNuevoViaje(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <PlusIcon className="w-4 h-4" />
          Nuevo viaje
        </button>
      </div>

      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon
          const c = colorMap[card.color] ?? colorMap.blue
          return (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <p className="text-xs text-slate-500 font-medium leading-tight">{card.title}</p>
                <div className={`p-1.5 ${c.bg} rounded-lg flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${c.icon}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              <p className="text-xs text-slate-400">{card.trend}</p>
            </div>
          )
        })}
      </div>

      {/* ── MAP + ALERTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* MAP PANEL */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-blue-500" />
              Mapa de Operación
            </h3>
            <span className="text-xs text-slate-400">3 viajes activos en ruta</span>
          </div>

          {/* Mapa SVG representativo */}
          <div className="relative bg-slate-100" style={{ height: 280 }}>
            <svg viewBox="0 0 600 280" className="w-full h-full">
              {/* Fondo estilo mapa */}
              <rect width="600" height="280" fill="#e8edf2" />

              {/* Cuadrícula de calles */}
              {[60,120,180,240,300,360,420,480,540].map(x => (
                <line key={`v${x}`} x1={x} y1="0" x2={x} y2="280" stroke="#d1d9e3" strokeWidth="1" />
              ))}
              {[40,80,120,160,200,240].map(y => (
                <line key={`h${y}`} x1="0" y1={y} x2="600" y2={y} stroke="#d1d9e3" strokeWidth="1" />
              ))}

              {/* Avenidas principales */}
              <line x1="0" y1="140" x2="600" y2="140" stroke="#c4cdd8" strokeWidth="3" />
              <line x1="300" y1="0" x2="300" y2="280" stroke="#c4cdd8" strokeWidth="3" />
              <line x1="0" y1="70" x2="600" y2="210" stroke="#c4cdd8" strokeWidth="2" />

              {/* Zona de operación */}
              <ellipse cx="300" cy="140" rx="200" ry="110" fill="#3b82f6" fillOpacity="0.07" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 4" />

              {/* Rutas activas */}
              <path d="M 140 90 Q 220 70 300 140" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeDasharray="6 3" opacity="0.7" />
              <path d="M 380 80 Q 420 140 460 180" stroke="#8b5cf6" strokeWidth="2.5" fill="none" strokeDasharray="6 3" opacity="0.7" />
              <path d="M 160 200 Q 240 200 320 170" stroke="#10b981" strokeWidth="2.5" fill="none" strokeDasharray="6 3" opacity="0.7" />

              {/* Conductor 1 - azul */}
              <circle cx="220" cy="75" r="10" fill="#3b82f6" />
              <text x="220" y="79" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">A</text>
              <rect x="228" y="64" width="44" height="14" rx="3" fill="white" stroke="#d1d5db" strokeWidth="0.5" />
              <text x="250" y="74" textAnchor="middle" fill="#374151" fontSize="7">TR-8842</text>

              {/* Conductor 2 - morado */}
              <circle cx="420" cy="130" r="10" fill="#8b5cf6" />
              <text x="420" y="134" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">M</text>
              <rect x="428" y="119" width="44" height="14" rx="3" fill="white" stroke="#d1d5db" strokeWidth="0.5" />
              <text x="450" y="129" textAnchor="middle" fill="#374151" fontSize="7">TR-8844</text>

              {/* Conductor 3 - verde */}
              <circle cx="240" cy="195" r="10" fill="#10b981" />
              <text x="240" y="199" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">P</text>
              <rect x="248" y="184" width="44" height="14" rx="3" fill="white" stroke="#d1d5db" strokeWidth="0.5" />
              <text x="270" y="194" textAnchor="middle" fill="#374151" fontSize="7">TR-8846</text>

              {/* Origen / destino markers */}
              {[
                { x: 140, y: 90, color: '#6b7280' },
                { x: 300, y: 140, color: '#6b7280' },
                { x: 380, y: 80, color: '#6b7280' },
                { x: 460, y: 180, color: '#6b7280' },
                { x: 160, y: 200, color: '#6b7280' },
                { x: 320, y: 170, color: '#6b7280' },
              ].map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill={p.color} opacity="0.5" />
              ))}

              {/* Label zona */}
              <text x="300" y="255" textAnchor="middle" fill="#94a3b8" fontSize="10">Zona Metropolitana CDMX</text>
            </svg>
          </div>

          {/* Leyenda */}
          <div className="p-4 border-t border-slate-100 flex flex-wrap gap-4">
            {activeTripsMap.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-slate-600 font-medium">{t.id}</span>
                <span className="text-slate-400">{t.conductor} · {t.vehiculo}</span>
                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${t.progreso}%`, backgroundColor: t.color }} />
                </div>
                <span className="text-slate-400">{t.progreso}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ALERTS PANEL */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BellAlertIcon className="w-5 h-5 text-amber-500" />
            Alertas Operativas
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto" style={{ maxHeight: 320 }}>
            {alerts.map((alert, idx) => (
              <div key={idx} className={`flex gap-3 p-3 border rounded-lg ${alertStyles[alert.type]}`}>
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alertDot[alert.type]}`} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-snug">{alert.title}</p>
                  <p className="text-xs mt-0.5 opacity-80 leading-snug">{alert.message}</p>
                  <p className="text-xs mt-1 opacity-50">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate?.('incidencias')} className="mt-4 text-xs text-blue-600 hover:text-blue-800 font-medium text-center w-full">
            Ver todas las alertas →
          </button>
        </div>
      </div>

      {/* ── ACTIVITY FEED + UPCOMING TRIPS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ACTIVITY FEED */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-slate-500" />
            Historial de Actividad
          </h3>
          <ol className="relative border-l border-slate-200 space-y-4 ml-2">
            {activityFeed.map((item, idx) => (
              <li key={idx} className="ml-4">
                <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 text-sm">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.event}</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                </div>
              </li>
            ))}
          </ol>
          <button onClick={() => onNavigate?.('viajes')} className="mt-4 text-xs text-blue-600 hover:text-blue-800 font-medium">
            Ver historial completo →
          </button>
        </div>

        {/* UPCOMING TRIPS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-indigo-500" />
            Próximos Viajes del Día
          </h3>
          <div className="space-y-3">
            {upcomingTrips.map((trip, idx) => (
              <div key={idx} className="flex gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                {/* Hora */}
                <div className="flex-shrink-0 text-center w-12">
                  <p className="text-sm font-bold text-slate-800">{trip.hora}</p>
                  <p className="text-xs text-slate-400">{trip.minutosRestantes < 60 ? `${trip.minutosRestantes} min` : `${Math.round(trip.minutosRestantes / 60)} h`}</p>
                </div>
                {/* Divider */}
                <div className="w-px bg-slate-200 flex-shrink-0" />
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-blue-600">{trip.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${tripStatusStyle[trip.statusColor]}`}>
                      {trip.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 truncate">
                    <span className="font-medium">De:</span> {trip.origen} &rarr; <span className="font-medium">A:</span> {trip.destino}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-slate-400 truncate">{trip.vehiculo}</p>
                    <span className="text-slate-300">·</span>
                    <p className={`text-xs font-medium truncate ${trip.conductor === 'Sin asignar' ? 'text-red-500' : 'text-slate-600'}`}>
                      {trip.conductor}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate?.('viajes')} className="mt-4 text-xs text-blue-600 hover:text-blue-800 font-medium">
            Ver todos los viajes →
          </button>
        </div>

      </div>
    </div>
  )
}
