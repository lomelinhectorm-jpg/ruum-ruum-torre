-- Flujo operativo de viajes:
-- 1) trazabilidad de reasignaciones en curso;
-- 2) evidencia separada por conductor;
-- 3) aceptación/cierre atómicos y sincronización de disponibilidad.

create table if not exists public.reasignaciones (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references public.viajes(id) on delete restrict,
  conductor_anterior uuid not null references public.conductores(id) on delete restrict,
  conductor_nuevo uuid not null references public.conductores(id) on delete restrict,
  motivo text not null check (length(trim(motivo)) > 0),
  created_at timestamptz not null default now(),
  check (conductor_anterior <> conductor_nuevo)
);

create index if not exists reasignaciones_viaje_created_idx
  on public.reasignaciones (viaje_id, created_at desc);

alter table public.reasignaciones enable row level security;

drop policy if exists "Admins can read reasignaciones" on public.reasignaciones;
create policy "Admins can read reasignaciones"
on public.reasignaciones for select to authenticated
using (public.is_admin());

-- Una reasignación puede producir una segunda fila de evidencia. Se elimina
-- cualquier unicidad histórica basada sólo en viaje_id y se reemplaza por
-- viaje + conductor. Las filas ya capturadas no se modifican.
do $$
declare
  r record;
  v_unique_solo_viaje boolean := false;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.evidencias'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ~ '^UNIQUE \(viaje_id\)$'
  loop
    v_unique_solo_viaje := true;
    execute format('alter table public.evidencias drop constraint %I', r.conname);
  end loop;

  for r in
    select indexrelid::regclass::text as index_name
    from pg_index i
    join pg_attribute a
      on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = 'public.evidencias'::regclass
      and i.indisunique
      and i.indnatts = 1
      and a.attname = 'viaje_id'
  loop
    v_unique_solo_viaje := true;
    execute format('drop index if exists %s', r.index_name);
  end loop;

  if v_unique_solo_viaje then
    raise notice 'RT-11 confirmado: existía UNIQUE(viaje_id); fue retirado';
  else
    raise notice 'RT-11: no se encontró UNIQUE(viaje_id); se normalizará el índice destino';
  end if;
end $$;

create unique index if not exists evidencias_viaje_conductor_idx
  on public.evidencias (viaje_id, conductor_id)
  where conductor_id is not null;

alter table public.viajes
  add column if not exists cancelacion_penalizacion numeric(12,2) not null default 0,
  add column if not exists cancelado_por text,
  add column if not exists cancelado_at timestamptz;

