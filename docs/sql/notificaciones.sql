-- ─────────────────────────────────────────────────────────────────────────
-- Notificaciones: campanita in-app (gratis, siempre activa) + WhatsApp/SMS
-- vía Twilio (de paga, solo si hay una plantilla activa que lo pida)
-- Usada por: app/api/notificaciones/enviar/route.ts (torre),
--            TopBar.tsx (torre), TopHeader.tsx (usuario), header de
--            conductor — y de paso conecta por fin
--            Configuración → Notificaciones (plantillas_notificacion),
--            que hasta ahora no la consumía nadie.
--
-- DISEÑO:
-- 1. Cada vez que cualquiera de las RPCs del flujo de viajes inserta en
--    timeline_viaje (todas ya lo hacen — ver
--    docs/sql/flujo_viaje_reasignaciones.sql y
--    docs/sql/estados_viaje_transiciones_seguras.sql), un trigger:
--      a) Inserta en `notificaciones` (in-app) para el usuario y/o
--         conductor del viaje — SIEMPRE, sin depender de configuración.
--         Así la campanita sirve desde el día uno aunque nadie haya
--         tocado Configuración → Notificaciones.
--      b) Busca en plantillas_notificacion una fila activa cuyo `evento`
--         coincida exactamente con el status resultante del viaje
--         (ej. 'Conductor asignado', 'Finalizado', 'Cancelado'...). Si
--         existe y su `canal` incluye 'WhatsApp' o 'SMS', dispara una
--         llamada HTTP (vía pg_net, asíncrona, no bloquea la transacción)
--         al endpoint que de verdad manda el mensaje por Twilio.
--    Si no hay plantilla activa para ese evento, NO se manda nada por
--    WhatsApp/SMS — por diseño, para no generar cargos de Twilio por
--    eventos que nadie configuró a propósito.
-- 2. `destinatario` en plantillas_notificacion sigue siendo texto libre
--    (como ya estaba). Se interpreta así: si contiene "usuario" -> se
--    manda al usuario del viaje; si contiene "conductor" -> al
--    conductor; cualquier otro valor (o vacío) -> no se manda a nadie por
--    WhatsApp/SMS (evita adivinar mal a quién notificar).
--
-- Requiere: que ya hayas aplicado flujo_viaje_reasignaciones.sql y
-- estados_viaje_transiciones_seguras.sql. Es idempotente.
-- ─────────────────────────────────────────────────────────────────────────

create extension if not exists pg_net;

-- ── 1. Tabla de notificaciones in-app ─────────────────────────────────────
create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  destinatario_tipo text not null check (destinatario_tipo in ('usuario', 'conductor', 'admin')),
  -- null solo para destinatario_tipo='admin' (visible a todos los admins).
  destinatario_id uuid null,
  viaje_id uuid references public.viajes(id) on delete cascade,
  titulo text not null,
  cuerpo text not null,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notificaciones_destinatario_idx
  on public.notificaciones (destinatario_tipo, destinatario_id, created_at desc);

alter table public.notificaciones enable row level security;

drop policy if exists "Usuario lee sus notificaciones" on public.notificaciones;
create policy "Usuario lee sus notificaciones"
on public.notificaciones for select to authenticated
using (
  (destinatario_tipo = 'usuario' and exists (select 1 from public.usuarios where id = destinatario_id and auth_id = auth.uid()))
  or (destinatario_tipo = 'conductor' and exists (select 1 from public.conductores where id = destinatario_id and auth_id = auth.uid()))
  or (destinatario_tipo = 'admin' and public.is_admin())
);

drop policy if exists "Usuario marca como leídas sus notificaciones" on public.notificaciones;
create policy "Usuario marca como leídas sus notificaciones"
on public.notificaciones for update to authenticated
using (
  (destinatario_tipo = 'usuario' and exists (select 1 from public.usuarios where id = destinatario_id and auth_id = auth.uid()))
  or (destinatario_tipo = 'conductor' and exists (select 1 from public.conductores where id = destinatario_id and auth_id = auth.uid()))
  or (destinatario_tipo = 'admin' and public.is_admin())
)
with check (true);

