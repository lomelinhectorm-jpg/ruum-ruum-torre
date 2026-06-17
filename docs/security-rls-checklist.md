# Supabase RLS checklist

Use this checklist before exposing the admin panel outside the internal team.

## Required baseline

- Enable RLS on every table used by the admin app.
- Confirm anonymous users cannot read or write business tables.
- Confirm authenticated non-admin users cannot access admin-only data.
- Store internal admin membership in `usuarios_internos` or equivalent.
- Restrict writes by role, not only by the presence of a session.
- Keep service-role keys out of the browser and out of `NEXT_PUBLIC_*` variables.

## Tables referenced by the app

- `viajes`
- `conductores`
- `usuarios`
- `empresas`
- `vehiculos`
- `evidencias`
- `incidencias`
- `documentos`
- `pagos_usuarios`
- `pagos_conductores`
- `gastos`
- `tarifas_base`
- `recargos`
- `tarifas_conductor`
- `tarifas_empresariales`
- `rutas_frecuentes`
- `zonas`
- `tipos_servicio`
- `tipos_vehiculo`
- `plantillas_notificacion`
- `metodos_pago`
- `configuracion`
- `timeline_viaje`
- `notas_internas`
- `usuarios_internos`
- `roles`
- `estados_viaje`
- `bitacora`

## Suggested helper

Adjust column names to match the production schema.

```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios_internos ui
    where ui.auth_id = auth.uid()
      and ui.activo = true
      and ui.rol in ('Super Administrador', 'Coordinador Operativo', 'Analista Financiero', 'Validador Documental')
  );
$$;
```

## Policy pattern

Use narrower policies for finance, configuration, and user management where possible.

```sql
alter table public.viajes enable row level security;

create policy "Admins can read viajes"
on public.viajes
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert viajes"
on public.viajes
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update viajes"
on public.viajes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
```

## Smoke tests

- Logged-out browser redirects `/` to `/login`.
- Non-admin authenticated user cannot read `viajes`.
- Admin user can read dashboard KPIs.
- Admin user can create a viaje.
- Admin user can update document/payment status.
- A direct Supabase request using the anon key and no session returns no business data.
