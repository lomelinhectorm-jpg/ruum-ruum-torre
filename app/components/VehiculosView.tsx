'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  PaperAirplaneIcon,
  TruckIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase'

// ─── CATÁLOGOS COMPARTIDOS (mismos valores que TarifasView / ViajesView) ──────
const TRANSMISIONES = ['Automática', 'Manual', 'CVT', 'Secuencial'] as const
const TIPOS_DOC_VEHICULO = ['Tarjeta circulación', 'Verificación', 'Seguro vehicular', 'Otro'] as const
const COMBUSTIBLES = ['Gasolina', 'Diésel', 'Eléctrico'] as const

type TipoDueno = 'usuario' | 'empresa' | 'flota'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface ViajeResumen {
  id: string
  fecha: string
  origen: string
  destino: string
  tarifa: number
  estatus: string
}

interface Documento {
  tipo: string
  numero: string
  vencimiento: string
  estado: 'Vigente' | 'Por vencer' | 'Vencido' | 'Pendiente'
}

interface NotaInterna {
  autor: string
  texto: string
  hora: string
}

interface Vehiculo {
  id: string
  folio: string
  marca: string
  modelo: string
  anio: string
  color: string
  placas: string
  vin: string
  transmision: string
  tipoVehiculo: string
  combustible: string
  alias: string
  observaciones: string
  activo: boolean
  usuarioId: string | null
  empresaId: string | null
  duenoNombre: string
  duenoTipo: TipoDueno
  createdAt: string
  verificacion: DocEstatusResumen
  tarjetaCirculacion: DocEstatusResumen
  verificacionVigente: boolean
  tarjetaCirculacionFisica: boolean
  numLlaves: number
}

type DocEstatusResumen = 'Vigente' | 'Vencido' | 'Sin registrar'

const FOLIO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789' // sin I/O para evitar confusión visual
function generarFolioVehiculo() {
  let folio = ''
  for (let i = 0; i < 8; i++) folio += FOLIO_CHARS[Math.floor(Math.random() * FOLIO_CHARS.length)]
  return folio
}

// ─── HELPERS DE ESTILO ─────────────────────────────────────────────────────────
const docStyle: Record<string, string> = {
  Vigente: 'bg-green-50 text-green-700',
  'Por vencer': 'bg-amber-50 text-amber-700',
  Vencido: 'bg-red-50 text-red-700',
  Pendiente: 'bg-slate-100 text-slate-500',
}

const avatarColors = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
]

