'use client'

import { useState, useEffect, useCallback } from 'react'
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
  ShieldCheckIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { getSupabaseBrowserClient } from '@/lib/supabase'

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
  'En viaje':      'bg-[#E8EFFF] text-rr-trace',
}

const dispDot: Record<EstatusDisponibilidad, string> = {
  'Disponible':    'bg-green-500',
  'No disponible': 'bg-slate-400',
  'En viaje':      'bg-rr-trace',
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
  'En revisión':'bg-[#E8EFFF] text-rr-traceDeep',
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
  const [notas, setNotas] = useState<NotaInterna[]>([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [docs, setDocs] = useState<Documento[]>([])
  const [viajes, setViajes] = useState<ViajeResumen[]>([])
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [ganancias, setGanancias] = useState<Ganancia[]>([])
  const [viajesRealizados, setViajesRealizados] = useState(0)
  const [gananciasTotal, setGananciasTotal] = useState(0)
  const [cargandoRelacionados, setCargandoRelacionados] = useState(true)
  const color = avatarColors[idx % avatarColors.length]
  const nombreCompleto = `${conductor.nombre} ${conductor.apellido}`.trim()

  useEffect(() => {
    const cargarRelacionados = async () => {
      const sb = getSupabaseBrowserClient()
      const [viajesRes, incRes, docsRes, pagosRes, notasRes] = await Promise.all([
        sb.from('viajes').select('id, folio, fecha_programada, origen_calle, destino_calle, tarifa_cliente, status').eq('conductor_id', conductor.id).order('created_at', { ascending: false }),
        sb.from('incidencias').select('id, tipo, estatus, created_at').eq('conductor_id', conductor.id).order('created_at', { ascending: false }),
        sb.from('documentos').select('tipo_doc, folio, fecha_vencimiento, estatus').eq('entidad_tipo', 'Conductor').eq('entidad_id', conductor.id),
        sb.from('pagos_conductores').select('periodo, viajes_revisados, ganancias, estatus').eq('conductor_id', conductor.id).order('created_at', { ascending: false }),
        sb.from('notas_internas').select('id, texto, autor_nombre, created_at').eq('entidad_tipo', 'conductor').eq('entidad_id', conductor.id).order('created_at', { ascending: false }),
      ])

      if (viajesRes.data) {
        setViajes(viajesRes.data.map((v: Record<string, unknown>) => ({
          id: String(v.folio ?? String(v.id).slice(0,8)),
          fecha: String(v.fecha_programada ?? '—'),
          origen: String(v.origen_calle ?? '—'),
          destino: String(v.destino_calle ?? '—'),
          tarifa: Number(v.tarifa_cliente ?? 0),
          estatus: String(v.status ?? '—'),
        })))
        setViajesRealizados(viajesRes.data.filter((v: Record<string, unknown>) => v.status === 'Finalizado').length)
      }
      if (incRes.data) {
        setIncidencias(incRes.data.map((i: Record<string, unknown>) => ({
          id: String(i.id).slice(0,8).toUpperCase(),
          tipo: String(i.tipo ?? '—'),
          fecha: String((i.created_at as string)?.slice(0,10) ?? '—'),
          estatus: String(i.estatus ?? '—'),
        })))
      }
      if (docsRes.data) {
        setDocs(docsRes.data.map((d: Record<string, unknown>) => ({
          tipo: String(d.tipo_doc ?? '—'),
          numero: String(d.folio ?? '—'),
          vencimiento: String(d.fecha_vencimiento ?? '—'),
          estado: (d.estatus as Documento['estado']) ?? 'Pendiente',
        })))
      }
      if (pagosRes.data) {
        setGanancias(pagosRes.data.map((g: Record<string, unknown>) => ({
          periodo: String(g.periodo ?? '—'),
          viajes: Number(g.viajes_revisados ?? 0),
          monto: Number(g.ganancias ?? 0),
          estatus: String(g.estatus ?? '—'),
        })))
        setGananciasTotal(pagosRes.data.reduce((s: number, g: Record<string, unknown>) => s + Number(g.ganancias ?? 0), 0))
      }
      if (notasRes.data) {
        setNotas(notasRes.data.map((n: Record<string, unknown>) => ({
          autor: String(n.autor_nombre ?? 'Admin'),
          texto: String(n.texto ?? ''),
          hora: String((n.created_at as string)?.slice(0,16).replace('T',' ') ?? ''),
        })))
      }
      setCargandoRelacionados(false)
    }
    cargarRelacionados()
  }, [conductor.id, nombreCompleto])

  const cambiarCert = async (nuevo: EstatusCertificacion) => {
    const sb = getSupabaseBrowserClient()
    await sb.from('conductores').update({ certificacion: nuevo }).eq('id', conductor.id)
    setCert(nuevo)
    onUpdate({ ...conductor, certificacion: nuevo })
  }

  const cambiarDisp = async (nuevo: EstatusDisponibilidad) => {
    const sb = getSupabaseBrowserClient()
    await sb.from('conductores').update({ disponibilidad: nuevo }).eq('id', conductor.id)
    setDisp(nuevo)
    onUpdate({ ...conductor, disponibilidad: nuevo })
  }

  const addNota = async () => {
    if (!nuevaNota.trim()) return
    const sb = getSupabaseBrowserClient()
    const texto = nuevaNota.trim()
    await sb.from('notas_internas').insert({
      entidad_tipo: 'conductor', entidad_id: conductor.id, texto, autor_nombre: 'Admin',
    })
    setNotas(n => [{ autor: 'Admin', texto, hora: 'Ahora' }, ...n])
    setNuevaNota('')
  }

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'perfil',      label: 'Perfil' },
    { id: 'documentos',  label: `Documentos (${docs.length})` },
    { id: 'viajes',      label: `Viajes (${viajes.length})` },
    { id: 'ganancias',   label: `Ganancias (${ganancias.length})` },
    { id: 'incidencias', label: `Incidencias (${incidencias.length})` },
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
                <button onClick={() => cambiarCert('Activo')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <CheckCircleIcon className="w-3.5 h-3.5" />Validar
                </button>
              )}
              {cert === 'Activo' && (
                <button onClick={() => cambiarCert('Suspendido')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />Suspender
                </button>
              )}
              {(cert === 'Suspendido' || cert === 'Bloqueado') && (
                <button onClick={() => cambiarCert('Activo')}
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
                  tab === t.id ? 'border-rr-route text-rr-trace' : 'border-transparent text-slate-500 hover:text-slate-700'
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
                  { label: 'Viajes realizados', value: viajesRealizados, color: 'text-rr-trace' },
                  { label: 'Ganancias totales', value: `$${gananciasTotal.toLocaleString()}`, color: 'text-emerald-600' },
                  { label: 'Incidencias', value: incidencias.length, color: incidencias.length > 0 ? 'text-red-600' : 'text-slate-500' },
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
                    <select value={disp} onChange={e => cambiarDisp(e.target.value as EstatusDisponibilidad)}
                      className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rr-route bg-white">
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
                <p className="text-xs text-slate-400">Para aprobar o rechazar, usa la sección Documentos del menú principal</p>
              </div>
              {cargandoRelacionados ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}</div>
              ) : docs.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-400 italic bg-white rounded-xl border border-slate-200">Sin documentos registrados para este conductor.</p>
              ) : docs.map((doc, i) => (
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
              {cargandoRelacionados
                ? <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-lg" />)}</div>
                : viajes.length === 0
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
                    {viajes.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-rr-trace">{v.id}</td>
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
                  <p className="text-2xl font-bold text-emerald-600">${gananciasTotal.toLocaleString()} MXN</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase">Viajes totales</p>
                  <p className="text-2xl font-bold text-slate-800">{viajesRealizados}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {cargandoRelacionados
                  ? <div className="p-4 space-y-2">{[1,2].map(i => <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-lg" />)}</div>
                  : ganancias.length === 0
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
                      {ganancias.map((g, i) => (
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
              {cargandoRelacionados
                ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}</div>
                : incidencias.length === 0
                ? <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                    <ShieldCheckIcon className="w-10 h-10 text-green-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 italic">Sin incidencias registradas.</p>
                  </div>
                : incidencias.map((inc, i) => (
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
                      ['Nueva', 'Requiere información', 'Escalada'].includes(inc.estatus) ? 'bg-red-100 text-red-700' :
                      ['En revisión', 'En seguimiento'].includes(inc.estatus) ? 'bg-[#E8EFFF] text-rr-traceDeep' :
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
              {cargandoRelacionados
                ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />)}</div>
                : notas.length === 0 && <p className="text-center text-sm text-slate-400 italic py-6">Sin notas aún.</p>}
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
    { label: 'Ver documentos',               color: 'slate',  tab: 'documentos' },
    { label: 'Ver historial de viajes',      color: 'slate',  tab: 'viajes' },
    { label: 'Ver ganancias',                color: 'emerald',tab: 'ganancias' },
    { label: 'Ver incidencias',              color: 'amber',  tab: 'incidencias' },
    { label: 'Agregar nota interna',         color: 'amber',  tab: 'notas' },
    { label: conductor.certificacion === 'Suspendido' ? 'Reactivar conductor' : 'Suspender conductor',
      color: conductor.certificacion === 'Suspendido' ? 'green' : 'red', tab: 'perfil' },
  ]
  const cls: Record<string, string> = {
    blue:   'text-rr-trace hover:bg-[#E8EFFF]',
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
function NuevoConductorForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    nombre: '', apellido: '', curp: '', telefono: '', email: '',
    calle: '', numero: '', colonia: '', cp: '', municipio: '', estado: '',
    banco: '', clabe: '', titular: '',
  })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')

  const set = (k: keyof typeof form, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.nombre)    e.nombre    = 'Requerido'
    if (!form.apellido)  e.apellido  = 'Requerido'
    if (!form.telefono)  e.telefono  = 'Requerido'
    if (!form.email)     e.email     = 'Requerido'
    if (!form.municipio) e.municipio = 'Requerido'
    if (!form.estado)    e.estado    = 'Requerido'
    if (!form.calle)     e.calle     = 'Requerido'
    if (!form.cp)        e.cp        = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setGuardando(true)
    setErrorGuardar('')
    try {
      const sb = getSupabaseBrowserClient()
      const { error } = await sb.from('conductores').insert({
        nombre:            form.nombre.toUpperCase(),
        apellido:          form.apellido.toUpperCase(),
        curp:              form.curp.toUpperCase() || null,
        telefono:          form.telefono,
        email:             form.email.toLowerCase(),
        domicilio_calle:   form.calle.toUpperCase(),
        domicilio_numero:  form.numero.toUpperCase() || null,
        domicilio_colonia: form.colonia.toUpperCase() || null,
        domicilio_cp:      form.cp,
        municipio:         form.municipio.toUpperCase(),
        estado_geo:        form.estado.toUpperCase(),
        cuenta_banco:      form.banco.toUpperCase() || null,
        cuenta_clabe:      form.clabe || null,
        cuenta_titular:    form.titular.toUpperCase() || null,
        disponibilidad: 'No disponible',
        certificacion:  'Pendiente de validación',
        calificacion:   0,
      })
      if (error) throw error
      onSave()
      onClose()
    } catch (e) {
      console.error(e)
      setErrorGuardar('Error al guardar. Verifica los datos e intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const I = (k: keyof typeof form) => `w-full border ${errors[k] ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rr-route`
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
              <div><L c="Nombre(s)" req /><input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value.toUpperCase())} placeholder="NOMBRE(S)" className={I('nombre')} /><E k="nombre" /></div>
              <div><L c="Apellido(s)" req /><input type="text" value={form.apellido} onChange={e => set('apellido', e.target.value.toUpperCase())} placeholder="APELLIDO(S)" className={I('apellido')} /><E k="apellido" /></div>
              <div><L c="CURP" /><input type="text" value={form.curp} onChange={e => set('curp', e.target.value.toUpperCase())} placeholder="18 CARACTERES" className={I('curp')} /></div>
              <div><L c="Teléfono" req /><input type="tel" value={form.telefono} maxLength={12} onChange={e => { const d = e.target.value.replace(/\D/g,'').slice(0,10); set('telefono', d.length<=3?d:d.length<=6?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`) }} placeholder="55-0000-0000" className={I('telefono')} /><E k="telefono" /></div>
              <div className="col-span-2"><L c="Correo electrónico" req /><input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="correo@ejemplo.com" className={I('email')} /><E k="email" /></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">🏠 Domicilio</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2"><L c="Calle" req /><input type="text" value={form.calle} onChange={e => set('calle', e.target.value.toUpperCase())} placeholder="NOMBRE DE LA CALLE" className={I('calle')} /><E k="calle" /></div>
              <div><L c="Número" /><input type="text" value={form.numero} onChange={e => set('numero', e.target.value.toUpperCase())} placeholder="EXT/INT" className={I('numero')} /></div>
              <div><L c="Colonia" /><input type="text" value={form.colonia} onChange={e => set('colonia', e.target.value.toUpperCase())} placeholder="COLONIA" className={I('colonia')} /></div>
              <div><L c="Código Postal" req /><input type="text" value={form.cp} maxLength={5} onChange={e => set('cp', e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="00000" className={I('cp')} /><E k="cp" /></div>
              <div><L c="Municipio" req /><input type="text" value={form.municipio} onChange={e => set('municipio', e.target.value.toUpperCase())} placeholder="MUNICIPIO O ALCALDÍA" className={I('municipio')} /><E k="municipio" /></div>
              <div><L c="Estado" req /><input type="text" value={form.estado} onChange={e => set('estado', e.target.value.toUpperCase())} placeholder="ESTADO" className={I('estado')} /><E k="estado" /></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">🏦 Cuenta bancaria</p>
            <div className="grid grid-cols-2 gap-4">
              <div><L c="Banco" /><input type="text" value={form.banco} onChange={e => set('banco', e.target.value.toUpperCase())} placeholder="BBVA, Santander..." className={I('banco')} /></div>
              <div><L c="Titular de la cuenta" /><input type="text" value={form.titular} onChange={e => set('titular', e.target.value.toUpperCase())} placeholder="Nombre completo" className={I('titular')} /></div>
              <div className="col-span-2"><L c="CLABE interbancaria" /><input type="text" value={form.clabe} onChange={e => set('clabe', e.target.value)} placeholder="18 dígitos" className={I('clabe')} /></div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            ⚠️ El conductor quedará en estado <strong>Pendiente de validación</strong>. Para activarlo deberás aprobar sus documentos desde su perfil.
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <div className="flex flex-col items-end gap-1">
            {errorGuardar && <p className="text-xs text-red-500">{errorGuardar}</p>}
            <button onClick={handleSubmit} disabled={guardando} className="bg-rr-route hover:bg-rr-routeDark disabled:opacity-60 text-rr-asphalt px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <CheckCircleIcon className="w-4 h-4" />
              {guardando ? 'Guardando...' : 'Registrar conductor'}
            </button>
          </div>
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
  const [conductores, setConductores] = useState<Conductor[]>([])
  const [cargando, setCargando] = useState(true)

  const cargarConductores = useCallback(async () => {
    const sb = getSupabaseBrowserClient()
    const { data, error } = await sb
      .from('conductores')
      .select(`
        id, nombre, apellido, curp, telefono, email,
        municipio, estado_geo,
        disponibilidad, certificacion, calificacion,
        cuenta_banco, cuenta_clabe, cuenta_titular,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      // Mapear DB → interface Conductor
      setConductores(data.map((c: Record<string, unknown>) => ({
        id: String(c.id ?? ''),
        nombre: String(c.nombre ?? ''),
        apellido: String(c.apellido ?? ''),
        curp: String(c.curp ?? ''),
        telefono: String(c.telefono ?? ''),
        email: String(c.email ?? ''),
        municipio: String(c.municipio ?? ''),
        estado: String(c.estado_geo ?? ''),
        foto: '',
        disponibilidad: (c.disponibilidad as EstatusDisponibilidad) ?? 'No disponible',
        certificacion: (c.certificacion as EstatusCertificacion) ?? 'Pendiente de validación',
        calificacion: Number(c.calificacion ?? 0),
        viajesRealizados: 0,
        gananciasTotal: 0,
        cuentaBanco: String(c.cuenta_banco ?? ''),
        cuentaClabe: String(c.cuenta_clabe ?? ''),
        cuentaTitular: String(c.cuenta_titular ?? ''),
        documentos: [],
        viajes: [],
        incidencias: [],
        ganancias: [],
        notas: [],
      })))
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    cargarConductores()
  }, [cargarConductores])

  const filtered = conductores.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    const matchCert = certFiltro === 'Todos' || c.certificacion === certFiltro
    const matchDisp = dispFiltro === 'Todos' || c.disponibilidad === dispFiltro
    return matchSearch && matchCert && matchDisp
  })

  const counts = {
    total:       conductores.length,
    activos:     conductores.filter(c => c.certificacion === 'Activo').length,
    disponibles: conductores.filter(c => c.disponibilidad === 'Disponible').length,
    pendientes:  conductores.filter(c => c.certificacion === 'Pendiente de validación').length,
    suspendidos: conductores.filter(c => c.certificacion === 'Suspendido').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showForm && <NuevoConductorForm onClose={() => setShowForm(false)} onSave={cargarConductores} />}
      {detailConductor && (
        <ConductorDetalle
          conductor={detailConductor.conductor}
          idx={detailConductor.idx}
          onClose={() => setDetailConductor(null)}
          onUpdate={() => cargarConductores()}
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
          { label: 'Disponibles ahora', value: counts.disponibles, color: 'text-rr-trace' },
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
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rr-route w-52" />
              </div>
              <button onClick={() => setShowForm(true)} className="bg-rr-route hover:bg-rr-routeDark text-rr-asphalt px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />Nuevo
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-8 space-y-3">
              {[1,2,3,4].map(n => (
                <div key={n} className="flex gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
                const globalIdx = i
                const color = avatarColors[i % avatarColors.length]
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer"
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
          )}
        </div>
      </div>
    </div>
  )
}