create or replace function public.guardar_evidencia_conductor(
  p_viaje_id uuid,
  p_conductor_id uuid,
  p_tipo text,
  p_actor_nombre text,
  p_km numeric default null,
  p_combustible text default null,
  p_danos text default null,
  p_llaves integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evidencia_id uuid;
  v_status_actual text;
  v_status_nuevo text;
  v_evento text;
begin
  if p_tipo not in ('inicial', 'final') then
    raise exception 'Tipo de evidencia inválido';
  end if;
  if not exists (
    select 1 from public.conductores
    where id = p_conductor_id and auth_id = auth.uid()
  ) then
    raise exception 'El conductor no corresponde a la sesión actual';
  end if;

  select status into v_status_actual
  from public.viajes
  where id = p_viaje_id and conductor_id = p_conductor_id
  for update;
  if not found then raise exception 'El viaje no está asignado al conductor actual'; end if;

  if p_tipo = 'inicial' then
    if v_status_actual <> 'Recolección en proceso' then
      raise exception 'El viaje no está listo para evidencia inicial';
    end if;
    insert into public.evidencias (
      viaje_id, conductor_id, km_inicial, combustible_inicial,
      danos_iniciales, llaves_recibidas, estatus
    ) values (
      p_viaje_id, p_conductor_id, p_km, p_combustible,
      p_danos, p_llaves, 'En revisión'
    )
    on conflict (viaje_id, conductor_id) where conductor_id is not null
    do update set
      km_inicial = excluded.km_inicial,
      combustible_inicial = excluded.combustible_inicial,
      danos_iniciales = excluded.danos_iniciales,
      llaves_recibidas = excluded.llaves_recibidas,
      estatus = 'En revisión'
    returning id into v_evidencia_id;
    v_status_nuevo := 'Evidencia inicial pendiente';
    v_evento := 'Evidencia inicial cargada';
  else
    if v_status_actual <> 'Entrega en proceso' then
      raise exception 'El viaje no está listo para evidencia final';
    end if;
    insert into public.evidencias (
      viaje_id, conductor_id, km_final, combustible_final,
      danos_finales, llaves_entregadas, estatus
    ) values (
      p_viaje_id, p_conductor_id, p_km, p_combustible,
      p_danos, p_llaves, 'Completa'
    )
    on conflict (viaje_id, conductor_id) where conductor_id is not null
    do update set
      km_final = excluded.km_final,
      combustible_final = excluded.combustible_final,
      danos_finales = excluded.danos_finales,
      llaves_entregadas = excluded.llaves_entregadas,
      estatus = 'Completa'
    returning id into v_evidencia_id;
    v_status_nuevo := 'Evidencia final pendiente';
    v_evento := 'Evidencia final cargada';
  end if;

  update public.viajes set status = v_status_nuevo where id = p_viaje_id;
  insert into public.timeline_viaje (viaje_id, evento, actor, actor_tipo)
  values (p_viaje_id, v_evento, p_actor_nombre, 'conductor');

  return jsonb_build_object(
    'evidencia_id', v_evidencia_id,
    'viaje_id', p_viaje_id,
    'status', v_status_nuevo
  );
end;
$$;

drop function if exists public.cancelar_viaje_usuario(uuid, text);

create or replace function public.cancelar_viaje_usuario(
  p_viaje_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create or replace function public.validar_transicion_estado_viaje()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_permitida boolean := false;
  v_estados_validos constant text[] := array[
    'Solicitud recibida', 'Pendiente de asignación', 'Conductor asignado',
    'Conductor en camino', 'Recolección en proceso',
    'Evidencia inicial pendiente', 'Traslado en curso',
    'Entrega en proceso', 'Evidencia final pendiente',
    'Finalizado', 'Cancelado', 'En revisión por incidencia'
  ];
begin
  if new.status is null or not (new.status = any(v_estados_validos)) then
    raise exception using
      errcode = '23514',
      message = format('Estatus de viaje no reconocido: %s', coalesce(new.status, 'NULL'));
  end if;

  -- Actualizaciones que conservan el estado (notas, reasignaciones, etc.).
  if new.status = old.status then return new; end if;

  -- Compatibilidad de una sola vía para retirar el estado legado.
  if old.status = 'Pendiente de revisión' and new.status = 'Pendiente de asignación' then
    return new;
  end if;

  -- Los terminales no pueden reabrirse.
  if old.status in ('Finalizado', 'Cancelado') then
    v_permitida := false;

  -- El admin puede cerrar o cancelar cualquier viaje no terminal.
  elsif new.status in ('Finalizado', 'Cancelado') then
    v_permitida := true;

  -- Una incidencia puede interrumpir cualquier etapa no terminal. Desde
  -- revisión sólo se permite resolver mediante cierre o cancelación.
  elsif new.status = 'En revisión por incidencia' then
    v_permitida := old.status <> 'En revisión por incidencia';

  else
    v_permitida := case old.status
      when 'Solicitud recibida' then
        new.status in ('Pendiente de asignación', 'Conductor asignado')
      when 'Pendiente de asignación' then
        new.status = 'Conductor asignado'
      when 'Conductor asignado' then
        new.status in ('Conductor en camino', 'Pendiente de asignación')
      when 'Conductor en camino' then
        new.status = 'Recolección en proceso'
      when 'Recolección en proceso' then
        new.status = 'Evidencia inicial pendiente'
      when 'Evidencia inicial pendiente' then
        new.status = 'Traslado en curso'
      when 'Traslado en curso' then
        new.status = 'Entrega en proceso'
      when 'Entrega en proceso' then
        new.status = 'Evidencia final pendiente'
      when 'Evidencia final pendiente' then
        new.status = 'Finalizado'
      else false
    end;
  end if;

  if not v_permitida then
    raise exception using
      errcode = '23514',
      message = format('Transición de viaje no permitida: %s → %s', old.status, new.status),
      hint = 'Usa la siguiente etapa operativa o una transición terminal autorizada.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_transicion_estado_viaje on public.viajes;
create trigger trg_validar_transicion_estado_viaje
before update of status on public.viajes
for each row execute function public.validar_transicion_estado_viaje();

create or replace function public.sync_disponibilidad_por_viaje()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- "Conductor asignado" no aparece entre los estados que activan al
  -- conductor: la disponibilidad cambia únicamente cuando acepta y el viaje
  -- pasa a "Conductor en camino".
  if old.conductor_id is distinct from new.conductor_id and old.conductor_id is not null then
    if not exists (
      select 1 from public.viajes v
      where v.conductor_id = old.conductor_id
        and v.id <> new.id
        and v.status not in ('Finalizado', 'Cancelado')
    ) then
      update public.conductores set disponibilidad = 'Disponible'
      where id = old.conductor_id
        and disponibilidad = 'En viaje';
    end if;
  end if;

  if new.conductor_id is not null then
    if new.status in ('Finalizado', 'Cancelado') then
      if not exists (
        select 1 from public.viajes v
        where v.conductor_id = new.conductor_id
          and v.id <> new.id
          and v.status not in ('Finalizado', 'Cancelado')
      ) then
        update public.conductores set disponibilidad = 'Disponible'
        where id = new.conductor_id
          and disponibilidad = 'En viaje';
      end if;
    elsif new.status in (
      'Conductor en camino', 'Recolección en proceso',
      'Evidencia inicial pendiente', 'Traslado en curso',
      'Entrega en proceso', 'Evidencia final pendiente'
    ) then
      update public.conductores set disponibilidad = 'En viaje'
      where id = new.conductor_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_disponibilidad_por_viaje on public.viajes;
create trigger trg_sync_disponibilidad_por_viaje
after update of status, conductor_id on public.viajes
for each row execute function public.sync_disponibilidad_por_viaje();

create or replace function public.asignar_conductor_admin(
  p_viaje_id uuid,
  p_conductor_nuevo uuid,
  p_motivo text default null,
  p_actor_nombre text default 'Admin'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create or replace function public.aceptar_viaje_conductor(
  p_viaje_id uuid,
  p_conductor_id uuid,
  p_actor_nombre text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create or replace function public.cerrar_viaje_conductor(
  p_viaje_id uuid,
  p_conductor_id uuid,
  p_actor_nombre text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke all on function public.asignar_conductor_admin(uuid, uuid, text, text) from public;
revoke all on function public.aceptar_viaje_conductor(uuid, uuid, text) from public;
revoke all on function public.cerrar_viaje_conductor(uuid, uuid, text) from public;
revoke all on function public.guardar_evidencia_conductor(uuid, uuid, text, text, numeric, text, text, integer) from public;
revoke all on function public.cancelar_viaje_usuario(uuid) from public;
grant execute on function public.asignar_conductor_admin(uuid, uuid, text, text) to authenticated;
grant execute on function public.aceptar_viaje_conductor(uuid, uuid, text) to authenticated;
grant execute on function public.cerrar_viaje_conductor(uuid, uuid, text) to authenticated;
grant execute on function public.guardar_evidencia_conductor(uuid, uuid, text, text, numeric, text, text, integer) to authenticated;
grant execute on function public.cancelar_viaje_usuario(uuid) to authenticated;