function DocEstatusBadge({ estatus }: { estatus: DocEstatusResumen }) {
  const cls: Record<DocEstatusResumen, string> = {
    Vigente: 'bg-green-50 text-green-700',
    Vencido: 'bg-red-50 text-red-700',
    'Sin registrar': 'bg-slate-100 text-slate-400',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls[estatus]}`}>{estatus}</span>
}

function SiNoBadge({ valor }: { valor: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${valor ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {valor ? 'Sí' : 'No'}
    </span>
  )
}

function DuenoBadge({ tipo, nombre }: { tipo: TipoDueno; nombre: string }) {
  if (tipo === 'flota') {
    return <span className="flex items-center gap-1.5 text-xs text-slate-500"><TruckIcon className="w-3.5 h-3.5" />Flota propia</span>
  }
  const Icon = tipo === 'empresa' ? BuildingOffice2Icon : UserCircleIcon
  return <span className="flex items-center gap-1.5 text-xs text-slate-600"><Icon className="w-3.5 h-3.5 text-slate-400" />{nombre}</span>
}

// ─── DETALLE VEHÍCULO ──────────────────────────────────────────────────────────
type DetailTab = 'info' | 'dueno' | 'viajes' | 'documentos' | 'notas'

function VehiculoDetalle({
  vehiculo, idx, initialTab, onClose, onUpdate,
}: {
  vehiculo: Vehiculo
  idx: number
  initialTab: DetailTab
  onClose: () => void
  onUpdate: () => void
}) {
  const [tab, setTab] = useState<DetailTab>(initialTab)
  const [activo, setActivo] = useState(vehiculo.activo)
  const [verificacionVigente, setVerificacionVigente] = useState(vehiculo.verificacionVigente)
  const [tarjetaCirculacionFisica, setTarjetaCirculacionFisica] = useState(vehiculo.tarjetaCirculacionFisica)
  const [numLlaves, setNumLlaves] = useState(vehiculo.numLlaves)
  const [viajes, setViajes] = useState<ViajeResumen[]>([])
  const [docs, setDocs] = useState<Documento[]>([])
  const [notas, setNotas] = useState<NotaInterna[]>([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [cargandoRelacionados, setCargandoRelacionados] = useState(true)
  const color = avatarColors[idx % avatarColors.length]
  const nombreVehiculo = `${vehiculo.marca} ${vehiculo.modelo}`.trim()

  useEffect(() => {
    const cargarRelacionados = async () => {
      const sb = getSupabaseBrowserClient()
      const [viajesRes, docsRes, notasRes] = await Promise.all([
        sb.from('viajes').select('id, folio, fecha_programada, origen_calle, destino_calle, tarifa_cliente, status').eq('vehiculo_id', vehiculo.id).order('created_at', { ascending: false }),
        sb.from('documentos').select('tipo_doc, folio, fecha_vencimiento, estatus').eq('entidad_tipo', 'Vehículo').eq('entidad_id', vehiculo.id),
        sb.from('notas_internas').select('texto, autor_nombre, created_at').eq('entidad_tipo', 'vehiculo').eq('entidad_id', vehiculo.id).order('created_at', { ascending: false }),
      ])

      if (viajesRes.data) {
        setViajes(viajesRes.data.map((v: Record<string, unknown>) => ({
          id: String(v.folio ?? String(v.id).slice(0, 8).toUpperCase()),
          fecha: String(v.fecha_programada ?? '—'),
          origen: String(v.origen_calle ?? '—'),
          destino: String(v.destino_calle ?? '—'),
          tarifa: Number(v.tarifa_cliente ?? 0),
          estatus: String(v.status ?? '—'),
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
      if (notasRes.data) {
        setNotas(notasRes.data.map((n: Record<string, unknown>) => ({
          autor: String(n.autor_nombre ?? 'Admin'),
          texto: String(n.texto ?? ''),
          hora: n.created_at ? new Date(String(n.created_at)).toLocaleString('es-MX') : '—',
        })))
      }
      setCargandoRelacionados(false)
    }
    cargarRelacionados()
  }, [vehiculo.id])

  const cambiarActivo = async (nuevo: boolean) => {
    const sb = getSupabaseBrowserClient()
    await sb.from('vehiculos').update({ activo: nuevo }).eq('id', vehiculo.id)
    setActivo(nuevo)
    onUpdate()
  }

  const cambiarVerificacion = async (nuevo: boolean) => {
    const sb = getSupabaseBrowserClient()
    await sb.from('vehiculos').update({ verificacion_vigente: nuevo }).eq('id', vehiculo.id)
    setVerificacionVigente(nuevo)
    onUpdate()
  }

  const cambiarTarjeta = async (nuevo: boolean) => {
    const sb = getSupabaseBrowserClient()
    await sb.from('vehiculos').update({ tarjeta_circulacion: nuevo }).eq('id', vehiculo.id)
    setTarjetaCirculacionFisica(nuevo)
    onUpdate()
  }

  const cambiarLlaves = async (nuevo: number) => {
    const sb = getSupabaseBrowserClient()
    await sb.from('vehiculos').update({ num_llaves: nuevo }).eq('id', vehiculo.id)
    setNumLlaves(nuevo)
    onUpdate()
  }

  const addNota = async () => {
    if (!nuevaNota.trim()) return
    const sb = getSupabaseBrowserClient()
    const texto = nuevaNota.trim()
    const { error } = await sb.from('notas_internas').insert({
      entidad_tipo: 'vehiculo', entidad_id: vehiculo.id, texto, autor_nombre: 'Admin',
    })
    if (!error) {
      setNotas(n => [{ autor: 'Admin', texto, hora: 'Ahora' }, ...n])
      setNuevaNota('')
    }
  }

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'info', label: 'Información' },
    { id: 'dueno', label: 'Dueño' },
    { id: 'viajes', label: `Viajes (${viajes.length})` },
    { id: 'documentos', label: `Documentos (${docs.length})` },
    { id: 'notas', label: `Notas (${notas.length})` },
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
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white flex-shrink-0`}>
                <TruckIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">{nombreVehiculo || 'Vehículo'}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{vehiculo.placas}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {activo ? (
                <button onClick={() => cambiarActivo(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />Desactivar
                </button>
              ) : (
                <button onClick={() => cambiarActivo(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <CheckCircleIcon className="w-3.5 h-3.5" />Activar
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
                  tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>{t.label}</button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* ── INFORMACIÓN ── */}
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Viajes realizados', value: viajes.length, color: 'text-blue-600' },
                  { label: 'Tipo de vehículo', value: vehiculo.tipoVehiculo || '—', color: 'text-slate-700' },
                  { label: 'Documentos', value: docs.length, color: 'text-slate-700' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <SectionCard title="Datos del vehículo" icon="🚗">
                <Grid2>
                  <Field label="ID interno" value={<span className="font-mono text-xs">{vehiculo.folio}</span>} />
                  <Field label="Marca / Modelo" value={`${vehiculo.marca} ${vehiculo.modelo}`} />
                  <Field label="Año" value={vehiculo.anio || '—'} />
                  <Field label="Color" value={vehiculo.color || '—'} />
                  <Field label="Placas" value={vehiculo.placas} mono />
                  <Field label="VIN" value={vehiculo.vin || '—'} mono />
                  <Field label="Transmisión" value={vehiculo.transmision || '—'} />
                  <Field label="Tipo de vehículo" value={vehiculo.tipoVehiculo || '—'} />
                  <Field label="Combustible" value={vehiculo.combustible || '—'} />
                  <Field label="Alias / Apodo" value={vehiculo.alias || '—'} />
                </Grid2>
                {vehiculo.observaciones && <Field label="Observaciones" value={vehiculo.observaciones} />}
              </SectionCard>

              <SectionCard title="Verificación y resguardo" icon="🪪">
                <Grid2>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Verificación vigente</p>
                    <div className="flex gap-2">
                      {([{ v: true, label: 'Sí' }, { v: false, label: 'No' }] as const).map(opt => (
                        <button key={String(opt.v)} onClick={() => cambiarVerificacion(opt.v)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${verificacionVigente === opt.v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Tarjeta de circulación</p>
                    <div className="flex gap-2">
                      {([{ v: true, label: 'Sí' }, { v: false, label: 'No' }] as const).map(opt => (
                        <button key={String(opt.v)} onClick={() => cambiarTarjeta(opt.v)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tarjetaCirculacionFisica === opt.v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Número de llaves</p>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(n => (
                        <button key={n} onClick={() => cambiarLlaves(n)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${numLlaves === n ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </Grid2>
              </SectionCard>
            </div>
          )}

          {/* ── DUEÑO ── */}
          {tab === 'dueno' && (
            <SectionCard title="Propietario del vehículo" icon="🧾">
              {vehiculo.duenoTipo === 'flota' ? (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <TruckIcon className="w-8 h-8 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-700 text-sm">Flota propia</p>
                    <p className="text-xs text-slate-400">Este vehículo no está vinculado a un usuario ni a una empresa.</p>
                  </div>
                </div>
              ) : (
                <Grid2>
                  <Field label={vehiculo.duenoTipo === 'empresa' ? 'Empresa' : 'Usuario particular'} value={vehiculo.duenoNombre || '—'} />
                  <Field label="Tipo de propietario" value={vehiculo.duenoTipo === 'empresa' ? 'Empresa' : 'Usuario particular'} />
                </Grid2>
              )}
            </SectionCard>
          )}

          {/* ── VIAJES ── */}
          {tab === 'viajes' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 text-sm font-semibold text-slate-700">Historial de viajes con este vehículo</div>
              {cargandoRelacionados
                ? <div className="p-4 space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-lg" />)}</div>
                : viajes.length === 0
                ? <p className="p-8 text-center text-sm text-slate-400 italic">Sin viajes registrados con este vehículo.</p>
                : <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Ruta</th>
                      <th className="px-4 py-3 text-right">Tarifa</th>
                      <th className="px-4 py-3">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viajes.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-blue-600">{v.id}</td>
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

          {/* ── DOCUMENTOS ── */}
          {tab === 'documentos' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Documentos del vehículo</p>
              {cargandoRelacionados ? (
                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}</div>
              ) : docs.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                  <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 italic">Sin documentos registrados para este vehículo.</p>
                  <p className="text-xs text-slate-400 mt-1">Tarjeta de circulación, verificación o póliza de seguro se capturan desde la sección Documentos.</p>
                </div>
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

          {/* ── NOTAS ── */}
          {tab === 'notas' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 italic">Visibles únicamente para el equipo de operaciones.</p>
              {cargandoRelacionados
                ? <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />)}</div>
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
  vehiculo, onClose, onOpenDetail,
}: {
  vehiculo: Vehiculo
  onClose: () => void
  onOpenDetail: (tab: DetailTab) => void
}) {
  const acciones: { label: string; color: string; tab: DetailTab }[] = [
    { label: 'Ver detalle completo', color: 'blue', tab: 'info' },
    { label: 'Ver dueño', color: 'slate', tab: 'dueno' },
    { label: 'Ver historial de viajes', color: 'indigo', tab: 'viajes' },
    { label: 'Ver / agregar documentos', color: 'purple', tab: 'documentos' },
    { label: 'Agregar nota interna', color: 'amber', tab: 'notas' },
    { label: vehiculo.activo ? 'Desactivar vehículo' : 'Activar vehículo', color: vehiculo.activo ? 'red' : 'green', tab: 'info' },
  ]
  const cls: Record<string, string> = {
    blue: 'text-blue-600 hover:bg-blue-50', indigo: 'text-indigo-600 hover:bg-indigo-50',
    slate: 'text-slate-600 hover:bg-slate-50', purple: 'text-purple-600 hover:bg-purple-50',
    amber: 'text-amber-600 hover:bg-amber-50', green: 'text-green-600 hover:bg-green-50',
    red: 'text-red-600 hover:bg-red-50',
  }
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-4 w-72" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <p className="font-semibold text-slate-800 text-sm">{vehiculo.marca} {vehiculo.modelo} · {vehiculo.placas}</p>
          <button onClick={onClose}><XMarkIcon className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="space-y-0.5">
          {acciones.map((a, i) => (
            <button key={i} onClick={() => { onClose(); onOpenDetail(a.tab) }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${cls[a.color]}`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── NUEVO VEHÍCULO FORM ───────────────────────────────────────────────────────
interface FormState {
  duenoTipo: TipoDueno
  duenoId: string
  marca: string
  modelo: string
  anio: string
  color: string
  placas: string
  vin: string
  transmision: string
  tipoVehiculo: string
  combustible: string
  alias: string
  observaciones: string
  verificacionVigente: boolean
  tarjetaCirculacion: boolean
  numLlaves: number
}

const EMPTY_FORM: FormState = {
  duenoTipo: 'flota', duenoId: '',
  marca: '', modelo: '', anio: '', color: '', placas: '', vin: '',
  transmision: '', tipoVehiculo: '', combustible: '', alias: '', observaciones: '',
  verificacionVigente: false, tarjetaCirculacion: false, numLlaves: 1,
}

function NuevoVehiculoForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')

  const [empresas, setEmpresas] = useState<{ id: string; nombre: string }[]>([])
  const [usuarios, setUsuarios] = useState<{ id: string; nombre: string; apellido: string }[]>([])
  const [tiposVehiculo, setTiposVehiculo] = useState<{ id: string; nombre: string }[]>([])
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)

  useEffect(() => {
    const cargarCatalogos = async () => {
      const sb = getSupabaseBrowserClient()
      const [empRes, usrRes, tiposRes] = await Promise.all([
        sb.from('empresas').select('id, nombre_comercial').eq('estatus', 'Activa').order('nombre_comercial'),
        sb.from('usuarios').select('id, nombre, apellido').order('nombre'),
        sb.from('configuracion').select('valor').eq('clave', 'tipos_vehiculo').maybeSingle(),
      ])
      if (empRes.data) setEmpresas(empRes.data.map((e: Record<string, unknown>) => ({ id: String(e.id), nombre: String(e.nombre_comercial ?? '') })))
      if (usrRes.data) setUsuarios(usrRes.data.map((u: Record<string, unknown>) => ({ id: String(u.id), nombre: String(u.nombre ?? ''), apellido: String(u.apellido ?? '') })))
      if (tiposRes.data?.valor) {
        try {
          const parsed = JSON.parse(String(tiposRes.data.valor))
          if (Array.isArray(parsed)) {
            setTiposVehiculo(
              parsed
                .filter((t: Record<string, unknown>) => t.activo !== false)
                .map((t: Record<string, unknown>) => ({ id: String(t.id ?? t.nombre), nombre: String(t.nombre ?? '') }))
                .filter(t => t.nombre)
            )
          }
        } catch {
          // catálogo vacío o corrupto: se deja vacío, el campo queda sin opciones
        }
      }
      setCargandoCatalogos(false)
    }
    cargarCatalogos()
  }, [])

  const set = (k: keyof FormState, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const elegirDueno = (tipo: TipoDueno) => setForm(f => ({ ...f, duenoTipo: tipo, duenoId: '' }))

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.marca) e.marca = 'Requerido'
    if (!form.modelo) e.modelo = 'Requerido'
    if (!form.placas) e.placas = 'Requerido'
    if (form.duenoTipo !== 'flota' && !form.duenoId) e.duenoId = 'Selecciona un propietario'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setGuardando(true)
    setErrorGuardar('')
    try {
      const sb = getSupabaseBrowserClient()

      const { data: existente } = await sb
        .from('vehiculos')
        .select('id')
        .eq('placas', form.placas.toUpperCase())
        .maybeSingle()
      if (existente) {
        setErrorGuardar('Ya existe un vehículo registrado con esas placas.')
        setGuardando(false)
        return
      }

      // Generar folio interno único (8 caracteres); reintenta en la rara
      // colisión de unicidad antes de rendirse.
      let insertError: { code?: string; message: string } | null = null
      for (let intento = 0; intento < 5; intento++) {
        const folio = generarFolioVehiculo()
        const { error } = await sb.from('vehiculos').insert({
          folio,
          usuario_id: form.duenoTipo === 'usuario' ? form.duenoId : null,
          empresa_id: form.duenoTipo === 'empresa' ? form.duenoId : null,
          marca: form.marca.toUpperCase(),
          modelo: form.modelo.toUpperCase(),
          anio: form.anio || null,
          color: form.color.toUpperCase() || null,
          placas: form.placas.toUpperCase(),
          vin: form.vin.toUpperCase() || null,
          transmision: form.transmision || null,
          tipo_vehiculo: form.tipoVehiculo || null,
          combustible: form.combustible || null,
          alias: form.alias.toUpperCase() || null,
          observaciones: form.observaciones || null,
          verificacion_vigente: form.verificacionVigente,
          tarjeta_circulacion: form.tarjetaCirculacion,
          num_llaves: form.numLlaves,
          activo: true,
        })
        if (!error) { insertError = null; break }
        // 23505 = unique_violation; si es por folio, reintenta con uno nuevo
        if (error.code === '23505' && error.message.includes('folio')) {
          insertError = error
          continue
        }
        insertError = error
        break
      }
      if (insertError) throw insertError

      onSave()
      onClose()
    } catch (e) {
      console.error('Error guardando vehículo:', e)
      setErrorGuardar('Error al guardar. Verifica los datos e intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const I = (k: keyof FormState) => `w-full border ${errors[k] ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`
  const E = ({ k }: { k: keyof FormState }) => errors[k] ? <p className="text-xs text-red-500 mt-0.5">{errors[k]}</p> : null
  const L = ({ c, req }: { c: React.ReactNode; req?: boolean }) => (
    <label className="block text-xs font-medium text-slate-500 mb-1">{c}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Nuevo Vehículo</h2>
            <p className="text-xs text-slate-400">Registra un vehículo de flota propia, de un usuario o de una empresa</p>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">🧾 Propietario</p>
            <div className="flex gap-2 mb-3">
              {([
                { v: 'flota', label: 'Flota propia' },
                { v: 'usuario', label: 'Usuario particular' },
                { v: 'empresa', label: 'Empresa' },
              ] as const).map(opt => (
                <button key={opt.v} type="button" onClick={() => elegirDueno(opt.v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.duenoTipo === opt.v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {form.duenoTipo === 'usuario' && (
              <div>
                <select value={form.duenoId} onChange={e => set('duenoId', e.target.value)} className={I('duenoId')} disabled={cargandoCatalogos}>
                  <option value="">{cargandoCatalogos ? 'Cargando...' : 'Seleccionar usuario...'}</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                </select>
                <E k="duenoId" />
              </div>
            )}
            {form.duenoTipo === 'empresa' && (
              <div>
                <select value={form.duenoId} onChange={e => set('duenoId', e.target.value)} className={I('duenoId')} disabled={cargandoCatalogos}>
                  <option value="">{cargandoCatalogos ? 'Cargando...' : 'Seleccionar empresa...'}</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                <E k="duenoId" />
              </div>
            )}
            {form.duenoTipo === 'flota' && (
              <p className="text-xs text-slate-400">Este vehículo no se vinculará a ningún usuario ni empresa.</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">🚗 Datos del vehículo</p>
            <div className="grid grid-cols-2 gap-4">
              <div><L c="Marca" req /><input type="text" value={form.marca} onChange={e => set('marca', e.target.value.toUpperCase())} placeholder="NISSAN" className={I('marca')} /><E k="marca" /></div>
              <div><L c="Modelo" req /><input type="text" value={form.modelo} onChange={e => set('modelo', e.target.value.toUpperCase())} placeholder="VERSA" className={I('modelo')} /><E k="modelo" /></div>
              <div><L c="Año" /><input type="text" value={form.anio} maxLength={4} onChange={e => set('anio', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="2023" className={I('anio')} /></div>
              <div><L c="Color" /><input type="text" value={form.color} onChange={e => set('color', e.target.value.toUpperCase())} placeholder="BLANCO" className={I('color')} /></div>
              <div><L c="Placas" req /><input type="text" value={form.placas} onChange={e => set('placas', e.target.value.toUpperCase())} placeholder="ABC-1234" className={I('placas')} /><E k="placas" /></div>
              <div><L c="VIN" /><input type="text" value={form.vin} onChange={e => set('vin', e.target.value.toUpperCase())} placeholder="NÚMERO DE SERIE" className={I('vin')} /></div>
              <div>
                <L c="Transmisión" />
                <select value={form.transmision} onChange={e => set('transmision', e.target.value)} className={I('transmision')}>
                  <option value="">Seleccionar...</option>
                  {TRANSMISIONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <L c="Tipo de vehículo" />
                <select value={form.tipoVehiculo} onChange={e => set('tipoVehiculo', e.target.value)} className={I('tipoVehiculo')} disabled={cargandoCatalogos}>
                  <option value="">{cargandoCatalogos ? 'Cargando...' : 'Seleccionar...'}</option>
                  {tiposVehiculo.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                </select>
                {!cargandoCatalogos && tiposVehiculo.length === 0 && (
                  <p className="text-xs text-amber-500 mt-0.5">No hay tipos de vehículo capturados. Configúralos en Configuración → Tipos de vehículo.</p>
                )}
              </div>
              <div>
                <L c="Combustible" />
                <select value={form.combustible} onChange={e => set('combustible', e.target.value)} className={I('combustible')}>
                  <option value="">Seleccionar...</option>
                  {COMBUSTIBLES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2"><L c="Alias / Apodo" /><input type="text" value={form.alias} onChange={e => set('alias', e.target.value.toUpperCase())} placeholder="EJ. CAMIONETA GRIS 1" className={I('alias')} /></div>
              <div className="col-span-2">
                <L c="Observaciones" />
                <textarea value={form.observaciones} onChange={e => set('observaciones', e.target.value)} rows={2}
                  placeholder="Detalles adicionales, golpes previos, accesorios, etc."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">🪪 Verificación y resguardo</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <L c="Verificación vigente" />
                <div className="flex gap-2">
                  {([{ v: true, label: 'Sí' }, { v: false, label: 'No' }] as const).map(opt => (
                    <button key={String(opt.v)} type="button"
                      onClick={() => setForm(f => ({ ...f, verificacionVigente: opt.v }))}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${form.verificacionVigente === opt.v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <L c="Tarjeta de circulación" />
                <div className="flex gap-2">
                  {([{ v: true, label: 'Sí' }, { v: false, label: 'No' }] as const).map(opt => (
                    <button key={String(opt.v)} type="button"
                      onClick={() => setForm(f => ({ ...f, tarjetaCirculacion: opt.v }))}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${form.tarjetaCirculacion === opt.v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <L c="Número de llaves" />
                <div className="flex gap-2">
                  {[1, 2, 3].map(n => (
                    <button key={n} type="button"
                      onClick={() => setForm(f => ({ ...f, numLlaves: n }))}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${form.numLlaves === n ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <div className="flex flex-col items-end gap-1">
            {errorGuardar && <p className="text-xs text-red-500">{errorGuardar}</p>}
            <button onClick={handleSubmit} disabled={guardando} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <CheckCircleIcon className="w-4 h-4" />
              {guardando ? 'Guardando...' : 'Registrar vehículo'}
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

// ─── TIPOS SUPABASE ───────────────────────────────────────────────────────────
interface VehiculoDB {
  id: string
  folio: string | null
  marca: string | null
  modelo: string | null
  anio: string | null
  color: string | null
  placas: string
  vin: string | null
  transmision: string | null
  tipo_vehiculo: string | null
  combustible: string | null
  alias: string | null
  observaciones: string | null
  activo: boolean | null
  verificacion_vigente: boolean | null
  tarjeta_circulacion: boolean | null
  num_llaves: number | null
  usuario_id: string | null
  empresa_id: string | null
  created_at: string
  usuarios: { nombre: string; apellido: string }[] | null
  empresas: { nombre_comercial: string }[] | null
}

function resolverEstatusDoc(fechaVencimiento: string | null): DocEstatusResumen {
  if (!fechaVencimiento) return 'Sin registrar'
  try {
    return new Date(fechaVencimiento) < new Date() ? 'Vencido' : 'Vigente'
  } catch {
    return 'Sin registrar'
  }
}

function vehiculoDBaVehiculo(
  v: VehiculoDB,
  docsPorVehiculo: Map<string, { verificacion: string | null; tarjetaCirculacion: string | null }>,
): Vehiculo {
  const usuario = v.usuarios?.[0] ?? null
  const empresa = v.empresas?.[0] ?? null
  let duenoTipo: TipoDueno = 'flota'
  let duenoNombre = ''
  if (v.empresa_id && empresa) {
    duenoTipo = 'empresa'
    duenoNombre = empresa.nombre_comercial
  } else if (v.usuario_id && usuario) {
    duenoTipo = 'usuario'
    duenoNombre = `${usuario.nombre} ${usuario.apellido}`
  }

  const docs = docsPorVehiculo.get(v.id) ?? { verificacion: null, tarjetaCirculacion: null }

  return {
    id: v.id,
    folio: v.folio ?? v.id.slice(0, 8).toUpperCase(),
    marca: v.marca ?? '—',
    modelo: v.modelo ?? '—',
    anio: v.anio ?? '',
    color: v.color ?? '',
    placas: v.placas,
    vin: v.vin ?? '',
    transmision: v.transmision ?? '',
    tipoVehiculo: v.tipo_vehiculo ?? '',
    combustible: v.combustible ?? '',
    alias: v.alias ?? '',
    observaciones: v.observaciones ?? '',
    activo: v.activo ?? true,
    usuarioId: v.usuario_id,
    empresaId: v.empresa_id,
    duenoNombre,
    duenoTipo,
    createdAt: v.created_at,
    verificacion: resolverEstatusDoc(docs.verificacion),
    tarjetaCirculacion: resolverEstatusDoc(docs.tarjetaCirculacion),
    verificacionVigente: v.verificacion_vigente ?? false,
    tarjetaCirculacionFisica: v.tarjeta_circulacion ?? false,
    numLlaves: v.num_llaves ?? 1,
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function VehiculosView() {
  const [search, setSearch] = useState('')
  const [duenoFiltro, setDuenoFiltro] = useState<TipoDueno | 'Todos'>('Todos')
  const [estatusFiltro, setEstatusFiltro] = useState<'Todos' | 'Activos' | 'Inactivos'>('Activos')
  const [actionVehiculo, setActionVehiculo] = useState<{ vehiculo: Vehiculo; idx: number } | null>(null)
  const [detailVehiculo, setDetailVehiculo] = useState<{ vehiculo: Vehiculo; idx: number; tab: DetailTab } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [cargando, setCargando] = useState(true)

  const cargarVehiculos = useCallback(async () => {
    const sb = getSupabaseBrowserClient()
    const [vehRes, docsRes] = await Promise.all([
      sb.from('vehiculos').select(`
        id, folio, marca, modelo, anio, color, placas, vin, transmision,
        tipo_vehiculo, combustible, alias, observaciones, activo,
        verificacion_vigente, tarjeta_circulacion, num_llaves,
        usuario_id, empresa_id, created_at,
        usuarios(nombre, apellido),
        empresas(nombre_comercial)
      `).order('created_at', { ascending: false }),
      sb.from('documentos')
        .select('entidad_id, tipo_doc, fecha_vencimiento')
        .eq('entidad_tipo', 'Vehículo')
        .in('tipo_doc', TIPOS_DOC_VEHICULO as readonly string[]),
    ])

    if (!vehRes.error && vehRes.data) {
      const docsPorVehiculo = new Map<string, { verificacion: string | null; tarjetaCirculacion: string | null }>()
      if (docsRes.data) {
        for (const d of docsRes.data as { entidad_id: string; tipo_doc: string; fecha_vencimiento: string | null }[]) {
          const actual = docsPorVehiculo.get(d.entidad_id) ?? { verificacion: null, tarjetaCirculacion: null }
          if (d.tipo_doc === 'Verificación') actual.verificacion = d.fecha_vencimiento
          if (d.tipo_doc === 'Tarjeta circulación') actual.tarjetaCirculacion = d.fecha_vencimiento
          docsPorVehiculo.set(d.entidad_id, actual)
        }
      }
      setVehiculos((vehRes.data as VehiculoDB[]).map(v => vehiculoDBaVehiculo(v, docsPorVehiculo)))
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    cargarVehiculos()
  }, [cargarVehiculos])

  const filtered = vehiculos.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${v.marca} ${v.modelo}`.toLowerCase().includes(q) ||
      v.placas.toLowerCase().includes(q) ||
      v.vin.toLowerCase().includes(q) ||
      v.alias.toLowerCase().includes(q) ||
      v.duenoNombre.toLowerCase().includes(q)
    const matchDueno = duenoFiltro === 'Todos' || v.duenoTipo === duenoFiltro
    const matchEstatus = estatusFiltro === 'Todos' || (estatusFiltro === 'Activos' ? v.activo : !v.activo)
    return matchSearch && matchDueno && matchEstatus
  })

  const counts = {
    total: vehiculos.length,
    activos: vehiculos.filter(v => v.activo).length,
    flota: vehiculos.filter(v => v.duenoTipo === 'flota').length,
    usuarios: vehiculos.filter(v => v.duenoTipo === 'usuario').length,
    empresas: vehiculos.filter(v => v.duenoTipo === 'empresa').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showForm && <NuevoVehiculoForm onClose={() => setShowForm(false)} onSave={cargarVehiculos} />}
      {detailVehiculo && (
        <VehiculoDetalle
          vehiculo={detailVehiculo.vehiculo}
          idx={detailVehiculo.idx}
          initialTab={detailVehiculo.tab}
          onClose={() => setDetailVehiculo(null)}
          onUpdate={() => cargarVehiculos()}
        />
      )}
      {actionVehiculo && (
        <AccionesMenu
          vehiculo={actionVehiculo.vehiculo}
          onClose={() => setActionVehiculo(null)}
          onOpenDetail={(tab) => {
            setDetailVehiculo({ vehiculo: actionVehiculo.vehiculo, idx: actionVehiculo.idx, tab })
            setActionVehiculo(null)
          }}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'text-slate-800' },
          { label: 'Activos', value: counts.activos, color: 'text-green-600' },
          { label: 'Flota propia', value: counts.flota, color: 'text-slate-600' },
          { label: 'De usuarios', value: counts.usuarios, color: 'text-blue-600' },
          { label: 'De empresas', value: counts.empresas, color: 'text-indigo-600' },
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
          {/* Dueño chips */}
          <div className="flex flex-wrap gap-1.5">
            {([
              { v: 'Todos', label: 'Todos' },
              { v: 'flota', label: 'Flota propia' },
              { v: 'usuario', label: 'Usuarios' },
              { v: 'empresa', label: 'Empresas' },
            ] as const).map(opt => (
              <button key={opt.v} onClick={() => setDuenoFiltro(opt.v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  duenoFiltro === opt.v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>{opt.label}</button>
            ))}
          </div>
          {/* Estatus + search + new */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2">
              {(['Activos', 'Inactivos', 'Todos'] as const).map(e => (
                <button key={e} onClick={() => setEstatusFiltro(e)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    estatusFiltro === e ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>{e}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar por marca, placa, VIN..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-60" />
              </div>
              <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />Nuevo
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4].map(n => (
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
                  <th className="px-4 py-3">Vehículo</th>
                  <th className="px-4 py-3">Placas</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Propietario</th>
                  <th className="px-4 py-3">Verificación (doc.)</th>
                  <th className="px-4 py-3">Tarjeta circ. (doc.)</th>
                  <th className="px-4 py-3 text-center">Verif. vigente</th>
                  <th className="px-4 py-3 text-center">Tarjeta física</th>
                  <th className="px-4 py-3 text-center">Llaves</th>
                  <th className="px-4 py-3 text-center">Estatus</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className="text-center py-10 text-slate-400 italic text-sm">Sin resultados.</td></tr>
                )}
                {filtered.map((v, i) => {
                  const color = avatarColors[i % avatarColors.length]
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setDetailVehiculo({ vehiculo: v, idx: i, tab: 'info' })}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white flex-shrink-0`}>
                            <TruckIcon className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{v.marca} {v.modelo}</div>
                            <div className="text-xs text-slate-400">{v.alias || (v.anio ? `Año ${v.anio}` : '—')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.placas}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{v.tipoVehiculo || '—'}</td>
                      <td className="px-4 py-3"><DuenoBadge tipo={v.duenoTipo} nombre={v.duenoNombre} /></td>
                      <td className="px-4 py-3"><DocEstatusBadge estatus={v.verificacion} /></td>
                      <td className="px-4 py-3"><DocEstatusBadge estatus={v.tarjetaCirculacion} /></td>
                      <td className="px-4 py-3 text-center"><SiNoBadge valor={v.verificacionVigente} /></td>
                      <td className="px-4 py-3 text-center"><SiNoBadge valor={v.tarjetaCirculacionFisica} /></td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-slate-700">{v.numLlaves}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${v.activo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                          {v.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setActionVehiculo({ vehiculo: v, idx: i })}
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