'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftEllipsisIcon,
  LinkIcon,
  ClockIcon,
  CameraIcon,
} from '@heroicons/react/24/outline'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type EstatusEvidencia =
  | 'Pendiente'
  | 'Completa'
  | 'Incompleta'
  | 'En revisión'
  | 'Aprobada'
  | 'Rechazada'
  | 'Relacionada con incidencia'

interface FotoItem {
  label: string
  inicial: boolean
  final: boolean
}

interface EvidenciaViaje {
  id: string
  viajeId: string
  conductor: string
  vehiculo: string
  placas: string
  fecha: string
  estatus: EstatusEvidencia
  // Fotos
  fotos: FotoItem[]
  // Datos operativos
  kmInicial: number | null
  kmFinal: number | null
  combustibleInicial: string
  combustibleFinal: string
  llavesRecibidas: number
  llavesEntregadas: number
  dañosIniciales: string
  dañosFinales: string
  firmaInicial: boolean
  firmaFinal: boolean
  // Revisión admin
  notaAclaracion: string
  incidenciaVinculada: string
  historial: { evento: string; hora: string; actor: string }[]
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const FOTOS_BASE: FotoItem[] = [
  { label: 'Frente',   inicial: false, final: false },
  { label: 'Lado piloto',   inicial: false, final: false },
  { label: 'Lado copiloto', inicial: false, final: false },
  { label: 'Trasera',  inicial: false, final: false },
  { label: 'Tablero',  inicial: false, final: false },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const estatusStyle: Record<EstatusEvidencia, string> = {
  'Pendiente':                   'bg-slate-100 text-slate-500',
  'Completa':                    'bg-blue-100 text-blue-700',
  'Incompleta':                  'bg-amber-100 text-amber-700',
  'En revisión':                 'bg-purple-100 text-purple-700',
  'Aprobada':                    'bg-green-100 text-green-700',
  'Rechazada':                   'bg-red-100 text-red-700',
  'Relacionada con incidencia':  'bg-rose-100 text-rose-700',
}

const estatusDot: Record<EstatusEvidencia, string> = {
  'Pendiente':                   'bg-slate-400',
  'Completa':                    'bg-blue-500',
  'Incompleta':                  'bg-amber-500',
  'En revisión':                 'bg-purple-500',
  'Aprobada':                    'bg-green-500',
  'Rechazada':                   'bg-red-500',
  'Relacionada con incidencia':  'bg-rose-500',
}

const COMBUSTIBLE_NIVELES = ['Vacío', '1/4', '1/2', '3/4', 'Lleno']

function CombustibleBar({ nivel }: { nivel: string }) {
  const idx = COMBUSTIBLE_NIVELES.indexOf(nivel)
  const pct = idx < 0 ? 0 : (idx / 4) * 100
  const color = pct < 25 ? 'bg-red-400' : pct < 50 ? 'bg-amber-400' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600 w-10">{nivel}</span>
    </div>
  )
}

function FotoGrid({ fotos, tipo }: { fotos: FotoItem[]; tipo: 'inicial' | 'final' }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {fotos.map((f, i) => {
        const ok = tipo === 'inicial' ? f.inicial : f.final
        return (
          <div key={i} className={`rounded-xl border-2 flex flex-col items-center justify-center aspect-square cursor-pointer transition-all ${
            ok ? 'border-slate-200 bg-slate-100 hover:bg-slate-200' : 'border-dashed border-slate-300 bg-slate-50'
          }`}>
            {ok ? (
              <>
                <CameraIcon className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs text-slate-500 font-medium text-center leading-tight px-1">{f.label}</span>
                <span className="text-xs text-green-600 mt-0.5">✓</span>
              </>
            ) : (
              <>
                <CameraIcon className="w-6 h-6 text-slate-300 mb-1" />
                <span className="text-xs text-slate-400 text-center leading-tight px-1">{f.label}</span>
                <span className="text-xs text-slate-300 mt-0.5">—</span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FotosCompletitudBadge({ fotos }: { fotos: FotoItem[] }) {
  const totalInicial = fotos.filter(f => f.inicial).length
  const totalFinal = fotos.filter(f => f.final).length
  const total = fotos.length
  return (
    <div className="flex gap-3 text-xs">
      <span className={`font-medium ${totalInicial === total ? 'text-green-600' : 'text-amber-600'}`}>Inicial {totalInicial}/{total}</span>
      <span className="text-slate-300">·</span>
      <span className={`font-medium ${totalFinal === total ? 'text-green-600' : 'text-amber-600'}`}>Final {totalFinal}/{total}</span>
    </div>
  )
}

// ─── MODAL DETALLE ────────────────────────────────────────────────────────────
function EvidenciaDetalle({
  ev, onClose,
}: {
  ev: EvidenciaViaje
  onClose: () => void
}) {
  const [estatus, setEstatus] = useState<EstatusEvidencia>(ev.estatus)
  const [aclaracion, setAclaracion] = useState(ev.notaAclaracion)
  const [editAcl, setEditAcl] = useState(false)
  const [incVinc, setIncVinc] = useState(ev.incidenciaVinculada)
  const [editInc, setEditInc] = useState(false)
  const [historial, setHistorial] = useState(ev.historial)
  const [vista, setVista] = useState<'comparar' | 'inicial' | 'final'>('comparar')

  const addHistorial = (evento: string) =>
    setHistorial(h => [...h, { evento, hora: 'Ahora', actor: 'Admin' }])

  const aprobar = () => { setEstatus('Aprobada'); addHistorial('Evidencia aprobada') }
  const rechazar = () => { setEstatus('Rechazada'); addHistorial('Evidencia rechazada') }
  const marcarIncompleta = () => { setEstatus('Incompleta'); addHistorial('Marcada como incompleta') }
  const enviarRevision = () => { setEstatus('En revisión'); addHistorial('Enviada a revisión') }

  const kmRecorrido = ev.kmInicial && ev.kmFinal ? ev.kmFinal - ev.kmInicial : null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl">

        {/* Header */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
                <ChevronLeftIcon className="w-4 h-4 text-slate-500" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-800 text-lg">Evidencia {ev.id}</h2>
                  <span className="text-slate-400">·</span>
                  <span className="font-semibold text-blue-600">{ev.viajeId}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${estatusStyle[estatus]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${estatusDot[estatus]}`} />
                    {estatus}
                  </span>
                  <span className="text-xs text-slate-400">{ev.conductor} · {ev.vehiculo} · {ev.placas}</span>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={aprobar}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <CheckCircleIcon className="w-3.5 h-3.5" />Aprobar
              </button>
              <button onClick={marcarIncompleta}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" />Incompleta
              </button>
              <button onClick={rechazar}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <XCircleIcon className="w-3.5 h-3.5" />Rechazar
              </button>
              <button onClick={() => { setEditAcl(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5" />Solicitar aclaración
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />Descargar
              </button>
              <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* ── COMPARADOR FOTOS ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <CameraIcon className="w-4 h-4 text-slate-500" />
                Fotografías del Vehículo
              </h3>
              <div className="flex gap-1.5 bg-slate-100 rounded-lg p-1">
                {([['comparar','Comparar'],['inicial','Solo inicial'],['final','Solo final']] as [typeof vista, string][]).map(([v, l]) => (
                  <button key={v} onClick={() => setVista(v)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${vista === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {vista === 'comparar' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-700">📸 Evidencia Inicial</p>
                    <span className="text-xs text-slate-400">{ev.fotos.filter(f=>f.inicial).length}/{ev.fotos.length} fotos</span>
                  </div>
                  <FotoGrid fotos={ev.fotos} tipo="inicial" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-700">📸 Evidencia Final</p>
                    <span className="text-xs text-slate-400">{ev.fotos.filter(f=>f.final).length}/{ev.fotos.length} fotos</span>
                  </div>
                  <FotoGrid fotos={ev.fotos} tipo="final" />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  📸 {vista === 'inicial' ? 'Evidencia Inicial' : 'Evidencia Final'}
                  <span className="text-xs text-slate-400 font-normal ml-2">
                    {vista === 'inicial' ? ev.fotos.filter(f=>f.inicial).length : ev.fotos.filter(f=>f.final).length}/{ev.fotos.length} fotos
                  </span>
                </p>
                <FotoGrid fotos={ev.fotos} tipo={vista as 'inicial'|'final'} />
              </div>
            )}
          </div>

          {/* ── DATOS OPERATIVOS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Kilometraje */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-4">🛣️ Kilometraje</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Km inicial</span>
                  <span className="font-mono font-semibold text-slate-800">{ev.kmInicial?.toLocaleString() ?? '—'} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Km final</span>
                  <span className="font-mono font-semibold text-slate-800">{ev.kmFinal?.toLocaleString() ?? '—'} km</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Recorrido total</span>
                  <span className={`font-mono font-bold text-base ${kmRecorrido ? 'text-blue-600' : 'text-slate-300'}`}>
                    {kmRecorrido ? `${kmRecorrido.toLocaleString()} km` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Combustible */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-4">⛽ Nivel de Combustible</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Al recibir</span>
                    <span className="text-xs text-slate-500">{ev.combustibleInicial}</span>
                  </div>
                  <CombustibleBar nivel={ev.combustibleInicial} />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Al entregar</span>
                    <span className="text-xs text-slate-500">{ev.combustibleFinal}</span>
                  </div>
                  <CombustibleBar nivel={ev.combustibleFinal} />
                </div>
              </div>
            </div>

            {/* Llaves */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-4">🔑 Llaves</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Recibidas', value: ev.llavesRecibidas, icon: '⬇️' },
                  { label: 'Entregadas', value: ev.llavesEntregadas, icon: '⬆️' },
                ].map((l, i) => (
                  <div key={i} className="text-center border border-slate-100 rounded-xl p-3">
                    <p className="text-2xl mb-1">{l.icon}</p>
                    <p className="text-2xl font-bold text-slate-800">{l.value}</p>
                    <p className="text-xs text-slate-400">{l.label}</p>
                    {l.value === 0 && <p className="text-xs text-red-500 mt-0.5">⚠ No registradas</p>}
                  </div>
                ))}
              </div>
              {ev.llavesRecibidas !== ev.llavesEntregadas && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700 font-medium">
                  ⚠ Discrepancia en número de llaves
                </div>
              )}
            </div>

            {/* Placas + Firmas */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-4">📋 Verificación</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Placas del vehículo</span>
                  <span className="font-mono font-bold text-slate-800">{ev.placas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Firma inicial</span>
                  {ev.firmaInicial
                    ? <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" />Firmado</span>
                    : <span className="text-xs text-red-500 font-semibold flex items-center gap-1"><XCircleIcon className="w-3.5 h-3.5" />Pendiente</span>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Firma final / Confirmación</span>
                  {ev.firmaFinal
                    ? <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" />Firmado</span>
                    : <span className="text-xs text-red-500 font-semibold flex items-center gap-1"><XCircleIcon className="w-3.5 h-3.5" />Pendiente</span>}
                </div>
              </div>
            </div>
          </div>

          {/* ── DAÑOS VISIBLES ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-4">🔍 Daños Visibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Al recibir el vehículo</p>
                <div className={`rounded-xl border p-3 text-sm ${ev.dañosIniciales === 'Sin daños.' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                  {ev.dañosIniciales || '—'}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Al entregar el vehículo</p>
                <div className={`rounded-xl border p-3 text-sm ${ev.dañosFinales === 'Sin daños adicionales.' || ev.dañosFinales === 'Sin daños.' ? 'bg-green-50 border-green-100 text-green-700' : ev.dañosFinales === '—' ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-red-50 border-red-100 text-red-800'}`}>
                  {ev.dañosFinales || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* ── REVISIÓN ADMINISTRATIVA ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm">⚙️ Revisión Administrativa</h3>

            {/* Aclaración al conductor */}
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Aclaración solicitada al conductor</p>
              {editAcl ? (
                <div className="space-y-2">
                  <textarea rows={2} value={aclaracion} onChange={e => setAclaracion(e.target.value)}
                    placeholder="Escribe la aclaración o comentario para el conductor..."
                    className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditAcl(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={() => { setEditAcl(false); addHistorial('Aclaración enviada al conductor') }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors">
                      <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5" />Enviar
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`rounded-xl border p-3 text-sm cursor-pointer hover:border-indigo-300 transition-colors ${aclaracion ? 'bg-indigo-50 border-indigo-100 text-indigo-800' : 'bg-slate-50 border-slate-200 text-slate-400 italic'}`}
                  onClick={() => setEditAcl(true)}>
                  {aclaracion || 'Sin aclaración pendiente. Clic para agregar.'}
                </div>
              )}
            </div>

            {/* Vincular a incidencia */}
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Incidencia vinculada</p>
              {editInc ? (
                <div className="flex gap-2">
                  <input type="text" value={incVinc} onChange={e => setIncVinc(e.target.value)}
                    placeholder="Ej. #INC-005"
                    className="flex-1 border border-rose-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  <button onClick={() => { setEditInc(false); if (incVinc) { setEstatus('Relacionada con incidencia'); addHistorial(`Vinculada a ${incVinc}`) } }}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors">
                    <LinkIcon className="w-3.5 h-3.5" />Vincular
                  </button>
                  <button onClick={() => setEditInc(false)} className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">✕</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${incVinc ? 'bg-rose-50 border-rose-100 text-rose-700 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400 italic'}`}>
                    <LinkIcon className="w-4 h-4" />
                    {incVinc || 'Sin incidencia vinculada'}
                  </div>
                  <button onClick={() => setEditInc(true)}
                    className="text-xs text-blue-600 hover:underline ml-3">
                    {incVinc ? 'Cambiar' : 'Asociar'}
                  </button>
                </div>
              )}
            </div>

            {/* Cambiar estatus */}
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Cambiar estatus manualmente</p>
              <div className="flex flex-wrap gap-2">
                {(['Pendiente','Completa','Incompleta','En revisión','Aprobada','Rechazada','Relacionada con incidencia'] as EstatusEvidencia[]).map(e => (
                  <button key={e} onClick={() => { setEstatus(e); addHistorial(`Estatus cambiado a: ${e}`) }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${estatus === e ? estatusStyle[e] + ' border-current' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── HISTORIAL ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-slate-400" />
              Historial de Evidencia
            </h3>
            <ol className="relative border-l-2 border-slate-200 space-y-3 ml-3">
              {historial.map((h, i) => (
                <li key={i} className="ml-5">
                  <span className="absolute -left-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                  <p className="text-sm font-medium text-slate-800">{h.evento}</p>
                  <p className="text-xs text-slate-400">{h.hora} · {h.actor}</p>
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const TODOS_ESTATUS: (EstatusEvidencia | 'Todos')[] = [
  'Todos','Pendiente','Completa','Incompleta','En revisión','Aprobada','Rechazada','Relacionada con incidencia',
]

export default function EvidenciaView() {
  const [search, setSearch]   = useState('')
  const [filtro, setFiltro]   = useState<EstatusEvidencia | 'Todos'>('Todos')
  const [detalle, setDetalle] = useState<EvidenciaViaje | null>(null)
  const [evidencias, setEvidencias] = useState<EvidenciaViaje[]>([])
  const [cargando, setCargando] = useState(true)

  const cargarEvidencias = useCallback(async () => {
    const sb = getSupabaseBrowserClient()
    const { data, error } = await sb
      .from('evidencias')
      .select(`id, estatus, km_inicial, km_final, combustible_inicial, combustible_final, danos_iniciales, danos_finales, nota_aclaracion, created_at, viajes(folio, fecha_programada), conductores(nombre,apellido), vehiculos(marca,modelo,placas)`)
      .order('created_at', { ascending: false })
    if (!error && data) {
      setEvidencias((data as Record<string,unknown>[]).map(e => {
        const v = e.viajes as Record<string,string>|null
        const c = e.conductores as Record<string,string>|null
        const vh = e.vehiculos as Record<string,string>|null
        return {
          id: String(e.id??'').slice(0,8).toUpperCase(),
          viajeId: v?.folio??'—',
          conductor: c?`${c.nombre} ${c.apellido}`:'—',
          vehiculo: vh?`${vh.marca} ${vh.modelo}`:'—',
          placas: vh?.placas??'—',
          fecha: String((e.created_at as string)?.slice(0,10)??''),
          estatus: (e.estatus as EstatusEvidencia)??'Pendiente',
          fotos: [...FOTOS_BASE],
          kmInicial: e.km_inicial as number|null,
          kmFinal: e.km_final as number|null,
          combustibleInicial: String(e.combustible_inicial??''),
          combustibleFinal: String(e.combustible_final??''),
          llavesRecibidas: 1, llavesEntregadas: 1,
          dañosIniciales: String(e.danos_iniciales??''),
          dañosFinales: String(e.danos_finales??''),
          firmaInicial: false, firmaFinal: false,
          notaAclaracion: String(e.nota_aclaracion??''),
          incidenciaVinculada: '', historial: [],
        }
      }))
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargarEvidencias() }, [cargarEvidencias])

  const filtered = evidencias.filter(ev => {
    const q = search.toLowerCase()
    const matchSearch = !q || ev.viajeId.toLowerCase().includes(q) || ev.conductor.toLowerCase().includes(q) || ev.vehiculo.toLowerCase().includes(q) || ev.placas.toLowerCase().includes(q)
    const matchFiltro = filtro === 'Todos' || ev.estatus === filtro
    return matchSearch && matchFiltro
  })

  const counts = TODOS_ESTATUS.reduce((acc, e) => {
    acc[e] = e === 'Todos' ? evidencias.length : evidencias.filter(ev => ev.estatus === e).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6 animate-fade-in">
      {detalle && <EvidenciaDetalle ev={detalle} onClose={() => setDetalle(null)} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {([
          ['Total',                   evidencias.length,                                    'text-slate-800'],
          ['Pendientes',              counts['Pendiente'],                                  'text-slate-500'],
          ['Incompletas',             counts['Incompleta'],                                 'text-amber-600'],
          ['En revisión',             counts['En revisión'],                                'text-purple-600'],
          ['Aprobadas',               counts['Aprobada'],                                   'text-green-600'],
          ['Rechazadas',              counts['Rechazada'],                                  'text-red-600'],
          ['Con incidencia',          counts['Relacionada con incidencia'],                 'text-rose-600'],
        ] as [string, number, string][]).map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros + tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {TODOS_ESTATUS.map(e => (
              <button key={e} onClick={() => setFiltro(e as EstatusEvidencia | 'Todos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filtro === e ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {e !== 'Todos' && <span className={`w-1.5 h-1.5 rounded-full ${filtro === e ? 'bg-white' : estatusDot[e as EstatusEvidencia]}`} />}
                {e}
                <span className={`text-xs px-1 rounded ${filtro === e ? 'text-white/70' : 'text-slate-400'}`}>{counts[e]}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar por viaje, conductor, vehículo..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Viaje</th>
                <th className="px-4 py-3">Conductor / Vehículo</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-center">Fotos inicial</th>
                <th className="px-4 py-3 text-center">Fotos final</th>
                <th className="px-4 py-3 text-center">Km</th>
                <th className="px-4 py-3 text-center">Firmas</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-slate-400 italic text-sm">Sin resultados.</td></tr>
              )}
              {filtered.map((ev, i) => {
                const fotosInicial = ev.fotos.filter(f => f.inicial).length
                const fotosFinal   = ev.fotos.filter(f => f.final).length
                const total        = ev.fotos.length
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setDetalle(ev)}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{ev.id}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{ev.viajeId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{ev.conductor}</div>
                      <div className="text-xs text-slate-400">{ev.vehiculo} · {ev.placas}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{ev.fecha}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold ${fotosInicial === total ? 'text-green-600' : fotosInicial > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                        {fotosInicial}/{total}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold ${fotosFinal === total ? 'text-green-600' : fotosFinal > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                        {fotosFinal}/{total}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ev.kmInicial && ev.kmFinal
                        ? <span className="text-xs font-mono text-slate-700">{(ev.kmFinal - ev.kmInicial).toLocaleString()} km</span>
                        : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1">
                        {ev.firmaInicial
                          ? <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          : <XCircleIcon className="w-4 h-4 text-slate-300" />}
                        {ev.firmaFinal
                          ? <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          : <XCircleIcon className="w-4 h-4 text-slate-300" />}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${estatusStyle[ev.estatus]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${estatusDot[ev.estatus]}`} />
                        {ev.estatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDetalle(ev)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        Revisar
                      </button>
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
