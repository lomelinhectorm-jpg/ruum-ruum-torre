// app/api/stripe/cobrar-pago/route.ts -- admin-web
// Cobra de verdad, con Stripe, la tarjeta predeterminada guardada del
// usuario, por el monto de un registro ya creado en `pagos_usuarios`.
// Se llama justo despues de crear ese registro desde Pagos -> Nuevo
// Registro de Pago (PagosView.tsx). Mismo patron de autenticacion que
// app/api/crear-usuario: sesion por cookies + verificacion de rol interno
// autorizado, nunca confiando en nada que mande el cliente salvo el id
// del pago a cobrar.
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getStripeServerClient } from '@/lib/stripe'
import Stripe from 'stripe'

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

const ROLES_AUTORIZADOS = new Set([
  'Super Administrador',
  'Coordinador Operativo',
  'Analista Financiero',
  'Validador Documental',
])

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return badRequest('Falta configurar Supabase en el servidor.', 500)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ── 1. Verificar que quien llama es un admin con sesión válida ──────────
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(supabaseUrl, anonKey, {
    cookies: { getAll: () => cookieStore.getAll(), setAll() {} },
  })
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return badRequest('No autenticado.', 401)

  const { data: usuarioInterno, error: adminCheckError } = await admin
    .from('usuarios_internos')
    .select('activo, roles(nombre, activo)')
    .eq('auth_id', user.id)
    .maybeSingle()
  const rol = usuarioInterno?.roles as unknown as { nombre?: string; activo?: boolean } | null
  const esAdmin = Boolean(
    usuarioInterno?.activo && rol?.activo && rol.nombre && ROLES_AUTORIZADOS.has(rol.nombre)
  )
  if (adminCheckError || !esAdmin) return badRequest('No autorizado.', 403)

  // ── 2. Leer el pago y al usuario dueño del viaje ─────────────────────────
  const body = await request.json().catch(() => null) as { pagoId?: string } | null
  if (!body?.pagoId) return badRequest('Falta indicar qué pago cobrar.')

  const { data: pago, error: pagoError } = await admin
    .from('pagos_usuarios')
    .select('id, usuario_id, tarifa, estatus')
    .eq('id', body.pagoId)
    .maybeSingle()
  if (pagoError || !pago) return badRequest('No se encontró el registro de pago.', 404)
  if (pago.estatus === 'Pagado') return badRequest('Este pago ya está marcado como Pagado.')

  const { data: usuarioRow, error: usuarioError } = await admin
    .from('usuarios')
    .select('id, stripe_customer_id')
    .eq('id', pago.usuario_id)
    .maybeSingle()
  if (usuarioError || !usuarioRow) return badRequest('No se encontró al usuario del viaje.', 404)
  if (!usuarioRow.stripe_customer_id) {
    return NextResponse.json({ ok: false, estatus: pago.estatus, mensaje: 'El usuario no tiene ninguna tarjeta guardada con Stripe.' })
  }

  const { data: metodoPredeterminado } = await admin
    .from('metodos_pago_usuario')
    .select('stripe_payment_method_id')
    .eq('usuario_id', usuarioRow.id)
    .eq('predeterminado', true)
    .not('stripe_payment_method_id', 'is', null)
    .maybeSingle()
  if (!metodoPredeterminado?.stripe_payment_method_id) {
    return NextResponse.json({ ok: false, estatus: pago.estatus, mensaje: 'El usuario no tiene un método de pago predeterminado con tarjeta guardada.' })
  }

  // ── 3. Cobrar con Stripe ──────────────────────────────────────────────────
  let stripe
  try {
    stripe = getStripeServerClient()
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : 'Stripe no está configurado.', 500)
  }

  const montoCentavos = Math.round(Number(pago.tarifa) * 100)
  if (!montoCentavos || montoCentavos <= 0) {
    return badRequest('La tarifa del pago debe ser mayor a cero para poder cobrarla.')
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: montoCentavos,
      currency: 'mxn',
      customer: usuarioRow.stripe_customer_id,
      payment_method: metodoPredeterminado.stripe_payment_method_id,
      off_session: true,
      confirm: true,
    })

    const nuevoEstatus = paymentIntent.status === 'succeeded' ? 'Pagado' : 'Pendiente'
    await admin
      .from('pagos_usuarios')
      .update({ estatus: nuevoEstatus, stripe_payment_intent_id: paymentIntent.id })
      .eq('id', pago.id)

    if (paymentIntent.status === 'succeeded') {
      return NextResponse.json({ ok: true, estatus: 'Pagado', mensaje: 'Cobro exitoso.' })
    }
    return NextResponse.json({
      ok: false, estatus: nuevoEstatus,
      mensaje: `Stripe no completó el cobro de inmediato (estatus: ${paymentIntent.status}). El registro quedó en Pendiente -- puede necesitar autenticación adicional del usuario.`,
    })
  } catch (e) {
    const stripeError = e instanceof Stripe.errors.StripeError ? e : null
    await admin
      .from('pagos_usuarios')
      .update({ estatus: 'Rechazado' })
      .eq('id', pago.id)

    return NextResponse.json({
      ok: false, estatus: 'Rechazado',
      mensaje: stripeError?.message ?? 'Stripe rechazó el cobro.',
    })
  }
}