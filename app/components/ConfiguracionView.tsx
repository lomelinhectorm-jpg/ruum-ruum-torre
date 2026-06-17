'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import {
  ShieldCheckIcon,
  UsersIcon,
  MapPinIcon,
  TruckIcon,
  CameraIcon,
  BellIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  LockClosedIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TagIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ConfigTab =
  | 'roles' | 'usuarios' | 'zonas' | 'servicios' | 'vehiculos'
  | 'evidencia' | 'estados' | 'notificaciones' | 'pagos' | 'fiscal'
  | 'seguridad' | 'bitacora'

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-10 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-blue-500' : 'bg-slate-300'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SCard({ title, subtitle, children, action }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Badge({ text, color = 'slate' }: { text: string; color?: string }) {
  const cls: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700', amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-600', purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  }
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls[color] ?? cls.slate}`}>{text}</span>
}

function iCls(err?: boolean) {
  return `w-full border ${err ? 'border-red-400' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><PencilSquareIcon className="w-4 h-4" /></button>
      {onDelete && <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>}
    </div>
  )
}

// ─── 1. ROLES Y PERMISOS ─────────────────────────────────────────────────────
const MODULOS_SISTEMA = ['Dashboard','Viajes','Conductores','Usuarios','Evidencia','Incidencias','Pagos','Documentos','Tarifas','Empresas','Reportes','Configuración']

