-- ─────────────────────────────────────────────────────────────────────────
-- Flujo de viajes: asignación, aceptación, evidencia, cierre, cancelación
-- Usada por: lib/queries/viajes.ts (admin), lib/queries/conductor.ts,
--            lib/queries/usuario.ts (usuario)
--
-- HISTORIAL: este archivo se sobrescribió por error con TypeScript antes
-- del 21-06-2026 y quedó bloqueado con un aviso de que los cuerpos de
-- estas 5 funciones solo existían ya en Supabase. Las definiciones de
-- abajo son las reales, recuperadas con pg_get_functiondef() el
-- 24-06-2026 y pegadas tal cual (solo se le agregaron los REVOKE/GRANT,
-- que pg_get_functiondef no incluye, y los comentarios). No se modificó
-- ninguna lógica.
--
-- Resumen de qué hace cada una (para no tener que releer el PL/pgSQL cada
-- vez):
--
--   asignar_conductor_admin(viaje, conductor_nuevo, motivo?, actor?)
--     Solo admin. Si el viaje ya tenía conductor Y está en uno de los 6
--     estados operativos (Conductor en camino...Evidencia final
--     pendiente), es una REASIGNACIÓN: exige motivo y lo registra en
--     `reasignaciones`. Si no tenía conductor (o estaba en Solicitud
--     recibida/Pendiente de asignación/Conductor asignado), es asignación
--     simple, sin motivo. El status pasa a 'Conductor asignado' solo si
--     venía de Solicitud recibida/Pendiente de asignación; si no, se
--     queda igual (solo cambia el conductor_id).
--
--   aceptar_viaje_conductor(viaje, conductor, actor)
--     Solo el conductor dueño de la sesión. 'Conductor asignado' ->
--     'Conductor en camino'. Falla si el viaje ya no está en ese estado
--     exacto (evita doble-aceptación / condiciones de carrera).
--
--   guardar_evidencia_conductor(viaje, conductor, tipo, actor, ...)
--     tipo='inicial' exige estar en 'Recolección en proceso' -> pasa a
--     'Evidencia inicial pendiente'. tipo='final' exige estar en 'Entrega
--     en proceso' -> pasa a 'Evidencia final pendiente'. Hace upsert sobre
--     `evidencias` (un solo registro por viaje+conductor).
--
--   cerrar_viaje_conductor(viaje, conductor, actor)
--     Exige que ya exista evidencia final (km_final not null). 'Evidencia
--     final pendiente' -> 'Finalizado'.
--
--   cancelar_viaje_usuario(viaje)
--     Solo el usuario dueño del viaje. Solo desde Solicitud
--     recibida/Pendiente de asignación/Conductor asignado — más allá de
--     eso, exige contactar soporte. Penalización del 10% de
--     tarifa_cliente si ya había conductor asignado, 0 si no.
--
-- Es idempotente (create or replace + revoke/grant explícitos).
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.aceptar_viaje_conductor(p_viaje_id uuid, p_conductor_id uuid, p_actor_nombre text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if not exists (
    select 1 from public.conductores
    where id = p_conductor_id and auth_id = auth.uid()
  ) then
    raise exception 'El conductor no corresponde a la sesión actual';
  end if;

  update public.viajes
  set status = 'Conductor en camino'
  where id = p_viaje_id
    and conductor_id = p_conductor_id
    and status = 'Conductor asignado';
  if not found then raise exception 'El viaje ya no está disponible para aceptación'; end if;

  insert into public.timeline_viaje (viaje_id, evento, actor, actor_tipo)
  values (p_viaje_id, 'Conductor aceptó el viaje', p_actor_nombre, 'conductor');

  return jsonb_build_object('viaje_id', p_viaje_id, 'status', 'Conductor en camino');
end;
$function$;

revoke all on function public.aceptar_viaje_conductor(uuid, uuid, text) from public;
grant execute on function public.aceptar_viaje_conductor(uuid, uuid, text) to authenticated;


create or replace function public.asignar_conductor_admin(p_viaje_id uuid, p_conductor_nuevo uuid, p_motivo text default null::text, p_actor_nombre text default 'Admin'::text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_viaje public.viajes%rowtype;
  v_es_reasignacion boolean := false;
  v_status_nuevo text;
begin
  if not public.is_admin() then
    raise exception 'Operación permitida sólo para administradores';
  end if;

  select * into v_viaje from public.viajes where id = p_viaje_id for update;
  if not found then raise exception 'Viaje no encontrado'; end if;
  if v_viaje.status in ('Finalizado', 'Cancelado') then
    raise exception 'No se puede asignar conductor a un viaje terminal';
  end if;
  if v_viaje.conductor_id = p_conductor_nuevo then
    raise exception 'Selecciona un conductor diferente';
  end if;
  if not exists (select 1 from public.conductores where id = p_conductor_nuevo) then
    raise exception 'Conductor nuevo no encontrado';
  end if;

  if v_viaje.conductor_id is not null then
    if v_viaje.status in (
      'Conductor en camino', 'Recolección en proceso',
      'Evidencia inicial pendiente', 'Traslado en curso',
      'Entrega en proceso', 'Evidencia final pendiente'
    ) then
      v_es_reasignacion := true;
      if p_motivo is null or length(trim(p_motivo)) = 0 then
        raise exception 'El motivo es obligatorio para una reasignación en curso';
      end if;
    elsif v_viaje.status not in ('Solicitud recibida', 'Pendiente de asignación', 'Conductor asignado') then
      raise exception 'La reasignación sólo está permitida durante los estados operativos';
    end if;
  end if;

  if v_es_reasignacion then
    insert into public.reasignaciones (
      viaje_id, conductor_anterior, conductor_nuevo, motivo
    ) values (
      p_viaje_id, v_viaje.conductor_id, p_conductor_nuevo, trim(p_motivo)
    );
  end if;

  v_status_nuevo := case
    when v_viaje.status in ('Solicitud recibida', 'Pendiente de asignación')
      then 'Conductor asignado'
    else v_viaje.status
  end;

  update public.viajes
  set conductor_id = p_conductor_nuevo, status = v_status_nuevo
  where id = p_viaje_id;

  insert into public.timeline_viaje (viaje_id, evento, actor, actor_tipo)
  values (
    p_viaje_id,
    case when v_es_reasignacion
      then 'Conductor reasignado · Motivo: ' || trim(p_motivo)
      else case when v_viaje.conductor_id is null then 'Conductor asignado' else 'Conductor cambiado' end
    end,
    coalesce(nullif(trim(p_actor_nombre), ''), 'Admin'),
    'admin'
  );

  return jsonb_build_object(
    'viaje_id', p_viaje_id,
    'conductor_id', p_conductor_nuevo,
    'status', v_status_nuevo,
    'reasignacion', v_es_reasignacion
  );
end;
$function$;

revoke all on function public.asignar_conductor_admin(uuid, uuid, text, text) from public;
grant execute on function public.asignar_conductor_admin(uuid, uuid, text, text) to authenticated;


create or replace function public.cancelar_viaje_usuario(p_viaje_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_viaje public.viajes%rowtype;
  v_penalizacion numeric(12,2) := 0;
  v_actor_nombre text;
begin
  select v.* into v_viaje
  from public.viajes v
  join public.usuarios u on u.id = v.usuario_id
  where v.id = p_viaje_id and u.auth_id = auth.uid()
  for update of v;

  if not found then raise exception 'El viaje no pertenece al usuario actual'; end if;
  select concat_ws(' ', nombre, apellido) into v_actor_nombre
  from public.usuarios where id = v_viaje.usuario_id;
  if v_viaje.status not in (
    'Solicitud recibida', 'Pendiente de asignación', 'Conductor asignado'
  ) then
    raise exception using
      errcode = '23514',
      message = 'El viaje ya no puede cancelarse desde la aplicación',
      hint = 'Contacta a soporte para revisar una cancelación operativa.';
  end if;

  if v_viaje.status = 'Conductor asignado' then
    v_penalizacion := round(coalesce(v_viaje.tarifa_cliente, 0)::numeric * 0.10, 2);
  end if;

  update public.viajes
  set status = 'Cancelado',
      cancelacion_penalizacion = v_penalizacion,
      cancelado_por = 'usuario',
      cancelado_at = now()
  where id = p_viaje_id;

  insert into public.timeline_viaje (viaje_id, evento, actor, actor_tipo)
  values (
    p_viaje_id,
    case when v_penalizacion > 0
      then 'Viaje cancelado por usuario · Penalización: $' || v_penalizacion::text || ' MXN'
      else 'Viaje cancelado por usuario · Sin penalización'
    end,
    coalesce(nullif(trim(v_actor_nombre), ''), 'Usuario'),
    'usuario'
  );

  return jsonb_build_object(
    'viaje_id', p_viaje_id,
    'status', 'Cancelado',
    'penalizacion', v_penalizacion
  );
end;
$function$;

revoke all on function public.cancelar_viaje_usuario(uuid) from public;
grant execute on function public.cancelar_viaje_usuario(uuid) to authenticated;


create or replace function public.cerrar_viaje_conductor(p_viaje_id uuid, p_conductor_id uuid, p_actor_nombre text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if not exists (
    select 1 from public.conductores
    where id = p_conductor_id and auth_id = auth.uid()
  ) then
    raise exception 'El conductor no corresponde a la sesión actual';
  end if;
  if not exists (
    select 1 from public.evidencias
    where viaje_id = p_viaje_id
      and conductor_id = p_conductor_id
      and km_final is not null
  ) then
    raise exception 'La evidencia final del conductor no está registrada';
  end if;

  update public.viajes
  set status = 'Finalizado'
  where id = p_viaje_id
    and conductor_id = p_conductor_id
    and status = 'Evidencia final pendiente';
  if not found then raise exception 'El viaje no está listo para cierre'; end if;

  insert into public.timeline_viaje (viaje_id, evento, actor, actor_tipo)
  values (p_viaje_id, 'Viaje cerrado por conductor', p_actor_nombre, 'conductor');

  return jsonb_build_object('viaje_id', p_viaje_id, 'status', 'Finalizado');
end;
$function$;

revoke all on function public.cerrar_viaje_conductor(uuid, uuid, text) from public;
grant execute on function public.cerrar_viaje_conductor(uuid, uuid, text) to authenticated;


create or replace function public.guardar_evidencia_conductor(p_viaje_id uuid, p_conductor_id uuid, p_tipo text, p_actor_nombre text, p_km numeric default null::numeric, p_combustible text default null::text, p_danos text default null::text, p_llaves integer default null::integer, p_foto_frente text default null::text, p_foto_piloto text default null::text, p_foto_copiloto text default null::text, p_foto_trasera text default null::text, p_foto_tablero text default null::text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_evidencia_id uuid;
  v_status_actual text;
  v_status_nuevo text;
  v_evento text;
begin
  if p_tipo not in ('inicial', 'final') then raise exception 'Tipo de evidencia inválido'; end if;
  if not exists (
    select 1 from public.conductores
    where id = p_conductor_id and auth_id = auth.uid()
  ) then raise exception 'El conductor no corresponde a la sesión actual'; end if;

  select status into v_status_actual
  from public.viajes
  where id = p_viaje_id and conductor_id = p_conductor_id
  for update;
  if not found then raise exception 'El viaje no está asignado al conductor actual'; end if;

  if p_tipo = 'inicial' then
    if v_status_actual <> 'Recolección en proceso' then raise exception 'El viaje no está listo para evidencia inicial'; end if;
    insert into public.evidencias (
      viaje_id, conductor_id, km_inicial, combustible_inicial, danos_iniciales,
      llaves_recibidas, foto_frente_i, foto_piloto_i, foto_copiloto_i,
      foto_trasera_i, foto_tablero_i, estatus
    ) values (
      p_viaje_id, p_conductor_id, p_km, p_combustible, p_danos, p_llaves,
      p_foto_frente, p_foto_piloto, p_foto_copiloto, p_foto_trasera,
      p_foto_tablero, 'En revisión'
    )
    on conflict (viaje_id, conductor_id) where conductor_id is not null
    do update set
      km_inicial = excluded.km_inicial,
      combustible_inicial = excluded.combustible_inicial,
      danos_iniciales = excluded.danos_iniciales,
      llaves_recibidas = excluded.llaves_recibidas,
      foto_frente_i = excluded.foto_frente_i,
      foto_piloto_i = excluded.foto_piloto_i,
      foto_copiloto_i = excluded.foto_copiloto_i,
      foto_trasera_i = excluded.foto_trasera_i,
      foto_tablero_i = excluded.foto_tablero_i,
      estatus = 'En revisión'
    returning id into v_evidencia_id;
    v_status_nuevo := 'Evidencia inicial pendiente';
    v_evento := 'Evidencia inicial cargada';
  else
    if v_status_actual <> 'Entrega en proceso' then raise exception 'El viaje no está listo para evidencia final'; end if;
    insert into public.evidencias (
      viaje_id, conductor_id, km_final, combustible_final, danos_finales,
      llaves_entregadas, foto_frente_f, foto_piloto_f, foto_copiloto_f,
      foto_trasera_f, foto_tablero_f, estatus
    ) values (
      p_viaje_id, p_conductor_id, p_km, p_combustible, p_danos, p_llaves,
      p_foto_frente, p_foto_piloto, p_foto_copiloto, p_foto_trasera,
      p_foto_tablero, 'Completa'
    )
    on conflict (viaje_id, conductor_id) where conductor_id is not null
    do update set
      km_final = excluded.km_final,
      combustible_final = excluded.combustible_final,
      danos_finales = excluded.danos_finales,
      llaves_entregadas = excluded.llaves_entregadas,
      foto_frente_f = excluded.foto_frente_f,
      foto_piloto_f = excluded.foto_piloto_f,
      foto_copiloto_f = excluded.foto_copiloto_f,
      foto_trasera_f = excluded.foto_trasera_f,
      foto_tablero_f = excluded.foto_tablero_f,
      estatus = 'Completa'
    returning id into v_evidencia_id;
    v_status_nuevo := 'Evidencia final pendiente';
    v_evento := 'Evidencia final cargada';
  end if;

  update public.viajes set status = v_status_nuevo where id = p_viaje_id;
  insert into public.timeline_viaje (viaje_id, evento, actor, actor_tipo)
  values (p_viaje_id, v_evento, p_actor_nombre, 'conductor');

  return jsonb_build_object('evidencia_id', v_evidencia_id, 'viaje_id', p_viaje_id, 'status', v_status_nuevo);
end;
$function$;

revoke all on function public.guardar_evidencia_conductor(uuid, uuid, text, text, numeric, text, text, integer, text, text, text, text, text) from public;
grant execute on function public.guardar_evidencia_conductor(uuid, uuid, text, text, numeric, text, text, integer, text, text, text, text, text) to authenticated;
