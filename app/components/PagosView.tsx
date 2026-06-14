'use client'

import { useState } from 'react'
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
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const PAGOS_USUARIOS: PagoUsuario[] = [
  { id: 'PU-001', viajeId: '#TR-8848', usuario: 'Ricardo Torres', empresa: 'Grupo Logístico CDMX', tarifa: 1200, metodoPago: 'Transferencia', estatus: 'Pendiente', fechaPago: '—', requiereFactura: true, folio: '—', notas: '' },
  { id: 'PU-002', viajeId: '#TR-8841', usuario: 'Luis Hernández', empresa: '—', tarifa: 650, metodoPago: 'Tarjeta crédito', estatus: 'Pagado', fechaPago: '13 Jun 2025', requiereFactura: false, folio: '—', notas: 'Ajuste de $50 aplicado por retraso.' },
  { id: 'PU-003', viajeId: '#TR-8844', usuario: 'Fernanda López', empresa: 'AutoMóviles del Norte SA', tarifa: 950, metodoPago: 'SPEI', estatus: 'En revisión', fechaPago: '—', requiereFactura: true, folio: 'F-2025-0441', notas: 'En espera de resolución de incidencia.' },
  { id: 'PU-004', viajeId: '#TR-8847', usuario: 'Claudia Ríos', empresa: 'Distribuidora Bajío', tarifa: 2200, metodoPago: 'Transferencia', estatus: 'Aprobado', fechaPago: '—', requiereFactura: true, folio: 'F-2025-0442', notas: '' },
  { id: 'PU-005', viajeId: '#TR-8838', usuario: 'Pedro Castillo', empresa: '—', tarifa: 550, metodoPago: 'Efectivo', estatus: 'Ajustado', fechaPago: '12 Jun 2025', requiereFactura: false, folio: '—', notas: 'Cargo del 50% por cancelación tardía. Monto ajustado a $275.' },
  { id: 'PU-006', viajeId: '#TR-8830', usuario: 'Ricardo Torres', empresa: 'Grupo Logístico CDMX', tarifa: 1800, metodoPago: 'Transferencia', estatus: 'Pagado', fechaPago: '10 Jun 2025', requiereFactura: true, folio: 'F-2025-0430', notas: '' },
]

const PAGOS_CONDUCTORES: PagoConductor[] = [
  { id: 'PC-001', conductor: 'Carlos Méndez', semana: '9-14 Jun 2025', viajesRevisados: 8, ganancias: 4900, gastosReportados: 200, gastosAutorizados: 150, ajustes: 0, depositoEsperado: 5050, fechaPago: '—', estatus: 'Pendiente', notas: '' },
  { id: 'PC-002', conductor: 'Ana Rodríguez', semana: '9-14 Jun 2025', viajesRevisados: 6, ganancias: 2660, gastosReportados: 80, gastosAutorizados: 80, ajustes: -50, depositoEsperado: 2690, fechaPago: '—', estatus: 'En revisión', notas: 'Ajuste por incidencia #INC-001.' },
  { id: 'PC-003', conductor: 'Mario García', semana: '9-14 Jun 2025', viajesRevisados: 2, ganancias: 1300, gastosReportados: 0, gastosAutorizados: 150, ajustes: 0, depositoEsperado: 1450, fechaPago: '—', estatus: 'Aprobado', notas: 'Gastos de casetas autorizados.' },
  { id: 'PC-004', conductor: 'Pedro Castillo', semana: '9-14 Jun 2025', viajesRevisados: 1, ganancias: 560, gastosReportados: 80, gastosAutorizados: 0, ajustes: 0, depositoEsperado: 560, fechaPago: '—', estatus: 'Rechazado', notas: 'Pago retenido por incidencias abiertas (#INC-005, #INC-006).' },
  { id: 'PC-005', conductor: 'Carlos Méndez', semana: '1-8 Jun 2025', viajesRevisados: 10, ganancias: 5600, gastosReportados: 0, gastosAutorizados: 0, ajustes: 0, depositoEsperado: 5600, fechaPago: '08 Jun 2025', estatus: 'Pagado', notas: '' },
  { id: 'PC-006', conductor: 'Ana Rodríguez', semana: '1-8 Jun 2025', viajesRevisados: 8, ganancias: 3200, gastosReportados: 0, gastosAutorizados: 0, ajustes: 0, depositoEsperado: 3200, fechaPago: '08 Jun 2025', estatus: 'Pagado', notas: '' },
]

