'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  IdentificationIcon,
  TruckIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClockIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type EstatusDoc = 'Pendiente' | 'En revisión' | 'Vigente' | 'Rechazado' | 'Vencido' | 'Suspendido'
type TipoDoc = 'Licencia' | 'INE / Pasaporte' | 'Comprobante domicilio' | 'Alta SAT / CIF' | 'Tarjeta circulación' | 'Verificación' | 'Seguro vehicular' | 'Contrato' | 'Otro'
type TipoEntidad = 'Conductor' | 'Usuario' | 'Empresa' | 'Vehículo'

interface Documento {
  _id: string
  id: string
  tipo: TipoDoc
  entidad: TipoEntidad
  entidadNombre: string
  folio: string
  vigencia: string
  estatus: EstatusDoc
  fechaCarga: string
  revisadoPor: string
  notas: string
  url?: string
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const estatusStyle: Record<EstatusDoc, string> = {
  Pendiente:     'bg-slate-100 text-slate-500',
  'En revisión': 'bg-purple-100 text-purple-700',
  Vigente:       'bg-green-100 text-green-700',
  Rechazado:     'bg-red-100 text-red-700',
  Vencido:       'bg-orange-100 text-orange-700',
  Suspendido:    'bg-amber-100 text-amber-700',
}
const estatusDot: Record<EstatusDoc, string> = {
  Pendiente:     'bg-slate-400',
  'En revisión': 'bg-purple-500',
  Vigente:       'bg-green-500',
  Rechazado:     'bg-red-500',
  Vencido:       'bg-orange-500',
  Suspendido:    'bg-amber-500',
}
const TODOS_ESTATUS: EstatusDoc[] = ['Pendiente','En revisión','Vigente','Rechazado','Vencido','Suspendido']
const TIPOS_DOC: TipoDoc[] = ['Licencia','INE / Pasaporte','Comprobante domicilio','Alta SAT / CIF','Tarjeta circulación','Verificación','Seguro vehicular','Contrato','Otro']
const TIPOS_ENTIDAD: TipoEntidad[] = ['Conductor','Usuario','Empresa','Vehículo']

const entidadIcon: Record<TipoEntidad, React.ReactNode> = {
  Conductor: <TruckIcon className="w-3.5 h-3.5" />,
  Usuario:   <IdentificationIcon className="w-3.5 h-3.5" />,
  Empresa:   <BuildingOfficeIcon className="w-3.5 h-3.5" />,
  Vehículo:  <TruckIcon className="w-3.5 h-3.5" />,
}

function EBadge({ e }: { e: EstatusDoc }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${estatusStyle[e]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${estatusDot[e]}`} />
      {e}
    </span>
  )
}

function EstatusSelector({ value, onChange }: { value: EstatusDoc; onChange: (e: EstatusDoc) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TODOS_ESTATUS.map(e => (
        <button key={e} onClick={() => onChange(e)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            value === e ? `${estatusStyle[e]} border-current shadow-sm` : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${estatusDot[e]}`} />
          {e}
        </button>
      ))}
    </div>
  )
}

async function getSB() {
  return getSupabaseBrowserClient()
}

function fmt(date: string | null) {
  if (!date) return '—'
  try { return new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return date }
}

function isVencido(vigencia: string) {
  if (vigencia === '—' || !vigencia) return false
  try { return new Date(vigencia) < new Date() }
  catch { return false }
}

