'use client'

import { useState } from 'react'
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  TruckIcon,
  BanknotesIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type MainTab = 'operativos' | 'financieros' | 'conductores' | 'usuarios'
type Periodo = 'hoy' | 'semana' | 'mes' | 'trimestre'

// ─── MINI CHART (SVG bars) ────────────────────────────────────────────────────
function BarChart({ data, color = '#3b82f6', height = 80 }: {
  data: { label: string; value: number }[]
  color?: string
  height?: number
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md transition-all duration-300 hover:opacity-80"
            style={{ height: `${(d.value / max) * (height - 20)}px`, backgroundColor: color, minHeight: 2 }} />
          <span className="text-xs text-slate-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function LineSparkline({ data, color = '#3b82f6', width = 120, height = 40 }: {
  data: number[]; color?: string; width?: number; height?: number
}) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, trendUp, sparkline, color = 'blue' }: {
  label: string; value: string | number; sub?: string; trend?: string; trendUp?: boolean
  sparkline?: number[]; color?: string
}) {
  const colorMap: Record<string, string> = {
    blue:    '#3b82f6', green: '#10b981', purple: '#8b5cf6',
    amber:   '#f59e0b', red:   '#ef4444', indigo: '#6366f1',
    emerald: '#059669', rose:  '#f43f5e',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex justify-between items-start">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {sparkline && <LineSparkline data={sparkline} color={colorMap[color]} />}
      </div>
      <p className="text-2xl font-bold text-slate-800 mt-2">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      {trend && (
        <p className={`text-xs font-medium mt-2 ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </p>
      )}
    </div>
  )
}

// ─── TABLE ────────────────────────────────────────────────────────────────────
function ReportTable({ headers, rows, colores }: {
  headers: string[]
  rows: (string | number | React.ReactNode)[][]
  colores?: Record<number, string>
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
          <tr>{headers.map((h, i) => <th key={i} className="px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className={`px-4 py-3 ${colores?.[ci] ?? 'text-slate-700'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SCard({ title, subtitle, children, onDownload }: {
  title: string; subtitle?: string; children: React.ReactNode; onDownload?: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {onDownload && (
          <button onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />CSV
          </button>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── DATA POR PERIODO ─────────────────────────────────────────────────────────
const dataViajes: Record<Periodo, { label: string; value: number }[]> = {
  hoy:       [{ label: '8am', value: 2 }, { label: '10am', value: 4 }, { label: '12pm', value: 6 }, { label: '2pm', value: 5 }, { label: '4pm', value: 7 }, { label: '6pm', value: 3 }],
  semana:    [{ label: 'Lun', value: 12 }, { label: 'Mar', value: 18 }, { label: 'Mié', value: 14 }, { label: 'Jue', value: 22 }, { label: 'Vie', value: 19 }, { label: 'Sáb', value: 8 }, { label: 'Dom', value: 4 }],
  mes:       [{ label: 'S1', value: 45 }, { label: 'S2', value: 62 }, { label: 'S3', value: 58 }, { label: 'S4', value: 71 }],
  trimestre: [{ label: 'Abr', value: 182 }, { label: 'May', value: 210 }, { label: 'Jun', value: 236 }],
}

const dataIngresos: Record<Periodo, { label: string; value: number }[]> = {
  hoy:       [{ label: '8am', value: 800 }, { label: '10am', value: 1600 }, { label: '12pm', value: 2400 }, { label: '2pm', value: 2000 }, { label: '4pm', value: 2800 }, { label: '6pm', value: 1200 }],
  semana:    [{ label: 'Lun', value: 4800 }, { label: 'Mar', value: 7200 }, { label: 'Mié', value: 5600 }, { label: 'Jue', value: 8800 }, { label: 'Vie', value: 7600 }, { label: 'Sáb', value: 3200 }, { label: 'Dom', value: 1600 }],
  mes:       [{ label: 'S1', value: 18000 }, { label: 'S2', value: 24800 }, { label: 'S3', value: 23200 }, { label: 'S4', value: 28400 }],
  trimestre: [{ label: 'Abr', value: 72800 }, { label: 'May', value: 84000 }, { label: 'Jun', value: 94400 }],
}

// ─── REPORTE OPERATIVO ────────────────────────────────────────────────────────
function ReporteOperativo({ periodo }: { periodo: Periodo }) {
  const viajesData = dataViajes[periodo]
  const totalViajes = viajesData.reduce((s, d) => s + d.value, 0)

  const porZona = [
    ['CDMX Centro', 38, '38%', '#3b82f6'],
    ['Zona Norte (Satélite / Tlalnepantla)', 24, '24%', '#8b5cf6'],
    ['Zona Sur (Coyoacán / Tlalpan)', 19, '19%', '#10b981'],
    ['Zona Oriente (Iztapalapa / Chalco)', 12, '12%', '#f59e0b'],
    ['Foráneo / Otro', 7, '7%', '#ef4444'],
  ]

  return (
    <div className="space-y-5">
      {/* KPIs operativos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total viajes" value={totalViajes} sub={periodo === 'hoy' ? 'hoy' : periodo === 'semana' ? 'esta semana' : periodo === 'mes' ? 'este mes' : 'este trimestre'} trend="+12% vs periodo anterior" trendUp sparkline={[12,18,14,22,19,totalViajes]} color="blue" />
        <KpiCard label="Cancelaciones" value={Math.round(totalViajes * 0.06)} sub={`${6}% tasa cancelación`} trend="-2% vs anterior" trendUp sparkline={[4,6,5,7,5,Math.round(totalViajes*0.06)]} color="red" />
        <KpiCard label="Tiempo asignación prom." value="8 min" sub="desde solicitud hasta conductor" trend="-1 min vs anterior" trendUp sparkline={[12,10,9,8,9,8]} color="green" />
        <KpiCard label="Tiempo traslado prom." value="42 min" sub="por viaje completado" trend="+3 min vs anterior" trendUp={false} sparkline={[38,41,39,44,40,42]} color="amber" />
      </div>

      {/* Gráfica de viajes */}
      <SCard title="📊 Viajes por Período" subtitle="Distribución temporal de traslados" onDownload={() => {}}>
        <BarChart data={viajesData} color="#3b82f6" height={120} />
      </SCard>

      {/* Tipo de servicio + Por zona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SCard title="🚗 Viajes por Tipo de Servicio" onDownload={() => {}}>
          <div className="space-y-3">
            {[
              { tipo: 'Traslado local',    pct: 48, color: 'bg-blue-500' },
              { tipo: 'Traslado foráneo',  pct: 22, color: 'bg-indigo-500' },
              { tipo: 'Entrega al cliente',pct: 15, color: 'bg-emerald-500' },
              { tipo: 'Largo recorrido',   pct: 10, color: 'bg-purple-500' },
              { tipo: 'Urgente',           pct: 5,  color: 'bg-rose-500' },
            ].map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">{s.tipo}</span>
                  <span className="text-slate-400">{s.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color} transition-all`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SCard>

        <SCard title="📍 Viajes por Zona" onDownload={() => {}}>
          <div className="space-y-3">
            {porZona.map(([zona, cant, pct, color], i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium truncate pr-2">{zona as string}</span>
                  <span className="text-slate-400 flex-shrink-0">{cant as number} ({pct as string})</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: pct as string, backgroundColor: color as string }} />
                </div>
              </div>
            ))}
          </div>
        </SCard>
      </div>

      {/* Incidencias */}
      <SCard title="⚠️ Incidencias por Tipo" subtitle="Registradas en el periodo" onDownload={() => {}}>
        <ReportTable
          headers={['Tipo de incidencia', 'Cantidad', 'Tasa sobre viajes', 'Resueltas', 'Abiertas']}
          rows={[
            ['Daños reportados',          5, '2.1%', 3, 2],
            ['Retraso',                   8, '3.4%', 7, 1],
            ['Falta de evidencia',         4, '1.7%', 4, 0],
            ['Cancelación',              3, '1.3%', 3, 0],
            ['Diferencia de kilometraje', 2, '0.8%', 1, 1],
            ['Problema con documentación', 2, '0.8%', 1, 1],
          ]}
        />
      </SCard>
    </div>
  )
}

// ─── REPORTE FINANCIERO ───────────────────────────────────────────────────────
function ReporteFinanciero({ periodo }: { periodo: Periodo }) {
  const ingData = dataIngresos[periodo]
  const totalIng = ingData.reduce((s, d) => s + d.value, 0)
  const totalPagos = Math.round(totalIng * 0.56)
  const totalGastos = Math.round(totalIng * 0.06)
  const margen = totalIng - totalPagos - totalGastos
  const margenPct = ((margen / totalIng) * 100).toFixed(1)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Ingresos totales" value={`$${totalIng.toLocaleString()}`} sub="facturado al cliente" trend="+15% vs anterior" trendUp sparkline={[60000,72000,68000,80000,76000,totalIng]} color="emerald" />
        <KpiCard label="Pago a conductores" value={`$${totalPagos.toLocaleString()}`} sub="56% de ingresos" sparkline={[33000,40000,38000,45000,43000,totalPagos]} color="blue" />
        <KpiCard label="Gastos autorizados" value={`$${totalGastos.toLocaleString()}`} sub="casetas, combustible, etc." sparkline={[3600,4200,4000,4800,4500,totalGastos]} color="amber" />
        <KpiCard label="Margen estimado" value={`$${margen.toLocaleString()}`} sub={`${margenPct}% del ingreso`} trend="+2.1 pts vs anterior" trendUp sparkline={[21000,26000,24000,29000,27000,margen]} color="purple" />
        <KpiCard label="Pendiente de cobro" value="$9,250" sub="5 viajes sin confirmar" trend="−$3k vs semana pasada" trendUp sparkline={[15000,12000,10000,11000,9500,9250]} color="rose" />
        <KpiCard label="Pendiente conductores" value="$13,940" sub="4 pagos en proceso" sparkline={[18000,15000,14500,16000,14200,13940]} color="indigo" />
      </div>

      <SCard title="💰 Ingresos por Período" subtitle="Facturación total al cliente" onDownload={() => {}}>
        <BarChart data={ingData} color="#10b981" height={120} />
      </SCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SCard title="📈 Margen por Tipo de Servicio" onDownload={() => {}}>
          <ReportTable
            headers={['Servicio', 'Ingresos', 'Pago conductor', 'Gastos', 'Margen']}
            rows={[
              ['Traslado local',    '$28,400', '$15,900', '$1,200', <span key="m1" className="text-green-600 font-semibold">$11,300</span>],
              ['Traslado foráneo',  '$21,800', '$12,200', '$2,400', <span key="m2" className="text-green-600 font-semibold">$7,200</span>],
              ['Largo recorrido',   '$18,200', '$10,400', '$3,200', <span key="m3" className="text-green-600 font-semibold">$4,600</span>],
              ['Entrega al cliente','$14,600',  '$8,200', '$600',  <span key="m4" className="text-green-600 font-semibold">$5,800</span>],
              ['Urgente',           '$11,400',  '$6,300', '$400',  <span key="m5" className="text-green-600 font-semibold">$4,700</span>],
            ]}
          />
        </SCard>

        <SCard title="📋 Viajes Pendientes de Cobro" onDownload={() => {}}>
          <ReportTable
            headers={['Viaje', 'Cliente', 'Monto', 'Días vencido', 'Estatus']}
            rows={[
              ['#TR-8848', 'Grupo Logístico', '$1,200', '0', <span key="e1" className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">Pendiente</span>],
              ['#TR-8844', 'AutoNorte', '$950', '1', <span key="e2" className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">En revisión</span>],
              ['#TR-8842', 'RentaWheels', '$2,200', '0', <span key="e3" className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">Aprobado</span>],
              ['#TR-8836', 'Seguros Primero', '$4,900', '4', <span key="e4" className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">Vencido</span>],
            ]}
          />
        </SCard>
      </div>

      <SCard title="💸 Pagos Pendientes a Conductores" onDownload={() => {}}>
        <ReportTable
          headers={['Conductor', 'Periodo', 'Viajes', 'Ganancias', 'Gs. Auto.', 'Depósito', 'Estatus']}
          rows={[
            ['Carlos Méndez', '9-14 Jun', 8, '$4,900', '$150', <span key="d1" className="font-bold text-slate-800">$5,050</span>, <span key="e1" className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">Pendiente</span>],
            ['Ana Rodríguez', '9-14 Jun', 6, '$2,660', '$80', <span key="d2" className="font-bold text-slate-800">$2,690</span>, <span key="e2" className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">En revisión</span>],
            ['Mario García',  '9-14 Jun', 2, '$1,300', '$300', <span key="d3" className="font-bold text-slate-800">$1,600</span>, <span key="e3" className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">Aprobado</span>],
            ['Pedro Castillo', '9-14 Jun', 1, '$560', '$0', <span key="d4" className="font-bold text-red-600">$560</span>, <span key="e4" className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">Rechazado</span>],
          ]}
        />
      </SCard>
    </div>
  )
}

// ─── REPORTE CONDUCTORES ──────────────────────────────────────────────────────
function ReporteConductores() {
  const conductores = [
    { nombre: 'Carlos Méndez', viajes: 142, calif: 4.9, incidencias: 0, disponibilidad: '94%', ganancias: 49700, docsVencidos: 1, estatus: 'Activo' },
    { nombre: 'Ana Rodríguez', viajes: 87,  calif: 4.7, incidencias: 1, disponibilidad: '88%', ganancias: 30450, docsVencidos: 0, estatus: 'Activo' },
    { nombre: 'Mario García',  viajes: 63,  calif: 4.5, incidencias: 0, disponibilidad: '76%', ganancias: 22050, docsVencidos: 2, estatus: 'Activo' },
    { nombre: 'Sandra Pérez',  viajes: 0,   calif: 0,   incidencias: 0, disponibilidad: '—',   ganancias: 0,     docsVencidos: 2, estatus: 'Pendiente' },
    { nombre: 'Pedro Castillo',viajes: 31,  calif: 3.8, incidencias: 2, disponibilidad: '62%', ganancias: 10850, docsVencidos: 2, estatus: 'Suspendido' },
  ]

  function Stars({ v }: { v: number }) {
    if (!v) return <span className="text-xs text-slate-300">—</span>
    return <span className="text-xs font-semibold text-amber-500">{'★'.repeat(Math.round(v))} {v.toFixed(1)}</span>
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Conductores activos" value={4} sub="de 5 registrados" sparkline={[3,3,4,4,4,4]} color="green" />
        <KpiCard label="Calificación promedio" value="4.6 ★" sub="promedio general" trend="+0.1 vs mes anterior" trendUp sparkline={[4.3,4.4,4.5,4.5,4.6,4.6]} color="amber" />
        <KpiCard label="Docs. vencidos / alertas" value={7} sub="entre todos los conductores" trend="+2 vs semana pasada" trendUp={false} sparkline={[3,4,5,5,6,7]} color="red" />
        <KpiCard label="Disponibilidad promedio" value="80%" sub="tiempo disponible" sparkline={[75,78,80,77,82,80]} color="blue" />
      </div>

      <SCard title="👤 Desempeño por Conductor" subtitle="Comparativo general del periodo" onDownload={() => {}}>
        <ReportTable
          headers={['Conductor', 'Viajes', 'Calificación', 'Incidencias', 'Disponibilidad', 'Ganancias', 'Docs vencidos', 'Estatus']}
          rows={conductores.map(c => [
            <span key={c.nombre} className="font-medium text-slate-800">{c.nombre}</span>,
            <span key="v" className="font-semibold">{c.viajes}</span>,
            <Stars key="s" v={c.calif} />,
            c.incidencias > 0
              ? <span key="i" className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">{c.incidencias}</span>
              : <span key="i0" className="text-slate-300 text-xs">0</span>,
            c.disponibilidad,
            `$${c.ganancias.toLocaleString()}`,
            c.docsVencidos > 0
              ? <span key="d" className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">{c.docsVencidos} vencidos</span>
              : <span key="d0" className="text-green-600 text-xs font-medium">✓ OK</span>,
            <span key="es" className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              c.estatus === 'Activo' ? 'bg-green-100 text-green-700' :
              c.estatus === 'Suspendido' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>{c.estatus}</span>,
          ])}
        />
      </SCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SCard title="⚠️ Documentos Vencidos / Por Vencer" onDownload={() => {}}>
          <ReportTable
            headers={['Conductor', 'Documento', 'Estado', 'Vence']}
            rows={[
              ['Carlos Méndez', 'Antecedentes no penales', <span key="a1" className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">Vencido</span>, 'Mar 2025'],
              ['Mario García',  'Licencia de conducir',    <span key="a2" className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs">Por vencer</span>, '19 Jun 2025'],
              ['Mario García',  'Antecedentes no penales', <span key="a3" className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">Vencido</span>, 'Ene 2024'],
              ['Sandra Pérez',  'Constancia fiscal',       <span key="a4" className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs">Pendiente carga</span>, '—'],
              ['Sandra Pérez',  'Antecedentes no penales', <span key="a5" className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs">Pendiente carga</span>, '—'],
              ['Pedro Castillo','Licencia de conducir',    <span key="a6" className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">Vencido</span>, 'Ago 2024'],
              ['Pedro Castillo','Antecedentes no penales', <span key="a7" className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">Vencido</span>, 'Feb 2023'],
            ]}
          />
        </SCard>

        <SCard title="📊 Ganancias por Conductor" subtitle="Acumulado histórico">
          <div className="space-y-3">
            {[
              { nombre: 'Carlos Méndez', total: 49700, color: 'bg-blue-500' },
              { nombre: 'Ana Rodríguez', total: 30450, color: 'bg-emerald-500' },
              { nombre: 'Mario García',  total: 22050, color: 'bg-purple-500' },
              { nombre: 'Pedro Castillo',total: 10850, color: 'bg-rose-500' },
              { nombre: 'Sandra Pérez', total: 0,     color: 'bg-slate-300' },
            ].map((c, i) => {
              const max = 49700
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{c.nombre}</span>
                    <span className="text-slate-500 font-semibold">${c.total.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.color}`} style={{ width: `${(c.total / max) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </SCard>
      </div>
    </div>
  )
}

// ─── REPORTE USUARIOS ─────────────────────────────────────────────────────────
function ReporteUsuarios() {
  const empresas = [
    { nombre: 'Grupo Logístico CDMX', tipo: 'Flotilla',    viajes: 148, frecuencia: 'Alta',  facturado: 148000, incidencias: 2, topServicio: 'Traslado local' },
    { nombre: 'RentaWheels',           tipo: 'Arrendadora', viajes: 310, frecuencia: 'Muy alta', facturado: 215000, incidencias: 0, topServicio: 'Entrega al cliente' },
    { nombre: 'Seguros Primero',       tipo: 'Aseguradora', viajes: 22,  frecuencia: 'Media', facturado: 62000,  incidencias: 0, topServicio: 'Traslado foráneo' },
    { nombre: 'AutoNorte',             tipo: 'Agencia',     viajes: 93,  frecuencia: 'Alta',  facturado: 93000,  incidencias: 2, topServicio: 'Traslado local' },
    { nombre: 'Distribuidora Bajío',   tipo: 'Empresa',     viajes: 1,   frecuencia: 'Baja',  facturado: 2200,   incidencias: 0, topServicio: 'Largo recorrido' },
  ]

  const freqColor: Record<string, string> = {
    'Muy alta': 'bg-green-100 text-green-700',
    'Alta':     'bg-blue-100 text-blue-700',
    'Media':    'bg-amber-100 text-amber-700',
    'Baja':     'bg-slate-100 text-slate-500',
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Clientes activos" value={5} sub="empresas y particulares" trend="+1 vs mes anterior" trendUp sparkline={[3,3,4,4,5,5]} color="blue" />
        <KpiCard label="Total viajes solicitados" value={574} sub="historial acumulado" sparkline={[320,380,420,470,520,574]} color="indigo" />
        <KpiCard label="Total facturado" value="$520k" sub="a todos los clientes" trend="+18% vs trimestre anterior" trendUp sparkline={[280,320,360,400,460,520]} color="emerald" />
        <KpiCard label="Incidencias generadas" value={4} sub="por parte de usuarios" sparkline={[2,3,4,3,4,4]} color="rose" />
      </div>

      <SCard title="🏢 Ranking de Clientes" subtitle="Por volumen de viajes y facturación" onDownload={() => {}}>
        <ReportTable
          headers={['Cliente', 'Tipo', 'Viajes', 'Frecuencia', 'Facturado', 'Incidencias', 'Servicio principal']}
          rows={empresas.map((e, i) => [
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 w-4">#{i + 1}</span>
              <span className="font-medium text-slate-800">{e.nombre}</span>
            </div>,
            <span key="t" className="text-xs text-slate-500">{e.tipo}</span>,
            <span key="v" className="font-semibold">{e.viajes}</span>,
            <span key="f" className={`px-2 py-0.5 rounded-full text-xs font-semibold ${freqColor[e.frecuencia]}`}>{e.frecuencia}</span>,
            <span key="m" className="font-bold text-emerald-600">${e.facturado.toLocaleString()}</span>,
            e.incidencias > 0
              ? <span key="i" className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">{e.incidencias}</span>
              : <span key="i0" className="text-slate-300 text-xs">0</span>,
            <span key="s" className="text-xs text-slate-600">{e.topServicio}</span>,
          ])}
        />
      </SCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SCard title="📊 Distribución de Facturación por Cliente" >
          <div className="space-y-3">
            {[
              { nombre: 'RentaWheels', pct: 41, color: 'bg-emerald-500' },
              { nombre: 'Grupo Logístico', pct: 28, color: 'bg-blue-500' },
              { nombre: 'AutoNorte', pct: 18, color: 'bg-indigo-500' },
              { nombre: 'Seguros Primero', pct: 12, color: 'bg-purple-500' },
              { nombre: 'Distribuidora Bajío', pct: 1, color: 'bg-slate-300' },
            ].map((c, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">{c.nombre}</span>
                  <span className="text-slate-400">{c.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SCard>

        <SCard title="🔄 Frecuencia de Uso" subtitle="Viajes por cliente en el periodo">
          <BarChart
            data={[
              { label: 'RentaWheels', value: 310 },
              { label: 'GrupoLog.', value: 148 },
              { label: 'AutoNorte', value: 93 },
              { label: 'Seguros', value: 22 },
              { label: 'Bajío', value: 1 },
            ]}
            color="#6366f1"
            height={100}
          />
        </SCard>
      </div>

      <SCard title="🚗 Tipo de Servicio por Cliente" onDownload={() => {}}>
        <ReportTable
          headers={['Cliente', 'Local', 'Foráneo', 'Entrega', 'Largo rec.', 'Urgente', 'Total']}
          rows={[
            ['RentaWheels',      '120 (39%)', '45 (14%)', '98 (32%)', '40 (13%)', '7 (2%)', <span key="t" className="font-bold">310</span>],
            ['Grupo Logístico',  '82 (55%)',  '38 (26%)', '12 (8%)',  '14 (9%)',  '2 (1%)', <span key="t" className="font-bold">148</span>],
            ['AutoNorte',        '55 (59%)',  '20 (22%)', '10 (11%)', '6 (6%)',   '2 (2%)', <span key="t" className="font-bold">93</span>],
            ['Seguros Primero',  '5 (23%)',   '12 (55%)', '2 (9%)',   '3 (14%)',  '0',      <span key="t" className="font-bold">22</span>],
            ['Dist. Bajío',      '0',         '0',        '0',        '1 (100%)', '0',      <span key="t" className="font-bold">1</span>],
          ]}
        />
      </SCard>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ReportesView() {
  const [tab, setTab]         = useState<MainTab>('operativos')
  const [periodo, setPeriodo] = useState<Periodo>('semana')

  const mainTabs: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    { id: 'operativos',   label: 'Operativos',          icon: <TruckIcon className="w-4 h-4" /> },
    { id: 'financieros',  label: 'Financieros',         icon: <BanknotesIcon className="w-4 h-4" /> },
    { id: 'conductores',  label: 'Conductores',         icon: <UserGroupIcon className="w-4 h-4" /> },
    { id: 'usuarios',     label: 'Usuarios / Empresas', icon: <BuildingOfficeIcon className="w-4 h-4" /> },
  ]

  const periodoNeedsSelector = tab === 'operativos' || tab === 'financieros'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con tabs y período */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-1 overflow-x-auto">
            {mainTabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                  tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {periodoNeedsSelector && (
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {([['hoy','Hoy'],['semana','Semana'],['mes','Mes'],['trimestre','Trimestre']] as [Periodo,string][]).map(([v, l]) => (
                  <button key={v} onClick={() => setPeriodo(v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${periodo === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {l}
                  </button>
                ))}
              </div>
            )}
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowDownTrayIcon className="w-4 h-4" />Exportar reporte
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-600">Reportes</span>
            <span className="mx-1.5">›</span>
            <span className="font-medium text-blue-600">{mainTabs.find(t => t.id === tab)?.label}</span>
            {periodoNeedsSelector && <span className="ml-2 text-slate-400">· {periodo === 'hoy' ? 'Hoy' : periodo === 'semana' ? 'Esta semana' : periodo === 'mes' ? 'Este mes' : 'Este trimestre'}</span>}
          </p>
        </div>
      </div>

      {/* Content */}
      {tab === 'operativos'  && <ReporteOperativo  periodo={periodo} />}
      {tab === 'financieros' && <ReporteFinanciero periodo={periodo} />}
      {tab === 'conductores' && <ReporteConductores />}
      {tab === 'usuarios'    && <ReporteUsuarios />}
    </div>
  )
}
