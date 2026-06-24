-- ─────────────────────────────────────────────────────────────────────────
-- Máquina de estados de viajes: grafo completo (versión final)
-- Usada por: lib/queries/viajes.ts (admin), lib/queries/conductor.ts
--
-- Esta versión reemplaza la entrega anterior de este mismo archivo. Antes
-- solo tenía 3 filas de `siguientes` llenas porque los cuerpos de
-- asignar_conductor_admin, aceptar_viaje_conductor, cerrar_viaje_conductor,
-- cancelar_viaje_usuario y guardar_evidencia_conductor no estaban
-- recuperados (ver docs/sql/flujo_viaje_reasignaciones.sql, ya actualizado
-- con sus definiciones reales). Con esos 5 cuerpos en mano, el grafo de
-- abajo es el real, no una reconstrucción parcial.
--
-- Grafo confirmado leyendo cada función línea por línea:
--   Solicitud recibida        -> Conductor asignado (asignar_conductor_admin)
--                              -> Cancelado (cancelar_viaje_usuario, sin penalización)
--   Pendiente de asignación   -> Conductor asignado (asignar_conductor_admin)
--                              -> Cancelado (cancelar_viaje_usuario, sin penalización)
--   Conductor asignado        -> Conductor en camino (aceptar_viaje_conductor)
--                              -> Cancelado (cancelar_viaje_usuario, con 10% de penalización)
--   Conductor en camino       -> Recolección en proceso  [antes sin proteger — ya corregido]
--   Recolección en proceso    -> Evidencia inicial pendiente (guardar_evidencia_conductor, tipo='inicial')
--   Evidencia inicial pendiente -> Traslado en curso      [antes sin proteger — ya corregido]
--   Traslado en curso         -> Entrega en proceso       [antes sin proteger — ya corregido]
--   Entrega en proceso        -> Evidencia final pendiente (guardar_evidencia_conductor, tipo='final')
--   Evidencia final pendiente -> Finalizado (cerrar_viaje_conductor, exige evidencia final ya cargada)
--   Finalizado / Cancelado    -> (terminales, sin salida)
--   En revisión por incidencia -> (sin salida propia hoy; solo Admin puede
--                                  sacarlo de ahí, vía la regla general de abajo)
--
-- Aparte de lo anterior, Admin puede mover CUALQUIER viaje que no esté ya
-- en Finalizado/Cancelado a Finalizado, Cancelado o En revisión por
-- incidencia (regla fija en cambiar_estado_viaje_admin, no por fila de
-- estados_viaje — ver nota en esa función).
--
-- asignar_conductor_admin también permite REASIGNAR conductor durante los
-- 6 estados operativos (Conductor en camino...Evidencia final pendiente)
-- sin cambiar el status, exigiendo un motivo y registrándolo en
-- `reasignaciones`. Eso no es una transición de estado — es un cambio de
-- conductor_id — por lo que no aparece en `siguientes`.
--
-- Es idempotente. Aplica sin riesgo aunque ya hayas corrido la versión
-- anterior de este archivo.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.estados_viaje
  add column if not exists siguientes text[] not null default '{}';

comment on column public.estados_viaje.siguiente is
  'Heredado. Ya no se usa para validar transiciones — ver columna siguientes.';

comment on column public.estados_viaje.siguientes is
  'Estados a los que se puede pasar legítimamente desde este estado, según las funciones que ya gobiernan el flujo (asignar_conductor_admin, aceptar_viaje_conductor, guardar_evidencia_conductor, cerrar_viaje_conductor, cancelar_viaje_usuario) o, para los 3 casos marcados en el código, avanzar_estado_viaje_conductor. No incluye Finalizado/Cancelado/En revisión por incidencia vía Admin — esa regla es general, no por fila (ver cambiar_estado_viaje_admin).';

update public.estados_viaje set siguientes = array['Conductor asignado', 'Cancelado']
  where nombre = 'Solicitud recibida';
update public.estados_viaje set siguientes = array['Conductor asignado', 'Cancelado']
  where nombre = 'Pendiente de asignación';
update public.estados_viaje set siguientes = array['Conductor en camino', 'Cancelado']
  where nombre = 'Conductor asignado';
update public.estados_viaje set siguientes = array['Recolección en proceso']
  where nombre = 'Conductor en camino';
update public.estados_viaje set siguientes = array['Evidencia inicial pendiente']
  where nombre = 'Recolección en proceso';
update public.estados_viaje set siguientes = array['Traslado en curso']
  where nombre = 'Evidencia inicial pendiente';
update public.estados_viaje set siguientes = array['Entrega en proceso']
  where nombre = 'Traslado en curso';
update public.estados_viaje set siguientes = array['Evidencia final pendiente']
  where nombre = 'Entrega en proceso';