// ─── DETALLE DOCUMENTO ────────────────────────────────────────────────────────
function DetalleDocumento({ doc, onClose, onSave }: { doc: Documento; onClose: () => void; onSave: () => void }) {
  const [estatus, setEstatus] = useState<EstatusDoc>(doc.estatus)
  const [notas, setNotas] = useState(doc.notas)
  const [revisadoPor, setRevisadoPor] = useState(doc.revisadoPor)
  const [guardando, setGuardando] = useState(false)

  async function guardar(forzarEstatus?: EstatusDoc) {
    setGuardando(true)
    const estatusFinal = forzarEstatus ?? estatus
    const sb = await getSB()
    await sb.from('documentos').update({
      estatus: estatusFinal, notas, revisado_por: revisadoPor, updated_at: new Date().toISOString()
    }).eq('id', doc._id)
    setGuardando(false)
    onSave()
    onClose()
  }

  const vencido = isVencido(doc.vigencia)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeftIcon className="w-4 h-4 text-slate-500" /></button>
            <div>
              <h2 className="font-bold text-slate-800">{doc.id} · {doc.tipo}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <EBadge e={estatus} />
                {vencido && <span className="text-xs text-orange-600 font-medium flex items-center gap-1"><ClockIcon className="w-3 h-3" />Vencido</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <Sec title="📄 Información del Documento">
            <G2>
              <F label="Tipo" value={doc.tipo} />
              <F label="Entidad" value={
                <span className="flex items-center gap-1.5">
                  {entidadIcon[doc.entidad]}
                  <span>{doc.entidad}</span>
                </span>
              } />
              <F label="Titular" value={<span className="font-medium">{doc.entidadNombre}</span>} />
              <F label="Folio / No." value={<span className="font-mono text-xs">{doc.folio}</span>} />
              <F label="Vigencia" value={
                <span className={vencido ? 'text-orange-600 font-medium' : 'text-slate-700'}>
                  {doc.vigencia}{vencido && ' ⚠ Vencido'}
                </span>
              } />
              <F label="Fecha de carga" value={doc.fechaCarga} />
            </G2>
            {doc.url && (
              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <ArrowDownTrayIcon className="w-4 h-4" />Ver / Descargar documento
              </a>
            )}
          </Sec>

          <Sec title="✅ Revisión">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Revisado por</p>
              <select value={revisadoPor} onChange={e => setRevisadoPor(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="—">Sin asignar</option>
                {['Ops. Central','Coordinador','Admin','Cumplimiento'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </Sec>

          <Sec title="⚙️ Cambiar Estatus">
            <EstatusSelector value={estatus} onChange={setEstatus} />
          </Sec>

          <Sec title="📝 Notas">
            <textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Sin notas..." />
          </Sec>

          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button onClick={() => guardar('Rechazado')} disabled={guardando}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-60 rounded-lg font-medium transition-colors">
              <XCircleIcon className="w-4 h-4" />Rechazar
            </button>
            <button onClick={() => guardar()} disabled={guardando}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <CheckCircleIcon className="w-4 h-4" />{guardando ? 'Guardando...' : 'Aprobar / Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── NUEVO DOCUMENTO FORM ─────────────────────────────────────────────────────
function NuevoDocumentoForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    tipo: '' as TipoDoc | '',
    entidad: '' as TipoEntidad | '',
    entidadNombre: '',
    folio: '',
    vigencia: '',
    revisadoPor: '',
    notas: '',
    url: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function guardar() {
    if (!form.tipo || !form.entidad || !form.entidadNombre) {
      setError('Tipo, entidad y titular son obligatorios.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      const sb = await getSB()
      const { error: e } = await sb.from('documentos').insert({
        tipo: form.tipo, entidad: form.entidad, entidad_nombre: form.entidadNombre,
        folio: form.folio || null, vigencia: form.vigencia || null,
        estatus: 'Pendiente', revisado_por: form.revisadoPor || '—',
        notas: form.notas, url: form.url || null,
      })
      if (e) throw e
      onSave()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGuardando(false)
    }
  }

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const selectCls = `${inputCls} bg-white`
  const L = ({ c, req }: { c: React.ReactNode; req?: boolean }) => (
    <label className="block text-xs font-medium text-slate-500 mb-1">{c}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-lg">Registrar Documento</h2>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <L c="Tipo de documento" req />
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={selectCls}>
                <option value="">Seleccionar...</option>
                {TIPOS_DOC.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <L c="Entidad" req />
              <select value={form.entidad} onChange={e => set('entidad', e.target.value)} className={selectCls}>
                <option value="">Seleccionar...</option>
                {TIPOS_ENTIDAD.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <L c="Nombre del titular" req />
              <input type="text" placeholder="Nombre completo o empresa" value={form.entidadNombre} onChange={e => set('entidadNombre', e.target.value)} className={inputCls} />
            </div>
            <div>
              <L c="Folio / Número" />
              <input type="text" placeholder="Número de documento" value={form.folio} onChange={e => set('folio', e.target.value)} className={inputCls} />
            </div>
            <div>
              <L c="Vigencia" />
              <input type="date" value={form.vigencia} onChange={e => set('vigencia', e.target.value)} className={inputCls} />
            </div>
            <div>
              <L c="Revisado por" />
              <select value={form.revisadoPor} onChange={e => set('revisadoPor', e.target.value)} className={selectCls}>
                <option value="">Sin asignar</option>
                {['Ops. Central','Coordinador','Admin','Cumplimiento'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <L c="URL / Enlace al archivo" />
              <input type="text" placeholder="https://..." value={form.url} onChange={e => set('url', e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-2">
              <L c="Notas" />
              <textarea rows={2} placeholder="Observaciones adicionales..." value={form.notas} onChange={e => set('notas', e.target.value)} className={inputCls} />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckCircleIcon className="w-4 h-4" />{guardando ? 'Guardando...' : 'Registrar documento'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function Sec({ title, children }: { title: string; children: React.ReactNode }) {
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
function F({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm text-slate-700">{value}</div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DocumentosView() {
  const [search, setSearch] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusDoc | 'Todos'>('Todos')
  const [filtroEntidad, setFiltroEntidad] = useState<TipoEntidad | 'Todos'>('Todos')
  const [detalle, setDetalle] = useState<Documento | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [docs, setDocs] = useState<Documento[]>([])

  const cargar = useCallback(async () => {
    setCargando(true)
    const sb = await getSB()
    const { data } = await sb.from('documentos').select('*').order('created_at', { ascending: false })

    setDocs((data ?? []).map((r: Record<string, unknown>, i: number) => ({
      _id: r.id as string,
      id: `DOC-${String(i+1).padStart(4, '0')}`,
      tipo: (r.tipo as TipoDoc) || 'Otro',
      entidad: (r.entidad as TipoEntidad) || 'Conductor',
      entidadNombre: (r.entidad_nombre as string) || '—',
      folio: (r.folio as string) || '—',
      vigencia: fmt(r.vigencia as string),
      estatus: (r.estatus as EstatusDoc) || 'Pendiente',
      fechaCarga: fmt(r.created_at as string),
      revisadoPor: (r.revisado_por as string) || '—',
      notas: (r.notas as string) || '',
      url: (r.url as string) || undefined,
    })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const q = search.toLowerCase()
  const filtrados = docs.filter(d => {
    const matchE = filtroEstatus === 'Todos' || d.estatus === filtroEstatus
    const matchEnt = filtroEntidad === 'Todos' || d.entidad === filtroEntidad
    const matchQ = !q || d.tipo.toLowerCase().includes(q) || d.entidadNombre.toLowerCase().includes(q) || d.folio.toLowerCase().includes(q)
    return matchE && matchEnt && matchQ
  })

  // KPIs
  const vigentes   = docs.filter(d => d.estatus === 'Vigente').length
  const pendientes = docs.filter(d => d.estatus === 'Pendiente').length
  const enRevision = docs.filter(d => d.estatus === 'En revisión').length
  const vencidos   = docs.filter(d => d.estatus === 'Vencido' || isVencido(d.vigencia)).length
  const rechazados = docs.filter(d => d.estatus === 'Rechazado').length

  const SkRow = () => (
    <tr className="animate-pulse">
      {Array.from({length: 8}).map((_,i) => (
        <td key={i} className="px-4 py-3"><div className="h-3 bg-slate-200 rounded w-full" /></td>
      ))}
    </tr>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {detalle && <DetalleDocumento doc={detalle} onClose={() => setDetalle(null)} onSave={cargar} />}
      {showForm && <NuevoDocumentoForm onClose={() => setShowForm(false)} onSave={cargar} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Vigentes',     value: vigentes,   color: 'text-green-600',  bg: 'bg-green-50',  icon: <CheckCircleIcon className="w-5 h-5 text-green-500" /> },
          { label: 'Pendientes',   value: pendientes, color: 'text-slate-600',  bg: 'bg-slate-50',  icon: <DocumentTextIcon className="w-5 h-5 text-slate-400" /> },
          { label: 'En revisión',  value: enRevision, color: 'text-purple-600', bg: 'bg-purple-50', icon: <ExclamationTriangleIcon className="w-5 h-5 text-purple-500" /> },
          { label: 'Vencidos',     value: vencidos,   color: 'text-orange-600', bg: 'bg-orange-50', icon: <ClockIcon className="w-5 h-5 text-orange-500" /> },
          { label: 'Rechazados',   value: rechazados, color: 'text-red-600',    bg: 'bg-red-50',    icon: <XCircleIcon className="w-5 h-5 text-red-500" /> },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-slate-500 font-medium leading-tight">{k.label}</p>
              <div className={`p-1.5 ${k.bg} rounded-lg`}>{k.icon}</div>
            </div>
            {cargando
              ? <div className="h-6 bg-slate-200 rounded w-1/2 animate-pulse" />
              : <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>}
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-800">Gestión de Documentos</h2>
            <p className="text-xs text-slate-400 mt-0.5">{docs.length} documentos registrados</p>
          </div>
          <div className="flex gap-2">
            <button onClick={cargar} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"><ArrowPathIcon className="w-4 h-4" /></button>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar documento..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
            </div>
            <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <PlusIcon className="w-4 h-4" />Registrar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-2 items-center">
          {/* Filtro entidad */}
          <div className="flex gap-1.5 mr-4">
            {(['Todos',...TIPOS_ENTIDAD] as (TipoEntidad | 'Todos')[]).map(ent => (
              <button key={ent} onClick={() => setFiltroEntidad(ent)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filtroEntidad === ent ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {ent}
              </button>
            ))}
          </div>
          {/* Filtro estatus */}
          <div className="flex gap-1.5">
            {(['Todos',...TODOS_ESTATUS] as (EstatusDoc | 'Todos')[]).map(e => (
              <button key={e} onClick={() => setFiltroEstatus(e)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filtroEstatus === e ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {e !== 'Todos' && <span className={`w-1.5 h-1.5 rounded-full ${filtroEstatus === e ? 'bg-white' : estatusDot[e as EstatusDoc]}`} />}
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Entidad</th>
                <th className="px-4 py-3">Titular</th>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Vigencia</th>
                <th className="px-4 py-3">Cargado</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando && [1,2,3,4].map(i => <SkRow key={i} />)}
              {!cargando && filtrados.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400 italic text-sm">
                  {docs.length === 0
                    ? 'Sin documentos registrados. Usa + Registrar para agregar el primero.'
                    : 'Sin resultados para los filtros aplicados.'}
                </td></tr>
              )}
              {!cargando && filtrados.map((d, i) => {
                const venc = isVencido(d.vigencia)
                return (
                  <tr key={i} className={`hover:bg-slate-50 cursor-pointer ${venc ? 'bg-orange-50/30' : ''}`}
                    onClick={() => setDetalle(d)}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <DocumentTextIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium text-slate-700">{d.tipo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        {entidadIcon[d.entidad]}
                        {d.entidad}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 text-xs">{d.entidadNombre}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.folio}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={venc ? 'text-orange-600 font-medium' : 'text-slate-500'}>
                        {venc && '⚠ '}{d.vigencia}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{d.fechaCarga}</td>
                    <td className="px-4 py-3"><EBadge e={d.estatus} /></td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2 items-center" onClick={e => e.stopPropagation()}>
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer"
                          className="text-slate-400 hover:text-blue-600 transition-colors" title="Descargar">
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => setDetalle(d)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium">Ver</button>
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