-- ── 2. Configuración necesaria para que el trigger llame al endpoint ─────
-- app.notificaciones_webhook_url: ej. https://tu-dominio.com/api/notificaciones/enviar
-- app.notificaciones_webhook_secret: el mismo valor que NOTIFICACIONES_WEBHOOK_SECRET
--   en el .env de torre (ver app/api/notificaciones/enviar/route.ts).
-- Corre esto UNA VEZ, ajustando los valores, después de aplicar este archivo:
--
--   alter database postgres set app.notificaciones_webhook_url = 'https://tu-dominio.com/api/notificaciones/enviar';
--   alter database postgres set app.notificaciones_webhook_secret = 'un-secreto-largo-aleatorio';
--
-- (cambia "postgres" si tu base se llama distinto). Sin esto, la parte de
-- WhatsApp/SMS no se va a disparar — pero la campanita in-app funciona
-- igual, no depende de esta configuración.

-- ── 3. Trigger: in-app siempre + WhatsApp/SMS solo si hay plantilla activa ─
create or replace function public.fn_notificar_desde_timeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viaje public.viajes%rowtype;
  v_plantilla public.plantillas_notificacion%rowtype;
  v_usuario_tel text;
  v_conductor_tel text;
  v_webhook_url text;
  v_webhook_secret text;
begin
  select * into v_viaje from public.viajes where id = new.viaje_id;
  if v_viaje.id is null then return new; end if;

  -- 3a. In-app: siempre, sin depender de configuración.
  if v_viaje.usuario_id is not null and new.actor_tipo <> 'usuario' then
    insert into public.notificaciones (destinatario_tipo, destinatario_id, viaje_id, titulo, cuerpo)
    values ('usuario', v_viaje.usuario_id, new.viaje_id, 'Actualización de tu viaje', new.evento);
  end if;

  if v_viaje.conductor_id is not null and new.actor_tipo <> 'conductor' then
    insert into public.notificaciones (destinatario_tipo, destinatario_id, viaje_id, titulo, cuerpo)
    values ('conductor', v_viaje.conductor_id, new.viaje_id, 'Actualización de viaje', new.evento);
  end if;

  if v_viaje.status = 'En revisión por incidencia' or v_viaje.status = 'Cancelado' or new.evento = 'Solicitud creada' then
    insert into public.notificaciones (destinatario_tipo, destinatario_id, viaje_id, titulo, cuerpo)
    values ('admin', null, new.viaje_id, 'Atención requerida', new.evento);
  end if;

  -- 3b. WhatsApp/SMS: solo si hay plantilla activa para este status exacto.
  select * into v_plantilla
  from public.plantillas_notificacion
  where evento = v_viaje.status and activa = true
  limit 1;

  if v_plantilla.id is null then return new; end if;
  if not ('WhatsApp' = any(v_plantilla.canal) or 'SMS' = any(v_plantilla.canal)) then return new; end if;

  begin
    v_webhook_url := current_setting('app.notificaciones_webhook_url', true);
    v_webhook_secret := current_setting('app.notificaciones_webhook_secret', true);
  exception when others then
    v_webhook_url := null;
  end;
  if v_webhook_url is null or v_webhook_url = '' then return new; end if;

  if lower(coalesce(v_plantilla.destinatario, '')) like '%usuario%' and v_viaje.usuario_id is not null then
    select telefono into v_usuario_tel from public.usuarios where id = v_viaje.usuario_id;
    if v_usuario_tel is not null and v_usuario_tel <> '' then
      perform net.http_post(
        url := v_webhook_url,
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_webhook_secret),
        body := jsonb_build_object(
          'telefono', v_usuario_tel,
          'evento', v_viaje.status,
          'canales', v_plantilla.canal,
          'viaje_id', v_viaje.id,
          'destinatario_tipo', 'usuario'
        )
      );
    end if;
  end if;

  if lower(coalesce(v_plantilla.destinatario, '')) like '%conductor%' and v_viaje.conductor_id is not null then
    select telefono into v_conductor_tel from public.conductores where id = v_viaje.conductor_id;
    if v_conductor_tel is not null and v_conductor_tel <> '' then
      perform net.http_post(
        url := v_webhook_url,
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_webhook_secret),
        body := jsonb_build_object(
          'telefono', v_conductor_tel,
          'evento', v_viaje.status,
          'canales', v_plantilla.canal,
          'viaje_id', v_viaje.id,
          'destinatario_tipo', 'conductor'
        )
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notificar_desde_timeline on public.timeline_viaje;
create trigger trg_notificar_desde_timeline
after insert on public.timeline_viaje
for each row execute function public.fn_notificar_desde_timeline();
