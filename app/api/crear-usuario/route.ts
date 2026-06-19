// app/api/crear-usuario/route.ts — admin-web
// Crea un Usuario (cliente) con cuenta de acceso real en Supabase Auth.
// Solo lo puede ejecutar un admin autenticado (se verifica con is_admin() vía RPC,
// usando la sesión propia del que llama — no con el service_role).
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type PerfilUsuario = {
  nombre: string
  apellido: string
  curp: string | null
  email: string
  telefono: string
  tipo: string
  estatus: string
  calle: string | null
  numero: string | null
  colonia: string | null
  municipio: string | null
  estado_geo: string | null
  codigo_postal: string | null
  razon_social: string | null
  rfc: string | null
  regimen_fiscal: string | null
  cfdi: string | null
  domicilio_fiscal: string | null
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Contraseña temporal legible, sin caracteres que se confundan entre sí (0/O, 1/I/l).
function generarPasswordTemporal(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return badRequest('Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.', 500)
  }

  // ── 1. Verificar que quien llama es un admin con sesión válida ────────────
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // No necesitamos escribir cookies en este endpoint.
      },
    },
  })

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return badRequest('No autenticado.', 401)

  const { data: esAdmin, error: adminCheckError } = await supabaseAuth.rpc('is_admin')
  if (adminCheckError || !esAdmin) {
    console.error('Chequeo is_admin() falló:', { userId: user.id, email: user.email, adminCheckError, esAdmin })
    return badRequest('No autorizado.', 403)
  }

  // ── 2. Leer y validar el payload ───────────────────────────────────────────
  const body = (await request.json().catch(() => null)) as { perfil?: Partial<PerfilUsuario> } | null
  const perfil = body?.perfil

  if (!perfil?.email || !perfil?.nombre || !perfil?.apellido || !perfil?.tipo) {
    return badRequest('Datos incompletos: nombre, apellido, tipo y correo son requeridos.')
  }

  const email = String(perfil.email).toLowerCase().trim()
  const tempPassword = generarPasswordTemporal()

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ── 3. Crear la cuenta de autenticación ───────────────────────────────────
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { creado_por_admin: true },
  })

  if (authError || !authData.user) {
    const msg = authError?.message?.includes('already been registered')
      ? 'Ya existe una cuenta con ese correo.'
      : (authError?.message ?? 'No se pudo crear la cuenta de acceso.')
    return badRequest(msg, 422)
  }

  // ── 4. Insertar el registro de negocio en `usuarios` ──────────────────────
  const { error: dbError } = await admin.from('usuarios').insert({
    auth_id: authData.user.id,
    nombre: String(perfil.nombre),
    apellido: String(perfil.apellido),
    curp: perfil.curp || null,
    email,
    telefono: perfil.telefono ? String(perfil.telefono) : null,
    tipo: String(perfil.tipo),
    estatus: String(perfil.estatus ?? 'Activo'),
    calle: perfil.calle || null,
    numero: perfil.numero || null,
    colonia: perfil.colonia || null,
    municipio: perfil.municipio || null,
    estado_geo: perfil.estado_geo || null,
    codigo_postal: perfil.codigo_postal || null,
    razon_social: perfil.razon_social || null,
    rfc: perfil.rfc || null,
    regimen_fiscal: perfil.regimen_fiscal || null,
    cfdi: perfil.cfdi || null,
    domicilio_fiscal: perfil.domicilio_fiscal || null,
  })

  if (dbError) {
    // Si falla el insert de negocio, no dejamos huérfana la cuenta de auth.
    await admin.auth.admin.deleteUser(authData.user.id).catch(() => undefined)
    return badRequest(dbError.message, 422)
  }

  return NextResponse.json({ ok: true, userId: authData.user.id, password: tempPassword })
}