update public.estados_viaje set siguientes = array['Finalizado']
  where nombre = 'Evidencia final pendiente';
update public.estados_viaje set siguientes = '{}'
  where nombre in ('Finalizado', 'Cancelado', 'En revisión por incidencia');

-- ── RPC para las 3 transiciones simples del conductor ─────────────────────
-- (Conductor en camino -> Recolección en proceso, Evidencia inicial
-- pendiente -> Traslado en curso, Traslado en curso -> Entrega en
-- proceso). Las demás transiciones del conductor (aceptar, cargar
-- evidencia, cerrar) ya tienen su propia función dedicada — no se tocan.
create or replace function public.avanzar_estado_viaje_conductor(
  p_viaje_id uuid,
  p_conductor_id uuid,
  p_actor_nombre text,
  p_nuevo_estado text,
  p_evento text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viaje public.viajes%rowtype;
  v_permitidos text[];
begin
  select * into v_viaje
  from public.viajes
  where id = p_viaje_id
  for update;

  if v_viaje.id is null then
    raise exception 'Viaje % no encontrado', p_viaje_id;
  end if;

  if v_viaje.conductor_id is distinct from p_conductor_id then
    raise exception 'El viaje % no está asignado a este conductor', p_viaje_id;
  end if;

  select siguientes into v_permitidos
  from public.estados_viaje
  where nombre = v_viaje.status;

  if v_permitidos is null or not (p_nuevo_estado = any(v_permitidos)) then
    raise exception 'Transición no permitida: de "%" a "%"', v_viaje.status, p_nuevo_estado;
  end if;

  update public.viajes
  set status = p_nuevo_estado, updated_at = now()
  where id = p_viaje_id;

  insert into public.timeline_viaje (viaje_id, evento, actor, actor_tipo)
  values (p_viaje_id, coalesce(p_evento, 'Estatus cambiado a: ' || p_nuevo_estado), p_actor_nombre, 'conductor');

  return jsonb_build_object('viaje_id', p_viaje_id, 'status', p_nuevo_estado);
end;
$$;

revoke all on function public.avanzar_estado_viaje_conductor(uuid, uuid, text, text, text) from public;
grant execute on function public.avanzar_estado_viaje_conductor(uuid, uuid, text, text, text) to authenticated;

-- ── RPC para finalizar / cancelar / marcar incidencia (admin) ────────────
-- Misma regla que ya tenía la UI (TERMINAL_STATUSES en ViajesView.tsx):
-- cualquier estado no terminal puede pasar a estos 3. Cuando el destino es
-- 'Cancelado', ahora también deja constancia en cancelado_por/cancelado_at
-- igual que cancelar_viaje_usuario — antes esta función no tocaba esas
-- columnas, así que una cancelación hecha por Admin quedaba sin ese rastro
-- mientras que una hecha por el cliente sí lo tenía. Sin penalización por
-- default (a diferencia de cancelar_viaje_usuario): es Admin decidiendo,
-- no el cliente autocancelándose.
create or replace function public.cambiar_estado_viaje_admin(
  p_viaje_id uuid,
  p_nuevo_estado text,
  p_actor_nombre text,
  p_evento text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viaje public.viajes%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede ejecutar esta acción';
  end if;

  if p_nuevo_estado not in ('Finalizado', 'Cancelado', 'En revisión por incidencia') then
    raise exception 'cambiar_estado_viaje_admin no maneja el estado "%"', p_nuevo_estado;
  end if;

  select * into v_viaje
  from public.viajes
  where id = p_viaje_id
  for update;

  if v_viaje.id is null then
    raise exception 'Viaje % no encontrado', p_viaje_id;
  end if;

  if v_viaje.status in ('Finalizado', 'Cancelado') then
    raise exception 'El viaje % ya está en un estado final ("%")', p_viaje_id, v_viaje.status;
  end if;

  if p_nuevo_estado = 'Cancelado' then
    update public.viajes
    set status = p_nuevo_estado,
        cancelacion_penalizacion = 0,
        cancelado_por = 'admin',
        cancelado_at = now(),
        updated_at = now()
    where id = p_viaje_id;
  else
    update public.viajes
    set status = p_nuevo_estado, updated_at = now()
    where id = p_viaje_id;
  end if;

  insert into public.timeline_viaje (viaje_id, evento, actor, actor_tipo)
  values (p_viaje_id, coalesce(p_evento, 'Estatus cambiado a: ' || p_nuevo_estado), coalesce(nullif(trim(p_actor_nombre), ''), 'Admin'), 'admin');

  return jsonb_build_object('viaje_id', p_viaje_id, 'status', p_nuevo_estado);
end;
$$;

revoke all on function public.cambiar_estado_viaje_admin(uuid, text, text, text) from public;
grant execute on function public.cambiar_estado_viaje_admin(uuid, text, text, text) to authenticated;
