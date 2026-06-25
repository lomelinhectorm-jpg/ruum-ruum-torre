-- Flujos conductor P0/P1
-- Aplicar en Supabase antes de activar las pantallas nuevas en produccion.

create table if not exists timeline_operativo (
  id uuid primary key default gen_random_uuid(),
  entidad_tipo text not null,
  entidad_id uuid not null,
  viaje_id uuid null,
  conductor_id uuid null,
  actor_id uuid null,
  actor_nombre text null,
  actor_tipo text not null,
  evento text not null,
  estado_anterior text null,
  estado_nuevo text null,
  metadata jsonb not null default '{}'::jsonb,
  latitud numeric null,
  longitud numeric null,
  precision_gps numeric null,
  created_at timestamptz not null default now()
);

alter table conductores
  add column if not exists certificacion_estado text not null default 'Pendiente de documentos',
  add column if not exists certificacion_motivo text null,
  add column if not exists certificacion_actualizada_at timestamptz null,
  add column if not exists fecha_certificacion timestamptz null,
  add column if not exists suspendido_hasta timestamptz null,
  add column if not exists motivo_suspension text null,
  add column if not exists metadata_registro jsonb not null default '{}'::jsonb;

alter table documentos
  add column if not exists slot text null,
  add column if not exists motivo_rechazo text null,
  add column if not exists version integer not null default 1,
  add column if not exists reemplaza_documento_id uuid null references documentos(id),
  add column if not exists revisado_por uuid null,
  add column if not exists revisado_at timestamptz null;

create unique index if not exists documentos_conductor_slot_version_uq
  on documentos(entidad_id, slot, version)
  where entidad_tipo = 'Conductor' and slot is not null;

create table if not exists ofertas_viaje (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references viajes(id),
  conductor_id uuid not null references conductores(id),
  status text not null default 'Enviada',
  pago_estimado numeric null,
  distancia_estimada_km numeric null,
  tiempo_estimado_min integer null,
  expira_at timestamptz not null,
  motivo_rechazo text null,
  accepted_at timestamptz null,
  rejected_at timestamptz null,
  created_at timestamptz not null default now()
);

create unique index if not exists ofertas_viaje_unica_enviada_idx
  on ofertas_viaje(viaje_id, conductor_id)
  where status = 'Enviada';

alter table incidencias
  add column if not exists bloquea_viaje boolean not null default false,
  add column if not exists requiere_respuesta_operaciones boolean not null default false,
  add column if not exists resuelta_at timestamptz null,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists latitud numeric null,
  add column if not exists longitud numeric null;