function TabRoles() {
  const [roles, setRoles] = useState<{id:string;nombre:string;descripcion:string;permisos:string[];activo:boolean;color:string}[]>([])
  const [cargando, setCargando] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: 'blue', permisos: [] as string[] })
  const [guardando, setGuardando] = useState(false)

  const getSb = async () => getSupabaseBrowserClient()

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const { data } = await sb.from('roles').select('id,nombre,descripcion,permisos,activo,color').order('created_at')
    if (data) setRoles(data.map((r: Record<string,unknown>) => ({
      id: String(r.id), nombre: String(r.nombre ?? ''), descripcion: String(r.descripcion ?? ''),
      permisos: Array.isArray(r.permisos) ? r.permisos as string[] : [],
      activo: Boolean(r.activo), color: String(r.color ?? 'slate'),
    })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const toggleActivo = async (id: string, activo: boolean) => {
    const sb = await getSb(); await sb.from('roles').update({ activo: !activo }).eq('id', id)
    setRoles(prev => prev.map(r => r.id === id ? { ...r, activo: !activo } : r))
  }

  const togglePermiso = async (id: string, permisos: string[], modulo: string) => {
    const nuevos = permisos.includes(modulo) ? permisos.filter(m => m !== modulo) : [...permisos, modulo]
    const sb = await getSb(); await sb.from('roles').update({ permisos: nuevos }).eq('id', id)
    setRoles(prev => prev.map(r => r.id === id ? { ...r, permisos: nuevos } : r))
  }

  const handleCrear = async () => {
    if (!form.nombre) return
    setGuardando(true)
    const sb = await getSb()
    await sb.from('roles').insert({ nombre: form.nombre.toUpperCase(), descripcion: form.descripcion, color: form.color, permisos: form.permisos, activo: true })
    setForm({ nombre: '', descripcion: '', color: 'blue', permisos: [] })
    setShowForm(false)
    setGuardando(false)
    cargar()
  }

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700', amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-100 text-slate-500',
  }

  return (
    <div className="space-y-4">
      <SCard title="🛡️ Roles del sistema" subtitle="Define qué puede ver y hacer cada rol"
        action={<button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Nuevo rol</button>}>
        {showForm && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-blue-700 uppercase">Nuevo rol</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500 mb-1 block">Nombre*</label><input type="text" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} className={iCls()} /></div>
              <div><label className="text-xs text-slate-500 mb-1 block">Color</label>
                <select value={form.color} onChange={e => setForm(f => ({...f, color: e.target.value}))} className={`${iCls()} bg-white`}>
                  {Object.keys(colorMap).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className="text-xs text-slate-500 mb-1 block">Descripción</label><input type="text" value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} className={iCls()} /></div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Módulos con acceso</label>
              <div className="flex flex-wrap gap-1.5">
                {MODULOS_SISTEMA.map(m => (
                  <button key={m} type="button"
                    onClick={() => setForm(f => ({ ...f, permisos: f.permisos.includes(m) ? f.permisos.filter(x => x !== m) : [...f.permisos, m] }))}
                    className={`px-2 py-1 rounded text-xs font-medium ${form.permisos.includes(m) ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
              <button onClick={handleCrear} disabled={guardando} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        )}
        {cargando ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />)}</div> : (
        <div className="space-y-3">
          {roles.length === 0 && <p className="text-center py-8 text-slate-400 text-xs italic">Sin roles registrados.</p>}
          {roles.map(r => (
            <div key={r.id} className={`border rounded-xl transition-colors ${!r.activo ? 'opacity-60 border-slate-200' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="p-0.5 text-slate-400">
                    {expanded === r.id ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${colorMap[r.color] ?? colorMap.slate}`}>{r.nombre}</span>
                      {!r.activo && <Badge text="Inactivo" color="slate" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{r.descripcion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400">{r.permisos.length} módulos</span>
                  <Toggle value={r.activo} onChange={() => toggleActivo(r.id, r.activo)} />
                  <RowActions onEdit={() => setEditing(editing === r.id ? null : r.id)} />
                </div>
              </div>
              {(expanded === r.id || editing === r.id) && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">
                    Módulos con acceso {editing === r.id && <span className="text-blue-500">(toca para activar/desactivar)</span>}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {MODULOS_SISTEMA.map(m => (
                      <button key={m} type="button" disabled={editing !== r.id}
                        onClick={() => togglePermiso(r.id, r.permisos, m)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${r.permisos.includes(m) ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-300 line-through'} ${editing === r.id ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </SCard>
    </div>
  )
}

// ─── 2. USUARIOS INTERNOS ─────────────────────────────────────────────────────
function TabUsuariosInternos() {
  const [usuarios, setUsuarios] = useState<{id:string;nombre:string;apellido:string;email:string;rol:string;ultimo:string;activo:boolean}[]>([])
  const [rolesDisponibles, setRolesDisponibles] = useState<string[]>([])
  const [cargando, setCargando] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', rol: '' })
  const [guardando, setGuardando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const sb = getSupabaseBrowserClient()
    const [usrRes, rolRes] = await Promise.all([
      sb.from('usuarios_internos').select('id, nombre, apellido, email, rol, ultimo_acceso, activo').order('created_at', { ascending: false }),
      sb.from('roles').select('nombre').eq('activo', true).order('nombre'),
    ])
    if (usrRes.data) setUsuarios(usrRes.data.map((u: Record<string,unknown>) => ({
      id: String(u.id), nombre: String(u.nombre ?? ''), apellido: String(u.apellido ?? ''),
      email: String(u.email ?? ''), rol: String(u.rol ?? ''),
      ultimo: String((u.ultimo_acceso as string)?.slice(0,16).replace('T',' ') ?? '—'),
      activo: Boolean(u.activo),
    })))
    if (rolRes.data) setRolesDisponibles(rolRes.data.map((r: Record<string,unknown>) => String(r.nombre ?? '')))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirNuevo = () => {
    setEditId(null)
    setForm({ nombre: '', apellido: '', email: '', rol: '' })
    setShowForm(true)
  }

  const abrirEditar = (u: typeof usuarios[number]) => {
    setEditId(u.id)
    setForm({ nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol })
    setShowForm(true)
  }

  const handleGuardar = async () => {
    if (!form.nombre || !form.email || !form.rol) return
    setGuardando(true)
    const sb = getSupabaseBrowserClient()
    if (editId) {
      await sb.from('usuarios_internos').update({
        nombre: form.nombre.toUpperCase(), apellido: form.apellido.toUpperCase(),
        email: form.email.toLowerCase(), rol: form.rol,
      }).eq('id', editId)
    } else {
      await sb.from('usuarios_internos').insert({
        nombre: form.nombre.toUpperCase(), apellido: form.apellido.toUpperCase(),
        email: form.email.toLowerCase(), rol: form.rol, activo: true,
      })
    }
    setForm({ nombre: '', apellido: '', email: '', rol: '' })
    setEditId(null)
    setShowForm(false)
    setGuardando(false)
    cargar()
  }

  const toggleActivo = async (id: string, activo: boolean) => {
    const sb = getSupabaseBrowserClient()
    await sb.from('usuarios_internos').update({ activo: !activo }).eq('id', id)
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: !activo } : u))
  }

  const eliminar = async (id: string) => {
    const sb = getSupabaseBrowserClient()
    await sb.from('usuarios_internos').delete().eq('id', id)
    setUsuarios(prev => prev.filter(u => u.id !== id))
    setConfirmDelete(null)
  }

  const iCls2 = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <SCard title="👥 Usuarios internos del sistema" subtitle="Personal con acceso al panel de administración"
      action={<button onClick={() => (showForm ? setShowForm(false) : abrirNuevo())} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Nuevo usuario</button>}>
      {showForm && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase">{editId ? 'Editar usuario interno' : 'Nuevo usuario interno'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 mb-1 block">Nombre(s)*</label><input type="text" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value.toUpperCase()}))} className={iCls2} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Apellido(s)</label><input type="text" value={form.apellido} onChange={e => setForm(f => ({...f, apellido: e.target.value.toUpperCase()}))} className={iCls2} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Correo*</label><input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={iCls2} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Rol*</label>
              <select value={form.rol} onChange={e => setForm(f => ({...f, rol: e.target.value}))} className={iCls2}>
                <option value="">{rolesDisponibles.length === 0 ? 'Sin roles activos...' : 'Seleccionar...'}</option>
                {rolesDisponibles.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
            <button onClick={handleGuardar} disabled={guardando} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        {cargando ? (
          <div className="space-y-2 py-4">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}</div>
        ) : (
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Último acceso</th>
              <th className="px-4 py-3 text-center">Activo</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-xs italic">Sin usuarios internos registrados.</td></tr>}
            {usuarios.map(u => (
              <tr key={u.id} className={`hover:bg-slate-50 ${!u.activo ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-slate-800">{u.nombre} {u.apellido}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                <td className="px-4 py-3"><Badge text={u.rol} color="blue" /></td>
                <td className="px-4 py-3 text-xs text-slate-400">{u.ultimo}</td>
                <td className="px-4 py-3 text-center"><Toggle value={u.activo} onChange={() => toggleActivo(u.id, u.activo)} /></td>
                <td className="px-4 py-3 text-right">
                  {confirmDelete === u.id ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">¿Eliminar?</span>
                      <button onClick={() => eliminar(u.id)} className="text-xs text-red-600 font-medium hover:underline">Sí</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:underline">No</button>
                    </span>
                  ) : (
                    <RowActions onEdit={() => abrirEditar(u)} onDelete={() => setConfirmDelete(u.id)} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </SCard>
  )
}

// ─── 3. ZONAS DE OPERACIÓN ────────────────────────────────────────────────────
function TabZonas() {
  const [zonas, setZonas] = useState<{id:string;nombre:string;descripcion:string;radio:number;tarifa:string;activa:boolean}[]>([])
  const [cargando, setCargando] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', radio: '', tarifa: '' })
  const [guardando, setGuardando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const getSb = async () => getSupabaseBrowserClient()

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const { data } = await sb.from('zonas').select('id,nombre,descripcion,radio,tarifa,activa').order('created_at')
    if (data) setZonas(data.map((z: Record<string,unknown>) => ({ id: String(z.id), nombre: String(z.nombre??''), descripcion: String(z.descripcion??''), radio: Number(z.radio??0), tarifa: String(z.tarifa??''), activa: Boolean(z.activa) })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const toggleZona = async (id: string, activa: boolean) => {
    const sb = await getSb(); await sb.from('zonas').update({ activa: !activa }).eq('id', id)
    setZonas(prev => prev.map(z => z.id === id ? { ...z, activa: !activa } : z))
  }

  const abrirNueva = () => { setEditId(null); setForm({ nombre: '', descripcion: '', radio: '', tarifa: '' }); setShowForm(true) }
  const abrirEditar = (z: typeof zonas[number]) => { setEditId(z.id); setForm({ nombre: z.nombre, descripcion: z.descripcion, radio: String(z.radio), tarifa: z.tarifa }); setShowForm(true) }

  const guardar = async () => {
    if (!form.nombre) return
    setGuardando(true)
    const sb = await getSb()
    const payload = { nombre: form.nombre.toUpperCase(), descripcion: form.descripcion, radio: Number(form.radio) || 0, tarifa: form.tarifa }
    if (editId) {
      await sb.from('zonas').update(payload).eq('id', editId)
    } else {
      await sb.from('zonas').insert({ ...payload, activa: true })
    }
    setShowForm(false); setEditId(null); setGuardando(false)
    cargar()
  }

  const eliminar = async (id: string) => {
    const sb = await getSb(); await sb.from('zonas').delete().eq('id', id)
    setZonas(prev => prev.filter(z => z.id !== id))
    setConfirmDelete(null)
  }

  return (
    <SCard title="📍 Zonas de operación" subtitle="Define las áreas de cobertura del servicio"
      action={<button onClick={() => (showForm ? setShowForm(false) : abrirNueva())} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Nueva zona</button>}>
      {showForm && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase">{editId ? 'Editar zona' : 'Nueva zona'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 mb-1 block">Nombre*</label><input type="text" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value.toUpperCase()}))} className={iCls()} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Radio (km)</label><input type="number" min="0" value={form.radio} onChange={e => setForm(f => ({...f, radio: e.target.value}))} className={iCls()} /></div>
            <div className="sm:col-span-2"><label className="text-xs text-slate-500 mb-1 block">Descripción</label><input type="text" value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} className={iCls()} /></div>
            <div className="sm:col-span-2"><label className="text-xs text-slate-500 mb-1 block">Tarifa asociada</label><input type="text" placeholder="Ej. Tarifa local" value={form.tarifa} onChange={e => setForm(f => ({...f, tarifa: e.target.value}))} className={iCls()} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
            <button onClick={guardar} disabled={guardando} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      )}
      {cargando ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />)}</div> : (
      <div className="space-y-2">
        {zonas.length === 0 && <p className="text-center py-8 text-slate-400 text-xs italic">Sin zonas registradas.</p>}
        {zonas.map(z => (
          <div key={z.id} className={`flex items-center justify-between p-4 border rounded-xl transition-colors ${z.activa ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${z.activa ? 'bg-blue-50' : 'bg-slate-100'}`}>
                <MapPinIcon className={`w-4 h-4 ${z.activa ? 'text-blue-500' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="font-medium text-slate-800 text-sm">{z.nombre}</p>
                <p className="text-xs text-slate-400">{z.descripcion} · Radio: {z.radio} km · <span className="text-blue-600">{z.tarifa}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Toggle value={z.activa} onChange={() => toggleZona(z.id, z.activa)} />
              {confirmDelete === z.id ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">¿Eliminar?</span>
                  <button onClick={() => eliminar(z.id)} className="text-xs text-red-600 font-medium hover:underline">Sí</button>
                  <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:underline">No</button>
                </span>
              ) : (
                <RowActions onEdit={() => abrirEditar(z)} onDelete={() => setConfirmDelete(z.id)} />
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </SCard>
  )
}

// ─── 4. TIPOS DE SERVICIO ─────────────────────────────────────────────────────
function TabServicios() {
  const [servicios, setServicios] = useState<{id:string;nombre:string;descripcion:string;icono:string;requiereEvidencia:boolean;requiereFirma:boolean;activo:boolean}[]>([])
  const [cargando, setCargando] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', icono: '🚘', requiereEvidencia: true, requiereFirma: true })
  const [guardando, setGuardando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const getSb = async () => getSupabaseBrowserClient()

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const { data } = await sb.from('tipos_servicio').select('id,nombre,descripcion,icono,requiere_evidencia,requiere_firma,activo').order('created_at')
    if (data) setServicios(data.map((s: Record<string,unknown>) => ({ id: String(s.id), nombre: String(s.nombre??''), descripcion: String(s.descripcion??''), icono: String(s.icono??''), requiereEvidencia: Boolean(s.requiere_evidencia), requiereFirma: Boolean(s.requiere_firma), activo: Boolean(s.activo) })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const toggle = async (id: string, field: string, val: boolean) => {
    const sb = await getSb(); await sb.from('tipos_servicio').update({ [field]: !val }).eq('id', id)
    setServicios(prev => prev.map(s => s.id === id ? { ...s, [field === 'requiere_evidencia' ? 'requiereEvidencia' : field === 'requiere_firma' ? 'requiereFirma' : 'activo']: !val } : s))
  }

  const abrirNuevo = () => { setEditId(null); setForm({ nombre: '', descripcion: '', icono: '🚘', requiereEvidencia: true, requiereFirma: true }); setShowForm(true) }
  const abrirEditar = (s: typeof servicios[number]) => { setEditId(s.id); setForm({ nombre: s.nombre, descripcion: s.descripcion, icono: s.icono || '🚘', requiereEvidencia: s.requiereEvidencia, requiereFirma: s.requiereFirma }); setShowForm(true) }

  const guardar = async () => {
    if (!form.nombre) return
    setGuardando(true)
    const sb = await getSb()
    const payload = { nombre: form.nombre, descripcion: form.descripcion, icono: form.icono, requiere_evidencia: form.requiereEvidencia, requiere_firma: form.requiereFirma }
    if (editId) {
      await sb.from('tipos_servicio').update(payload).eq('id', editId)
    } else {
      await sb.from('tipos_servicio').insert({ ...payload, activo: true })
    }
    setShowForm(false); setEditId(null); setGuardando(false)
    cargar()
  }

  const eliminar = async (id: string) => {
    const sb = await getSb(); await sb.from('tipos_servicio').delete().eq('id', id)
    setServicios(prev => prev.filter(s => s.id !== id))
    setConfirmDelete(null)
  }

  return (
    <SCard title="🚘 Tipos de servicio" subtitle="Configura los tipos de traslado disponibles"
      action={<button onClick={() => (showForm ? setShowForm(false) : abrirNuevo())} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Nuevo tipo</button>}>
      {showForm && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase">{editId ? 'Editar tipo de servicio' : 'Nuevo tipo de servicio'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-3">
            <div><label className="text-xs text-slate-500 mb-1 block">Icono</label><input type="text" maxLength={4} value={form.icono} onChange={e => setForm(f => ({...f, icono: e.target.value}))} className={`${iCls()} text-center text-lg`} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Nombre*</label><input type="text" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} className={iCls()} /></div>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">Descripción</label><input type="text" value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} className={iCls()} /></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={form.requiereEvidencia} onChange={e => setForm(f => ({...f, requiereEvidencia: e.target.checked}))} /> Requiere evidencia</label>
            <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={form.requiereFirma} onChange={e => setForm(f => ({...f, requiereFirma: e.target.checked}))} /> Requiere firma</label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
            <button onClick={guardar} disabled={guardando} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      )}
      {cargando ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />)}</div> : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Servicio</th>
              <th className="px-4 py-3 text-center">Req. Evidencia</th>
              <th className="px-4 py-3 text-center">Req. Firma</th>
              <th className="px-4 py-3 text-center">Activo</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {servicios.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-xs italic">Sin tipos de servicio registrados.</td></tr>}
            {servicios.map(s => (
              <tr key={s.id} className={`hover:bg-slate-50 ${!s.activo ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.icono}</span>
                    <div><p className="font-medium text-slate-800">{s.nombre}</p><p className="text-xs text-slate-400">{s.descripcion}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center"><Toggle value={s.requiereEvidencia} onChange={() => toggle(s.id, 'requiere_evidencia', s.requiereEvidencia)} /></td>
                <td className="px-4 py-3 text-center"><Toggle value={s.requiereFirma} onChange={() => toggle(s.id, 'requiere_firma', s.requiereFirma)} /></td>
                <td className="px-4 py-3 text-center"><Toggle value={s.activo} onChange={() => toggle(s.id, 'activo', s.activo)} /></td>
                <td className="px-4 py-3 text-right">
                  {confirmDelete === s.id ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">¿Eliminar?</span>
                      <button onClick={() => eliminar(s.id)} className="text-xs text-red-600 font-medium hover:underline">Sí</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:underline">No</button>
                    </span>
                  ) : (
                    <RowActions onEdit={() => abrirEditar(s)} onDelete={() => setConfirmDelete(s.id)} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </SCard>
  )
}

// ─── 5. TIPOS DE VEHÍCULOS ────────────────────────────────────────────────────
function TabVehiculos() {
  const [tipos, setTipos] = useState<{id:string;nombre:string;descripcion:string;icono:string;capacidad:number;activo:boolean}[]>([])
  const [cargando, setCargando] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', icono: '🚗', capacidad: '' })
  const [guardando, setGuardando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const getSb = async () => getSupabaseBrowserClient()

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const { data } = await sb.from('tipos_vehiculo').select('id,nombre,descripcion,icono,capacidad,activo').order('created_at')
    if (data) setTipos(data.map((t: Record<string,unknown>) => ({ id: String(t.id), nombre: String(t.nombre??''), descripcion: String(t.descripcion??''), icono: String(t.icono??''), capacidad: Number(t.capacidad??0), activo: Boolean(t.activo) })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const toggleTipo = async (id: string, activo: boolean) => {
    const sb = await getSb(); await sb.from('tipos_vehiculo').update({ activo: !activo }).eq('id', id)
    setTipos(prev => prev.map(t => t.id === id ? { ...t, activo: !activo } : t))
  }

  const abrirNuevo = () => { setEditId(null); setForm({ nombre: '', descripcion: '', icono: '🚗', capacidad: '' }); setShowForm(true) }
  const abrirEditar = (t: typeof tipos[number]) => { setEditId(t.id); setForm({ nombre: t.nombre, descripcion: t.descripcion, icono: t.icono || '🚗', capacidad: String(t.capacidad) }); setShowForm(true) }

  const guardar = async () => {
    if (!form.nombre) return
    setGuardando(true)
    const sb = await getSb()
    const payload = { nombre: form.nombre, descripcion: form.descripcion, icono: form.icono, capacidad: Number(form.capacidad) || 0 }
    if (editId) {
      await sb.from('tipos_vehiculo').update(payload).eq('id', editId)
    } else {
      await sb.from('tipos_vehiculo').insert({ ...payload, activo: true })
    }
    setShowForm(false); setEditId(null); setGuardando(false)
    cargar()
  }

  const eliminar = async (id: string) => {
    const sb = await getSb(); await sb.from('tipos_vehiculo').delete().eq('id', id)
    setTipos(prev => prev.filter(t => t.id !== id))
    setConfirmDelete(null)
  }

  return (
    <SCard title="🚘 Tipos de vehículo" subtitle="Categorías de vehículos que opera la plataforma"
      action={<button onClick={() => (showForm ? setShowForm(false) : abrirNuevo())} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Nuevo tipo</button>}>
      {showForm && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase">{editId ? 'Editar tipo de vehículo' : 'Nuevo tipo de vehículo'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr_100px] gap-3">
            <div><label className="text-xs text-slate-500 mb-1 block">Icono</label><input type="text" maxLength={4} value={form.icono} onChange={e => setForm(f => ({...f, icono: e.target.value}))} className={`${iCls()} text-center text-lg`} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Nombre*</label><input type="text" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} className={iCls()} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Capacidad</label><input type="number" min="0" value={form.capacidad} onChange={e => setForm(f => ({...f, capacidad: e.target.value}))} className={iCls()} /></div>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">Descripción</label><input type="text" value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} className={iCls()} /></div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
            <button onClick={guardar} disabled={guardando} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      )}
      {cargando ? <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />)}</div> : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tipos.length === 0 && <p className="col-span-2 text-center py-8 text-slate-400 text-xs italic">Sin tipos de vehículo registrados.</p>}
        {tipos.map(t => (
          <div key={t.id} className={`border rounded-xl p-4 flex items-center justify-between gap-3 ${!t.activo ? 'opacity-50 border-slate-100' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{t.icono}</span>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{t.nombre}</p>
                <p className="text-xs text-slate-400">{t.descripcion}</p>
                <p className="text-xs text-slate-500 mt-0.5">Capacidad: {t.capacidad} personas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Toggle value={t.activo} onChange={() => toggleTipo(t.id, t.activo)} />
              {confirmDelete === t.id ? (
                <span className="inline-flex items-center gap-1.5">
                  <button onClick={() => eliminar(t.id)} className="text-xs text-red-600 font-medium hover:underline">Sí</button>
                  <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:underline">No</button>
                </span>
              ) : (
                <RowActions onEdit={() => abrirEditar(t)} onDelete={() => setConfirmDelete(t.id)} />
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </SCard>
  )
}

// ─── 6. REGLAS DE EVIDENCIA ───────────────────────────────────────────────────
function TabEvidencia() {
  const [reglas, setReglas] = useState({
    fotoFrente: true, fotoLadoPiloto: true, fotoLadoCopiloto: true, fotoTrasera: true, fotoTablero: true,
    kmInicial: true, kmFinal: true, nivelCombustible: true, llaves: true,
    firmaInicial: true, firmaFinal: true, dañosVisibles: true,
    tiempoLimiteHoras: 2, sancionIncompleta: 'Alerta + retención de pago',
  })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const getSb = async () => getSupabaseBrowserClient()

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const { data } = await sb.from('configuracion').select('valor').eq('clave', 'reglas_evidencia').single()
    if (data?.valor) { try { setReglas(prev => ({ ...prev, ...JSON.parse(String(data.valor)) })) } catch {} }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardar = async () => {
    setGuardando(true)
    const sb = await getSb()
    await sb.from('configuracion').upsert({ clave: 'reglas_evidencia', valor: JSON.stringify(reglas) }, { onConflict: 'clave' })
    setGuardando(false)
  }

  const fotos = [
    { key: 'fotoFrente', label: 'Foto frente' },
    { key: 'fotoLadoPiloto', label: 'Foto lado piloto' },
    { key: 'fotoLadoCopiloto', label: 'Foto lado copiloto' },
    { key: 'fotoTrasera', label: 'Foto trasera' },
    { key: 'fotoTablero', label: 'Foto tablero' },
  ] as const

  const datos = [
    { key: 'kmInicial', label: 'Kilometraje inicial' },
    { key: 'kmFinal', label: 'Kilometraje final' },
    { key: 'nivelCombustible', label: 'Nivel de combustible' },
    { key: 'llaves', label: 'Registro de llaves' },
    { key: 'firmaInicial', label: 'Firma/confirmación inicial' },
    { key: 'firmaFinal', label: 'Firma/confirmación final' },
    { key: 'dañosVisibles', label: 'Reporte de daños visibles' },
  ] as const

  if (cargando) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />)}</div>

  return (
    <div className="space-y-4">
      <SCard title="📷 Fotografías requeridas" subtitle="Define qué fotos son obligatorias por viaje">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fotos.map(f => (
            <label key={f.key} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
              <span className="text-sm text-slate-700">{f.label}</span>
              <Toggle value={reglas[f.key]} onChange={v => setReglas(r => ({ ...r, [f.key]: v }))} />
            </label>
          ))}
        </div>
      </SCard>
      <SCard title="📋 Datos operativos requeridos" subtitle="Información que el conductor debe registrar">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {datos.map(d => (
            <label key={d.key} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
              <span className="text-sm text-slate-700">{d.label}</span>
              <Toggle value={reglas[d.key]} onChange={v => setReglas(r => ({ ...r, [d.key]: v }))} />
            </label>
          ))}
        </div>
      </SCard>
      <SCard title="⚙️ Reglas de validación">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Tiempo límite para cargar evidencia (horas)</label>
            <input type="number" value={reglas.tiempoLimiteHoras} min={1} max={24}
              onChange={e => setReglas(r => ({ ...r, tiempoLimiteHoras: +e.target.value }))}
              className={iCls()} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Sanción por evidencia incompleta</label>
            <select value={reglas.sancionIncompleta} onChange={e => setReglas(r => ({ ...r, sancionIncompleta: e.target.value }))} className={`${iCls()} bg-white`}>
              <option>Solo alerta</option>
              <option>Alerta + retención de pago</option>
              <option>Alerta + suspensión temporal</option>
              <option>Bloqueo hasta completar</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={guardar} disabled={guardando} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckIcon className="w-4 h-4" />{guardando ? 'Guardando...' : 'Guardar reglas'}
          </button>
        </div>
      </SCard>
    </div>
  )
}

// ─── 7. ESTADOS DE VIAJE ──────────────────────────────────────────────────────
function TabEstados() {
  const [estados, setEstados] = useState<{id:string;orden:number;nombre:string;siguiente:string;color:string;auto:boolean}[]>([])
  const [cargando, setCargando] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)

  const getSb = async () => getSupabaseBrowserClient()

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const { data } = await sb.from('estados_viaje').select('id,orden,nombre,siguiente,color,auto').order('orden')
    if (data) setEstados(data.map((e: Record<string,unknown>) => ({
      id: String(e.id), orden: Number(e.orden ?? 0), nombre: String(e.nombre ?? ''),
      siguiente: String(e.siguiente ?? '—'), color: String(e.color ?? 'slate'), auto: Boolean(e.auto),
    })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardarSiguiente = async (id: string, siguiente: string, auto: boolean) => {
    const sb = await getSb()
    await sb.from('estados_viaje').update({ siguiente, auto }).eq('id', id)
    setEstados(prev => prev.map(e => e.id === id ? { ...e, siguiente, auto } : e))
    setEditing(null)
  }

  const colorDot: Record<string, string> = {
    slate: 'bg-slate-400', amber: 'bg-amber-500', blue: 'bg-blue-500',
    indigo: 'bg-indigo-500', orange: 'bg-orange-500', purple: 'bg-purple-500',
    violet: 'bg-violet-500', green: 'bg-green-500', red: 'bg-red-500', rose: 'bg-rose-500',
  }

  if (cargando) return <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-lg" />)}</div>

  return (
    <SCard title="🔄 Estados del ciclo de vida de un viaje" subtitle="Flujo de estados configurado por operaciones">
      {estados.length === 0 ? (
        <p className="text-center py-8 text-slate-400 text-xs italic">Sin estados configurados en la tabla estados_viaje.</p>
      ) : (
      <ol className="relative border-l-2 border-slate-200 space-y-4 ml-3">
        {estados.map((e) => (
          <li key={e.id} className="ml-5">
            <span className={`absolute -left-2 w-4 h-4 rounded-full flex items-center justify-center ${colorDot[e.color] ?? colorDot.slate}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  <span className="text-xs text-slate-400 font-normal mr-2">#{e.orden}</span>
                  {e.nombre}
                </p>
                {editing === e.id ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <input defaultValue={e.siguiente} id={`sig-${e.id}`} className="text-xs border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <label className="flex items-center gap-1 text-xs text-slate-500">
                      <input type="checkbox" defaultChecked={e.auto} id={`auto-${e.id}`} /> Automático
                    </label>
                    <button
                      onClick={() => {
                        const sig = (document.getElementById(`sig-${e.id}`) as HTMLInputElement)?.value ?? e.siguiente
                        const auto = (document.getElementById(`auto-${e.id}`) as HTMLInputElement)?.checked ?? e.auto
                        guardarSiguiente(e.id, sig, auto)
                      }}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700">Guardar</button>
                    <button onClick={() => setEditing(null)} className="text-xs text-slate-500 px-2 py-1 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Siguiente: {e.siguiente}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {e.auto && <Badge text="Automático" color="blue" />}
                <RowActions onEdit={() => setEditing(editing === e.id ? null : e.id)} />
              </div>
            </div>
          </li>
        ))}
      </ol>
      )}
    </SCard>
  )
}

// ─── 8. NOTIFICACIONES ────────────────────────────────────────────────────────
function TabNotificaciones() {
  const [plantillas, setPlantillas] = useState<{id:string;evento:string;canal:string[];activa:boolean;destinatario:string}[]>([])
  const [cargando, setCargando] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ evento: '', destinatario: '', canal: [] as string[] })
  const [guardando, setGuardando] = useState(false)

  const CANALES = ['Email', 'App', 'SMS', 'WhatsApp']

  const getSb = async () => getSupabaseBrowserClient()

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const { data } = await sb.from('plantillas_notificacion').select('id,evento,canal,activa,destinatario').order('created_at')
    if (data) setPlantillas(data.map((p: Record<string,unknown>) => ({ id: String(p.id), evento: String(p.evento??''), canal: (p.canal as string[]) ?? [], activa: Boolean(p.activa), destinatario: String(p.destinatario??'') })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const togglePlantilla = async (id: string, activa: boolean) => {
    const sb = await getSb(); await sb.from('plantillas_notificacion').update({ activa: !activa }).eq('id', id)
    setPlantillas(prev => prev.map(p => p.id === id ? { ...p, activa: !activa } : p))
  }

  const abrirNueva = () => { setEditId(null); setForm({ evento: '', destinatario: '', canal: [] }); setShowForm(true) }
  const abrirEditar = (p: typeof plantillas[number]) => { setEditId(p.id); setForm({ evento: p.evento, destinatario: p.destinatario, canal: p.canal }); setShowForm(true) }

  const guardar = async () => {
    if (!form.evento) return
    setGuardando(true)
    const sb = await getSb()
    const payload = { evento: form.evento, destinatario: form.destinatario, canal: form.canal }
    if (editId) {
      await sb.from('plantillas_notificacion').update(payload).eq('id', editId)
    } else {
      await sb.from('plantillas_notificacion').insert({ ...payload, activa: true })
    }
    setShowForm(false); setEditId(null); setGuardando(false)
    cargar()
  }

  const canalColor: Record<string, string> = {
    Email: 'bg-blue-50 text-blue-700', App: 'bg-green-50 text-green-700',
    SMS: 'bg-orange-50 text-orange-700', WhatsApp: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <SCard title="🔔 Plantillas de notificación" subtitle="Configura qué notificaciones se envían y por qué canal"
      action={<button onClick={() => (showForm ? setShowForm(false) : abrirNueva())} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Nueva plantilla</button>}>
      {showForm && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase">{editId ? 'Editar plantilla' : 'Nueva plantilla'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 mb-1 block">Evento*</label><input type="text" placeholder="Ej. Conductor asignado" value={form.evento} onChange={e => setForm(f => ({...f, evento: e.target.value}))} className={iCls()} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Destinatario</label><input type="text" placeholder="Ej. Usuario solicitante" value={form.destinatario} onChange={e => setForm(f => ({...f, destinatario: e.target.value}))} className={iCls()} /></div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Canales</label>
            <div className="flex gap-2">
              {CANALES.map(c => (
                <button key={c} type="button"
                  onClick={() => setForm(f => ({ ...f, canal: f.canal.includes(c) ? f.canal.filter(x => x !== c) : [...f.canal, c] }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${form.canal.includes(c) ? (canalColor[c] ?? 'bg-slate-100 text-slate-700') : 'bg-slate-50 text-slate-400'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
            <button onClick={guardar} disabled={guardando} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      )}
      {cargando ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />)}</div> : (
      <div className="space-y-2">
        {plantillas.length === 0 && <p className="text-center py-8 text-slate-400 text-xs italic">Sin plantillas registradas.</p>}
        {plantillas.map(p => (
          <div key={p.id} className={`flex items-center justify-between p-3.5 border rounded-xl gap-3 ${!p.activa ? 'opacity-50 border-slate-100' : 'border-slate-200'}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{p.evento}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-slate-400">→ {p.destinatario}</span>
                {p.canal.map(c => <span key={c} className={`text-xs px-1.5 py-0.5 rounded font-medium ${canalColor[c] ?? 'bg-slate-100 text-slate-500'}`}>{c}</span>)}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Toggle value={p.activa} onChange={() => togglePlantilla(p.id, p.activa)} />
              <RowActions onEdit={() => abrirEditar(p)} />
            </div>
          </div>
        ))}
      </div>
      )}
    </SCard>
  )
}

// ─── 9. MÉTODOS DE PAGO ───────────────────────────────────────────────────────
function TabPagos() {
  const [metodos, setMetodos] = useState<{id:string;nombre:string;descripcion:string;activo:boolean}[]>([])
  const [ciclo, setCiclo] = useState({ frecuencia: 'Quincenal', diaPago: '1 y 15', comision: 2.5 })
  const [cargando, setCargando] = useState(true)
  const [guardandoCiclo, setGuardandoCiclo] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [guardando, setGuardando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const getSb = async () => getSupabaseBrowserClient()

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const { data } = await sb.from('metodos_pago').select('id,nombre,descripcion,activo').order('created_at')
    if (data) setMetodos(data.map((m: Record<string,unknown>) => ({ id: String(m.id), nombre: String(m.nombre??''), descripcion: String(m.descripcion??''), activo: Boolean(m.activo) })))
    // Cargar ciclo de pago
    const { data: cfg } = await sb.from('configuracion').select('valor').eq('clave', 'ciclo_pago').single()
    if (cfg?.valor) { try { const v = JSON.parse(String(cfg.valor)); setCiclo(v) } catch {} }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const toggleMetodo = async (id: string, activo: boolean) => {
    const sb = await getSb(); await sb.from('metodos_pago').update({ activo: !activo }).eq('id', id)
    setMetodos(prev => prev.map(m => m.id === id ? { ...m, activo: !activo } : m))
  }

  const abrirNuevoMetodo = () => { setEditId(null); setForm({ nombre: '', descripcion: '' }); setShowForm(true) }
  const abrirEditarMetodo = (m: typeof metodos[number]) => { setEditId(m.id); setForm({ nombre: m.nombre, descripcion: m.descripcion }); setShowForm(true) }

  const guardarMetodo = async () => {
    if (!form.nombre) return
    setGuardando(true)
    const sb = await getSb()
    if (editId) {
      await sb.from('metodos_pago').update({ nombre: form.nombre, descripcion: form.descripcion }).eq('id', editId)
    } else {
      await sb.from('metodos_pago').insert({ nombre: form.nombre, descripcion: form.descripcion, activo: true })
    }
    setForm({ nombre: '', descripcion: '' }); setEditId(null); setShowForm(false); setGuardando(false)
    cargar()
  }

  const eliminarMetodo = async (id: string) => {
    const sb = await getSb(); await sb.from('metodos_pago').delete().eq('id', id)
    setMetodos(prev => prev.filter(m => m.id !== id))
    setConfirmDelete(null)
  }

  const guardarCiclo = async () => {
    setGuardandoCiclo(true)
    const sb = await getSb()
    await sb.from('configuracion').upsert({ clave: 'ciclo_pago', valor: JSON.stringify(ciclo) }, { onConflict: 'clave' })
    setGuardandoCiclo(false)
  }

  return (
    <div className="space-y-4">
      <SCard title="💳 Métodos de pago habilitados" subtitle="Configura las formas de pago disponibles para usuarios y conductores"
        action={<button onClick={() => (showForm ? setShowForm(false) : abrirNuevoMetodo())} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Agregar método</button>}>
        {showForm && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-blue-700 uppercase">{editId ? 'Editar método de pago' : 'Nuevo método de pago'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500 mb-1 block">Nombre*</label><input type="text" placeholder="Ej. Transferencia SPEI" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} className={iCls()} /></div>
              <div><label className="text-xs text-slate-500 mb-1 block">Descripción</label><input type="text" value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} className={iCls()} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
              <button onClick={guardarMetodo} disabled={guardando} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        )}
        {cargando ? <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metodos.length === 0 && <p className="col-span-2 text-center py-8 text-slate-400 text-xs italic">Sin métodos de pago registrados.</p>}
          {metodos.map(m => (
            <div key={m.id} className={`flex items-center justify-between p-4 border rounded-xl ${!m.activo ? 'opacity-50 border-slate-100' : 'border-slate-200'}`}>
              <div>
                <p className="font-medium text-slate-800 text-sm">{m.nombre}</p>
                <p className="text-xs text-slate-400">{m.descripcion}</p>
              </div>
              <div className="flex items-center gap-2">
                <Toggle value={m.activo} onChange={() => toggleMetodo(m.id, m.activo)} />
                {confirmDelete === m.id ? (
                  <span className="inline-flex items-center gap-1.5">
                    <button onClick={() => eliminarMetodo(m.id)} className="text-xs text-red-600 font-medium hover:underline">Sí</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:underline">No</button>
                  </span>
                ) : (
                  <RowActions onEdit={() => abrirEditarMetodo(m)} onDelete={() => setConfirmDelete(m.id)} />
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </SCard>
      <SCard title="📅 Ciclo de pago a conductores" subtitle="Define cuándo y cómo se liquida a los conductores">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Frecuencia de pago</label>
            <select value={ciclo.frecuencia} onChange={e => setCiclo(c => ({ ...c, frecuencia: e.target.value }))} className={`${iCls()} bg-white`}>
              <option>Semanal</option><option>Quincenal</option><option>Mensual</option><option>Por viaje</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Día(s) de pago</label>
            <input type="text" value={ciclo.diaPago} onChange={e => setCiclo(c => ({ ...c, diaPago: e.target.value }))} className={iCls()} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Comisión de plataforma (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={ciclo.comision} onChange={e => setCiclo(c => ({ ...c, comision: +e.target.value }))} className={iCls()} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={guardarCiclo} disabled={guardandoCiclo} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckIcon className="w-4 h-4" />{guardandoCiclo ? 'Guardando...' : 'Guardar ciclo'}
          </button>
        </div>
      </SCard>
    </div>
  )
}

// ─── 10. DATOS FISCALES ───────────────────────────────────────────────────────
function TabFiscal() {
  const [form, setForm] = useState({
    razonSocial: '', rfc: '', regimen: '', domicilio: '', codigoPostal: '',
    email: '', telefono: '', serie: '', folioActual: '', certificado: '', venceCSD: '',
  })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const getSb = async () => getSupabaseBrowserClient()

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const { data } = await sb.from('configuracion').select('valor').eq('clave', 'datos_fiscales').single()
    if (data?.valor) { try { setForm(prev => ({ ...prev, ...JSON.parse(String(data.valor)) })) } catch {} }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardar = async () => {
    setGuardando(true)
    const sb = await getSb()
    await sb.from('configuracion').upsert({ clave: 'datos_fiscales', valor: JSON.stringify(form) }, { onConflict: 'clave' })
    setGuardando(false)
  }

  if (cargando) return <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />)}</div>

  return (
    <div className="space-y-4">
      <SCard title="🧾 Datos fiscales del emisor" subtitle="Información para la emisión de CFDI">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2"><label className="block text-xs text-slate-500 font-medium mb-1">Razón social</label><input value={form.razonSocial} onChange={e => set('razonSocial', e.target.value.toUpperCase())} className={iCls()} /></div>
          <div><label className="block text-xs text-slate-500 font-medium mb-1">RFC</label><input value={form.rfc} onChange={e => set('rfc', e.target.value)} className={`${iCls()} font-mono`} /></div>
          <div><label className="block text-xs text-slate-500 font-medium mb-1">Régimen fiscal</label><input value={form.regimen} onChange={e => set('regimen', e.target.value.toUpperCase())} className={iCls()} /></div>
          <div className="sm:col-span-2"><label className="block text-xs text-slate-500 font-medium mb-1">Domicilio fiscal</label><input value={form.domicilio} onChange={e => set('domicilio', e.target.value.toUpperCase())} className={iCls()} /></div>
          <div><label className="block text-xs text-slate-500 font-medium mb-1">Código postal</label><input value={form.codigoPostal} onChange={e => set('codigoPostal', e.target.value.toUpperCase())} className={iCls()} /></div>
          <div><label className="block text-xs text-slate-500 font-medium mb-1">Correo de facturación</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={iCls()} /></div>
        </div>
      </SCard>
      <SCard title="📄 Configuración de folios CFDI">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div><label className="block text-xs text-slate-500 font-medium mb-1">Serie</label><input value={form.serie} onChange={e => set('serie', e.target.value.toUpperCase())} className={`${iCls()} font-mono uppercase`} /></div>
          <div><label className="block text-xs text-slate-500 font-medium mb-1">Folio actual</label><input value={form.folioActual} onChange={e => set('folioActual', e.target.value)} className={`${iCls()} font-mono`} /></div>
          <div><label className="block text-xs text-slate-500 font-medium mb-1">Certificado CSD</label><input value={form.certificado} onChange={e => set('certificado', e.target.value.toUpperCase())} className={iCls()} /></div>
        </div>
        {form.venceCSD && (
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2 text-sm text-amber-800">
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 text-amber-500" />
            El CSD vigente vence el <strong>{form.venceCSD}</strong>. Recuerda renovarlo antes de esa fecha.
          </div>
        )}
        <div className="mt-4">
          <label className="block text-xs text-slate-500 font-medium mb-1">Vencimiento del CSD</label>
          <input type="text" placeholder="31 Mar 2026" value={form.venceCSD} onChange={e => set('venceCSD', e.target.value)} className={`${iCls()} max-w-xs`} />
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={guardar} disabled={guardando} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckIcon className="w-4 h-4" />{guardando ? 'Guardando...' : 'Guardar datos fiscales'}
          </button>
        </div>
      </SCard>
    </div>
  )
}

// ─── 11. SEGURIDAD ────────────────────────────────────────────────────────────
function TabSeguridad() {
  const [config, setConfig] = useState({
    dobleAutenticacion: true,
    sesionMaxMin: 480,
    intentosFallidos: 5,
    ipBloqueo: false,
    registroActividad: true,
    cifradoDatos: true,
    backupAutomatico: true,
    frecuenciaBackup: 'Diario',
  })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [ejecutandoBackup, setEjecutandoBackup] = useState(false)
  const [backupMsg, setBackupMsg] = useState('')
  const set = (k: keyof typeof config, v: string | number | boolean) => setConfig(c => ({ ...c, [k]: v }))

  const getSb = async () => getSupabaseBrowserClient()

  const cargar = useCallback(async () => {
    const sb = await getSb()
    const { data } = await sb.from('configuracion').select('valor').eq('clave', 'seguridad').single()
    if (data?.valor) { try { setConfig(prev => ({ ...prev, ...JSON.parse(String(data.valor)) })) } catch {} }
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardar = async () => {
    setGuardando(true)
    const sb = await getSb()
    await sb.from('configuracion').upsert({ clave: 'seguridad', valor: JSON.stringify(config) }, { onConflict: 'clave' })
    setGuardando(false)
  }

  const ejecutarBackup = async () => {
    setEjecutandoBackup(true)
    setBackupMsg('')
    const sb = await getSb()
    await sb.from('bitacora').insert({
      usuario: 'Admin', accion: 'Backup manual ejecutado', modulo: 'Configuración',
      detalle: 'Respaldo manual solicitado desde Seguridad', ip: null,
    })
    setEjecutandoBackup(false)
    setBackupMsg('Solicitud de backup registrada correctamente.')
  }

  if (cargando) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}</div>

  return (
    <div className="space-y-4">
      <SCard title="🔒 Configuración de seguridad" subtitle="Parámetros de acceso y autenticación">
        <div className="space-y-4">
          {[
            { key: 'dobleAutenticacion', label: '2FA (Doble factor de autenticación)', desc: 'Requerir código adicional al iniciar sesión' },
            { key: 'ipBloqueo', label: 'Bloqueo por IP sospechosa', desc: 'Detectar y bloquear accesos desde IPs desconocidas' },
            { key: 'registroActividad', label: 'Registro de actividad', desc: 'Guardar bitácora de todas las acciones del sistema' },
            { key: 'cifradoDatos', label: 'Cifrado de datos sensibles', desc: 'Cifrar CLABE, RFC y datos bancarios en reposo' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <Toggle value={config[item.key as keyof typeof config] as boolean} onChange={v => set(item.key as keyof typeof config, v)} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Duración máxima de sesión (minutos)</label>
            <input type="number" min={30} value={config.sesionMaxMin} onChange={e => set('sesionMaxMin', +e.target.value)} className={iCls()} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Intentos fallidos antes de bloquear cuenta</label>
            <input type="number" min={3} max={10} value={config.intentosFallidos} onChange={e => set('intentosFallidos', +e.target.value)} className={iCls()} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={guardar} disabled={guardando} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckIcon className="w-4 h-4" />{guardando ? 'Guardando...' : 'Guardar seguridad'}
          </button>
        </div>
      </SCard>
      <SCard title="💾 Respaldos automáticos">
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl mb-4">
          <div>
            <p className="text-sm font-medium text-slate-800">Backup automático</p>
            <p className="text-xs text-slate-400">Copia de seguridad de todos los datos de la plataforma</p>
          </div>
          <Toggle value={config.backupAutomatico} onChange={v => set('backupAutomatico', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 font-medium mb-1">Frecuencia</label>
            <select value={config.frecuenciaBackup} onChange={e => set('frecuenciaBackup', e.target.value)} className={`${iCls()} bg-white`}>
              <option>Horario</option>
              <option>Diario</option>
              <option>Semanal</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={ejecutarBackup} disabled={ejecutandoBackup} className="w-full border border-slate-300 hover:bg-slate-50 disabled:opacity-60 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              <ArrowPathIcon className={`w-4 h-4 ${ejecutandoBackup ? 'animate-spin' : ''}`} />{ejecutandoBackup ? 'Ejecutando...' : 'Ejecutar backup ahora'}
            </button>
          </div>
        </div>
        {backupMsg && <p className="text-xs text-green-600 mt-3">{backupMsg}</p>}
      </SCard>
    </div>
  )
}

// ─── 12. BITÁCORA ─────────────────────────────────────────────────────────────
function TabBitacora() {
  const [registros, setRegistros] = useState<{id:string;usuario:string;accion:string;modulo:string;detalle:string;ip:string;fecha:string}[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroModulo, setFiltroModulo] = useState('Todos')

  const cargar = useCallback(async () => {
    const sb = getSupabaseBrowserClient()
    const { data } = await sb.from('bitacora').select('id,usuario,accion,modulo,detalle,ip,created_at').order('created_at', { ascending: false }).limit(200)
    if (data) setRegistros(data.map((r: Record<string,unknown>) => ({
      id: String(r.id), usuario: String(r.usuario ?? 'Sistema'), accion: String(r.accion ?? ''),
      modulo: String(r.modulo ?? 'Sistema'), detalle: String(r.detalle ?? ''), ip: String(r.ip ?? '—'),
      fecha: String((r.created_at as string)?.slice(0,16).replace('T',' ') ?? '—'),
    })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const exportarCSV = () => {
    const filas = registros.filter(r => filtroModulo === 'Todos' || r.modulo === filtroModulo)
    const header = ['Usuario','Acción','Módulo','Detalle','IP','Fecha'].join(',')
    const body = filas.map(r => [r.usuario, r.accion, r.modulo, r.detalle, r.ip, r.fecha].map(v => `"${v.replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bitacora_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const moduloColor: Record<string, string> = {
    Tarifas: 'blue', Viajes: 'purple', Pagos: 'emerald', Documentos: 'amber',
    Conductores: 'indigo', Incidencias: 'rose', Configuración: 'slate', Reportes: 'teal', Sistema: 'slate',
  }

  return (
    <SCard title="📋 Bitácora de cambios" subtitle="Registro de todas las acciones relevantes del sistema"
      action={<button onClick={exportarCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
        Exportar CSV
      </button>}>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(['Todos','Tarifas','Viajes','Pagos','Documentos','Conductores','Incidencias','Configuración','Reportes']).map(m => (
          <button key={m} onClick={() => setFiltroModulo(m)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filtroModulo === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {m}
          </button>
        ))}
      </div>
      {cargando ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-lg" />)}</div> : (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Módulo</th>
              <th className="px-4 py-3">Detalle</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Fecha y hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registros.filter(r => filtroModulo === 'Todos' || r.modulo === filtroModulo).length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-xs italic">Sin registros en la bitácora.</td></tr>
            )}
            {registros.filter(r => filtroModulo === 'Todos' || r.modulo === filtroModulo).map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800 text-xs whitespace-nowrap">{r.usuario}</td>
                <td className="px-4 py-3 text-slate-700 text-xs">{r.accion}</td>
                <td className="px-4 py-3"><Badge text={r.modulo} color={moduloColor[r.modulo] ?? 'slate'} /></td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">{r.detalle}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{r.ip}</td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{r.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </SCard>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const TABS: { id: ConfigTab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'roles',          label: 'Roles y permisos',      icon: <ShieldCheckIcon className="w-4 h-4" />,         desc: 'Control de acceso por rol' },
  { id: 'usuarios',       label: 'Usuarios internos',     icon: <UsersIcon className="w-4 h-4" />,               desc: 'Personal del panel admin' },
  { id: 'zonas',          label: 'Zonas de operación',    icon: <MapPinIcon className="w-4 h-4" />,              desc: 'Áreas de cobertura' },
  { id: 'servicios',      label: 'Tipos de servicio',     icon: <TruckIcon className="w-4 h-4" />,               desc: 'Servicios disponibles' },
  { id: 'vehiculos',      label: 'Tipos de vehículo',     icon: <TagIcon className="w-4 h-4" />,                 desc: 'Categorías de vehículos' },
  { id: 'evidencia',      label: 'Reglas de evidencia',   icon: <CameraIcon className="w-4 h-4" />,              desc: 'Requisitos de fotos y datos' },
  { id: 'estados',        label: 'Estados de viaje',      icon: <ArrowPathIcon className="w-4 h-4" />,           desc: 'Ciclo de vida del viaje' },
  { id: 'notificaciones', label: 'Notificaciones',        icon: <BellIcon className="w-4 h-4" />,                desc: 'Plantillas y canales' },
  { id: 'pagos',          label: 'Métodos de pago',       icon: <CreditCardIcon className="w-4 h-4" />,          desc: 'Formas de pago y ciclos' },
  { id: 'fiscal',         label: 'Datos fiscales',        icon: <BuildingLibraryIcon className="w-4 h-4" />,     desc: 'Emisor y CFDI' },
  { id: 'seguridad',      label: 'Seguridad',             icon: <LockClosedIcon className="w-4 h-4" />,          desc: 'Autenticación y respaldos' },
  { id: 'bitacora',       label: 'Bitácora de cambios',   icon: <ClipboardDocumentListIcon className="w-4 h-4" />, desc: 'Registro de acciones' },
]

export default function ConfiguracionView() {
  const [tab, setTab] = useState<ConfigTab>('roles')
  const active = TABS.find(t => t.id === tab)!

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-64 flex-shrink-0 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                tab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              <span className={`mt-0.5 flex-shrink-0 ${tab === t.id ? 'text-white' : 'text-slate-400'}`}>{t.icon}</span>
              <div>
                <p className={`text-sm font-medium leading-tight ${tab === t.id ? 'text-white' : 'text-slate-700'}`}>{t.label}</p>
                <p className={`text-xs mt-0.5 ${tab === t.id ? 'text-blue-100' : 'text-slate-400'}`}>{t.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-600">{active.icon}</span>
              <h2 className="font-bold text-slate-800 text-lg">{active.label}</h2>
            </div>
            <p className="text-sm text-slate-500">{active.desc}</p>
          </div>

          {tab === 'roles'          && <TabRoles />}
          {tab === 'usuarios'       && <TabUsuariosInternos />}
          {tab === 'zonas'          && <TabZonas />}
          {tab === 'servicios'      && <TabServicios />}
          {tab === 'vehiculos'      && <TabVehiculos />}
          {tab === 'evidencia'      && <TabEvidencia />}
          {tab === 'estados'        && <TabEstados />}
          {tab === 'notificaciones' && <TabNotificaciones />}
          {tab === 'pagos'          && <TabPagos />}
          {tab === 'fiscal'         && <TabFiscal />}
          {tab === 'seguridad'      && <TabSeguridad />}
          {tab === 'bitacora'       && <TabBitacora />}
        </div>
      </div>
    </div>
  )
}
