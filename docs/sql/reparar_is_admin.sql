-- Corrige la autorizacion del panel administrativo para el esquema actual:
-- usuarios_internos.rol_id -> roles.id.
-- Es idempotente y no modifica registros de negocio.

begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.usuarios_internos ui
    inner join public.roles r on r.id = ui.rol_id
    where ui.auth_id = (select auth.uid())
      and ui.activo is true
      and r.activo is true
      and lower(btrim(r.nombre)) in (
        'super administrador',
        'coordinador operativo',
        'analista financiero',
        'validador documental'
      )
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

commit;

-- Verificacion del vinculo del administrador principal.
-- La fila debe mostrar auth_id, usuario_activo=true y rol_activo=true.
select
  ui.email,
  ui.auth_id,
  ui.activo as usuario_activo,
  r.nombre as rol,
  r.activo as rol_activo
from public.usuarios_internos ui
join public.roles r on r.id = ui.rol_id
where lower(ui.email) = lower('ruum.ruum.mx@gmail.com');
