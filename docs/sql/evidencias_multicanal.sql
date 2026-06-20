-- Evidencias visibles en Conductor, Admin y Usuario.
-- Guarda paths privados del bucket; las apps generan signed URLs al leer.

create or replace function public.guardar_evidencia_conductor(
  p_viaje_id uuid,
  p_conductor_id uuid,
  p_tipo text,
  p_actor_nombre text,
  p_km numeric default null,
  p_combustible text default null,
  p_danos text default null,
  p_llaves integer default null,
  p_foto_frente text default null,
  p_foto_piloto text default null,
  p_foto_copiloto text default null,
  p_foto_trasera text default null,
  p_foto_tablero text default null
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
$$;

revoke all on function public.guardar_evidencia_conductor(
  uuid, uuid, text, text, numeric, text, text, integer, text, text, text, text, text
) from public;
grant execute on function public.guardar_evidencia_conductor(
  uuid, uuid, text, text, numeric, text, text, integer, text, text, text, text, text
) to authenticated;

drop policy if exists "Evidencias viaje lectura multicanal" on storage.objects;
create policy "Evidencias viaje lectura multicanal"
on storage.objects for select to authenticated
using (
  bucket_id = 'evidencias-viaje'
  and (
    public.is_admin()
    or exists (
      select 1 from public.viajes v
      where v.id::text = (storage.foldername(name))[1]
        and v.conductor_id = public.mi_conductor_id()
    )
    or exists (
      select 1 from public.viajes v
      where v.id::text = (storage.foldername(name))[1]
        and v.usuario_id = public.mi_usuario_id()
    )
  )
);

drop policy if exists "Conductor carga evidencia de su viaje" on storage.objects;
create policy "Conductor carga evidencia de su viaje"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'evidencias-viaje'
  and (storage.foldername(name))[2] = public.mi_conductor_id()::text
  and exists (
    select 1 from public.viajes v
    where v.id::text = (storage.foldername(name))[1]
      and v.conductor_id = public.mi_conductor_id()
  )
);

drop policy if exists "Conductor reemplaza evidencia de su viaje" on storage.objects;
create policy "Conductor reemplaza evidencia de su viaje"
on storage.objects for update to authenticated
using (
  bucket_id = 'evidencias-viaje'
  and (storage.foldername(name))[2] = public.mi_conductor_id()::text
)
with check (
  bucket_id = 'evidencias-viaje'
  and (storage.foldername(name))[2] = public.mi_conductor_id()::text
);
