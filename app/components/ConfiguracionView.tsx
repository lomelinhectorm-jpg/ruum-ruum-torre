'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [roles, setRoles] = useState([
    { id: 1, nombre: 'Super Administrador', descripcion: 'Acceso total a todos los módulos', permisos: MODULOS_SISTEMA, activo: true, color: 'blue' },
    { id: 2, nombre: 'Coordinador Operativo', descripcion: 'Gestión de viajes, conductores e incidencias', permisos: ['Dashboard','Viajes','Conductores','Evidencia','Incidencias'], activo: true, color: 'green' },
    { id: 3, nombre: 'Analista Financiero', descripcion: 'Acceso a pagos, tarifas y reportes financieros', permisos: ['Pagos','Tarifas','Reportes'], activo: true, color: 'purple' },
    { id: 4, nombre: 'Validador Documental', descripcion: 'Revisión y aprobación de documentos', permisos: ['Documentos','Conductores','Usuarios'], activo: true, color: 'amber' },
    { id: 5, nombre: 'Soporte / Lectura', descripcion: 'Solo vista sin capacidad de edición', permisos: ['Dashboard','Viajes','Conductores'], activo: false, color: 'slate' },
  ])
  const [editing, setEditing] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700', amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-100 text-slate-500',
  }

  return (
    <div className="space-y-4">
      <SCard title="🛡️ Roles del sistema" subtitle="Define qué puede ver y hacer cada rol"
        action={<button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Nuevo rol</button>}>
        <div className="space-y-3">
          {roles.map(r => (
            <div key={r.id} className={`border rounded-xl transition-colors ${!r.activo ? 'opacity-60 border-slate-200' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="p-0.5 text-slate-400">
                    {expanded === r.id ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${colorMap[r.color]}`}>{r.nombre}</span>
                      {!r.activo && <Badge text="Inactivo" color="slate" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{r.descripcion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400">{r.permisos.length} módulos</span>
                  <Toggle value={r.activo} onChange={v => setRoles(prev => prev.map(x => x.id === r.id ? { ...x, activo: v } : x))} />
                  <RowActions onEdit={() => setEditing(editing === r.id ? null : r.id)} />
                </div>
              </div>
              {expanded === r.id && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Módulos con acceso</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MODULOS_SISTEMA.map(m => (
                      <span key={m} className={`px-2 py-1 rounded text-xs font-medium ${r.permisos.includes(m) ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-300 line-through'}`}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SCard>
    </div>
  )
}

// ─── 2. USUARIOS INTERNOS ─────────────────────────────────────────────────────
function TabUsuariosInternos() {
  const [usuarios, setUsuarios] = useState<{id:string;nombre:string;apellido:string;email:string;rol:string;ultimo:string;activo:boolean}[]>([])
  const [cargando, setCargando] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', rol: '' })
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await sb.from('usuarios_internos').select('id, nombre, apellido, email, rol, ultimo_acceso, activo').order('created_at', { ascending: false })
    if (data) setUsuarios(data.map((u: Record<string,unknown>) => ({
      id: String(u.id), nombre: String(u.nombre ?? ''), apellido: String(u.apellido ?? ''),
      email: String(u.email ?? ''), rol: String(u.rol ?? ''),
      ultimo: String((u.ultimo_acceso as string)?.slice(0,16).replace('T',' ') ?? '—'),
      activo: Boolean(u.activo),
    })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const handleGuardar = async () => {
    if (!form.nombre || !form.email || !form.rol) return
    setGuardando(true)
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.from('usuarios_internos').insert({
      nombre: form.nombre.toUpperCase(), apellido: form.apellido.toUpperCase(),
      email: form.email.toLowerCase(), rol: form.rol, activo: true,
    })
    setForm({ nombre: '', apellido: '', email: '', rol: '' })
    setShowForm(false)
    setGuardando(false)
    cargar()
  }

  const ROLES = ['Super Administrador','Coordinador Operativo','Analista Financiero','Validador Documental','Soporte / Lectura']
  const iCls2 = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <SCard title="👥 Usuarios internos del sistema" subtitle="Personal con acceso al panel de administración"
      action={<button onClick={() => setShowForm(s => !s)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Nuevo usuario</button>}>
      {showForm && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase">Nuevo usuario interno</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 mb-1 block">Nombre(s)*</label><input type="text" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value.toUpperCase()}))} className={iCls2} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Apellido(s)</label><input type="text" value={form.apellido} onChange={e => setForm(f => ({...f, apellido: e.target.value.toUpperCase()}))} className={iCls2} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Correo*</label><input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={iCls2} /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">Rol*</label>
              <select value={form.rol} onChange={e => setForm(f => ({...f, rol: e.target.value}))} className={iCls2}>
                <option value="">Seleccionar...</option>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
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
                <td className="px-4 py-3 text-center"><span className={`inline-block w-2 h-2 rounded-full ${u.activo ? 'bg-green-500' : 'bg-slate-300'}`} /></td>
                <td className="px-4 py-3 text-right"><RowActions onEdit={() => {}} /></td>
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

  const SEED = [
    { nombre: 'Zona Centro CDMX', descripcion: 'Radio 15 km desde el Zócalo', radio: 15, tarifa: 'Local', activa: true },
    { nombre: 'Zona Norte Metropolitana', descripcion: 'Tlalnepantla, Satélite, Naucalpan', radio: 25, tarifa: 'Local', activa: true },
    { nombre: 'Zona Sur', descripcion: 'Coyoacán, Tlalpan, Xochimilco, Tláhuac', radio: 20, tarifa: 'Local', activa: true },
    { nombre: 'Zona Oriente', descripcion: 'Chalco, Iztapalapa, Texcoco', radio: 30, tarifa: 'Local recargo', activa: false },
    { nombre: 'Zona Foránea — Querétaro', descripcion: 'Ciudad de Querétaro y municipios', radio: 50, tarifa: 'Foráneo', activa: true },
    { nombre: 'Zona Foránea — Guadalajara', descripcion: 'Área metropolitana de Guadalajara', radio: 60, tarifa: 'Foráneo', activa: false },
  ]

  const getSb = async () => { const { createClient } = await import('@supabase/supabase-js'); return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) }

  const cargar = useCallback(async () => {
    const sb = await getSb()
    let { data } = await sb.from('zonas').select('id,nombre,descripcion,radio,tarifa,activa').order('created_at')
    if (!data?.length) { await sb.from('zonas').insert(SEED); const r = await sb.from('zonas').select('id,nombre,descripcion,radio,tarifa,activa').order('created_at'); data = r.data }
    if (data) setZonas(data.map((z: Record<string,unknown>) => ({ id: String(z.id), nombre: String(z.nombre??''), descripcion: String(z.descripcion??''), radio: Number(z.radio??0), tarifa: String(z.tarifa??''), activa: Boolean(z.activa) })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const toggleZona = async (id: string, activa: boolean) => {
    const sb = await getSb(); await sb.from('zonas').update({ activa: !activa }).eq('id', id)
    setZonas(prev => prev.map(z => z.id === id ? { ...z, activa: !activa } : z))
  }

  return (
    <SCard title="📍 Zonas de operación" subtitle="Define las áreas de cobertura del servicio"
      action={<button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Nueva zona</button>}>
      {cargando ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />)}</div> : (
      <div className="space-y-2">
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
              <RowActions onEdit={() => {}} onDelete={() => {}} />
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

  const SEED = [
    { nombre: 'Traslado local', descripcion: 'Viaje dentro de la zona metropolitana', icono: '🚗', requiere_evidencia: true, requiere_firma: true, activo: true },
    { nombre: 'Traslado foráneo', descripcion: 'Viaje fuera de la zona metropolitana', icono: '🛣️', requiere_evidencia: true, requiere_firma: true, activo: true },
    { nombre: 'Entrega al cliente', descripcion: 'El conductor entrega el vehículo en domicilio', icono: '📦', requiere_evidencia: true, requiere_firma: true, activo: true },
    { nombre: 'Recolección', descripcion: 'Recolección de vehículo en punto de origen', icono: '🔄', requiere_evidencia: true, requiere_firma: false, activo: true },
    { nombre: 'Largo recorrido', descripcion: 'Viaje de más de 200 km con posible pernocta', icono: '✈️', requiere_evidencia: true, requiere_firma: true, activo: true },
    { nombre: 'Urgente', descripcion: 'Asignación prioritaria en menos de 2 horas', icono: '⚡', requiere_evidencia: true, requiere_firma: false, activo: true },
  ]

  const getSb = async () => { const { createClient } = await import('@supabase/supabase-js'); return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) }

  const cargar = useCallback(async () => {
    const sb = await getSb()
    let { data } = await sb.from('tipos_servicio').select('id,nombre,descripcion,icono,requiere_evidencia,requiere_firma,activo').order('created_at')
    if (!data?.length) { await sb.from('tipos_servicio').insert(SEED); const r = await sb.from('tipos_servicio').select('id,nombre,descripcion,icono,requiere_evidencia,requiere_firma,activo').order('created_at'); data = r.data }
    if (data) setServicios(data.map((s: Record<string,unknown>) => ({ id: String(s.id), nombre: String(s.nombre??''), descripcion: String(s.descripcion??''), icono: String(s.icono??''), requiereEvidencia: Boolean(s.requiere_evidencia), requiereFirma: Boolean(s.requiere_firma), activo: Boolean(s.activo) })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const toggle = async (id: string, field: string, val: boolean) => {
    const sb = await getSb(); await sb.from('tipos_servicio').update({ [field]: !val }).eq('id', id)
    setServicios(prev => prev.map(s => s.id === id ? { ...s, [field === 'requiere_evidencia' ? 'requiereEvidencia' : field === 'requiere_firma' ? 'requiereFirma' : 'activo']: !val } : s))
  }

  return (
    <SCard title="🚘 Tipos de servicio" subtitle="Configura los tipos de traslado disponibles"
      action={<button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Nuevo tipo</button>}>
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
                <td className="px-4 py-3 text-right"><RowActions onEdit={() => {}} onDelete={() => {}} /></td>
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

  const SEED = [
    { nombre: 'Sedán', descripcion: 'Automóvil estándar 4 puertas', icono: '🚗', capacidad: 5, activo: true },
    { nombre: 'SUV', descripcion: 'Vehículo utilitario deportivo', icono: '🚙', capacidad: 7, activo: true },
    { nombre: 'Pick-up', descripcion: 'Camioneta con caja de carga', icono: '🛻', capacidad: 2, activo: true },
    { nombre: 'Van', descripcion: 'Vehículo de pasajeros / carga', icono: '🚐', capacidad: 8, activo: true },
    { nombre: 'Luxury', descripcion: 'Vehículo de lujo (BMW, Mercedes, etc.)', icono: '🏎️', capacidad: 4, activo: true },
    { nombre: 'Camioneta de trabajo', descripcion: 'Vehículo pesado de trabajo', icono: '🚛', capacidad: 3, activo: false },
  ]

  const getSb = async () => { const { createClient } = await import('@supabase/supabase-js'); return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) }

  const cargar = useCallback(async () => {
    const sb = await getSb()
    let { data } = await sb.from('tipos_vehiculo').select('id,nombre,descripcion,icono,capacidad,activo').order('created_at')
    if (!data?.length) { await sb.from('tipos_vehiculo').insert(SEED); const r = await sb.from('tipos_vehiculo').select('id,nombre,descripcion,icono,capacidad,activo').order('created_at'); data = r.data }
    if (data) setTipos(data.map((t: Record<string,unknown>) => ({ id: String(t.id), nombre: String(t.nombre??''), descripcion: String(t.descripcion??''), icono: String(t.icono??''), capacidad: Number(t.capacidad??0), activo: Boolean(t.activo) })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const toggleTipo = async (id: string, activo: boolean) => {
    const sb = await getSb(); await sb.from('tipos_vehiculo').update({ activo: !activo }).eq('id', id)
    setTipos(prev => prev.map(t => t.id === id ? { ...t, activo: !activo } : t))
  }

  return (
    <SCard title="🚘 Tipos de vehículo" subtitle="Categorías de vehículos que opera la plataforma"
      action={<button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Nuevo tipo</button>}>
      {cargando ? <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />)}</div> : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <RowActions onEdit={() => {}} />
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
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckIcon className="w-4 h-4" />Guardar reglas
          </button>
        </div>
      </SCard>
    </div>
  )
}

// ─── 7. ESTADOS DE VIAJE ──────────────────────────────────────────────────────
function TabEstados() {
  const estados = [
    { orden: 1, nombre: 'Solicitud recibida',         siguiente: 'Pendiente de revisión',         color: 'slate', auto: true },
    { orden: 2, nombre: 'Pendiente de revisión',      siguiente: 'Pendiente de asignación',       color: 'slate', auto: false },
    { orden: 3, nombre: 'Pendiente de asignación',    siguiente: 'Conductor asignado',            color: 'amber', auto: false },
    { orden: 4, nombre: 'Conductor asignado',         siguiente: 'Conductor en camino',           color: 'blue',  auto: false },
    { orden: 5, nombre: 'Conductor en camino',        siguiente: 'Recolección en proceso',        color: 'blue',  auto: false },
    { orden: 6, nombre: 'Recolección en proceso',     siguiente: 'Evidencia inicial pendiente',   color: 'indigo',auto: false },
    { orden: 7, nombre: 'Evidencia inicial pendiente',siguiente: 'Traslado en curso',             color: 'orange',auto: false },
    { orden: 8, nombre: 'Traslado en curso',          siguiente: 'Entrega en proceso',            color: 'purple',auto: false },
    { orden: 9, nombre: 'Entrega en proceso',         siguiente: 'Evidencia final pendiente',     color: 'violet',auto: false },
    { orden: 10,nombre: 'Evidencia final pendiente',  siguiente: 'Finalizado',                    color: 'orange',auto: false },
    { orden: 11,nombre: 'Finalizado',                 siguiente: '—',                             color: 'green', auto: false },
    { orden: 12,nombre: 'Cancelado',                  siguiente: '—',                             color: 'red',   auto: false },
    { orden: 13,nombre: 'En revisión por incidencia', siguiente: 'Finalizado / Cancelado',        color: 'rose',  auto: false },
  ]
  const colorDot: Record<string, string> = {
    slate: 'bg-slate-400', amber: 'bg-amber-500', blue: 'bg-blue-500',
    indigo: 'bg-indigo-500', orange: 'bg-orange-500', purple: 'bg-purple-500',
    violet: 'bg-violet-500', green: 'bg-green-500', red: 'bg-red-500', rose: 'bg-rose-500',
  }
  return (
    <SCard title="🔄 Estados del ciclo de vida de un viaje" subtitle="Flujo de estados configurado por operaciones">
      <ol className="relative border-l-2 border-slate-200 space-y-4 ml-3">
        {estados.map((e, i) => (
          <li key={i} className="ml-5">
            <span className={`absolute -left-2 w-4 h-4 rounded-full flex items-center justify-center ${colorDot[e.color]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  <span className="text-xs text-slate-400 font-normal mr-2">#{e.orden}</span>
                  {e.nombre}
                </p>
                <p className="text-xs text-slate-400">Siguiente: {e.siguiente}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {e.auto && <Badge text="Automático" color="blue" />}
                <RowActions onEdit={() => {}} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </SCard>
  )
}

// ─── 8. NOTIFICACIONES ────────────────────────────────────────────────────────
function TabNotificaciones() {
  const [plantillas, setPlantillas] = useState<{id:string;evento:string;canal:string[];activa:boolean;destinatario:string}[]>([])
  const [cargando, setCargando] = useState(true)

  const SEED = [
    { evento: 'Viaje asignado a conductor', canal: ['App','WhatsApp'], activa: true, destinatario: 'Conductor' },
    { evento: 'Evidencia incompleta', canal: ['Email','App'], activa: true, destinatario: 'Admin + Conductor' },
    { evento: 'Incidencia reportada (Alta prioridad)', canal: ['Email','App','SMS'], activa: true, destinatario: 'Admin' },
    { evento: 'Documento por vencer (5 días)', canal: ['Email'], activa: true, destinatario: 'Admin + Conductor' },
    { evento: 'Pago procesado al conductor', canal: ['App','Email'], activa: true, destinatario: 'Conductor' },
    { evento: 'Conductor retrasado (>20 min)', canal: ['App'], activa: true, destinatario: 'Admin + Usuario' },
    { evento: 'Viaje finalizado', canal: ['App','Email'], activa: true, destinatario: 'Usuario' },
    { evento: 'Solicitud de aclaración de evidencia', canal: ['App'], activa: true, destinatario: 'Conductor' },
    { evento: 'Nuevo conductor registrado', canal: ['Email'], activa: false, destinatario: 'Admin' },
    { evento: 'Convenio empresarial por vencer', canal: ['Email'], activa: true, destinatario: 'Admin' },
  ]

  const getSb = async () => { const { createClient } = await import('@supabase/supabase-js'); return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) }

  const cargar = useCallback(async () => {
    const sb = await getSb()
    let { data } = await sb.from('plantillas_notificacion').select('id,evento,canal,activa,destinatario').order('created_at')
    if (!data?.length) { await sb.from('plantillas_notificacion').insert(SEED); const r = await sb.from('plantillas_notificacion').select('id,evento,canal,activa,destinatario').order('created_at'); data = r.data }
    if (data) setPlantillas(data.map((p: Record<string,unknown>) => ({ id: String(p.id), evento: String(p.evento??''), canal: (p.canal as string[]) ?? [], activa: Boolean(p.activa), destinatario: String(p.destinatario??'') })))
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const togglePlantilla = async (id: string, activa: boolean) => {
    const sb = await getSb(); await sb.from('plantillas_notificacion').update({ activa: !activa }).eq('id', id)
    setPlantillas(prev => prev.map(p => p.id === id ? { ...p, activa: !activa } : p))
  }

  const canalColor: Record<string, string> = {
    Email: 'bg-blue-50 text-blue-700', App: 'bg-green-50 text-green-700',
    SMS: 'bg-orange-50 text-orange-700', WhatsApp: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <SCard title="🔔 Plantillas de notificación" subtitle="Configura qué notificaciones se envían y por qué canal">
      {cargando ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />)}</div> : (
      <div className="space-y-2">
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
              <RowActions onEdit={() => {}} />
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

  const SEED = [
    { nombre: 'Transferencia bancaria', descripcion: 'SPEI a cuenta bancaria del conductor', activo: true },
    { nombre: 'Depósito OXXO', descripcion: 'Pago en efectivo en tiendas OXXO', activo: false },
    { nombre: 'Tarjeta de débito', descripcion: 'Pago con tarjeta Visa/Mastercard débito', activo: true },
    { nombre: 'Tarjeta de crédito', descripcion: 'Cargo a tarjeta con posible comisión', activo: true },
    { nombre: 'Efectivo', descripcion: 'Pago directo en efectivo al conductor', activo: false },
    { nombre: 'Factura mensual', descripcion: 'Facturación mensual para cuentas empresariales', activo: true },
  ]

  const getSb = async () => { const { createClient } = await import('@supabase/supabase-js'); return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) }

  const cargar = useCallback(async () => {
    const sb = await getSb()
    let { data } = await sb.from('metodos_pago').select('id,nombre,descripcion,activo').order('created_at')
    if (!data?.length) { await sb.from('metodos_pago').insert(SEED); const r = await sb.from('metodos_pago').select('id,nombre,descripcion,activo').order('created_at'); data = r.data }
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

  const guardarCiclo = async () => {
    setGuardandoCiclo(true)
    const sb = await getSb()
    await sb.from('configuracion').upsert({ clave: 'ciclo_pago', valor: JSON.stringify(ciclo) }, { onConflict: 'clave' })
    setGuardandoCiclo(false)
  }

  return (
    <div className="space-y-4">
      <SCard title="💳 Métodos de pago habilitados" subtitle="Configura las formas de pago disponibles para usuarios y conductores"
        action={<button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"><PlusIcon className="w-3.5 h-3.5" />Agregar método</button>}>
        {cargando ? <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metodos.map(m => (
            <div key={m.id} className={`flex items-center justify-between p-4 border rounded-xl ${!m.activo ? 'opacity-50 border-slate-100' : 'border-slate-200'}`}>
              <div>
                <p className="font-medium text-slate-800 text-sm">{m.nombre}</p>
                <p className="text-xs text-slate-400">{m.descripcion}</p>
              </div>
              <Toggle value={m.activo} onChange={() => toggleMetodo(m.id, m.activo)} />
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
    razonSocial: 'MoviliaX Tecnología SA de CV',
    rfc: 'MXT220310XY1',
    regimen: '601 - General de Ley Personas Morales',
    domicilio: 'Av. Paseo de la Reforma 250, Cuauhtémoc, CDMX',
    codigoPostal: '06600',
    email: 'facturacion@movilax.mx',
    telefono: '55-4000-1200',
    serie: 'A',
    folioActual: '1441',
    certificado: 'CSD-2024-MXT-001',
    venceCSD: '31 Mar 2026',
  })
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

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
        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2 text-sm text-amber-800">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 text-amber-500" />
          El CSD vigente vence el <strong>{form.venceCSD}</strong>. Recuerda renovarlo antes de esa fecha.
        </div>
        <div className="mt-4 flex justify-end">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckIcon className="w-4 h-4" />Guardar datos fiscales
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
  const set = (k: keyof typeof config, v: any) => setConfig(c => ({ ...c, [k]: v }))

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
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <CheckIcon className="w-4 h-4" />Guardar seguridad
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
            <select value={config.frecuenciaBackup} onChange={e => set('frecuenciaBackup', e.target.value.toUpperCase())} className={`${iCls()} bg-white`}>
              <option>Horario</option>
              <option>Diario</option>
              <option>Semanal</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              <ArrowPathIcon className="w-4 h-4" />Ejecutar backup ahora
            </button>
          </div>
        </div>
      </SCard>
    </div>
  )
}

// ─── 12. BITÁCORA ─────────────────────────────────────────────────────────────
function TabBitacora() {
  const registros = [
    { id: 1, usuario: 'Alejandro Méndez', accion: 'Tarifa base actualizada', modulo: 'Tarifas', detalle: 'TB-003: tarifaBase $500 → $520', ip: '192.168.1.10', fecha: '14 Jun 2025 11:42' },
    { id: 2, usuario: 'Carmen Villanueva', accion: 'Viaje asignado a conductor', modulo: 'Viajes', detalle: '#TR-8848 → Carlos Méndez', ip: '192.168.1.12', fecha: '14 Jun 2025 10:55' },
    { id: 3, usuario: 'Roberto Salas', accion: 'Pago aprobado', modulo: 'Pagos', detalle: 'PC-003 → Mario García $1,600', ip: '192.168.1.14', fecha: '14 Jun 2025 09:30' },
    { id: 4, usuario: 'Patricia Luna', accion: 'Documento aprobado', modulo: 'Documentos', detalle: 'DOC-001 Licencia Carlos Méndez', ip: '192.168.1.16', fecha: '14 Jun 2025 09:15' },
    { id: 5, usuario: 'Alejandro Méndez', accion: 'Conductor suspendido', modulo: 'Conductores', detalle: 'CON-005 Pedro Castillo → Suspendido', ip: '192.168.1.10', fecha: '14 Jun 2025 08:50' },
    { id: 6, usuario: 'Sistema', accion: 'Alerta: documento vencido', modulo: 'Documentos', detalle: 'DOC-004 Licencia Mario García', ip: '—', fecha: '14 Jun 2025 08:00' },
    { id: 7, usuario: 'Carmen Villanueva', accion: 'Incidencia escalada', modulo: 'Incidencias', detalle: '#INC-007 → Coordinación', ip: '192.168.1.12', fecha: '13 Jun 2025 18:05' },
    { id: 8, usuario: 'Alejandro Méndez', accion: 'Zona desactivada', modulo: 'Configuración', detalle: 'Zona Foránea Guadalajara → inactiva', ip: '192.168.1.10', fecha: '13 Jun 2025 17:20' },
    { id: 9, usuario: 'Roberto Salas', accion: 'Reporte exportado', modulo: 'Reportes', detalle: 'Reporte financiero semana 9-14 Jun', ip: '192.168.1.14', fecha: '13 Jun 2025 16:45' },
    { id: 10,usuario: 'Patricia Luna', accion: 'Nuevo usuario creado', modulo: 'Configuración', detalle: 'Usuario: efuentes@admin.com (Soporte)', ip: '192.168.1.16', fecha: '01 Jun 2025 10:00' },
  ]

  const moduloColor: Record<string, string> = {
    Tarifas: 'blue', Viajes: 'purple', Pagos: 'emerald', Documentos: 'amber',
    Conductores: 'indigo', Incidencias: 'rose', Configuración: 'slate', Reportes: 'teal', Sistema: 'slate',
  }

  const [filtroModulo, setFiltroModulo] = useState('Todos')

  return (
    <SCard title="📋 Bitácora de cambios" subtitle="Registro de todas las acciones relevantes del sistema"
      action={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
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