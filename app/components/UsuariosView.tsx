'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ChevronLeftIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  TruckIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type TipoUsuario =
  | 'Personal'
  | 'Empresarial'
  | 'Agencia'
  | 'Lote'
  | 'Flotilla'
  | 'Arrendadora'
  | 'Taller'
  | 'Aseguradora'
  | 'Entrega al cliente'

type Estatus = 'Activo' | 'Suspendido' | 'Pendiente' | 'Inactivo'

interface Vehiculo { modelo: string; placas: string; anio: string }
interface Pago { fecha: string; monto: number; concepto: string; estatus: string }
interface Viaje { id: string; fecha: string; origen: string; destino: string; estatus: string }
interface NotaInterna { autor: string; texto: string; hora: string }

interface Usuario {
  id: string
  nombre: string
  apellido: string
  curp: string
  email: string
  telefono: string
  tipo: TipoUsuario
  fechaRegistro: string
  estatus: Estatus
  viajesSolicitados: number
  calle: string
  numero: string
  colonia: string
  municipio: string
  estadoGeo: string
  codigoPostal: string
  razonSocial: string
  rfc: string
  regimenFiscal: string
  domicilioFiscal: string
  cfdi: string
  vehiculos: Vehiculo[]
  pagos: Pago[]
  viajes: Viaje[]
  notas: NotaInterna[]
}

const TIPOS: TipoUsuario[] = ['Personal','Empresarial','Agencia','Lote','Flotilla','Arrendadora','Taller','Aseguradora','Entrega al cliente']

const tipoColor: Record<TipoUsuario, string> = {
  Personal:            'bg-purple-50 text-purple-700',
  Empresarial:         'bg-blue-50 text-blue-700',
  Agencia:             'bg-indigo-50 text-indigo-700',
  Lote:                'bg-cyan-50 text-cyan-700',
  Flotilla:            'bg-sky-50 text-sky-700',
  Arrendadora:         'bg-teal-50 text-teal-700',
  Taller:              'bg-orange-50 text-orange-700',
  Aseguradora:         'bg-rose-50 text-rose-700',
  'Entrega al cliente':'bg-green-50 text-green-700',
}

const estatusStyle: Record<Estatus, string> = {
  Activo:     'bg-green-100 text-green-700',
  Suspendido: 'bg-red-100 text-red-700',
  Pendiente:  'bg-amber-100 text-amber-700',
  Inactivo:   'bg-slate-100 text-slate-500',
}

const pagoEstatusStyle: Record<string, string> = {
  Pagado:      'bg-green-50 text-green-700',
  Pendiente:   'bg-amber-50 text-amber-700',
  'En revisión': 'bg-blue-50 text-blue-700',
}

// ─── PANEL DETALLE ────────────────────────────────────────────────────────────
type DetailTab = 'perfil' | 'viajes' | 'vehiculos' | 'pagos' | 'notas'