const GASTOS: Gasto[] = [
  { id: 'GS-001', concepto: 'Casetas autopista', viajeId: '#TR-8847', conductor: 'Mario García', comprobante: 'CASET-2025-0221', monto: 150, estatus: 'Aprobado', aprobadoPor: 'Coordinador', fecha: '15 Jun 2025', notas: 'Ruta Querétaro-CDMX.' },
  { id: 'GS-002', concepto: 'Gasolina', viajeId: '#TR-8844', conductor: 'Pedro Castillo', comprobante: 'TICKET-GAS-0044', monto: 80, estatus: 'Rechazado', aprobadoPor: 'Admin', fecha: '14 Jun 2025', notas: 'No corresponde a la ruta del viaje.' },
  { id: 'GS-003', concepto: 'Servicio de grúa de emergencia', viajeId: '#TR-8841', conductor: 'Ana Rodríguez', comprobante: 'GRUA-2025-008', monto: 350, estatus: 'En revisión', aprobadoPor: '—', fecha: '13 Jun 2025', notas: 'Se solicita validación de la necesidad del servicio.' },
  { id: 'GS-004', concepto: 'Casetas autopista', viajeId: '#TR-8815', conductor: 'Carlos Méndez', comprobante: 'CASET-2025-0198', monto: 90, estatus: 'Pagado', aprobadoPor: 'Ops. Central', fecha: '07 Jun 2025', notas: '' },
  { id: 'GS-005', concepto: 'Lavado del vehículo', viajeId: '#TR-8830', conductor: 'Carlos Méndez', comprobante: 'LAVADO-0031', monto: 120, estatus: 'Pendiente', aprobadoPor: '—', fecha: '10 Jun 2025', notas: 'Solicitado por el usuario antes de entrega.' },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const estatusStyle: Record<EstatusPago, string> = {
  Pendiente:   'bg-slate-100 text-slate-500',
  'En revisión': 'bg-purple-100 text-purple-700',
  Aprobado:    'bg-blue-100 text-blue-700',
  Rechazado:   'bg-red-100 text-red-700',
  Pagado:      'bg-green-100 text-green-700',
  Revocado:    'bg-orange-100 text-orange-700',
  Ajustado:    'bg-amber-100 text-amber-700',
}

const estatusDot: Record<EstatusPago, string> = {
  Pendiente:   'bg-slate-400',
  'En revisión': 'bg-purple-500',
  Aprobado:    'bg-blue-500',
  Rechazado:   'bg-red-500',
  Pagado:      'bg-green-500',
  Revocado:    'bg-orange-500',
  Ajustado:    'bg-amber-500',
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

// ─── DETALLE PAGO USUARIO ─────────────────────────────────────────────────────
function DetallePagoUsuario({ pago, onClose }: { pago: PagoUsuario; onClose: () => void }) {
  const [estatus, setEstatus] = useState<EstatusPago>(pago.estatus)
  const [notas, setNotas] = useState(pago.notas)
  const [editNota, setEditNota] = useState(false)

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
                  <button onClick={() => setEditNota(false)} className="bg-blue-600 text-white px-4 py-1.5 text-xs rounded-lg font-medium">Guardar</button>
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
            <button onClick={() => setEstatus('Rechazado')} className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors">
              <XCircleIcon className="w-4 h-4" />Rechazar
            </button>
            <button onClick={() => setEstatus('Pagado')} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <CheckCircleIcon className="w-4 h-4" />Marcar como pagado
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DETALLE PAGO CONDUCTOR ───────────────────────────────────────────────────
function DetallePagoConductor({ pago, onClose }: { pago: PagoConductor; onClose: () => void }) {
  const [estatus, setEstatus] = useState<EstatusPago>(pago.estatus)
  const [notas, setNotas] = useState(pago.notas)
  const deposito = pago.ganancias + pago.gastosAutorizados + pago.ajustes
  const margen = deposito

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
            <div className={`mt-4 rounded-xl border p-4 flex items-center justify-between ${margen >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div>
                <p className="text-xs text-slate-500 font-medium">Depósito esperado</p>
                <p className={`text-2xl font-bold ${margen >= 0 ? 'text-green-700' : 'text-red-700'}`}>${deposito.toLocaleString()} MXN</p>
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

          {notas && (
            <Sec title="📝 Notas">
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-900">{notas}</div>
            </Sec>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={() => setEstatus('Rechazado')} className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors">
              <XCircleIcon className="w-4 h-4" />Rechazar
            </button>
            <button onClick={() => setEstatus('Pagado')} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <CheckCircleIcon className="w-4 h-4" />Confirmar depósito
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DETALLE GASTO ────────────────────────────────────────────────────────────
function DetalleGasto({ gasto, onClose }: { gasto: Gasto; onClose: () => void }) {
  const [estatus, setEstatus] = useState<EstatusPago>(gasto.estatus)
  const [aprobado, setAprobado] = useState(gasto.aprobadoPor)

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
            <button onClick={() => setEstatus('Rechazado')} className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors">
              <XCircleIcon className="w-4 h-4" />Rechazar gasto
            </button>
            <button onClick={() => { setEstatus('Aprobado'); setAprobado(aprobado === '—' ? 'Admin' : aprobado) }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <CheckCircleIcon className="w-4 h-4" />Aprobar gasto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── NUEVO PAGO FORM ──────────────────────────────────────────────────────────
type NuevoPagoTipo = 'usuario' | 'conductor' | 'gasto'

function NuevoPagoForm({ onClose }: { onClose: () => void }) {
  const [tipo, setTipo] = useState<NuevoPagoTipo>('usuario')

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
          {/* Tipo selector */}
          <div className="flex gap-2">
            {([['usuario','💳 Pago usuario'],['conductor','👤 Pago conductor'],['gasto','🧾 Gasto']] as [NuevoPagoTipo, string][]).map(([t, l]) => (
              <button key={t} onClick={() => setTipo(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${tipo === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Campos comunes */}
          <div className="grid grid-cols-2 gap-4">
            <div><L c="Viaje relacionado" req /><input type="text" placeholder="#TR-0000" className={inputCls} /></div>
            {tipo === 'usuario' && <>
              <div><L c="Usuario" req /><input type="text" placeholder="Nombre" className={inputCls} /></div>
              <div><L c="Empresa" /><input type="text" placeholder="Empresa o —" className={inputCls} /></div>
              <div><L c="Tarifa" req /><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span><input type="number" min="0" className={`${inputCls} pl-7`} /></div></div>
              <div><L c="Método de pago" req />
                <select className={selectCls}><option value="">Seleccionar...</option>{METODOS.map(m => <option key={m}>{m}</option>)}</select>
              </div>
              <div><L c="Facturación" />
                <select className={selectCls}><option value="no">No requiere</option><option value="si">Sí requiere</option></select>
              </div>
            </>}
            {tipo === 'conductor' && <>
              <div><L c="Conductor" req /><input type="text" placeholder="Nombre" className={inputCls} /></div>
              <div><L c="Semana / Periodo" req /><input type="text" placeholder="01-07 Jun 2025" className={inputCls} /></div>
              <div><L c="Viajes revisados" req /><input type="number" min="0" className={inputCls} /></div>
              <div><L c="Ganancias" req /><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span><input type="number" min="0" className={`${inputCls} pl-7`} /></div></div>
              <div><L c="Gastos autorizados" /><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span><input type="number" min="0" className={`${inputCls} pl-7`} /></div></div>
              <div><L c="Ajustes" /><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span><input type="number" className={`${inputCls} pl-7`} /></div></div>
            </>}
            {tipo === 'gasto' && <>
              <div><L c="Concepto" req /><input type="text" placeholder="Casetas, gasolina..." className={inputCls} /></div>
              <div><L c="Conductor / Equipo" req /><input type="text" placeholder="Nombre" className={inputCls} /></div>
              <div><L c="Comprobante" /><input type="text" placeholder="Número o folio" className={inputCls} /></div>
              <div><L c="Monto" req /><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span><input type="number" min="0" className={`${inputCls} pl-7`} /></div></div>
              <div><L c="Aprobado por" />
                <select className={selectCls}><option value="">Sin asignar</option>{['Ops. Central','Coordinador','Admin','Finanzas'].map(r => <option key={r}>{r}</option>)}</select>
              </div>
            </>}
            <div><L c="Fecha" /><input type="date" className={inputCls} /></div>
          </div>
          <div><L c="Notas" /><textarea rows={2} placeholder="Observaciones adicionales..." className={inputCls} /></div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckCircleIcon className="w-4 h-4" />Guardar registro
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

  const filtrar = <T extends { estatus: EstatusPago }>(list: T[], extraMatch: (i: T) => boolean) =>
    list.filter(i => {
      const matchE = filtroEstatus === 'Todos' || i.estatus === filtroEstatus
      return matchE && extraMatch(i)
    })

  const q = search.toLowerCase()
  const filtUsuarios   = filtrar(PAGOS_USUARIOS,   u => !q || u.usuario.toLowerCase().includes(q) || u.viajeId.toLowerCase().includes(q) || u.empresa.toLowerCase().includes(q))
  const filtConductores = filtrar(PAGOS_CONDUCTORES, c => !q || c.conductor.toLowerCase().includes(q) || c.semana.toLowerCase().includes(q))
  const filtGastos     = filtrar(GASTOS,             g => !q || g.concepto.toLowerCase().includes(q) || g.viajeId.toLowerCase().includes(q) || g.conductor.toLowerCase().includes(q))

  // KPIs globales
  const totalPagadoU = PAGOS_USUARIOS.filter(p => p.estatus === 'Pagado').reduce((s,p) => s+p.tarifa, 0)
  const totalPendU   = PAGOS_USUARIOS.filter(p => ['Pendiente','Aprobado'].includes(p.estatus)).reduce((s,p) => s+p.tarifa, 0)
  const totalPagadoC = PAGOS_CONDUCTORES.filter(p => p.estatus === 'Pagado').reduce((s,p) => s+p.depositoEsperado, 0)
  const totalPendC   = PAGOS_CONDUCTORES.filter(p => ['Pendiente','Aprobado'].includes(p.estatus)).reduce((s,p) => s+p.depositoEsperado, 0)
  const totalGastos  = GASTOS.filter(g => g.estatus === 'Aprobado').reduce((s,g) => s+g.monto, 0)

  const mainTabs: { id: MainTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'usuarios',    label: 'Pagos de Usuarios',    icon: <ReceiptRefundIcon className="w-4 h-4" />,      count: PAGOS_USUARIOS.length },
    { id: 'conductores', label: 'Pagos a Conductores',  icon: <BanknotesIcon className="w-4 h-4" />,          count: PAGOS_CONDUCTORES.length },
    { id: 'gastos',      label: 'Gastos Operativos',    icon: <BuildingStorefrontIcon className="w-4 h-4" />, count: GASTOS.length },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {detalleU && <DetallePagoUsuario pago={detalleU} onClose={() => setDetalleU(null)} />}
      {detalleC && <DetallePagoConductor pago={detalleC} onClose={() => setDetalleC(null)} />}
      {detalleG && <DetalleGasto gasto={detalleG} onClose={() => setDetalleG(null)} />}
      {showForm && <NuevoPagoForm onClose={() => setShowForm(false)} />}

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
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Tab header */}
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
              const count = e === 'Todos'
                ? (tab === 'usuarios' ? PAGOS_USUARIOS : tab === 'conductores' ? PAGOS_CONDUCTORES : GASTOS).length
                : (tab === 'usuarios' ? PAGOS_USUARIOS : tab === 'conductores' ? PAGOS_CONDUCTORES : GASTOS).filter(p => p.estatus === e).length
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

        {/* ── TAB: PAGOS USUARIOS ── */}
        {tab === 'usuarios' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Viaje</th>
                  <th className="px-4 py-3">Usuario / Empresa</th>
                  <th className="px-4 py-3 text-right">Tarifa</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3 text-center">Factura</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtUsuarios.length === 0 && <tr><td colSpan={9} className="text-center py-10 text-slate-400 italic text-sm">Sin registros.</td></tr>}
                {filtUsuarios.map((p, i) => (
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
                      {p.requiereFactura
                        ? <span className="text-xs text-blue-600 font-medium">✓ Sí</span>
                        : <span className="text-xs text-slate-300">No</span>}
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

        {/* ── TAB: PAGOS CONDUCTORES ── */}
        {tab === 'conductores' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Conductor</th>
                  <th className="px-4 py-3">Semana</th>
                  <th className="px-4 py-3 text-center">Viajes</th>
                  <th className="px-4 py-3 text-right">Ganancias</th>
                  <th className="px-4 py-3 text-right">Gs. Auto.</th>
                  <th className="px-4 py-3 text-right">Ajuste</th>
                  <th className="px-4 py-3 text-right">Depósito</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtConductores.length === 0 && <tr><td colSpan={11} className="text-center py-10 text-slate-400 italic text-sm">Sin registros.</td></tr>}
                {filtConductores.map((p, i) => (
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

        {/* ── TAB: GASTOS ── */}
        {tab === 'gastos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Concepto</th>
                  <th className="px-4 py-3">Viaje</th>
                  <th className="px-4 py-3">Conductor / Equipo</th>
                  <th className="px-4 py-3">Comprobante</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Aprobado por</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtGastos.length === 0 && <tr><td colSpan={10} className="text-center py-10 text-slate-400 italic text-sm">Sin registros.</td></tr>}
                {filtGastos.map((g, i) => (
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