create table if not exists evidencia_fotos (
  id uuid primary key default gen_random_uuid(),
  evidencia_id uuid null references evidencias(id),
  viaje_id uuid not null references viajes(id),
  conductor_id uuid not null references conductores(id),
  fase text not null,
  tipo_foto text not null,
  archivo_path text not null,
  latitud numeric null,
  longitud numeric null,
  precision_gps numeric null,
  tomada_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table gastos
  add column if not exists comprobante_path text null,
  add column if not exists tipo_gasto text null,
  add column if not exists motivo_rechazo text null,
  add column if not exists revisado_por uuid null,
  add column if not exists revisado_at timestamptz null,
  add column if not exists incluido_en_liquidacion_id uuid null;

create table if not exists liquidaciones_conductor (
  id uuid primary key default gen_random_uuid(),
  conductor_id uuid not null references conductores(id),
  periodo_inicio date not null,
  periodo_fin date not null,
  subtotal_viajes numeric not null default 0,
  total_gastos_aprobados numeric not null default 0,
  bonos numeric not null default 0,
  penalizaciones numeric not null default 0,
  retenciones numeric not null default 0,
  total_a_depositar numeric not null default 0,
  estatus text not null default 'Por calcular',
  motivo text null,
  programado_at timestamptz null,
  pagado_at timestamptz null,
  comprobante_path text null,
  created_at timestamptz not null default now()
);

create table if not exists liquidacion_detalles (
  id uuid primary key default gen_random_uuid(),
  liquidacion_id uuid not null references liquidaciones_conductor(id),
  tipo_linea text not null,
  viaje_id uuid null references viajes(id),
  gasto_id uuid null references gastos(id),
  concepto text not null,
  monto numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function evaluar_certificacion_conductor(p_conductor_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  faltantes int;
  rechazados int;
  vencidos int;
  nuevo_estado text;
begin
  select count(*) into faltantes
  from unnest(array['licencia-frente','licencia-reverso','ine-frente','comprobante-domicilio']) req(slot)
  where not exists (
    select 1 from documentos d
    where d.entidad_tipo = 'Conductor'
      and d.entidad_id = p_conductor_id
      and d.slot = req.slot
      and d.estatus in ('En revisión','Aprobado','Vigente')
  );

  select count(*) into rechazados
  from documentos
  where entidad_tipo = 'Conductor'
    and entidad_id = p_conductor_id
    and estatus in ('Rechazado','Corrección requerida');

  select count(*) into vencidos
  from documentos
  where entidad_tipo = 'Conductor'
    and entidad_id = p_conductor_id
    and fecha_vencimiento is not null
    and fecha_vencimiento < current_date;

  nuevo_estado := case
    when vencidos > 0 then 'Suspendido'
    when rechazados > 0 then 'Correccion requerida'
    when faltantes > 0 then 'Pendiente de documentos'
    when exists (
      select 1 from documentos
      where entidad_tipo = 'Conductor'
        and entidad_id = p_conductor_id
        and estatus = 'En revisión'
    ) then 'En revision'
    else 'Certificado'
  end;

  update conductores
  set certificacion_estado = nuevo_estado,
      certificacion = nuevo_estado,
      certificacion_actualizada_at = now(),
      fecha_certificacion = case when nuevo_estado = 'Certificado' then coalesce(fecha_certificacion, now()) else fecha_certificacion end,
      disponibilidad = case when nuevo_estado = 'Certificado' then disponibilidad else 'No disponible' end
  where id = p_conductor_id;

  insert into timeline_operativo(entidad_tipo, entidad_id, conductor_id, actor_tipo, evento, estado_nuevo)
  values ('conductor', p_conductor_id, p_conductor_id, 'sistema', 'Certificacion evaluada', nuevo_estado);

  return nuevo_estado;
end;
$$;

create or replace function aceptar_viaje_conductor(
  p_viaje_id uuid,
  p_conductor_id uuid,
  p_actor_nombre text,
  p_oferta_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_status text;
  v_conductor uuid;
  v_oferta ofertas_viaje%rowtype;
begin
  if not exists (
    select 1 from conductores
    where id = p_conductor_id
      and coalesce(certificacion_estado, certificacion) in ('Certificado','Activo')
      and disponibilidad in ('Disponible','No disponible')
  ) then
    raise exception 'Conductor no certificado o no disponible.';
  end if;

  if p_oferta_id is not null then
    select * into v_oferta from ofertas_viaje where id = p_oferta_id for update;
    if not found or v_oferta.conductor_id <> p_conductor_id or v_oferta.viaje_id <> p_viaje_id then
      raise exception 'Oferta invalida.';
    end if;
    if v_oferta.status <> 'Enviada' or v_oferta.expira_at <= now() then
      raise exception 'La oferta ya no esta disponible.';
    end if;
  end if;

  select status, conductor_id into v_status, v_conductor
  from viajes where id = p_viaje_id for update;
  if not found then raise exception 'Viaje no encontrado.'; end if;
  if v_conductor is not null and v_conductor <> p_conductor_id then
    raise exception 'El viaje ya fue tomado por otro conductor.';
  end if;

  update viajes
  set conductor_id = p_conductor_id,
      status = 'Aceptado',
      updated_at = now()
  where id = p_viaje_id;

  if p_oferta_id is not null then
    update ofertas_viaje
    set status = 'Aceptada', accepted_at = now()
    where id = p_oferta_id;
    update ofertas_viaje
    set status = 'Cancelada'
    where viaje_id = p_viaje_id and id <> p_oferta_id and status = 'Enviada';
  end if;

  update conductores set disponibilidad = 'Ocupado' where id = p_conductor_id;

  insert into timeline_operativo(entidad_tipo, entidad_id, viaje_id, conductor_id, actor_id, actor_nombre, actor_tipo, evento, estado_anterior, estado_nuevo)
  values ('viaje', p_viaje_id, p_viaje_id, p_conductor_id, p_conductor_id, p_actor_nombre, 'conductor', 'Oferta aceptada', v_status, 'Aceptado');

  insert into timeline_viaje(viaje_id, evento, actor, actor_tipo)
  values (p_viaje_id, 'Oferta aceptada por conductor', p_actor_nombre, 'conductor');

  return jsonb_build_object('ok', true, 'viaje_id', p_viaje_id);
end;
$$;

create or replace function rechazar_oferta_viaje(
  p_oferta_id uuid default null,
  p_viaje_id uuid default null,
  p_motivo text default null,
  p_actor_nombre text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_oferta ofertas_viaje%rowtype;
  v_viaje_id uuid;
  v_conductor_id uuid;
begin
  if p_oferta_id is not null then
    select * into v_oferta from ofertas_viaje where id = p_oferta_id for update;
  else
    select * into v_oferta
    from ofertas_viaje
    where viaje_id = p_viaje_id and status = 'Enviada'
    order by created_at desc
    limit 1
    for update;
  end if;

  if found then
    update ofertas_viaje
    set status = 'Rechazada', motivo_rechazo = p_motivo, rejected_at = now()
    where id = v_oferta.id;
    v_viaje_id := v_oferta.viaje_id;
    v_conductor_id := v_oferta.conductor_id;
  else
    v_viaje_id := p_viaje_id;
    select conductor_id into v_conductor_id from viajes where id = p_viaje_id;
  end if;

  insert into timeline_operativo(entidad_tipo, entidad_id, viaje_id, conductor_id, actor_id, actor_nombre, actor_tipo, evento, estado_nuevo, metadata)
  values ('oferta', coalesce(p_oferta_id, v_viaje_id), v_viaje_id, v_conductor_id, v_conductor_id, p_actor_nombre, 'conductor', 'Oferta rechazada', 'Rechazada', jsonb_build_object('motivo', p_motivo));

  return jsonb_build_object('ok', true, 'viaje_id', v_viaje_id);
end;
$$;

create or replace function expirar_ofertas_vencidas()
returns integer
language plpgsql
security definer
as $$
declare
  afectadas integer;
begin
  update ofertas_viaje
  set status = 'Expirada'
  where status = 'Enviada' and expira_at <= now();
  get diagnostics afectadas = row_count;
  return afectadas;
end;
$$;
