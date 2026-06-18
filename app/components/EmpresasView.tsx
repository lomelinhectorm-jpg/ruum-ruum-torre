'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  TruckIcon,
  BanknotesIcon,
  DocumentTextIcon,
  UsersIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TipoEmpresa =
  | 'Agencia automotriz'
  | 'Lote de autos'
  | 'Arrendadora'
  | 'Flotilla'
  | 'Taller'
  | 'Aseguradora'
  | 'Grupo automotriz'
  | 'Empresa general'

type EstatusEmpresa = 'Activa' | 'Suspendida' | 'Pendiente' | 'Inactiva'

interface UsuarioVinculado { nombre: string; rol: string; email: string }
interface VehiculoFrecuente { modelo: string; placas: string; anio: string }
interface ViajeResumen { id: string; fecha: string; ruta: string; monto: number; estatus: string }
interface NotaInterna { autor: string; texto: string; hora: string }

interface Empresa {
  id: string
  razonSocial: string
  nombreComercial: string
  tipo: TipoEmpresa
  rfc: string
  regimenFiscal: string
  domicilioFiscal: string
  cfdi: string
  contactoPrincipal: string
  telefono: string
  correo: string
  estatus: EstatusEmpresa
  fechaRegistro: string
  // condiciones comerciales
  descuento: number
  creditoDias: number
  limiteCredito: number
  vigenciaConvenio: string
  // resumen
  usuariosVinculados: UsuarioVinculado[]
  vehiculosFrecuentes: VehiculoFrecuente[]
  historialViajes: ViajeResumen[]
  notas: NotaInterna[]
  totalFacturado: number
  viajesTotal: number
}

const TIPOS_EMPRESA: TipoEmpresa[] = [
  'Agencia automotriz','Lote de autos','Arrendadora','Flotilla',
  'Taller','Aseguradora','Grupo automotriz','Empresa general',
]

const tipoColor: Record<TipoEmpresa, string> = {
  'Agencia automotriz': 'bg-blue-50 text-blue-700',
  'Lote de autos':      'bg-sky-50 text-sky-700',
  'Arrendadora':        'bg-teal-50 text-teal-700',
  'Flotilla':           'bg-indigo-50 text-indigo-700',
  'Taller':             'bg-orange-50 text-orange-700',
  'Aseguradora':        'bg-rose-50 text-rose-700',
  'Grupo automotriz':   'bg-violet-50 text-violet-700',
  'Empresa general':    'bg-slate-100 text-slate-600',
}

const tipoIcon: Record<TipoEmpresa, string> = {
  'Agencia automotriz': '🏪',
  'Lote de autos':      '🚗',
  'Arrendadora':        '🔑',
  'Flotilla':           '🚛',
  'Taller':             '🔧',
  'Aseguradora':        '🛡️',
  'Grupo automotriz':   '🏭',
  'Empresa general':    '🏢',
}

const estatusStyle: Record<EstatusEmpresa, string> = {
  Activa:     'bg-green-100 text-green-700',
  Suspendida: 'bg-red-100 text-red-700',
  Pendiente:  'bg-amber-100 text-amber-700',
  Inactiva:   'bg-slate-100 text-slate-500',
}

function initials(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const gradients = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
]

// ─── DETALLE EMPRESA ──────────────────────────────────────────────────────────
type DetailTab = 'info' | 'usuarios' | 'vehiculos' | 'viajes' | 'comercial' | 'notas'

