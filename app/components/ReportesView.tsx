'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ArrowDownTrayIcon,
  TruckIcon,
  BanknotesIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'

type MainTab = 'operativos' | 'financieros' | 'conductores' | 'usuarios'
type Periodo = 'hoy' | 'semana' | 'mes' | 'trimestre'

// ─── MINI CHART ───────────────────────────────────────────────────────────────
function BarChart({ data, color = '#3b82f6', height = 80 }: {
  data: { label: string; value: number }[]; color?: string; height?: number
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
  const max = Math.max(...data, 1); const min = Math.min(...data, 0); const range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ')
  return <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function KpiCard({ label, value, sub, trend, trendUp, sparkline, color = 'blue' }: {
  label: string; value: string | number; sub?: string; trend?: string; trendUp?: boolean; sparkline?: number[]; color?: string
}) {
  const colorMap: Record<string, string> = { blue: '#3b82f6', green: '#10b981', purple: '#8b5cf6', amber: '#f59e0b', red: '#ef4444', indigo: '#6366f1', emerald: '#059669', rose: '#f43f5e' }
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex justify-between items-start">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {sparkline && <LineSparkline data={sparkline} color={colorMap[color]} />}
      </div>
      <p className="text-2xl font-bold text-slate-800 mt-2">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      {trend && <p className={`text-xs font-medium mt-2 ${trendUp ? 'text-green-600' : 'text-red-500'}`}>{trendUp ? '↑' : '↓'} {trend}</p>}
    </div>
  )
}

function ReportTable({ headers, rows, colores }: {
  headers: string[]; rows: (string | number | React.ReactNode)[][]; colores?: Record<number, string>
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
          <tr>{headers.map((h, i) => <th key={i} className="px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0
            ? <tr><td colSpan={headers.length} className="text-center py-8 text-slate-400 text-xs italic">Sin datos para este período.</td></tr>
            : rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-slate-50 transition-colors">
                {row.map((cell, ci) => <td key={ci} className={`px-4 py-3 ${colores?.[ci] ?? 'text-slate-700'}`}>{cell}</td>)}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

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
          <button onClick={onDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />CSV
          </button>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function SkeletonCard() {
  return <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-pulse"><div className="h-3 bg-slate-100 rounded w-1/2 mb-3" /><div className="h-7 bg-slate-200 rounded w-1/3" /></div>
}

// ─── SUPABASE HELPER ──────────────────────────────────────────────────────────
async function getSb() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

function periodoFecha(periodo: Periodo): string {
  const now = new Date()
  if (periodo === 'hoy') return new Date(now.setHours(0,0,0,0)).toISOString()
  if (periodo === 'semana') { now.setDate(now.getDate() - 7); return now.toISOString() }
  if (periodo === 'mes') { now.setMonth(now.getMonth() - 1); return now.toISOString() }
  now.setMonth(now.getMonth() - 3); return now.toISOString()
}

// ─── REPORTE OPERATIVO ────────────────────────────────────────────────────────
function ReporteOperativo({ periodo }: { periodo: Periodo }) {
  const [data, setData] = useState<{
    total: number; cancelados: number; porStatus: Record<string,number>
    porTipo: { tipo: string; count: number }[]
    barData: { label: string; value: number }[]
    incidencias: { tipo: string; count: number; resueltas: number }[]
  } | null>(null)

  useEffect(() => {
    const cargar = async () => {
      const sb = await getSb()
      const desde = periodoFecha(periodo)
      const { data: viajes } = await sb.from('viajes')
        .select('status, created_at')
        .gte('created_at', desde)

      if (!viajes) return
      const total = viajes.length
      const cancelados = viajes.filter(v => v.status === 'Cancelado').length

      const porStatus: Record<string,number> = {}
      viajes.forEach(v => { porStatus[v.status] = (porStatus[v.status] ?? 0) + 1 })

      // Agrupar por día/hora para la gráfica
      const grupos: Record<string,number> = {}
      viajes.forEach(v => {
        const d = new Date(v.created_at)
        const key = periodo === 'hoy'
          ? `${d.getHours()}:00`
          : periodo === 'trimestre'
          ? d.toLocaleString('es', { month: 'short' })
          : d.toLocaleString('es', { weekday: 'short' })
        grupos[key] = (grupos[key] ?? 0) + 1
      })
      const barData = Object.entries(grupos).map(([label, value]) => ({ label, value }))

      const { data: incs } = await sb.from('incidencias').select('tipo, estatus').gte('created_at', desde)
      const tiposInc: Record<string,{ count: number; resueltas: number }> = {}
      ;(incs ?? []).forEach(i => {
        if (!tiposInc[i.tipo]) tiposInc[i.tipo] = { count: 0, resueltas: 0 }
        tiposInc[i.tipo].count++
        if (i.estatus === 'Resuelta' || i.estatus === 'Cerrada') tiposInc[i.tipo].resueltas++
      })
      const incidencias = Object.entries(tiposInc).map(([tipo, v]) => ({ tipo, ...v }))

      setData({ total, cancelados, porStatus, porTipo: [], barData: barData.length ? barData : [{ label: 'Sin datos', value: 0 }], incidencias })
    }
    cargar()
  }, [periodo])

  if (!data) return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>

  const tasaCancelacion = data.total ? ((data.cancelados / data.total) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total viajes" value={data.total} sub="en el período" sparkline={[0, data.total * 0.3, data.total * 0.6, data.total * 0.8, data.total]} color="blue" />
        <KpiCard label="Cancelaciones" value={data.cancelados} sub={`${tasaCancelacion}% tasa cancelación`} sparkline={[0, data.cancelados]} color="red" />
        <KpiCard label="Finalizados" value={data.porStatus['Finalizado'] ?? 0} sub="completados exitosamente" sparkline={[0, data.porStatus['Finalizado'] ?? 0]} color="green" />
        <KpiCard label="Incidencias" value={data.incidencias.reduce((s, i) => s + i.count, 0)} sub="registradas en el período" sparkline={[0, data.incidencias.length]} color="amber" />
      </div>

      <SCard title="📊 Viajes por Período" subtitle="Distribución temporal de traslados" onDownload={() => {}}>
        <BarChart data={data.barData} color="#3b82f6" height={120} />
      </SCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SCard title="🚗 Viajes por Estatus" onDownload={() => {}}>
          <div className="space-y-3">
            {Object.entries(data.porStatus).map(([status, count], i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">{status}</span>
                  <span className="text-slate-400">{count} ({data.total ? ((count/data.total)*100).toFixed(0) : 0}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${data.total ? (count/data.total)*100 : 0}%` }} />
                </div>
              </div>
            ))}
            {Object.keys(data.porStatus).length === 0 && <p className="text-xs text-slate-400 italic">Sin viajes en este período.</p>}
          </div>
        </SCard>

        <SCard title="⚠️ Incidencias por Tipo" subtitle="Registradas en el período" onDownload={() => {}}>
          <ReportTable
            headers={['Tipo', 'Total', 'Resueltas', 'Abiertas']}
            rows={data.incidencias.map(i => [i.tipo, i.count, i.resueltas, i.count - i.resueltas])}
          />
        </SCard>
      </div>
    </div>
  )
}

// ─── REPORTE FINANCIERO ───────────────────────────────────────────────────────
function ReporteFinanciero({ periodo }: { periodo: Periodo }) {
  const [data, setData] = useState<{
    totalIng: number; totalPagado: number; totalGastos: number
    pendienteCobro: number; pendienteConductores: number
    viajes: { folio: string; empresa: string; tarifa: number; status: string }[]
    conductores: { nombre: string; deposito: number; viajes: number; status: string }[]
    barData: { label: string; value: number }[]
  } | null>(null)

  useEffect(() => {
    const cargar = async () => {
      const sb = await getSb()
      const desde = periodoFecha(periodo)

      const [pvRes, pcRes, gsRes] = await Promise.all([
        sb.from('pagos_usuarios').select('tarifa_cobrada, estatus, created_at, viajes(folio), empresas(nombre_comercial)').gte('created_at', desde),
        sb.from('pagos_conductores').select('deposito_esperado, estatus, viajes_revisados, conductores(nombre,apellido)').gte('created_at', desde),
        sb.from('gastos').select('monto, estatus').gte('created_at', desde),
      ])

      const pu = pvRes.data ?? []
      const pc = pcRes.data ?? []
      const gs = gsRes.data ?? []

      const totalIng = pu.filter(p => p.estatus === 'Pagado').reduce((s: number, p: Record<string,unknown>) => s + Number(p.tarifa_cobrada ?? 0), 0)
      const pendienteCobro = pu.filter(p => ['Pendiente','Aprobado','En revisión'].includes(p.estatus)).reduce((s: number, p: Record<string,unknown>) => s + Number(p.tarifa_cobrada ?? 0), 0)
      const totalPagado = pc.filter(p => p.estatus === 'Pagado').reduce((s: number, p: Record<string,unknown>) => s + Number(p.deposito_esperado ?? 0), 0)
      const pendienteConductores = pc.filter(p => ['Pendiente','Aprobado'].includes(p.estatus)).reduce((s: number, p: Record<string,unknown>) => s + Number(p.deposito_esperado ?? 0), 0)
      const totalGastos = gs.filter(g => g.estatus === 'Aprobado').reduce((s: number, g: Record<string,unknown>) => s + Number(g.monto ?? 0), 0)

      // Agrupar ingresos para gráfica
      const grupos: Record<string,number> = {}
      pu.forEach((p: Record<string,unknown>) => {
        const d = new Date(p.created_at as string)
        const key = periodo === 'hoy' ? `${d.getHours()}:00` : periodo === 'trimestre' ? d.toLocaleString('es', { month: 'short' }) : d.toLocaleString('es', { weekday: 'short' })
        grupos[key] = (grupos[key] ?? 0) + Number(p.tarifa_cobrada ?? 0)
      })
      const barData = Object.entries(grupos).map(([label, value]) => ({ label, value }))

      const viajes = pu.filter(p => ['Pendiente','En revisión','Aprobado'].includes(p.estatus)).slice(0,5).map((p: Record<string,unknown>) => {
        const v = p.viajes as Record<string,string>|null
        const e = p.empresas as Record<string,string>|null
        return { folio: v?.folio ?? '—', empresa: e?.nombre_comercial ?? '—', tarifa: Number(p.tarifa_cobrada ?? 0), status: String(p.estatus) }
      })

      const conductoresData = pc.filter(p => ['Pendiente','Aprobado'].includes(p.estatus)).slice(0,5).map((p: Record<string,unknown>) => {
        const c = p.conductores as Record<string,string>|null
        return { nombre: c ? `${c.nombre} ${c.apellido}` : '—', deposito: Number(p.deposito_esperado ?? 0), viajes: Number(p.viajes_revisados ?? 0), status: String(p.estatus) }
      })

      setData({ totalIng, totalPagado, totalGastos, pendienteCobro, pendienteConductores, viajes, conductores: conductoresData, barData: barData.length ? barData : [{ label: 'Sin datos', value: 0 }] })
    }
    cargar()
  }, [periodo])

  if (!data) return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}</div>

  const margen = data.totalIng - data.totalPagado - data.totalGastos
  const margenPct = data.totalIng ? ((margen / data.totalIng) * 100).toFixed(1) : '0'

  const estatusBadge = (s: string) => {
    const map: Record<string,string> = { Pendiente: 'bg-amber-100 text-amber-700', 'En revisión': 'bg-purple-100 text-purple-700', Aprobado: 'bg-blue-100 text-blue-700', Pagado: 'bg-green-100 text-green-700', Rechazado: 'bg-red-100 text-red-700' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s] ?? 'bg-slate-100 text-slate-600'}`}>{s}</span>
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Ingresos cobrados" value={`$${data.totalIng.toLocaleString()}`} sub="pagado por clientes" sparkline={[0, data.totalIng*0.4, data.totalIng*0.7, data.totalIng]} color="emerald" />
        <KpiCard label="Pendiente cobro" value={`$${data.pendienteCobro.toLocaleString()}`} sub="por confirmar" sparkline={[0, data.pendienteCobro]} color="rose" />
        <KpiCard label="Pago conductores" value={`$${data.totalPagado.toLocaleString()}`} sub="pagado" sparkline={[0, data.totalPagado]} color="blue" />
        <KpiCard label="Pendiente conductores" value={`$${data.pendienteConductores.toLocaleString()}`} sub="por pagar" sparkline={[0, data.pendienteConductores]} color="indigo" />
        <KpiCard label="Gastos autorizados" value={`$${data.totalGastos.toLocaleString()}`} sub="casetas, combustible, etc." sparkline={[0, data.totalGastos]} color="amber" />
        <KpiCard label="Margen estimado" value={`$${margen.toLocaleString()}`} sub={`${margenPct}% del ingreso`} sparkline={[0, margen]} color="purple" />
      </div>

      <SCard title="💰 Ingresos por Período" subtitle="Facturación total al cliente" onDownload={() => {}}>
        <BarChart data={data.barData} color="#10b981" height={120} />
      </SCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SCard title="📋 Pagos Pendientes de Cobro" onDownload={() => {}}>
          <ReportTable
            headers={['Viaje', 'Cliente', 'Monto', 'Estatus']}
            rows={data.viajes.map(v => [v.folio, v.empresa, `$${v.tarifa.toLocaleString()}`, estatusBadge(v.status)])}
          />
        </SCard>
        <SCard title="💸 Pagos Pendientes a Conductores" onDownload={() => {}}>
          <ReportTable
            headers={['Conductor', 'Viajes', 'Depósito', 'Estatus']}
            rows={data.conductores.map(c => [c.nombre, c.viajes, `$${c.deposito.toLocaleString()}`, estatusBadge(c.status)])}
          />
        </SCard>
      </div>
    </div>
  )
}

// ─── REPORTE CONDUCTORES ──────────────────────────────────────────────────────
function ReporteConductores() {
  const [conductores, setConductores] = useState<{
    id: string; nombre: string; viajes: number; calif: number
    incidencias: number; ganancias: number; estatus: string; docsAlert: number
  }[]>([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const { data: conds } = await sb.from('conductores')
      .select('id, nombre, apellido, calificacion, viajes_realizados, ganancias_total, certificacion, estatus')
      .order('ganancias_total', { ascending: false })

    const { data: incs } = await sb.from('incidencias')
      .select('conductor_id, estatus')

    const { data: docs } = await sb.from('documentos')
      .select('entidad_id, estatus')
      .eq('entidad_tipo', 'Conductor')
      .in('estatus', ['Vencido', 'Pendiente de carga', 'Pendiente de actualización'])

    if (conds) {
      setConductores(conds.map((c: Record<string,unknown>) => ({
        id: String(c.id),
        nombre: `${c.nombre} ${c.apellido}`,
        viajes: Number(c.viajes_realizados ?? 0),
        calif: Number(c.calificacion ?? 0),
        incidencias: (incs ?? []).filter(i => i.conductor_id === c.id).length,
        ganancias: Number(c.ganancias_total ?? 0),
        estatus: String(c.certificacion ?? 'Pendiente'),
        docsAlert: (docs ?? []).filter(d => d.entidad_id === c.id).length,
      })))
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function Stars({ v }: { v: number }) {
    if (!v) return <span className="text-xs text-slate-300">—</span>
    return <span className="text-xs font-semibold text-amber-500">{'★'.repeat(Math.round(v))} {v.toFixed(1)}</span>
  }

  const maxGanancias = Math.max(...conductores.map(c => c.ganancias), 1)
  const activos = conductores.filter(c => c.estatus === 'Activo').length
  const califProm = conductores.filter(c => c.calif > 0).reduce((s, c) => s + c.calif, 0) / (conductores.filter(c => c.calif > 0).length || 1)
  const totalDocsAlert = conductores.reduce((s, c) => s + c.docsAlert, 0)

  if (cargando) return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Conductores activos" value={activos} sub={`de ${conductores.length} registrados`} sparkline={[0, activos]} color="green" />
        <KpiCard label="Calificación promedio" value={`${califProm.toFixed(1)} ★`} sub="promedio general" sparkline={[0, califProm]} color="amber" />
        <KpiCard label="Docs. con alerta" value={totalDocsAlert} sub="vencidos o pendientes" sparkline={[0, totalDocsAlert]} color="red" />
        <KpiCard label="Total conductores" value={conductores.length} sub="registrados en sistema" sparkline={[0, conductores.length]} color="blue" />
      </div>

      <SCard title="👤 Desempeño por Conductor" subtitle="Comparativo general" onDownload={() => {}}>
        <ReportTable
          headers={['Conductor', 'Viajes', 'Calificación', 'Incidencias', 'Ganancias', 'Docs', 'Estatus']}
          rows={conductores.map(c => [
            <span key="n" className="font-medium text-slate-800">{c.nombre}</span>,
            <span key="v" className="font-semibold">{c.viajes}</span>,
            <Stars key="s" v={c.calif} />,
            c.incidencias > 0
              ? <span key="i" className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">{c.incidencias}</span>
              : <span key="i0" className="text-slate-300 text-xs">0</span>,
            `$${c.ganancias.toLocaleString()}`,
            c.docsAlert > 0
              ? <span key="d" className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">{c.docsAlert} alertas</span>
              : <span key="d0" className="text-green-600 text-xs font-medium">✓ OK</span>,
            <span key="es" className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.estatus === 'Activo' ? 'bg-green-100 text-green-700' : c.estatus === 'Suspendido' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{c.estatus}</span>,
          ])}
        />
      </SCard>

      <SCard title="📊 Ganancias por Conductor" subtitle="Acumulado histórico">
        <div className="space-y-3">
          {conductores.map((c, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">{c.nombre}</span>
                <span className="text-slate-500 font-semibold">${c.ganancias.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${(c.ganancias / maxGanancias) * 100}%` }} />
              </div>
            </div>
          ))}
          {conductores.length === 0 && <p className="text-xs text-slate-400 italic">Sin conductores registrados.</p>}
        </div>
      </SCard>
    </div>
  )
}

// ─── REPORTE USUARIOS ─────────────────────────────────────────────────────────
function ReporteUsuarios() {
  const [empresas, setEmpresas] = useState<{
    id: string; nombre: string; tipo: string; viajes: number; facturado: number; incidencias: number
  }[]>([])
  const [usuarios, setUsuarios] = useState<{ total: number; activos: number }>({ total: 0, activos: 0 })
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const [empRes, vRes, puRes, incRes, usrRes] = await Promise.all([
      sb.from('empresas').select('id, nombre_comercial, tipo, estatus'),
      sb.from('viajes').select('empresa_id'),
      sb.from('pagos_usuarios').select('empresa_id, tarifa_cobrada, estatus'),
      sb.from('incidencias').select('usuario_id'),
      sb.from('usuarios').select('id, estatus'),
    ])

    const emps = empRes.data ?? []
    const viajes = vRes.data ?? []
    const pagos = puRes.data ?? []
    const incs = incRes.data ?? []
    const usrs = usrRes.data ?? []

    setUsuarios({ total: usrs.length, activos: usrs.filter((u: Record<string,unknown>) => u.estatus === 'Activo').length })

    setEmpresas(emps.map((e: Record<string,unknown>) => ({
      id: String(e.id),
      nombre: String(e.nombre_comercial ?? ''),
      tipo: String(e.tipo ?? ''),
      viajes: viajes.filter(v => v.empresa_id === e.id).length,
      facturado: pagos.filter(p => p.empresa_id === e.id && p.estatus === 'Pagado').reduce((s: number, p: Record<string,unknown>) => s + Number(p.tarifa_cobrada ?? 0), 0),
      incidencias: incs.filter(i => i.usuario_id === e.id).length,
    })).sort((a, b) => b.viajes - a.viajes))

    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const totalViajes = empresas.reduce((s, e) => s + e.viajes, 0)
  const totalFact = empresas.reduce((s, e) => s + e.facturado, 0)
  const maxFact = Math.max(...empresas.map(e => e.facturado), 1)

  if (cargando) return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Empresas registradas" value={empresas.length} sub="cuentas corporativas" sparkline={[0, empresas.length]} color="blue" />
        <KpiCard label="Usuarios registrados" value={usuarios.total} sub={`${usuarios.activos} activos`} sparkline={[0, usuarios.total]} color="indigo" />
        <KpiCard label="Total viajes" value={totalViajes} sub="de todas las cuentas" sparkline={[0, totalViajes]} color="emerald" />
        <KpiCard label="Total facturado" value={`$${totalFact.toLocaleString()}`} sub="ingresos cobrados" sparkline={[0, totalFact]} color="purple" />
      </div>

      <SCard title="🏢 Ranking de Empresas" subtitle="Por volumen de viajes y facturación" onDownload={() => {}}>
        <ReportTable
          headers={['#', 'Empresa', 'Tipo', 'Viajes', 'Facturado', 'Incidencias']}
          rows={empresas.map((e, i) => [
            <span key="n" className="text-xs font-bold text-slate-400">#{i+1}</span>,
            <span key="nm" className="font-medium text-slate-800">{e.nombre}</span>,
            <span key="t" className="text-xs text-slate-500">{e.tipo}</span>,
            <span key="v" className="font-semibold">{e.viajes}</span>,
            <span key="f" className="font-bold text-emerald-600">${e.facturado.toLocaleString()}</span>,
            e.incidencias > 0
              ? <span key="i" className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">{e.incidencias}</span>
              : <span key="i0" className="text-slate-300 text-xs">0</span>,
          ])}
        />
      </SCard>

      <SCard title="📊 Distribución de Facturación" subtitle="Por empresa">
        <div className="space-y-3">
          {empresas.filter(e => e.facturado > 0).map((e, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium truncate pr-2">{e.nombre}</span>
                <span className="text-slate-400 flex-shrink-0">${e.facturado.toLocaleString()} ({totalFact ? ((e.facturado/totalFact)*100).toFixed(0) : 0}%)</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(e.facturado / maxFact) * 100}%` }} />
              </div>
            </div>
          ))}
          {empresas.filter(e => e.facturado > 0).length === 0 && <p className="text-xs text-slate-400 italic">Sin facturación registrada.</p>}
        </div>
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-1 overflow-x-auto">
            {mainTabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
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
              <ArrowDownTrayIcon className="w-4 h-4" />Exportar
            </button>
          </div>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-600">Reportes</span>
            <span className="mx-1.5">›</span>
            <span className="font-medium text-blue-600">{mainTabs.find(t => t.id === tab)?.label}</span>
            {periodoNeedsSelector && <span className="ml-2 text-slate-400">· {periodo === 'hoy' ? 'Hoy' : periodo === 'semana' ? 'Esta semana' : periodo === 'mes' ? 'Este mes' : 'Este trimestre'}</span>}
          </p>
        </div>
      </div>

      {tab === 'operativos'  && <ReporteOperativo  periodo={periodo} />}
      {tab === 'financieros' && <ReporteFinanciero periodo={periodo} />}
      {tab === 'conductores' && <ReporteConductores />}
      {tab === 'usuarios'    && <ReporteUsuarios />}
    </div>
  )
}