function UsuarioDetalle({ usuario, onClose, onUpdate }: { usuario: Usuario; onClose: () => void; onUpdate: () => void }) {
  const [tab, setTab] = useState<DetailTab>('perfil')
  const [editMode, setEditMode] = useState(false)
  const [notas, setNotas] = useState<NotaInterna[]>([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [estatus, setEstatus] = useState<Estatus>(usuario.estatus)
  const [form, setForm] = useState({
    nombre: usuario.nombre, apellido: usuario.apellido, curp: usuario.curp,
    email: usuario.email, telefono: usuario.telefono, tipo: usuario.tipo,
    calle: usuario.calle, numero: usuario.numero, colonia: usuario.colonia,
    municipio: usuario.municipio, estadoGeo: usuario.estadoGeo, codigoPostal: usuario.codigoPostal,
    razonSocial: usuario.razonSocial, rfc: usuario.rfc, regimenFiscal: usuario.regimenFiscal,
    domicilioFiscal: usuario.domicilioFiscal, cfdi: usuario.cfdi,
  })
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [cargandoRelacionados, setCargandoRelacionados] = useState(true)
  const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim()

  useEffect(() => {
    const cargarRelacionados = async () => {
      const sb = getSupabaseBrowserClient()
      const [viajesRes, vehRes, pagosRes, notasRes] = await Promise.all([
        sb.from('viajes').select('id, folio, fecha_programada, origen_calle, destino_calle, status').eq('usuario_id', usuario.id).order('created_at', { ascending: false }),
        sb.from('vehiculos').select('marca, modelo, placas, anio').eq('usuario_id', usuario.id),
        sb.from('pagos_usuarios').select('fecha_pago, tarifa, estatus, viajes(folio)').eq('usuario_id', usuario.id).order('created_at', { ascending: false }),
        sb.from('notas_internas').select('id, texto, autor_nombre, created_at').eq('entidad_tipo', 'usuario').eq('entidad_id', usuario.id).order('created_at', { ascending: false }),
      ])

      if (viajesRes.data) {
        setViajes(viajesRes.data.map((v: Record<string, unknown>) => ({
          id: String(v.folio ?? String(v.id).slice(0,8)),
          fecha: String(v.fecha_programada ?? '—'),
          origen: String(v.origen_calle ?? '—'),
          destino: String(v.destino_calle ?? '—'),
          estatus: String(v.status ?? '—'),
        })))
      }
      if (vehRes.data) {
        setVehiculos(vehRes.data.map((v: Record<string, unknown>) => ({
          modelo: `${v.marca ?? ''} ${v.modelo ?? ''}`.trim() || '—',
          placas: String(v.placas ?? '—'),
          anio: String(v.anio ?? '—'),
        })))
      }
      if (pagosRes.data) {
        setPagos(pagosRes.data.map((p: Record<string, unknown>) => ({
          fecha: String(p.fecha_pago ?? '—'),
          monto: Number(p.tarifa ?? 0),
          concepto: (p.viajes as { folio?: string } | null)?.folio ? `Viaje ${(p.viajes as { folio?: string }).folio}` : 'Viaje',
          estatus: String(p.estatus ?? '—'),
        })))
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
  }, [usuario.id, nombreCompleto])

  const cambiarEstatus = async (nuevo: Estatus) => {
    const sb = getSupabaseBrowserClient()
    await sb.from('usuarios').update({ estatus: nuevo }).eq('id', usuario.id)
    setEstatus(nuevo)
    onUpdate()
  }

  const guardarPerfil = async () => {
    setGuardandoPerfil(true)
    const sb = getSupabaseBrowserClient()
    await sb.from('usuarios').update({
      nombre: form.nombre.toUpperCase(), apellido: form.apellido.toUpperCase(), curp: form.curp.toUpperCase(),
      email: form.email.toLowerCase(), telefono: form.telefono, tipo: form.tipo,
      calle: form.calle.toUpperCase() || null, numero: form.numero.toUpperCase() || null,
      colonia: form.colonia.toUpperCase() || null, municipio: form.municipio.toUpperCase() || null,
      estado_geo: form.estadoGeo.toUpperCase() || null, codigo_postal: form.codigoPostal || null,
      razon_social: form.razonSocial.toUpperCase(), rfc: form.rfc.toUpperCase(), regimen_fiscal: form.regimenFiscal,
      domicilio_fiscal: form.domicilioFiscal.toUpperCase(), cfdi: form.cfdi,
    }).eq('id', usuario.id)
    setGuardandoPerfil(false)
    setEditMode(false)
    onUpdate()
  }

  const addNota = async () => {
    if (!nuevaNota.trim()) return
    const sb = getSupabaseBrowserClient()
    const texto = nuevaNota.trim()
    await sb.from('notas_internas').insert({ entidad_tipo: 'usuario', entidad_id: usuario.id, texto, autor_nombre: 'Admin' })
    setNotas(n => [{ autor: 'Admin', texto, hora: 'Ahora' }, ...n])
    setNuevaNota('')
  }

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'perfil',    label: 'Perfil',    icon: <UserCircleIcon className="w-4 h-4" /> },
    { id: 'viajes',    label: `Viajes (${viajes.length})`,     icon: <TruckIcon className="w-4 h-4" /> },
    { id: 'vehiculos', label: `Vehículos (${vehiculos.length})`, icon: <BuildingOfficeIcon className="w-4 h-4" /> },
    { id: 'pagos',     label: `Pagos (${pagos.length})`,       icon: <BanknotesIcon className="w-4 h-4" /> },
    { id: 'notas',     label: `Notas (${notas.length})`,               icon: <PencilSquareIcon className="w-4 h-4" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl">

        {/* Header */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
              <ChevronLeftIcon className="w-4 h-4 text-slate-500" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {usuario.nombre[0]}{usuario.apellido[0]}
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{usuario.nombre} {usuario.apellido}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tipoColor[usuario.tipo]}`}>{usuario.tipo}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estatusStyle[estatus]}`}>{estatus}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Acciones rápidas estatus */}
            {estatus === 'Activo' && (
              <button onClick={() => cambiarEstatus('Suspendido')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                Suspender
              </button>
            )}
            {estatus === 'Suspendido' && (
              <button onClick={() => cambiarEstatus('Activo')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 transition-colors">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Reactivar
              </button>
            )}
            <button onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${editMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <PencilSquareIcon className="w-3.5 h-3.5" />
              {editMode ? 'Editando...' : 'Editar datos'}
            </button>
            <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">

          {/* ── PERFIL ── */}
          {tab === 'perfil' && (
            <div className="space-y-4">
              {/* Información principal */}
              <Section title="Información Principal" icon="👤">
                <Grid2>
                  <Field label="Nombre" editable={editMode} value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} />
                  <Field label="Apellido" editable={editMode} value={form.apellido} onChange={v => setForm(f => ({ ...f, apellido: v }))} />
                  <Field label="CURP" editable={editMode} value={form.curp} mono onChange={v => setForm(f => ({ ...f, curp: v }))} />
                  <Field label="Correo electrónico" editable={editMode} value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
                  <Field label="Teléfono" editable={editMode} value={form.telefono} onChange={v => setForm(f => ({ ...f, telefono: v }))} />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Tipo de usuario</p>
                    {editMode ? (
                      <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoUsuario }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        {TIPOS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${tipoColor[usuario.tipo]}`}>{usuario.tipo}</span>
                    )}
                  </div>
                  <Field label="Fecha de registro" value={usuario.fechaRegistro} />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Estatus</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estatusStyle[estatus]}`}>{estatus}</span>
                  </div>
                </Grid2>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { label: 'Viajes solicitados', value: viajes.length, color: 'text-blue-600' },
                    { label: 'Vehículos', value: vehiculos.length, color: 'text-indigo-600' },
                    { label: 'Pagos registrados', value: pagos.length, color: 'text-emerald-600' },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Domicilio general */}
              <Section title="Domicilio" icon="🏠">
                <Grid2>
                  <Field label="Calle" editable={editMode} value={form.calle} onChange={v => setForm(f => ({ ...f, calle: v }))} />
                  <Field label="Número" editable={editMode} value={form.numero} onChange={v => setForm(f => ({ ...f, numero: v }))} />
                  <Field label="Colonia" editable={editMode} value={form.colonia} onChange={v => setForm(f => ({ ...f, colonia: v }))} />
                  <Field label="Código Postal" editable={editMode} value={form.codigoPostal} onChange={v => setForm(f => ({ ...f, codigoPostal: v }))} />
                  <Field label="Municipio / Alcaldía" editable={editMode} value={form.municipio} onChange={v => setForm(f => ({ ...f, municipio: v }))} />
                  <Field label="Estado" editable={editMode} value={form.estadoGeo} onChange={v => setForm(f => ({ ...f, estadoGeo: v }))} />
                </Grid2>
              </Section>

              {/* Información fiscal */}
              <Section title="Información Fiscal" icon="🧾">
                <Grid2>
                  <Field label="Razón Social" editable={editMode} value={form.razonSocial} onChange={v => setForm(f => ({ ...f, razonSocial: v }))} />
                  <Field label="RFC" editable={editMode} value={form.rfc} mono onChange={v => setForm(f => ({ ...f, rfc: v }))} />
                  <Field label="Régimen Fiscal" editable={editMode} value={form.regimenFiscal} onChange={v => setForm(f => ({ ...f, regimenFiscal: v }))} />
                  <Field label="CFDI" editable={editMode} value={form.cfdi} onChange={v => setForm(f => ({ ...f, cfdi: v }))} />
                </Grid2>
                <Field label="Domicilio Fiscal" editable={editMode} value={form.domicilioFiscal} onChange={v => setForm(f => ({ ...f, domicilioFiscal: v }))} />
              </Section>

              {editMode && (
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditMode(false)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">Cancelar</button>
                  <button onClick={guardarPerfil} disabled={guardandoPerfil} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">{guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}</button>
                </div>
              )}
            </div>
          )}

          {/* ── VIAJES ── */}
          {tab === 'viajes' && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-100 text-sm font-semibold text-slate-700">Historial de viajes</div>
              {cargandoRelacionados
                ? <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-lg" />)}</div>
                : viajes.length === 0
                ? <p className="text-sm text-slate-400 italic p-6 text-center">Sin viajes registrados.</p>
                : <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Origen → Destino</th>
                      <th className="px-4 py-3">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viajes.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-blue-600">{v.id}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{v.fecha}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{v.origen} → {v.destino}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{v.estatus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          )}

          {/* ── VEHÍCULOS ── */}
          {tab === 'vehiculos' && (
            <div className="space-y-3">
              {cargandoRelacionados
                ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}</div>
                : vehiculos.length === 0
                ? <p className="text-sm text-slate-400 italic text-center py-8">Sin vehículos registrados.</p>
                : vehiculos.map((v, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <TruckIcon className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{v.modelo}</p>
                        <p className="text-xs text-slate-400">Placas: <span className="font-mono">{v.placas}</span> · {v.anio}</p>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── PAGOS ── */}
          {tab === 'pagos' && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-100 text-sm font-semibold text-slate-700">Historial de pagos</div>
              {cargandoRelacionados
                ? <div className="p-4 space-y-2">{[1,2].map(i => <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-lg" />)}</div>
                : pagos.length === 0
                ? <p className="text-sm text-slate-400 italic p-6 text-center">Sin pagos registrados.</p>
                : <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Concepto</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagos.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.fecha}</td>
                        <td className="px-4 py-3 text-slate-700">{p.concepto}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">${p.monto.toLocaleString()} MXN</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pagoEstatusStyle[p.estatus] ?? 'bg-slate-100 text-slate-500'}`}>{p.estatus}</span>
                        </td>
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
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Agregar nota interna..."
                  value={nuevaNota}
                  onChange={e => setNuevaNota(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNota()}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
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
  usuario, onClose, onOpenDetail,
}: { usuario: Usuario; onClose: () => void; onOpenDetail: (tab: DetailTab) => void }) {
  const acciones: { label: string; color: string; tab?: DetailTab; action?: () => void }[] = [
    { label: 'Ver perfil completo',   color: 'blue',   tab: 'perfil' },
    { label: 'Editar datos',          color: 'indigo', tab: 'perfil' },
    { label: 'Ver viajes',            color: 'slate',  tab: 'viajes' },
    { label: 'Ver vehículos',         color: 'slate',  tab: 'vehiculos' },
    { label: 'Ver pagos',             color: 'slate',  tab: 'pagos' },
    { label: 'Agregar nota interna',  color: 'amber',  tab: 'notas' },
    { label: usuario.estatus === 'Suspendido' ? 'Reactivar cuenta' : 'Suspender cuenta',
      color: usuario.estatus === 'Suspendido' ? 'green' : 'red' },
  ]
  const colorCls: Record<string, string> = {
    blue:   'text-blue-600 hover:bg-blue-50',
    indigo: 'text-indigo-600 hover:bg-indigo-50',
    slate:  'text-slate-600 hover:bg-slate-50',
    amber:  'text-amber-600 hover:bg-amber-50',
    green:  'text-green-600 hover:bg-green-50',
    red:    'text-red-600 hover:bg-red-50',
  }
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-4 w-64" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <p className="font-semibold text-slate-800 text-sm">{usuario.nombre} {usuario.apellido}</p>
          <button onClick={onClose}><XMarkIcon className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="space-y-0.5">
          {acciones.map((a, i) => (
            <button key={i}
              onClick={() => { onClose(); if (a.tab) onOpenDetail(a.tab) }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${colorCls[a.color]}`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SUB-COMPONENTES ──────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">{icon} {title}</h3>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">{children}</div>
}

function Field({ label, value, editable, mono, onChange }: { label: string; value: string | React.ReactNode; editable?: boolean; mono?: boolean; onChange?: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      {editable && typeof value === 'string'
        ? <input type="text" value={value} onChange={e => onChange?.(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        : <div className={`text-sm text-slate-700 ${mono ? 'font-mono' : ''}`}>{value}</div>
      }
    </div>
  )
}

// ─── CATÁLOGOS SAT ────────────────────────────────────────────────────────────
const REGIMENES_FISCAL = [
  { clave: '601', desc: '601 - General de Ley Personas Morales' },
  { clave: '603', desc: '603 - Personas Morales con Fines no Lucrativos' },
  { clave: '605', desc: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { clave: '606', desc: '606 - Arrendamiento' },
  { clave: '607', desc: '607 - Régimen de Enajenación o Adquisición de Bienes' },
  { clave: '608', desc: '608 - Demás Ingresos' },
  { clave: '610', desc: '610 - Residentes en el Extranjero sin Establecimiento Permanente en México' },
  { clave: '611', desc: '611 - Ingresos por Dividendos (socios y accionistas)' },
  { clave: '612', desc: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
  { clave: '614', desc: '614 - Ingresos por intereses' },
  { clave: '615', desc: '615 - Régimen de los ingresos por obtención de premios' },
  { clave: '616', desc: '616 - Sin obligaciones fiscales' },
  { clave: '620', desc: '620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
  { clave: '621', desc: '621 - Incorporación Fiscal' },
  { clave: '622', desc: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { clave: '623', desc: '623 - Opcional para Grupos de Sociedades' },
  { clave: '624', desc: '624 - Coordinados' },
  { clave: '625', desc: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { clave: '626', desc: '626 - Régimen Simplificado de Confianza' },
]

const USOS_CFDI = [
  { clave: 'G01', desc: 'G01 - Adquisición de mercancias' },
  { clave: 'G02', desc: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { clave: 'G03', desc: 'G03 - Gastos en general' },
  { clave: 'I01', desc: 'I01 - Construcciones' },
  { clave: 'I02', desc: 'I02 - Mobilario y equipo de oficina por inversiones' },
  { clave: 'I03', desc: 'I03 - Equipo de transporte' },
  { clave: 'I04', desc: 'I04 - Equipo de computo y accesorios' },
  { clave: 'I05', desc: 'I05 - Dados, troqueles, moldes, matrices y herramental' },
  { clave: 'I06', desc: 'I06 - Comunicaciones telefónicas' },
  { clave: 'I07', desc: 'I07 - Comunicaciones satelitales' },
  { clave: 'I08', desc: 'I08 - Otra maquinaria y equipo' },
  { clave: 'D01', desc: 'D01 - Honorarios médicos, dentales y gastos hospitalarios' },
  { clave: 'D02', desc: 'D02 - Gastos médicos por incapacidad o discapacidad' },
  { clave: 'D03', desc: 'D03 - Gastos funerales' },
  { clave: 'D04', desc: 'D04 - Donativos' },
  { clave: 'D05', desc: 'D05 - Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)' },
  { clave: 'D06', desc: 'D06 - Aportaciones voluntarias al SAR' },
  { clave: 'D07', desc: 'D07 - Primas por seguros de gastos médicos' },
  { clave: 'D08', desc: 'D08 - Gastos de transportación escolar obligatoria' },
  { clave: 'D09', desc: 'D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones' },
  { clave: 'D10', desc: 'D10 - Pagos por servicios educativos (colegiaturas)' },
  { clave: 'S01', desc: 'S01 - Sin efectos fiscales' },
  { clave: 'CP01', desc: 'CP01 - Pagos' },
  { clave: 'CN01', desc: 'CN01 - Nómina' },
]

// ─── NUEVO USUARIO FORM ───────────────────────────────────────────────────────
function NuevoUsuarioForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    nombre: '', apellido: '', curp: '', email: '', telefono: '',
    tipo: '' as TipoUsuario | '',
    // Domicilio general (no fiscal)
    calle: '', numero: '', colonia: '', municipio: '', estadoGeo: '', codigoPostal: '',
    // Fiscal
    requiereFactura: false,
    razonSocial: '', rfc: '', regimenFiscal: '', cfdi: '',
    fiscalCalle: '', fiscalNumero: '', fiscalColonia: '',
    fiscalMunicipio: '', fiscalEstado: '', fiscalCp: '',
  })
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')

  const set = (k: keyof typeof form, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nombre)   e.nombre   = 'Requerido'
    if (!form.apellido) e.apellido = 'Requerido'
    if (!form.email)    e.email    = 'Requerido'
    if (!form.telefono) e.telefono = 'Requerido'
    if (!form.tipo)     e.tipo     = 'Requerido'
    if (form.requiereFactura) {
      if (!form.razonSocial)   e.razonSocial   = 'Requerido para facturación'
      if (!form.rfc)           e.rfc           = 'Requerido para facturación'
      if (!form.regimenFiscal) e.regimenFiscal = 'Requerido para facturación'
      if (!form.cfdi)          e.cfdi          = 'Requerido para facturación'
      if (!form.fiscalCalle)   e.fiscalCalle   = 'Requerido para facturación'
      if (!form.fiscalCp)      e.fiscalCp      = 'Requerido para facturación'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setGuardando(true)
    setErrorGuardar('')
    try {
    const sb = getSupabaseBrowserClient()

      const domicilioFiscal = form.requiereFactura
        ? [form.fiscalCalle, form.fiscalNumero, form.fiscalColonia, form.fiscalMunicipio, form.fiscalEstado, form.fiscalCp]
            .filter(Boolean).join(', ').toUpperCase()
        : null

      const { error } = await sb.from('usuarios').insert({
        nombre:           form.nombre.toUpperCase(),
        apellido:         form.apellido.toUpperCase(),
        curp:             form.curp.toUpperCase() || null,
        email:            form.email.toLowerCase(),
        telefono:         form.telefono,
        tipo:             form.tipo,
        estatus:          'Activo',
        calle:            form.calle.toUpperCase() || null,
        numero:           form.numero.toUpperCase() || null,
        colonia:          form.colonia.toUpperCase() || null,
        municipio:        form.municipio.toUpperCase() || null,
        estado_geo:       form.estadoGeo.toUpperCase() || null,
        codigo_postal:    form.codigoPostal || null,
        razon_social:     form.requiereFactura ? form.razonSocial.toUpperCase() : null,
        rfc:              form.requiereFactura ? form.rfc.toUpperCase() : null,
        regimen_fiscal:   form.requiereFactura ? form.regimenFiscal : null,
        cfdi:             form.requiereFactura ? form.cfdi : null,
        domicilio_fiscal: domicilioFiscal,
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

  const cls = (k: string) =>
    `w-full border ${errors[k] ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`
  const Err = ({ k }: { k: string }) =>
    errors[k] ? <p className="text-xs text-red-500 mt-0.5">{errors[k]}</p> : null
  const Label = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
    <label className="block text-xs font-medium text-slate-500 mb-1">
      {children}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Nuevo Usuario</h2>
            <p className="text-xs text-slate-400">Registra un nuevo cliente en el sistema</p>
          </div>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── Datos personales ── */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">👤 Datos personales</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label req>Nombre(s)</Label>
                <input type="text" placeholder="NOMBRE(S)" value={form.nombre}
                  onChange={e => set('nombre', e.target.value.toUpperCase())} className={cls('nombre')} />
                <Err k="nombre" />
              </div>
              <div>
                <Label req>Apellido(s)</Label>
                <input type="text" placeholder="APELLIDO(S)" value={form.apellido}
                  onChange={e => set('apellido', e.target.value.toUpperCase())} className={cls('apellido')} />
                <Err k="apellido" />
              </div>
              <div>
                <Label>CURP</Label>
                <input type="text" placeholder="18 CARACTERES" maxLength={18} value={form.curp}
                  onChange={e => set('curp', e.target.value.toUpperCase())} className={cls('curp')} />
              </div>
              <div>
                <Label req>Tipo de usuario</Label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={cls('tipo')}>
                  <option value="">Seleccionar...</option>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <Err k="tipo" />
              </div>
              <div>
                <Label req>Correo electrónico</Label>
                <input type="email" placeholder="correo@ejemplo.com" value={form.email}
                  onChange={e => set('email', e.target.value)} className={cls('email')} />
                <Err k="email" />
              </div>
              <div>
                <Label req>Teléfono</Label>
                <input type="tel" placeholder="55-0000-0000" maxLength={12} value={form.telefono}
                  onChange={e => {
                    const d = e.target.value.replace(/\D/g,'').slice(0,10)
                    set('telefono', d.length<=3?d:d.length<=6?`${d.slice(0,3)}-${d.slice(3)}`:`${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`)
                  }} className={cls('telefono')} />
                <Err k="telefono" />
              </div>
            </div>
          </div>

          {/* ── Domicilio general ── */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 border-b pb-1">🏠 Domicilio</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Label>Calle</Label>
                <input type="text" placeholder="NOMBRE DE LA CALLE" value={form.calle}
                  onChange={e => set('calle', e.target.value.toUpperCase())} className={cls('calle')} />
              </div>
              <div>
                <Label>Número</Label>
                <input type="text" placeholder="EXT / INT" value={form.numero}
                  onChange={e => set('numero', e.target.value.toUpperCase())} className={cls('numero')} />
              </div>
              <div>
                <Label>Colonia</Label>
                <input type="text" placeholder="COLONIA" value={form.colonia}
                  onChange={e => set('colonia', e.target.value.toUpperCase())} className={cls('colonia')} />
              </div>
              <div>
                <Label>Código Postal</Label>
                <input type="text" placeholder="00000" maxLength={5} value={form.codigoPostal}
                  onChange={e => set('codigoPostal', e.target.value.replace(/\D/g,'').slice(0,5))} className={cls('codigoPostal')} />
              </div>
              <div>
                <Label>Municipio / Alcaldía</Label>
                <input type="text" placeholder="MUNICIPIO" value={form.municipio}
                  onChange={e => set('municipio', e.target.value.toUpperCase())} className={cls('municipio')} />
              </div>
              <div>
                <Label>Estado</Label>
                <input type="text" placeholder="ESTADO" value={form.estadoGeo}
                  onChange={e => set('estadoGeo', e.target.value.toUpperCase())} className={cls('estadoGeo')} />
              </div>
            </div>
          </div>

          {/* ── Toggle facturación ── */}
          <div>
            <button
              type="button"
              onClick={() => set('requiereFactura', !form.requiereFactura)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                form.requiereFactura
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                  form.requiereFactura ? 'bg-blue-100' : 'bg-slate-200'
                }`}>🧾</div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${form.requiereFactura ? 'text-blue-700' : 'text-slate-700'}`}>
                    Requiere facturación
                  </p>
                  <p className="text-xs text-slate-400">Activa para capturar datos fiscales del cliente</p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${
                form.requiereFactura ? 'bg-blue-500' : 'bg-slate-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${
                  form.requiereFactura ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
            </button>
          </div>

          {/* ── Datos fiscales (condicional) ── */}
          {form.requiereFactura && (
            <div className="space-y-4 border border-blue-100 bg-blue-50/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide border-b border-blue-100 pb-2">
                🧾 Información fiscal
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label req>Razón social</Label>
                  <input type="text" placeholder="NOMBRE O RAZÓN SOCIAL COMPLETA" value={form.razonSocial}
                    onChange={e => set('razonSocial', e.target.value.toUpperCase())} className={cls('razonSocial')} />
                  <Err k="razonSocial" />
                </div>
                <div>
                  <Label req>RFC</Label>
                  <input type="text" placeholder="RFC 12 O 13 CARACTERES" maxLength={13} value={form.rfc}
                    onChange={e => set('rfc', e.target.value.toUpperCase())} className={cls('rfc')} />
                  <Err k="rfc" />
                </div>
                <div>
                  {/* vacío para alinear grid */}
                </div>
                <div className="col-span-2">
                  <Label req>Régimen fiscal</Label>
                  <select value={form.regimenFiscal} onChange={e => set('regimenFiscal', e.target.value)} className={cls('regimenFiscal')}>
                    <option value="">Seleccionar régimen...</option>
                    {REGIMENES_FISCAL.map(r => (
                      <option key={r.clave} value={r.clave}>{r.desc}</option>
                    ))}
                  </select>
                  <Err k="regimenFiscal" />
                </div>
                <div className="col-span-2">
                  <Label req>Uso de CFDI</Label>
                  <select value={form.cfdi} onChange={e => set('cfdi', e.target.value)} className={cls('cfdi')}>
                    <option value="">Seleccionar uso de CFDI...</option>
                    {USOS_CFDI.map(c => (
                      <option key={c.clave} value={c.clave}>{c.desc}</option>
                    ))}
                  </select>
                  <Err k="cfdi" />
                </div>
              </div>

              {/* Domicilio fiscal desglosado */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Domicilio fiscal</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <Label req>Calle</Label>
                    <input type="text" placeholder="NOMBRE DE LA CALLE" value={form.fiscalCalle}
                      onChange={e => set('fiscalCalle', e.target.value.toUpperCase())} className={cls('fiscalCalle')} />
                    <Err k="fiscalCalle" />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <input type="text" placeholder="EXT / INT" value={form.fiscalNumero}
                      onChange={e => set('fiscalNumero', e.target.value.toUpperCase())} className={cls('fiscalNumero')} />
                  </div>
                  <div>
                    <Label>Colonia</Label>
                    <input type="text" placeholder="COLONIA" value={form.fiscalColonia}
                      onChange={e => set('fiscalColonia', e.target.value.toUpperCase())} className={cls('fiscalColonia')} />
                  </div>
                  <div>
                    <Label req>Código Postal</Label>
                    <input type="text" placeholder="00000" maxLength={5} value={form.fiscalCp}
                      onChange={e => set('fiscalCp', e.target.value.replace(/\D/g,'').slice(0,5))} className={cls('fiscalCp')} />
                    <Err k="fiscalCp" />
                  </div>
                  <div>
                    <Label>Municipio / Alcaldía</Label>
                    <input type="text" placeholder="MUNICIPIO" value={form.fiscalMunicipio}
                      onChange={e => set('fiscalMunicipio', e.target.value.toUpperCase())} className={cls('fiscalMunicipio')} />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <input type="text" placeholder="ESTADO" value={form.fiscalEstado}
                      onChange={e => set('fiscalEstado', e.target.value.toUpperCase())} className={cls('fiscalEstado')} />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <div className="flex flex-col items-end gap-1">
            {errorGuardar && <p className="text-xs text-red-500">{errorGuardar}</p>}
            <button onClick={handleSubmit} disabled={guardando}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <CheckCircleIcon className="w-4 h-4" />
              {guardando ? 'Guardando...' : 'Registrar usuario'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function UsuariosView() {
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<TipoUsuario | 'Todos'>('Todos')
  const [estatusFiltro, setEstatusFiltro] = useState<Estatus | 'Todos'>('Todos')
  const [actionUser, setActionUser] = useState<Usuario | null>(null)
  const [detailUser, setDetailUser] = useState<{ usuario: Usuario; tab: DetailTab } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)

  const cargarUsuarios = useCallback(async () => {
    const sb = getSupabaseBrowserClient()
    const { data, error } = await sb
      .from('usuarios')
      .select('id, nombre, apellido, curp, email, telefono, tipo, estatus, calle, numero, colonia, municipio, estado_geo, codigo_postal, razon_social, rfc, regimen_fiscal, domicilio_fiscal, cfdi, created_at')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setUsuarios(data.map((u: Record<string, unknown>) => ({
        id:               String(u.id ?? ''),
        nombre:           String(u.nombre ?? ''),
        apellido:         String(u.apellido ?? ''),
        curp:             String(u.curp ?? ''),
        email:            String(u.email ?? ''),
        telefono:         String(u.telefono ?? ''),
        tipo:             (u.tipo as TipoUsuario) ?? 'Personal',
        estatus:          (u.estatus as Estatus) ?? 'Activo',
        fechaRegistro:    String((u.created_at as string)?.slice(0, 10) ?? ''),
        viajesSolicitados: 0,
        razonSocial:      String(u.razon_social ?? ''),
        rfc:              String(u.rfc ?? ''),
        regimenFiscal:    String(u.regimen_fiscal ?? ''),
        domicilioFiscal:  String(u.domicilio_fiscal ?? ''),
        cfdi:             String(u.cfdi ?? ''),
        calle:            String(u.calle ?? ''),
        numero:           String(u.numero ?? ''),
        colonia:          String(u.colonia ?? ''),
        municipio:        String(u.municipio ?? ''),
        estadoGeo:        String(u.estado_geo ?? ''),
        codigoPostal:     String(u.codigo_postal ?? ''),
        vehiculos: [], pagos: [], viajes: [], notas: [],
      })))
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargarUsuarios() }, [cargarUsuarios])

  const filtered = usuarios.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
    const matchTipo = tipoFiltro === 'Todos' || u.tipo === tipoFiltro
    const matchEstatus = estatusFiltro === 'Todos' || u.estatus === estatusFiltro
    return matchSearch && matchTipo && matchEstatus
  })

  const counts = {
    total:      usuarios.length,
    activos:    usuarios.filter(u => u.estatus === 'Activo').length,
    pendientes: usuarios.filter(u => u.estatus === 'Pendiente').length,
    suspendidos:usuarios.filter(u => u.estatus === 'Suspendido').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showForm && <NuevoUsuarioForm onClose={() => setShowForm(false)} onSave={cargarUsuarios} />}
      {detailUser && <UsuarioDetalle usuario={detailUser.usuario} onClose={() => setDetailUser(null)} onUpdate={cargarUsuarios} />}
      {actionUser && (
        <AccionesMenu
          usuario={actionUser}
          onClose={() => setActionUser(null)}
          onOpenDetail={(tab) => { setDetailUser({ usuario: actionUser!, tab }); setActionUser(null) }}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total usuarios', value: counts.total, color: 'text-slate-800' },
          { label: 'Activos', value: counts.activos, color: 'text-green-600' },
          { label: 'Pendientes', value: counts.pendientes, color: 'text-amber-600' },
          { label: 'Suspendidos', value: counts.suspendidos, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 space-y-3">
          {/* Tipo filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {(['Todos', ...TIPOS] as (TipoUsuario | 'Todos')[]).map(t => (
              <button key={t} onClick={() => setTipoFiltro(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  tipoFiltro === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>{t}</button>
            ))}
          </div>
          {/* Search + estatus + new */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-2">
              {(['Todos', 'Activo', 'Pendiente', 'Suspendido', 'Inactivo'] as (Estatus | 'Todos')[]).map(e => (
                <button key={e} onClick={() => setEstatusFiltro(e)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    estatusFiltro === e ? 'bg-slate-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>{e}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
              </div>
              <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <PlusIcon className="w-4 h-4" />
                Nuevo
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {cargando ? (
            <div className="p-8 space-y-3">
              {[1,2,3,4].map(n => (
                <div key={n} className="flex gap-4 animate-pulse">
                  <div className="w-8 h-8 bg-slate-200 rounded-full" />
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
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3 text-center">Viajes</th>
                <th className="px-4 py-3 text-center">Vehículos</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 italic text-sm">Sin resultados.</td></tr>
              )}
              {filtered.map((u, i) => (
                <tr key={u.id || i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setDetailUser({ usuario: u, tab: 'perfil' })}>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{u.id.slice(0,8)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.nombre[0]}{u.apellido[0]}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{u.nombre} {u.apellido}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${tipoColor[u.tipo]}`}>{u.tipo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">{u.telefono}</div>
                    {u.razonSocial !== '—' && <div className="text-xs text-slate-400 truncate max-w-[120px]">{u.razonSocial}</div>}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{u.viajesSolicitados}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{u.vehiculos.length}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{u.fechaRegistro}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estatusStyle[u.estatus]}`}>{u.estatus}</span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setActionUser(u)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                      Acciones ▾
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  )
}