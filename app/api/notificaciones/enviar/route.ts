import { NextResponse } from 'next/server'

// Llamado por el trigger fn_notificar_desde_timeline (ver
// docs/sql/notificaciones.sql) vía pg_net — no por el navegador. Por eso
// se autentica con un secreto compartido en el header, no con sesión de
// Supabase Auth.
const WEBHOOK_SECRET = process.env.NOTIFICACIONES_WEBHOOK_SECRET
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM // ej. 'whatsapp:+14155238886'
const TWILIO_SMS_FROM = process.env.TWILIO_SMS_FROM

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Mensajes por estado resultante del viaje — los mismos 12 estados de
// EstatusViaje. Si Configuración → Notificaciones marca un evento como
// activo con canal WhatsApp/SMS, este es el texto que se envía. El cuerpo
// libre de la plantilla no se usa como mensaje (ver nota abajo).
//
// Por qué no usar el texto libre de la plantilla directamente: hoy
// plantillas_notificacion no tiene un campo "cuerpo del mensaje" en su
// formulario (ConfiguracionView.tsx → TabNotificaciones), solo
// evento/destinatario/canal — agregar ese campo es un cambio aparte de UI
// que no se hizo en esta entrega. Por ahora el texto vive aquí, indexado
// por estado, así que sigue siendo correcto en español/contexto sin
// depender de que alguien lo capture bien en el formulario.
const MENSAJES: Record<string, string> = {
  'Conductor asignado': 'Ya tenemos un conductor certificado para tu traslado. Te avisaremos cuando esté en camino.',
  'Conductor en camino': 'Tu conductor va en camino a recoger el vehículo.',
  'Recolección en proceso': 'El conductor llegó al punto de origen y está iniciando la recolección.',
  'Evidencia inicial pendiente': 'Se registró la evidencia inicial del vehículo.',
  'Traslado en curso': 'Tu vehículo ya va en camino a su destino.',
  'Entrega en proceso': 'El conductor llegó al destino y está iniciando la entrega.',
  'Evidencia final pendiente': 'Se registró la evidencia final del vehículo.',
  'Finalizado': 'Tu traslado se completó. Gracias por confiar en Ruum.',
  'Cancelado': 'Tu viaje fue cancelado.',
  'En revisión por incidencia': 'Tu viaje está en revisión por una incidencia reportada. Te contactaremos pronto.',
}

type ResultadoEnvio = { canal: string; ok: boolean; error?: string }

export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret')
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return badRequest('No autorizado.', 401)
  }

  const body = await request.json().catch(() => null) as {
    telefono?: string; evento?: string; canales?: string[]; viaje_id?: string; destinatario_tipo?: string
  } | null
  if (!body?.telefono || !body?.evento) return badRequest('Falta teléfono o evento.')

  const mensaje = MENSAJES[body.evento] ?? `Actualización de tu viaje: ${body.evento}`
  const numero = '+52' + body.telefono.replace(/\D/g, '')
  const canales = body.canales ?? []
  const resultados: ResultadoEnvio[] = []

  if (canales.includes('WhatsApp')) resultados.push(await enviarTwilio(numero, mensaje, 'whatsapp'))
  if (canales.includes('SMS')) resultados.push(await enviarTwilio(numero, mensaje, 'sms'))

  if (resultados.length === 0) {
    return badRequest('Ninguno de los canales solicitados es WhatsApp o SMS.')
  }

  return NextResponse.json({ ok: resultados.every(r => r.ok), resultados })
}

async function enviarTwilio(numeroDestino: string, mensaje: string, tipo: 'whatsapp' | 'sms'): Promise<ResultadoEnvio> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { canal: tipo, ok: false, error: 'Twilio no está configurado en el servidor (faltan TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN).' }
  }
  const from = tipo === 'whatsapp' ? TWILIO_WHATSAPP_FROM : TWILIO_SMS_FROM
  if (!from) {
    return { canal: tipo, ok: false, error: `Falta TWILIO_${tipo === 'whatsapp' ? 'WHATSAPP' : 'SMS'}_FROM en el servidor.` }
  }

  const to = tipo === 'whatsapp' ? `whatsapp:${numeroDestino}` : numeroDestino
  const fromFormateado = tipo === 'whatsapp' ? (from.startsWith('whatsapp:') ? from : `whatsapp:${from}`) : from

  try {
    const params = new URLSearchParams({ To: to, From: fromFormateado, Body: mensaje })
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
      },
      body: params,
    })
    if (!res.ok) {
      const detalle = await res.text().catch(() => '')
      return { canal: tipo, ok: false, error: `Twilio respondió ${res.status}: ${detalle.slice(0, 300)}` }
    }
    return { canal: tipo, ok: true }
  } catch (e) {
    return { canal: tipo, ok: false, error: e instanceof Error ? e.message : 'Error desconocido llamando a Twilio.' }
  }
}