function EmpresaDetalle({ empresa, idx, onClose, onUpdate }: {
  empresa: Empresa; idx: number; onClose: () => void; onUpdate: () => void
}) {
  const [tab, setTab]           = useState<DetailTab>('info')
  const [editMode, setEditMode] = useState(false)
  const [estatus, setEstatus]   = useState<EstatusEmpresa>(empresa.estatus)
  const [notas, setNotas]       = useState<NotaInterna[]>([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [form, setForm] = useState({
    razonSocial: empresa.razonSocial, nombreComercial: empresa.nombreComercial, tipo: empresa.tipo,
    contactoPrincipal: empresa.contactoPrincipal, telefono: empresa.telefono, correo: empresa.correo,
    regimenFiscal: empresa.regimenFiscal, cfdi: empresa.cfdi, domicilioFiscal: empresa.domicilioFiscal,
    descuento: empresa.descuento, creditoDias: empresa.creditoDias, limiteCredito: empresa.limiteCredito,
  })
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [usuariosVinculados, setUsuariosVinculados] = useState<UsuarioVinculado[]>([])
  const [vehiculosFrecuentes, setVehiculosFrecuentes] = useState<VehiculoFrecuente[]>([])
  const [historialViajes, setHistorialViajes] = useState<ViajeResumen[]>([])
  const [cargandoRelacionados, setCargandoRelacionados] = useState(true)
  const grad = gradients[idx % gradients.length]

  useEffect(() => {
    const cargarRelacionados = async () => {
      const sb = getSupabaseBrowserClient()
      const [viajesRes, vehRes, notasRes] = await Promise.all([
        sb.from('viajes').select('id, folio, fecha_programada, origen_calle, destino_calle, tarifa_cliente, status, usuarios(nombre, apellido, email)').eq('empresa_id', empresa.id).order('created_at', { ascending: false }),
        sb.from('vehiculos').select('marca, modelo, placas, anio').eq('empresa_id', empresa.id),
        sb.from('notas_internas').select('id, texto, created_at').eq('entidad_tipo', 'empresa').eq('entidad_id', empresa.id).order('created_at', { ascending: false }),
      ])

      if (viajesRes.data) {
        const viajesData = viajesRes.data as Record<string, unknown>[]
        setHistorialViajes(viajesData.map(v => ({
          id: String(v.folio ?? String(v.id).slice(0,8)),
          fecha: String(v.fecha_programada ?? '—'),
          ruta: `${v.origen_calle ?? '—'} → ${v.destino_calle ?? '—'}`,
          monto: Number(v.tarifa_cliente ?? 0),
          estatus: String(v.status ?? '—'),
        })))
        // Usuarios vinculados: derivados de quienes solicitaron viajes con esta empresa
        const vistos = new Set<string>()
        const usuarios: UsuarioVinculado[] = []
        for (const v of viajesData) {
          const u = v.usuarios as { nombre?: string; apellido?: string; email?: string } | null
          if (u?.email && !vistos.has(u.email)) {
            vistos.add(u.email)
            usuarios.push({ nombre: `${u.nombre ?? ''} ${u.apellido ?? ''}`.trim(), rol: 'Solicitante', email: u.email })
          }
        }
        setUsuariosVinculados(usuarios)
      }
      if (vehRes.data) {
        setVehiculosFrecuentes(vehRes.data.map((v: Record<string, unknown>) => ({
          modelo: `${v.marca ?? ''} ${v.modelo ?? ''}`.trim() || '—',
          placas: String(v.placas ?? '—'),
          anio: String(v.anio ?? '—'),
        })))
      }
      if (notasRes.data) {
        setNotas(notasRes.data.map((n: Record<string, unknown>) => ({
          autor: 'Admin',
          texto: String(n.texto ?? ''),
          hora: String((n.created_at as string)?.slice(0,16).replace('T',' ') ?? ''),
        })))
      }
      setCargandoRelacionados(false)
    }
    cargarRelacionados()
  }, [empresa.id])

  const totalFacturado = historialViajes.reduce((s, v) => s + v.monto, 0)
  const viajesTotal = historialViajes.length

  const cambiarEstatus = async (nuevo: EstatusEmpresa) => {
    const sb = getSupabaseBrowserClient()
    await sb.from('empresas').update({ estatus: nuevo }).eq('id', empresa.id)
    setEstatus(nuevo)
    onUpdate()
  }

  const guardarPerfil = async () => {
    setGuardandoPerfil(true)
    const sb = getSupabaseBrowserClient()
    await sb.from('empresas').update({
      razon_social: form.razonSocial.toUpperCase(), nombre_comercial: form.nombreComercial.toUpperCase(), tipo: form.tipo,
      contacto_principal: form.contactoPrincipal.toUpperCase(), telefono: form.telefono, correo: form.correo.toLowerCase(),
      regimen_fiscal: form.regimenFiscal, cfdi: form.cfdi, domicilio_fiscal: form.domicilioFiscal.toUpperCase(),
      descuento: form.descuento, credito_dias: form.creditoDias, limite_credito: form.limiteCredito,
    }).eq('id', empresa.id)
    setGuardandoPerfil(false)
    setEditMode(false)
    onUpdate()
  }

  const addNota = async () => {
    if (!nuevaNota.trim()) return
    const sb = getSupabaseBrowserClient()
    const texto = nuevaNota.trim()
    await sb.from('notas_internas').insert({ entidad_tipo: 'empresa', entidad_id: empresa.id, texto })
    setNotas(n => [{ autor: 'Admin', texto, hora: 'Ahora' }, ...n])
    setNuevaNota('')
  }

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'info',      label: 'Información',      icon: <BuildingOfficeIcon className="w-3.5 h-3.5" /> },
    { id: 'comercial', label: 'Condiciones comerciales', icon: <BanknotesIcon className="w-3.5 h-3.5" /> },
    { id: 'usuarios',  label: `Usuarios (${usuariosVinculados.length})`, icon: <UsersIcon className="w-3.5 h-3.5" /> },
    { id: 'vehiculos', label: `Vehículos (${vehiculosFrecuentes.length})`, icon: <TruckIcon className="w-3.5 h-3.5" /> },
    { id: 'viajes',    label: `Viajes (${historialViajes.length})`,    icon: <DocumentTextIcon className="w-3.5 h-3.5" /> },
    { id: 'notas',     label: `Notas (${notas.length})`,                       icon: <PencilSquareIcon className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl">

        {/* Header */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeftIcon className="w-4 h-4 text-slate-500" /></button>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {initials(empresa.nombreComercial)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-slate-800 text-lg leading-tight">{empresa.nombreComercial}</h2>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoColor[empresa.tipo]}`}>{tipoIcon[empresa.tipo]} {empresa.tipo}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estatusStyle[estatus]}`}>{estatus}</span>
                  <span className="text-xs text-slate-400">RFC: {empresa.rfc}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {estatus === 'Activa' && (
                <button onClick={() => cambiarEstatus('Suspendida')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />Suspender
                </button>
              )}
              {(estatus === 'Suspendida' || estatus === 'Inactiva') && (
                <button onClick={() => cambiarEstatus('Activa')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <CheckCircleIcon className="w-3.5 h-3.5" />Reactivar
                </button>
              )}
              <button onClick={() => setEditMode(e => !e)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${editMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <PencilSquareIcon className="w-3.5 h-3.5" />{editMode ? 'Editando...' : 'Editar'}
              </button>
              <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
            </div>
          </div>

          {/* Quick KPIs */}
          <div className="grid grid-cols-3 gap-3 mt-4 pb-1">
            {[
              { label: 'Total facturado', value: `$${totalFacturado.toLocaleString()}`, color: 'text-emerald-600' },
              { label: 'Viajes totales',  value: viajesTotal,  color: 'text-blue-600' },
              { label: 'Usuarios vinculados', value: usuariosVinculados.length, color: 'text-indigo-600' },
            ].map((k, i) => (
              <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-center">
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-slate-400">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-3 overflow-x-auto border-t border-slate-100 pt-1 -mx-6 px-6">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* ── INFO ── */}
          {tab === 'info' && (
            <div className="space-y-4">
              <SCard title="🏢 Datos de la Empresa">
                <G2>
                  <F label="Razón social" value={form.razonSocial} editable={editMode} onChange={v => setForm(f => ({ ...f, razonSocial: v }))} />
                  <F label="Nombre comercial" value={form.nombreComercial} editable={editMode} onChange={v => setForm(f => ({ ...f, nombreComercial: v }))} />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Tipo de empresa</p>
                    {editMode ? (
                      <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoEmpresa }))} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full">
                        {TIPOS_EMPRESA.map(t => <option key={t}>{t}</option>)}
                      </select>
                    ) : <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${tipoColor[empresa.tipo]}`}>{tipoIcon[empresa.tipo]} {empresa.tipo}</span>}
                  </div>
                  <F label="Fecha de registro" value={empresa.fechaRegistro} />
                </G2>
              </SCard>

              <SCard title="📞 Contacto">
                <G2>
                  <F label="Contacto principal" value={form.contactoPrincipal} editable={editMode} onChange={v => setForm(f => ({ ...f, contactoPrincipal: v }))} />
                  <F label="Teléfono" value={form.telefono} editable={editMode} onChange={v => setForm(f => ({ ...f, telefono: v }))} />
                  <F label="Correo electrónico" value={form.correo} editable={editMode} onChange={v => setForm(f => ({ ...f, correo: v }))} />
                </G2>
              </SCard>

              <SCard title="🧾 Datos de Facturación">
                <G2>
                  <F label="RFC" value={<span className="font-mono text-xs">{empresa.rfc}</span>} />
                  <F label="Régimen fiscal" value={form.regimenFiscal} editable={editMode} onChange={v => setForm(f => ({ ...f, regimenFiscal: v }))} />
                  <F label="CFDI" value={form.cfdi} editable={editMode} onChange={v => setForm(f => ({ ...f, cfdi: v }))} />
                  <F label="Domicilio fiscal" value={form.domicilioFiscal} editable={editMode} onChange={v => setForm(f => ({ ...f, domicilioFiscal: v }))} />
                </G2>
              </SCard>

              {editMode && (
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditMode(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button onClick={guardarPerfil} disabled={guardandoPerfil} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">{guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}</button>
                </div>
              )}
            </div>
          )}

          {/* ── CONDICIONES COMERCIALES ── */}
          {tab === 'comercial' && (
            <div className="space-y-4">
              <SCard title="📋 Condiciones Comerciales">
                <G2>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Descuento aplicado</p>
                    {editMode
                      ? <input type="number" value={form.descuento} onChange={e => setForm(f => ({ ...f, descuento: +e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                      : <span className="text-xl font-bold text-green-600">{empresa.descuento}%</span>}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Crédito (días)</p>
                    {editMode
                      ? <input type="number" value={form.creditoDias} onChange={e => setForm(f => ({ ...f, creditoDias: +e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                      : <span className="text-xl font-bold text-blue-600">{empresa.creditoDias} días</span>}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Límite de crédito</p>
                    {editMode
                      ? <input type="number" value={form.limiteCredito} onChange={e => setForm(f => ({ ...f, limiteCredito: +e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                      : <span className="text-xl font-bold text-slate-800">${empresa.limiteCredito.toLocaleString()} MXN</span>}
                  </div>
                  <F label="Vigencia del convenio" value={empresa.vigenciaConvenio} />
                </G2>
              </SCard>

              {/* Facturación resumen */}
              <SCard title="💰 Resumen Financiero">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Total facturado</p>
                    <p className="text-2xl font-bold text-emerald-700">${totalFacturado.toLocaleString()}</p>
                    <p className="text-xs text-emerald-500 mt-0.5">MXN acumulado</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-blue-600 font-medium mb-1">Promedio por viaje</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ${viajesTotal > 0 ? Math.round(totalFacturado / viajesTotal).toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-blue-500 mt-0.5">en {viajesTotal} viajes</p>
                  </div>
                </div>
              </SCard>

              {editMode && (
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditMode(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button onClick={guardarPerfil} disabled={guardandoPerfil} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">{guardandoPerfil ? 'Guardando...' : 'Guardar'}</button>
                </div>
              )}
            </div>
          )}

          {/* ── USUARIOS VINCULADOS ── */}
          {tab === 'usuarios' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-700">Usuarios que han solicitado viajes con esta cuenta</p>
              </div>
              {cargandoRelacionados
                ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}</div>
                : usuariosVinculados.length === 0
                ? <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400 italic">Sin usuarios vinculados.</div>
                : usuariosVinculados.map((u, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white text-xs font-bold`}>
                        {initials(u.nombre)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{u.nombre}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-medium">{u.rol}</span>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── VEHÍCULOS FRECUENTES ── */}
          {tab === 'vehiculos' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-700">Vehículos asociados a esta empresa</p>
              </div>
              {cargandoRelacionados
                ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}</div>
                : vehiculosFrecuentes.length === 0
                ? <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400 italic">Sin vehículos registrados para esta empresa.</div>
                : vehiculosFrecuentes.map((v, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg"><TruckIcon className="w-5 h-5 text-blue-500" /></div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{v.modelo}</p>
                        <p className="text-xs text-slate-400">Placas: <span className="font-mono">{v.placas}</span> · {v.anio}</p>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── HISTORIAL VIAJES ── */}
          {tab === 'viajes' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 text-sm font-semibold text-slate-700">Historial de viajes de esta empresa</div>
              {cargandoRelacionados
                ? <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-lg" />)}</div>
                : historialViajes.length === 0
                ? <p className="p-8 text-center text-sm text-slate-400 italic">Sin viajes registrados.</p>
                : <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Ruta</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historialViajes.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-blue-600">{v.id}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{v.fecha}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{v.ruta}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">${v.monto.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{v.estatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          )}

          {/* ── NOTAS ── */}
          {tab === 'notas' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 italic">Visibles únicamente para el equipo de operaciones.</p>
              {cargandoRelacionados
                ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />)}</div>
                : notas.length === 0 && <p className="text-sm text-slate-400 italic text-center py-6">Sin notas aún.</p>}
              {notas.map((n, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700">{n.autor} · {n.hora}</p>
                  <p className="text-sm text-slate-700 mt-1">{n.texto}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input type="text" value={nuevaNota} onChange={e => setNuevaNota(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNota()}
                  placeholder="Agregar nota interna..."
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

// ─── NUEVA EMPRESA FORM ───────────────────────────────────────────────────────
function NuevaEmpresaForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [tipo, setTipo] = useState<TipoEmpresa | ''>('')
  const [form, setForm] = useState({
    razonSocial: '', nombreComercial: '', rfc: '', contacto: '', telefono: '', email: '',
    regimenFiscal: '', cfdi: '', domicilioFiscal: '',
    descuento: '0', creditoDias: '0', limiteCredito: '0',
  })
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!tipo || !form.razonSocial || !form.rfc || !form.contacto || !form.telefono) {
      setErrorGuardar('Completa los campos obligatorios (*)'); return
    }
    setGuardando(true); setErrorGuardar('')
    try {
    const sb = getSupabaseBrowserClient()
      const { error } = await sb.from('empresas').insert({
        tipo,
        razon_social:      form.razonSocial.toUpperCase(),
        nombre_comercial:  form.nombreComercial.toUpperCase() || form.razonSocial.toUpperCase(),
        rfc:               form.rfc.toUpperCase(),
        contacto_principal:form.contacto.toUpperCase(),
        telefono:          form.telefono,
        correo:            form.email.toLowerCase() || null,
        regimen_fiscal:    form.regimenFiscal || null,
        cfdi:              form.cfdi || null,
        domicilio_fiscal:  form.domicilioFiscal.toUpperCase() || null,
        descuento:         parseFloat(form.descuento) || 0,
        credito_dias:      parseInt(form.creditoDias) || 0,
        limite_credito:    parseFloat(form.limiteCredito) || 0,
        estatus:           'Activa',
      })
      if (error) throw error
      onSave(); onClose()
    } catch (e) {
      console.error(e); setErrorGuardar('Error al guardar. Intenta de nuevo.')
    } finally { setGuardando(false) }
  }

  const iCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const L = ({ c, req }: { c: React.ReactNode; req?: boolean }) => (
    <label className="block text-xs font-medium text-slate-500 mb-1">{c}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Nueva Empresa</h2>
            <p className="text-xs text-slate-400">Registrar cuenta corporativa</p>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Tipo */}
          <div>
            <L c="Tipo de empresa" req />
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_EMPRESA.map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border-2 transition-colors text-left ${tipo === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <span className="text-base">{tipoIcon[t]}</span>{t}
                </button>
              ))}
            </div>
          </div>

          {/* Datos empresa */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">🏢 Datos de la empresa</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><L c="Razón social" req /><input type="text" value={form.razonSocial} onChange={e => set('razonSocial', e.target.value.toUpperCase())} className={iCls} /></div>
              <div><L c="Nombre comercial" /><input type="text" value={form.nombreComercial} onChange={e => set('nombreComercial', e.target.value.toUpperCase())} className={iCls} /></div>
              <div><L c="RFC" req /><input type="text" placeholder="12 O 13 CARACTERES" value={form.rfc} onChange={e => set('rfc', e.target.value.toUpperCase())} className={iCls} /></div>
              <div><L c="Contacto principal" req /><input type="text" value={form.contacto} onChange={e => set('contacto', e.target.value.toUpperCase())} className={iCls} /></div>
              <div><L c="Teléfono" req /><input type="tel" placeholder="55-0000-0000" maxLength={12} value={form.telefono} onChange={e => { const d = e.target.value.replace(/\D/g,'').slice(0,10); set('telefono', d.length<=3?d:d.length<=6?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`) }} className={iCls} /></div>
              <div className="col-span-2"><L c="Correo electrónico" /><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={iCls} /></div>
            </div>
          </div>

          {/* Facturación */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">🧾 Facturación</p>
            <div className="grid grid-cols-2 gap-4">
              <div><L c="Régimen fiscal" /><input type="text" placeholder="601 - GENERAL DE LEY..." value={form.regimenFiscal} onChange={e => set('regimenFiscal', e.target.value.toUpperCase())} className={iCls} /></div>
              <div><L c="CFDI" /><input type="text" placeholder="G03 - GASTOS EN GENERAL" value={form.cfdi} onChange={e => set('cfdi', e.target.value.toUpperCase())} className={iCls} /></div>
              <div className="col-span-2"><L c="Domicilio fiscal" /><input type="text" value={form.domicilioFiscal} onChange={e => set('domicilioFiscal', e.target.value.toUpperCase())} className={iCls} /></div>
            </div>
          </div>

          {/* Condiciones */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">📋 Condiciones comerciales</p>
            <div className="grid grid-cols-3 gap-4">
              <div><L c="Descuento (%)" /><input type="number" min="0" max="100" value={form.descuento} onChange={e => set('descuento', e.target.value)} className={iCls} /></div>
              <div><L c="Crédito (días)" /><input type="number" min="0" value={form.creditoDias} onChange={e => set('creditoDias', e.target.value)} className={iCls} /></div>
              <div><L c="Límite crédito ($)" /><input type="number" min="0" value={form.limiteCredito} onChange={e => set('limiteCredito', e.target.value)} className={iCls} /></div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
          <div className="flex flex-col items-end gap-1">
            {errorGuardar && <p className="text-xs text-red-500">{errorGuardar}</p>}
            <button onClick={handleSubmit} disabled={guardando} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <CheckCircleIcon className="w-4 h-4" />{guardando ? 'Guardando...' : 'Registrar empresa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function SCard({ title, children }: { title: string; children: React.ReactNode }) {
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
function F({ label, value, editable, onChange }: { label: string; value: React.ReactNode; editable?: boolean; onChange?: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      {editable && typeof value === 'string'
        ? <input type="text" value={value} onChange={e => onChange?.(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        : <div className="text-sm text-slate-700">{value}</div>}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function EmpresasView() {
  const [search, setSearch]         = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoEmpresa | 'Todos'>('Todos')
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusEmpresa | 'Todos'>('Todos')
  const [detalle, setDetalle]       = useState<{ empresa: Empresa; idx: number } | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [empresas, setEmpresas]     = useState<Empresa[]>([])
  const [cargando, setCargando]     = useState(true)

  const cargarEmpresas = useCallback(async () => {
    const sb = getSupabaseBrowserClient()
    const [empRes, viajesRes] = await Promise.all([
      sb.from('empresas').select('id, razon_social, nombre_comercial, tipo, rfc, regimen_fiscal, domicilio_fiscal, cfdi, contacto_principal, telefono, correo, estatus, descuento, credito_dias, limite_credito, vigencia_convenio, created_at').order('created_at', { ascending: false }),
      sb.from('viajes').select('empresa_id, usuario_id, tarifa_cliente').not('empresa_id', 'is', null),
    ])
    const { data, error } = empRes
    const resumenPorEmpresa = new Map<string, { viajesTotal: number; totalFacturado: number; usuarios: Set<string> }>()
    if (viajesRes.data) {
      for (const v of viajesRes.data as Record<string, unknown>[]) {
        const eid = String(v.empresa_id)
        const prev = resumenPorEmpresa.get(eid) ?? { viajesTotal: 0, totalFacturado: 0, usuarios: new Set<string>() }
        prev.viajesTotal += 1
        prev.totalFacturado += Number(v.tarifa_cliente ?? 0)
        if (v.usuario_id) prev.usuarios.add(String(v.usuario_id))
        resumenPorEmpresa.set(eid, prev)
      }
    }
    if (!error && data) {
      setEmpresas(data.map((e: Record<string, unknown>) => {
        const resumen = resumenPorEmpresa.get(String(e.id)) ?? { viajesTotal: 0, totalFacturado: 0, usuarios: new Set<string>() }
        return {
        id:               String(e.id ?? ''),
        razonSocial:      String(e.razon_social ?? ''),
        nombreComercial:  String(e.nombre_comercial ?? e.razon_social ?? ''),
        tipo:             (e.tipo as TipoEmpresa) ?? 'Empresa general',
        rfc:              String(e.rfc ?? ''),
        regimenFiscal:    String(e.regimen_fiscal ?? ''),
        domicilioFiscal:  String(e.domicilio_fiscal ?? ''),
        cfdi:             String(e.cfdi ?? ''),
        contactoPrincipal:String(e.contacto_principal ?? ''),
        telefono:         String(e.telefono ?? ''),
        correo:           String(e.correo ?? ''),
        estatus:          (e.estatus as EstatusEmpresa) ?? 'Activa',
        fechaRegistro:    String((e.created_at as string)?.slice(0,10) ?? ''),
        descuento:        Number(e.descuento ?? 0),
        creditoDias:      Number(e.credito_dias ?? 0),
        limiteCredito:    Number(e.limite_credito ?? 0),
        vigenciaConvenio: String(e.vigencia_convenio ?? ''),
        usuariosVinculados: Array.from({ length: resumen.usuarios.size }, () => ({ nombre: '', rol: '', email: '' })),
        vehiculosFrecuentes: [], historialViajes: [], notas: [],
        totalFacturado: resumen.totalFacturado, viajesTotal: resumen.viajesTotal,
        }
      }))
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargarEmpresas() }, [cargarEmpresas])

  const filtered = empresas.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.nombreComercial.toLowerCase().includes(q) || e.razonSocial.toLowerCase().includes(q) || e.rfc.toLowerCase().includes(q) || e.contactoPrincipal.toLowerCase().includes(q)
    const matchTipo    = filtroTipo    === 'Todos' || e.tipo    === filtroTipo
    const matchEstatus = filtroEstatus === 'Todos' || e.estatus === filtroEstatus
    return matchSearch && matchTipo && matchEstatus
  })

  const counts = {
    total:      empresas.length,
    activas:    empresas.filter(e => e.estatus === 'Activa').length,
    pendientes: empresas.filter(e => e.estatus === 'Pendiente').length,
    suspendidas:empresas.filter(e => e.estatus === 'Suspendida').length,
    totalFacturado: empresas.reduce((s, e) => s + e.totalFacturado, 0),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {detalle  && <EmpresaDetalle empresa={detalle.empresa} idx={detalle.idx} onClose={() => setDetalle(null)} onUpdate={cargarEmpresas} />}
      {showForm && <NuevaEmpresaForm onClose={() => setShowForm(false)} onSave={cargarEmpresas} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total empresas',    value: counts.total,         color: 'text-slate-800' },
          { label: 'Activas',           value: counts.activas,       color: 'text-green-600' },
          { label: 'Pendientes',        value: counts.pendientes,    color: 'text-amber-600' },
          { label: 'Suspendidas',       value: counts.suspendidas,   color: 'text-red-600' },
          { label: 'Total facturado',   value: `$${(counts.totalFacturado / 1000).toFixed(0)}k`, color: 'text-emerald-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 space-y-3">
          {/* Tipo chips */}
          <div className="flex flex-wrap gap-1.5">
            {(['Todos', ...TIPOS_EMPRESA] as (TipoEmpresa | 'Todos')[]).map(t => (
              <button key={t} onClick={() => setFiltroTipo(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  filtroTipo === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {t !== 'Todos' && tipoIcon[t as TipoEmpresa]}{t}
              </button>
            ))}
          </div>
          {/* Estatus + search + new */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              {(['Todos','Activa','Pendiente','Suspendida','Inactiva'] as (EstatusEmpresa | 'Todos')[]).map(e => (
                <button key={e} onClick={() => setFiltroEstatus(e)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    filtroEstatus === e ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>{e}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar empresa..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
              </div>
              <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />Nueva empresa
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-8 space-y-3">{[1,2,3].map(n => (<div key={n} className="flex gap-4 animate-pulse"><div className="w-9 h-9 bg-slate-200 rounded-xl" /><div className="flex-1 space-y-2 pt-1"><div className="h-3 bg-slate-200 rounded w-1/3" /><div className="h-3 bg-slate-200 rounded w-1/4" /></div></div>))}</div>
          ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">RFC</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3 text-center">Usuarios</th>
                <th className="px-4 py-3 text-center">Viajes</th>
                <th className="px-4 py-3 text-right">Facturado</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 italic text-sm">Sin resultados.</td></tr>
              )}
              {filtered.map((empresa, i) => {
                const globalIdx = i
                const grad = gradients[i % gradients.length]
                return (
                  <tr key={empresa.id || i} className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setDetalle({ empresa, idx: globalIdx })}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {initials(empresa.nombreComercial)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{empresa.nombreComercial}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[140px]">{empresa.razonSocial}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${tipoColor[empresa.tipo]}`}>
                        {tipoIcon[empresa.tipo]}{empresa.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{empresa.rfc}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-700">{empresa.contactoPrincipal}</div>
                      <div className="text-xs text-slate-400">{empresa.telefono}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{empresa.usuariosVinculados.length}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{empresa.viajesTotal}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">${empresa.totalFacturado.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estatusStyle[empresa.estatus]}`}>{empresa.estatus}</span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDetalle({ empresa, idx: globalIdx })}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        Ver perfil
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
