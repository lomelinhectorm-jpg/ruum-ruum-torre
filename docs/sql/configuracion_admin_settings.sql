-- ─────────────────────────────────────────────────────────────────────────
-- Configuración admin: escrituras bloqueadas por RLS
-- Usada por: app/components/ConfiguracionView.tsx
--
-- Cubre:
-- - Plantillas de notificación: public.plantillas_notificacion
-- - Métodos de pago: public.metodos_pago
-- - Datos fiscales / ciclo de pago / tipos de vehículo: public.configuracion
-- - Bitácora y backup manual: public.bitacora
--
-- Requiere que public.is_admin() exista.
-- Ver docs/security-rls-checklist.md.
-- ─────────────────────────────────────────────────────────────────────────

-- Configuración clave/valor
create unique index if not exists configuracion_clave_uidx
on public.configuracion (clave);

insert into public.configuracion (clave, valor)
values
  ('tipos_vehiculo', '[]'),
  ('datos_fiscales', '{}'),
  ('ciclo_pago', '{}')
on conflict (clave) do nothing;

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

-- Plantillas de notificación
alter table public.plantillas_notificacion enable row level security;

drop policy if exists "Admins can read plantillas_notificacion" on public.plantillas_notificacion;
create policy "Admins can read plantillas_notificacion"
on public.plantillas_notificacion
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert plantillas_notificacion" on public.plantillas_notificacion;
create policy "Admins can insert plantillas_notificacion"
on public.plantillas_notificacion
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update plantillas_notificacion" on public.plantillas_notificacion;
create policy "Admins can update plantillas_notificacion"
on public.plantillas_notificacion
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Métodos de pago
alter table public.metodos_pago enable row level security;

drop policy if exists "Admins can read metodos_pago" on public.metodos_pago;
create policy "Admins can read metodos_pago"
on public.metodos_pago
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert metodos_pago" on public.metodos_pago;
create policy "Admins can insert metodos_pago"
on public.metodos_pago
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update metodos_pago" on public.metodos_pago;
create policy "Admins can update metodos_pago"
on public.metodos_pago
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete metodos_pago" on public.metodos_pago;
create policy "Admins can delete metodos_pago"
on public.metodos_pago
for delete
to authenticated
using (public.is_admin());

-- Bitácora
alter table public.bitacora enable row level security;

drop policy if exists "Admins can read bitacora" on public.bitacora;
create policy "Admins can read bitacora"
on public.bitacora
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert bitacora" on public.bitacora;
create policy "Admins can insert bitacora"
on public.bitacora
for insert
to authenticated
with check (public.is_admin());
