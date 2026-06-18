-- ─────────────────────────────────────────────────────────────────────────
-- Configuración: tipos_vehiculo
-- Usada por: app/components/ConfiguracionView.tsx (TabVehiculos)
--
-- El frontend guarda este catálogo en public.configuracion:
--   clave = 'tipos_vehiculo'
--   valor = JSON serializado con los tipos configurados.
--
-- Si la fila no existe, el primer guardado requiere permiso INSERT. En
-- producción el error observado fue:
--   new row violates row-level security policy for table "configuracion"
-- ─────────────────────────────────────────────────────────────────────────

create unique index if not exists configuracion_clave_uidx
on public.configuracion (clave);

insert into public.configuracion (clave, valor)
values ('tipos_vehiculo', '[]')
on conflict (clave) do nothing;

-- Requiere que la función public.is_admin() exista.
-- Ver docs/security-rls-checklist.md.
alter table public.configuracion enable row level security;

drop policy if exists "Admins can read configuracion" on public.configuracion;
create policy "Admins can read configuracion"
on public.configuracion
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert configuracion" on public.configuracion;
create policy "Admins can insert configuracion"
on public.configuracion
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update configuracion" on public.configuracion;
create policy "Admins can update configuracion"
on public.configuracion
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
