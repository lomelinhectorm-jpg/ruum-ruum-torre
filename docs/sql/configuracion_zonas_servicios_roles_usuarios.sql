-- ─────────────────────────────────────────────────────────────────────────
-- RLS faltante: zonas, tipos_servicio, roles, usuarios_internos
-- Usada por: app/components/ConfiguracionView.tsx (TabZonas, TabServicios,
-- TabRoles, TabUsuariosInternos)
--
-- Contexto: a diferencia de configuracion / plantillas_notificacion /
-- metodos_pago / bitacora / estados_viaje (que ya tienen su propio script
-- de RLS en docs/sql/), no se encontró en el repo ningún script que
-- habilite RLS para estas 4 tablas. Es posible que ya estén protegidas
-- manualmente desde el dashboard de Supabase; si es así, este script no
-- hace daño (usa "if not exists" / "drop policy if exists" antes de crear).
-- Si NO están protegidas, cualquier usuario autenticado (no solo admins)
-- podría leer o escribir directamente estas tablas vía la REST API de
-- Supabase, sin pasar por la UI de Torre.
--
-- Verifica el resultado real corriendo:
--   node scripts/rls-readonly.mjs
-- (zonas, tipos_servicio, roles y usuarios_internos ya están en sus listas
-- businessTables / adminOnlyTables).
--
-- Requiere que public.is_admin() ya exista (ver docs/sql/reparar_is_admin.sql).
-- Es idempotente y no modifica datos.
-- ─────────────────────────────────────────────────────────────────────────

-- Zonas de operación
alter table public.zonas enable row level security;

drop policy if exists "Admins can read zonas" on public.zonas;
create policy "Admins can read zonas"
on public.zonas
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert zonas" on public.zonas;
create policy "Admins can insert zonas"
on public.zonas
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update zonas" on public.zonas;
create policy "Admins can update zonas"
on public.zonas
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete zonas" on public.zonas;
create policy "Admins can delete zonas"
on public.zonas
for delete
to authenticated
using (public.is_admin());

-- Tipos de servicio
alter table public.tipos_servicio enable row level security;

drop policy if exists "Admins can read tipos_servicio" on public.tipos_servicio;
create policy "Admins can read tipos_servicio"
on public.tipos_servicio
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert tipos_servicio" on public.tipos_servicio;
create policy "Admins can insert tipos_servicio"
on public.tipos_servicio
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update tipos_servicio" on public.tipos_servicio;
create policy "Admins can update tipos_servicio"
on public.tipos_servicio
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete tipos_servicio" on public.tipos_servicio;
create policy "Admins can delete tipos_servicio"
on public.tipos_servicio
for delete
to authenticated
using (public.is_admin());

-- Roles
-- Nota: is_admin() lee de roles internamente (security definer, así que no
-- entra en recursión con la RLS que se agrega aquí abajo).
alter table public.roles enable row level security;

drop policy if exists "Admins can read roles" on public.roles;
create policy "Admins can read roles"
on public.roles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert roles" on public.roles;
create policy "Admins can insert roles"
on public.roles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update roles" on public.roles;
create policy "Admins can update roles"
on public.roles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Sin policy de "delete" a propósito: eliminar un rol en uso rompería la
-- referencia rol_id en usuarios_internos. Si se necesita borrar roles,
-- hazlo manualmente verificando primero que no tenga usuarios asignados.

-- Usuarios internos
-- Nota: is_admin() también lee de usuarios_internos internamente
-- (security definer), por lo que tampoco hay recursión aquí.
alter table public.usuarios_internos enable row level security;

drop policy if exists "Admins can read usuarios_internos" on public.usuarios_internos;
create policy "Admins can read usuarios_internos"
on public.usuarios_internos
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert usuarios_internos" on public.usuarios_internos;
create policy "Admins can insert usuarios_internos"
on public.usuarios_internos
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update usuarios_internos" on public.usuarios_internos;
create policy "Admins can update usuarios_internos"
on public.usuarios_internos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete usuarios_internos" on public.usuarios_internos;
create policy "Admins can delete usuarios_internos"
on public.usuarios_internos
for delete
to authenticated
using (public.is_admin());
