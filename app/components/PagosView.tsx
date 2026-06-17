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
  BanknotesIcon,
  ReceiptRefundIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type EstatusPago = 'Pendiente' | 'En revisión' | 'Aprobado' | 'Rechazado' | 'Pagado' | 'Revocado' | 'Ajustado'

interface PagoUsuario {
  id: string
  viajeId: string
  usuario: string
  empresa: string
  tarifa: number
  metodoPago: string
  estatus: EstatusPago
  fechaPago: string
  requiereFactura: boolean
  folio: string
  notas: string
  // raw
  _id?: string
}

interface PagoConductor {
  id: string
  conductor: string
  semana: string
  viajesRevisados: number
  ganancias: number
  gastosReportados: number
  gastosAutorizados: number
  ajustes: number
  depositoEsperado: number
  fechaPago: string
  estatus: EstatusPago
  notas: string
  _id?: string
}

interface Gasto {
  id: string
  concepto: string
  viajeId: string
  conductor: string
  comprobante: string
  monto: number
  estatus: EstatusPago
  aprobadoPor: string
  fecha: string
  notas: string
  _id?: string
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const estatusStyle: Record<EstatusPago, string> = {
  Pendiente:     'bg-slate-100 text-slate-500',
  'En revisión': 'bg-purple-100 text-purple-700',
  Aprobado:      'bg-blue-100 text-blue-700',
  Rechazado:     'bg-red-100 text-red-700',
  Pagado:        'bg-green-100 text-green-700',
  Revocado:      'bg-orange-100 text-orange-700',
  Ajustado:      'bg-amber-100 text-amber-700',
}
const estatusDot: Record<EstatusPago, string> = {
  Pendiente:     'bg-slate-400',
  'En revisión': 'bg-purple-500',
  Aprobado:      'bg-blue-500',
  Rechazado:     'bg-red-500',
  Pagado:        'bg-green-500',
  Revocado:      'bg-orange-500',
  Ajustado:      'bg-amber-500',
}
const TODOS_ESTATUS: EstatusPago[] = ['Pendiente','En revisión','Aprobado','Rechazado','Pagado','Revocado','Ajustado']
const METODOS = ['Transferencia','SPEI','Tarjeta crédito','Tarjeta débito','Efectivo','Cheque']

function EBadge({ e }: { e: EstatusPago }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${estatusStyle[e]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${estatusDot[e]}`} />
      {e}
    </span>
  )
}

function EstatusSelector({ value, onChange }: { value: EstatusPago; onChange: (e: EstatusPago) => void }) {
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

// ─── DETALLE PAGO USUARIO ─────────────────────────────────────────────────────
function DetallePagoUsuario({ pago, onClose, onSave }: { pago: PagoUsuario; onClose: () => void; onSave: () => void }) {
  const [estatus, setEstatus] = useState<EstatusPago>(pago.estatus)
  const [notas, setNotas] = useState(pago.notas)
  const [editNota, setEditNota] = useState(false)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    if (!pago._id) return
    setGuardando(true)
    const sb = await getSB()
    await sb.from('pagos_usuarios').update({ estatus, notas, updated_at: new Date().toISOString() }).eq('id', pago._id)
    setGuardando(false)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeftIcon className="w-4 h-4 text-slate-500" /></button>
            <div>
              <h2 className="font-bold text-slate-800">{pago.id} · {pago.viajeId}</h2>
              <div className="flex items-center gap-2 mt-0.5"><EBadge e={estatus} /></div>
            </div>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <Sec title="💳 Pago del Usuario">
            <G2>
              <F label="Viaje" value={<span className="font-semibold text-blue-600">{pago.viajeId}</span>} />
              <F label="Usuario" value={pago.usuario} />
              <F label="Empresa" value={pago.empresa || '—'} />
              <F label="Tarifa cobrada" value={<span className="text-xl font-bold text-slate-800">${pago.tarifa.toLocaleString()} MXN</span>} />
              <F label="Método de pago" value={pago.metodoPago} />
              <F label="Fecha de pago" value={pago.fechaPago} />
              <F label="Facturación" value={pago.requiereFactura
                ? <span className="text-blue-600 font-medium">✓ Requiere factura</span>
                : <span className="text-slate-400">No aplica</span>} />
              {pago.requiereFactura && <F label="Folio / UUID" value={<span className="font-mono text-xs">{pago.folio}</span>} />}
            </G2>
          </Sec>

          <Sec title="⚙️ Cambiar Estatus">
            <EstatusSelector value={estatus} onChange={setEstatus} />
          </Sec>

          <Sec title="📝 Notas">
            {editNota ? (
              <div className="space-y-2">
                <textarea rows={3} value={notas} onChange={e => setNotas(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditNota(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button onClick={() => setEditNota(false)} className="bg-blue-600 text-white px-4 py-1.5 text-xs rounded-lg font-medium">OK</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setEditNota(true)}
                className={`rounded-xl border p-3 text-sm cursor-pointer hover:border-blue-300 transition-colors ${notas ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-400 italic'}`}>
                {notas || 'Sin notas. Clic para agregar.'}
              </div>
            )}
          </Sec>

          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button onClick={guardar} disabled={guardando}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <CheckCircleIcon className="w-4 h-4" />{guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DETALLE PAGO CONDUCTOR ───────────────────────────────────────────────────
function DetallePagoConductor({ pago, onClose, onSave }: { pago: PagoConductor; onClose: () => void; onSave: () => void }) {
  const [estatus, setEstatus] = useState<EstatusPago>(pago.estatus)
  const [notas, setNotas] = useState(pago.notas)
  const [guardando, setGuardando] = useState(false)
  const deposito = pago.ganancias + pago.gastosAutorizados + pago.ajustes

  async function guardar() {
    if (!pago._id) return
    setGuardando(true)
    const sb = await getSB()
    await sb.from('pagos_conductores').update({ estatus, notas, updated_at: new Date().toISOString() }).eq('id', pago._id)
    setGuardando(false)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeftIcon className="w-4 h-4 text-slate-500" /></button>
            <div>
              <h2 className="font-bold text-slate-800">{pago.id} · {pago.conductor}</h2>
              <div className="flex items-center gap-2 mt-0.5"><EBadge e={estatus} /><span className="text-xs text-slate-400">{pago.semana}</span></div>
            </div>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <Sec title="👤 Detalle del Pago">
            <G2>
              <F label="Conductor" value={pago.conductor} />
              <F label="Semana" value={pago.semana} />
              <F label="Viajes revisados" value={<span className="font-bold text-slate-800 text-lg">{pago.viajesRevisados}</span>} />
              <F label="Ganancias brutas" value={<span className="font-semibold text-slate-800">${pago.ganancias.toLocaleString()} MXN</span>} />
              <F label="Gastos reportados" value={`$${pago.gastosReportados.toLocaleString()} MXN`} />
              <F label="Gastos autorizados" value={<span className="text-green-600 font-medium">${pago.gastosAutorizados.toLocaleString()} MXN</span>} />
              <F label="Ajustes" value={<span className={pago.ajustes < 0 ? 'text-red-600 font-medium' : 'text-slate-600'}>{pago.ajustes >= 0 ? '+' : ''}${pago.ajustes.toLocaleString()} MXN</span>} />
              <F label="Fecha de pago" value={pago.fechaPago} />
            </G2>
            <div className={`mt-4 rounded-xl border p-4 flex items-center justify-between ${deposito >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div>
                <p className="text-xs text-slate-500 font-medium">Depósito esperado</p>
                <p className={`text-2xl font-bold ${deposito >= 0 ? 'text-green-700' : 'text-red-700'}`}>${deposito.toLocaleString()} MXN</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>${pago.ganancias.toLocaleString()}</p>
                <p>+ ${pago.gastosAutorizados.toLocaleString()}</p>
                {pago.ajustes !== 0 && <p className={pago.ajustes < 0 ? 'text-red-500' : 'text-green-500'}>{pago.ajustes >= 0 ? '+' : ''}${pago.ajustes.toLocaleString()}</p>}
              </div>
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
            <button onClick={guardar} disabled={guardando}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <CheckCircleIcon className="w-4 h-4" />{guardando ? 'Guardando...' : 'Confirmar depósito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DETALLE GASTO ────────────────────────────────────────────────────────────
function DetalleGasto({ gasto, onClose, onSave }: { gasto: Gasto; onClose: () => void; onSave: () => void }) {
  const [estatus, setEstatus] = useState<EstatusPago>(gasto.estatus)
  const [aprobado, setAprobado] = useState(gasto.aprobadoPor)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    if (!gasto._id) return
    setGuardando(true)
    const sb = await getSB()
    await sb.from('gastos').update({ estatus, aprobado_por: aprobado, updated_at: new Date().toISOString() }).eq('id', gasto._id)
    setGuardando(false)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeftIcon className="w-4 h-4 text-slate-500" /></button>
            <div>
              <h2 className="font-bold text-slate-800">{gasto.id} · {gasto.concepto}</h2>
              <div className="flex gap-2 mt-0.5"><EBadge e={estatus} /></div>
            </div>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <Sec title="🧾 Detalle del Gasto">
            <G2>
              <F label="Concepto" value={gasto.concepto} />
              <F label="Viaje relacionado" value={<span className="font-semibold text-blue-600">{gasto.viajeId}</span>} />
              <F label="Conductor / Equipo" value={gasto.conductor} />
              <F label="Comprobante" value={<span className="font-mono text-xs">{gasto.comprobante}</span>} />
              <F label="Monto" value={<span className="text-xl font-bold text-slate-800">${gasto.monto.toLocaleString()} MXN</span>} />
              <F label="Fecha" value={gasto.fecha} />
            </G2>
            {gasto.notas && (
              <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-900">{gasto.notas}</div>
            )}
          </Sec>

          <Sec title="✅ Aprobación">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Aprobado por</p>
                <select value={aprobado} onChange={e => setAprobado(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="—">Sin asignar</option>
                  {['Ops. Central','Coordinador','Admin','Finanzas'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </Sec>

          <Sec title="⚙️ Cambiar Estatus">
            <EstatusSelector value={estatus} onChange={setEstatus} />
          </Sec>

          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button onClick={() => { setEstatus('Rechazado'); guardar() }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors">
              <XCircleIcon className="w-4 h-4" />Rechazar
            </button>
            <button onClick={guardar} disabled={guardando}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <CheckCircleIcon className="w-4 h-4" />{guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── NUEVO PAGO FORM ──────────────────────────────────────────────────────────
type NuevoPagoTipo = 'usuario' | 'conductor' | 'gasto'

function NuevoPagoForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [tipo, setTipo] = useState<NuevoPagoTipo>('usuario')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    viaje: '', usuario: '', empresa: '', tarifa: '', metodoPago: '', factura: 'no',
    conductor: '', semana: '', viajesRevisados: '', ganancias: '', gastosAut: '', ajustes: '',
    concepto: '', comprobante: '', monto: '', aprobadoPor: '',
    fecha: new Date().toISOString().slice(0,10), notas: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function guardar() {
    setError('')
    setGuardando(true)
    try {
      const sb = await getSB()
      if (tipo === 'usuario') {
        const { error: e } = await sb.from('pagos_usuarios').insert({
          viaje_folio: form.viaje, usuario_nombre: form.usuario, empresa_nombre: form.empresa,
          tarifa: parseFloat(form.tarifa) || 0, metodo_pago: form.metodoPago,
          requiere_factura: form.factura === 'si', estatus: 'Pendiente',
          fecha_pago: form.fecha || null, notas: form.notas,
        })
        if (e) throw e
      } else if (tipo === 'conductor') {
        const { error: e } = await sb.from('pagos_conductores').insert({
          conductor_nombre: form.conductor, semana: form.semana,
          viajes_revisados: parseInt(form.viajesRevisados) || 0,
          ganancias: parseFloat(form.ganancias) || 0,
          gastos_autorizados: parseFloat(form.gastosAut) || 0,
          ajustes: parseFloat(form.ajustes) || 0,
          estatus: 'Pendiente', notas: form.notas,
        })
        if (e) throw e
      } else {
        const { error: e } = await sb.from('gastos').insert({
          concepto: form.concepto, viaje_folio: form.viaje,
          conductor_nombre: form.conductor, comprobante: form.comprobante,
          monto: parseFloat(form.monto) || 0, aprobado_por: form.aprobadoPor || '—',
          estatus: 'Pendiente', fecha: form.fecha, notas: form.notas,
        })
        if (e) throw e
      }
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
          <h2 className="font-bold text-slate-800 text-lg">Nuevo Registro de Pago</h2>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-2">
            {([['usuario','💳 Pago usuario'],['conductor','👤 Pago conductor'],['gasto','🧾 Gasto']] as [NuevoPagoTipo, string][]).map(([t, l]) => (
              <button key={t} onClick={() => setTipo(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${tipo === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><L c="Viaje relacionado" req /><input type="text" placeholder="#TR-0000" value={form.viaje} onChange={e => set('viaje', e.target.value)} className={inputCls} /></div>
            {tipo === 'usuario' && <>
              <div><L c="Usuario" req /><input type="text" placeholder="Nombre" value={form.usuario} onChange={e => set('usuario', e.target.value)} className={inputCls} /></div>
              <div><L c="Empresa" /><input type="text" placeholder="Empresa o —" value={form.empresa} onChange={e => set('empresa', e.target.value)} className={inputCls} /></div>
              <div><L c="Tarifa" req /><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span><input type="number" min="0" value={form.tarifa} onChange={e => set('tarifa', e.target.value)} className={`${inputCls} pl-7`} /></div></div>
              <div><L c="Método de pago" req />
                <select value={form.metodoPago} onChange={e => set('metodoPago', e.target.value)} className={selectCls}><option value="">Seleccionar...</option>{METODOS.map(m => <option key={m}>{m}</option>)}</select>
              </div>
              <div><L c="Facturación" />
                <select value={form.factura} onChange={e => set('factura', e.target.value)} className={selectCls}><option value="no">No requiere</option><option value="si">Sí requiere</option></select>
              </div>
            </>}
            {tipo === 'conductor' && <>
              <div><L c="Conductor" req /><input type="text" placeholder="Nombre" value={form.conductor} onChange={e => set('conductor', e.target.value)} className={inputCls} /></div>
              <div><L c="Semana / Periodo" req /><input type="text" placeholder="01-07 Jun 2025" value={form.semana} onChange={e => set('semana', e.target.value)} className={inputCls} /></div>
              <div><L c="Viajes revisados" req /><input type="number" min="0" value={form.viajesRevisados} onChange={e => set('viajesRevisados', e.target.value)} className={inputCls} /></div>
              <div><L c="Ganancias" req /><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span><input type="number" min="0" value={form.ganancias} onChange={e => set('ganancias', e.target.value)} className={`${inputCls} pl-7`} /></div></div>
              <div><L c="Gastos autorizados" /><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span><input type="number" min="0" value={form.gastosAut} onChange={e => set('gastosAut', e.target.value)} className={`${inputCls} pl-7`} /></div></div>
              <div><L c="Ajustes" /><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span><input type="number" value={form.ajustes} onChange={e => set('ajustes', e.target.value)} className={`${inputCls} pl-7`} /></div></div>
            </>}
            {tipo === 'gasto' && <>
              <div><L c="Concepto" req /><input type="text" placeholder="Casetas, gasolina..." value={form.concepto} onChange={e => set('concepto', e.target.value)} className={inputCls} /></div>
              <div><L c="Conductor / Equipo" req /><input type="text" placeholder="Nombre" value={form.conductor} onChange={e => set('conductor', e.target.value)} className={inputCls} /></div>
              <div><L c="Comprobante" /><input type="text" placeholder="Número o folio" value={form.comprobante} onChange={e => set('comprobante', e.target.value)} className={inputCls} /></div>
              <div><L c="Monto" req /><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span><input type="number" min="0" value={form.monto} onChange={e => set('monto', e.target.value)} className={`${inputCls} pl-7`} /></div></div>
              <div><L c="Aprobado por" />
                <select value={form.aprobadoPor} onChange={e => set('aprobadoPor', e.target.value)} className={selectCls}><option value="">Sin asignar</option>{['Ops. Central','Coordinador','Admin','Finanzas'].map(r => <option key={r}>{r}</option>)}</select>
              </div>
            </>}
            <div><L c="Fecha" /><input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className={inputCls} /></div>
          </div>
          <div><L c="Notas" /><textarea rows={2} placeholder="Observaciones adicionales..." value={form.notas} onChange={e => set('notas', e.target.value)} className={inputCls} /></div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckCircleIcon className="w-4 h-4" />{guardando ? 'Guardando...' : 'Guardar registro'}
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
type MainTab = 'usuarios' | 'conductores' | 'gastos'

export default function PagosView() {
  const [tab, setTab] = useState<MainTab>('usuarios')
  const [search, setSearch] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusPago | 'Todos'>('Todos')
  const [detalleU, setDetalleU] = useState<PagoUsuario | null>(null)
  const [detalleC, setDetalleC] = useState<PagoConductor | null>(null)
  const [detalleG, setDetalleG] = useState<Gasto | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [cargando, setCargando] = useState(true)

  const [pagosUsuarios, setPagosUsuarios] = useState<PagoUsuario[]>([])
  const [pagosConductores, setPagosConductores] = useState<PagoConductor[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])

  const cargar = useCallback(async () => {
    setCargando(true)
    const sb = await getSB()

    const [{ data: pu }, { data: pc }, { data: gs }] = await Promise.all([
      sb.from('pagos_usuarios').select('*').order('created_at', { ascending: false }),
      sb.from('pagos_conductores').select('*').order('created_at', { ascending: false }),
      sb.from('gastos').select('*').order('created_at', { ascending: false }),
    ])

    setPagosUsuarios((pu ?? []).map((r: Record<string, unknown>) => ({
      _id: r.id as string,
      id: `PU-${String(r.id as string).slice(-4).toUpperCase()}`,
      viajeId: (r.viaje_folio as string) || '—',
      usuario: (r.usuario_nombre as string) || '—',
      empresa: (r.empresa_nombre as string) || '—',
      tarifa: (r.tarifa as number) || 0,
      metodoPago: (r.metodo_pago as string) || '—',
      estatus: (r.estatus as EstatusPago) || 'Pendiente',
      fechaPago: fmt(r.fecha_pago as string),
      requiereFactura: !!(r.requiere_factura),
      folio: (r.folio_factura as string) || '—',
      notas: (r.notas as string) || '',
    })))

    setPagosConductores((pc ?? []).map((r: Record<string, unknown>) => ({
      _id: r.id as string,
      id: `PC-${String(r.id as string).slice(-4).toUpperCase()}`,
      conductor: (r.conductor_nombre as string) || '—',
      semana: (r.semana as string) || '—',
      viajesRevisados: (r.viajes_revisados as number) || 0,
      ganancias: (r.ganancias as number) || 0,
      gastosReportados: (r.gastos_reportados as number) || 0,
      gastosAutorizados: (r.gastos_autorizados as number) || 0,
      ajustes: (r.ajustes as number) || 0,
      depositoEsperado: ((r.ganancias as number) || 0) + ((r.gastos_autorizados as number) || 0) + ((r.ajustes as number) || 0),
      fechaPago: fmt(r.fecha_pago as string),
      estatus: (r.estatus as EstatusPago) || 'Pendiente',
      notas: (r.notas as string) || '',
    })))

    setGastos((gs ?? []).map((r: Record<string, unknown>) => ({
      _id: r.id as string,
      id: `GS-${String(r.id as string).slice(-4).toUpperCase()}`,
      concepto: (r.concepto as string) || '—',
      viajeId: (r.viaje_folio as string) || '—',
      conductor: (r.conductor_nombre as string) || '—',
      comprobante: (r.comprobante as string) || '—',
      monto: (r.monto as number) || 0,
      estatus: (r.estatus as EstatusPago) || 'Pendiente',
      aprobadoPor: (r.aprobado_por as string) || '—',
      fecha: fmt(r.fecha as string),
      notas: (r.notas as string) || '',
    })))

    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const filtrar = <T extends { estatus: EstatusPago }>(list: T[], extraMatch: (i: T) => boolean) =>
    list.filter(i => {
      const matchE = filtroEstatus === 'Todos' || i.estatus === filtroEstatus
      return matchE && extraMatch(i)
    })

  const q = search.toLowerCase()
  const filtUsuarios    = filtrar(pagosUsuarios,    u => !q || u.usuario.toLowerCase().includes(q) || u.viajeId.toLowerCase().includes(q) || u.empresa.toLowerCase().includes(q))
  const filtConductores = filtrar(pagosConductores, c => !q || c.conductor.toLowerCase().includes(q) || c.semana.toLowerCase().includes(q))
  const filtGastos      = filtrar(gastos,           g => !q || g.concepto.toLowerCase().includes(q) || g.viajeId.toLowerCase().includes(q) || g.conductor.toLowerCase().includes(q))

  const totalPagadoU = pagosUsuarios.filter(p => p.estatus === 'Pagado').reduce((s,p) => s+p.tarifa, 0)
  const totalPendU   = pagosUsuarios.filter(p => ['Pendiente','Aprobado'].includes(p.estatus)).reduce((s,p) => s+p.tarifa, 0)
  const totalPagadoC = pagosConductores.filter(p => p.estatus === 'Pagado').reduce((s,p) => s+p.depositoEsperado, 0)
  const totalPendC   = pagosConductores.filter(p => ['Pendiente','Aprobado'].includes(p.estatus)).reduce((s,p) => s+p.depositoEsperado, 0)
  const totalGastos  = gastos.filter(g => g.estatus === 'Aprobado').reduce((s,g) => s+g.monto, 0)

  const mainTabs: { id: MainTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'usuarios',    label: 'Pagos de Usuarios',    icon: <ReceiptRefundIcon className="w-4 h-4" />,      count: pagosUsuarios.length },
    { id: 'conductores', label: 'Pagos a Conductores',  icon: <BanknotesIcon className="w-4 h-4" />,          count: pagosConductores.length },
    { id: 'gastos',      label: 'Gastos Operativos',    icon: <BuildingStorefrontIcon className="w-4 h-4" />, count: gastos.length },
  ]

  const currentList = tab === 'usuarios' ? pagosUsuarios : tab === 'conductores' ? pagosConductores : gastos

  const SkRow = () => (
    <tr className="animate-pulse">
      {Array.from({length: tab === 'conductores' ? 11 : 9}).map((_,i) => (
        <td key={i} className="px-4 py-3"><div className="h-3 bg-slate-200 rounded w-full" /></td>
      ))}
    </tr>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {detalleU && <DetallePagoUsuario pago={detalleU} onClose={() => setDetalleU(null)} onSave={cargar} />}
      {detalleC && <DetallePagoConductor pago={detalleC} onClose={() => setDetalleC(null)} onSave={cargar} />}
      {detalleG && <DetalleGasto gasto={detalleG} onClose={() => setDetalleG(null)} onSave={cargar} />}
      {showForm && <NuevoPagoForm onClose={() => setShowForm(false)} onSave={cargar} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Cobrado a usuarios', value: `$${totalPagadoU.toLocaleString()}`, sub: 'pagado', color: 'text-green-600', icon: <ReceiptRefundIcon className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
          { label: 'Por cobrar usuarios', value: `$${totalPendU.toLocaleString()}`, sub: 'pendiente / aprobado', color: 'text-amber-600', icon: <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50' },
          { label: 'Pagado a conductores', value: `$${totalPagadoC.toLocaleString()}`, sub: 'depositado', color: 'text-blue-600', icon: <BanknotesIcon className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Por pagar conductores', value: `$${totalPendC.toLocaleString()}`, sub: 'pendiente / aprobado', color: 'text-purple-600', icon: <BanknotesIcon className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50' },
          { label: 'Gastos aprobados', value: `$${totalGastos.toLocaleString()}`, sub: 'autorizados', color: 'text-rose-600', icon: <DocumentTextIcon className="w-5 h-5 text-rose-500" />, bg: 'bg-rose-50' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-slate-500 font-medium leading-tight">{k.label}</p>
              <div className={`p-1.5 ${k.bg} rounded-lg`}>{k.icon}</div>
            </div>
            {cargando
              ? <div className="h-6 bg-slate-200 rounded w-3/4 animate-pulse" />
              : <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>}
            <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 px-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <div className="flex gap-1">
              {mainTabs.map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setFiltroEstatus('Todos'); setSearch('') }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    tab === t.id ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}>
                  {t.icon}{t.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>{t.count}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 pb-1">
              <button onClick={cargar} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"><ArrowPathIcon className="w-4 h-4" /></button>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
              </div>
              <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />Nuevo
              </button>
            </div>
          </div>

          {/* Estatus chips */}
          <div className="flex flex-wrap gap-1.5 pb-4">
            {(['Todos',...TODOS_ESTATUS] as (EstatusPago | 'Todos')[]).map(e => {
              const count = e === 'Todos' ? currentList.length : currentList.filter(p => p.estatus === e).length
              return (
                <button key={e} onClick={() => setFiltroEstatus(e as EstatusPago | 'Todos')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filtroEstatus === e ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {e !== 'Todos' && <span className={`w-1.5 h-1.5 rounded-full ${filtroEstatus === e ? 'bg-white' : estatusDot[e as EstatusPago]}`} />}
                  {e} <span className="opacity-60">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* TAB: PAGOS USUARIOS */}
        {tab === 'usuarios' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">ID</th><th className="px-4 py-3">Viaje</th>
                  <th className="px-4 py-3">Usuario / Empresa</th><th className="px-4 py-3 text-right">Tarifa</th>
                  <th className="px-4 py-3">Método</th><th className="px-4 py-3 text-center">Factura</th>
                  <th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargando && [1,2,3].map(i => <SkRow key={i} />)}
                {!cargando && filtUsuarios.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-10 text-slate-400 italic text-sm">
                    {pagosUsuarios.length === 0 ? 'Sin registros en Supabase. Crea el primero con + Nuevo.' : 'Sin resultados para el filtro.'}
                  </td></tr>
                )}
                {!cargando && filtUsuarios.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50 cursor-pointer" onClick={() => setDetalleU(p)}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.id}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{p.viajeId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{p.usuario}</div>
                      <div className="text-xs text-slate-400">{p.empresa || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">${p.tarifa.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.metodoPago}</td>
                    <td className="px-4 py-3 text-center">
                      {p.requiereFactura ? <span className="text-xs text-blue-600 font-medium">✓ Sí</span> : <span className="text-xs text-slate-300">No</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.fechaPago}</td>
                    <td className="px-4 py-3"><EBadge e={p.estatus} /></td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDetalleU(p)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium">Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: PAGOS CONDUCTORES */}
        {tab === 'conductores' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">ID</th><th className="px-4 py-3">Conductor</th>
                  <th className="px-4 py-3">Semana</th><th className="px-4 py-3 text-center">Viajes</th>
                  <th className="px-4 py-3 text-right">Ganancias</th><th className="px-4 py-3 text-right">Gs. Auto.</th>
                  <th className="px-4 py-3 text-right">Ajuste</th><th className="px-4 py-3 text-right">Depósito</th>
                  <th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargando && [1,2,3].map(i => <SkRow key={i} />)}
                {!cargando && filtConductores.length === 0 && (
                  <tr><td colSpan={11} className="text-center py-10 text-slate-400 italic text-sm">
                    {pagosConductores.length === 0 ? 'Sin registros en Supabase.' : 'Sin resultados.'}
                  </td></tr>
                )}
                {!cargando && filtConductores.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50 cursor-pointer" onClick={() => setDetalleC(p)}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.conductor}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.semana}</td>
                    <td className="px-4 py-3 text-center font-semibold">{p.viajesRevisados}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${p.ganancias.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-600 text-xs">${p.gastosAutorizados.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-xs"><span className={p.ajustes < 0 ? 'text-red-500' : 'text-slate-500'}>{p.ajustes >= 0 ? '+' : ''}${p.ajustes.toLocaleString()}</span></td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">${p.depositoEsperado.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.fechaPago}</td>
                    <td className="px-4 py-3"><EBadge e={p.estatus} /></td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDetalleC(p)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium">Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: GASTOS */}
        {tab === 'gastos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">ID</th><th className="px-4 py-3">Concepto</th>
                  <th className="px-4 py-3">Viaje</th><th className="px-4 py-3">Conductor / Equipo</th>
                  <th className="px-4 py-3">Comprobante</th><th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Aprobado por</th>
                  <th className="px-4 py-3">Estatus</th><th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargando && [1,2,3].map(i => <SkRow key={i} />)}
                {!cargando && filtGastos.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-10 text-slate-400 italic text-sm">
                    {gastos.length === 0 ? 'Sin registros en Supabase.' : 'Sin resultados.'}
                  </td></tr>
                )}
                {!cargando && filtGastos.map((g, i) => (
                  <tr key={i} className="hover:bg-slate-50 cursor-pointer" onClick={() => setDetalleG(g)}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{g.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{g.concepto}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{g.viajeId}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{g.conductor}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{g.comprobante}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">${g.monto.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{g.fecha}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{g.aprobadoPor}</td>
                    <td className="px-4 py-3"><EBadge e={g.estatus} /></td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDetalleG(g)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium">Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}