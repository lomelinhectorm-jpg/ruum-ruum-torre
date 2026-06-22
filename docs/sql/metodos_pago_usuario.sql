-- ─────────────────────────────────────────────────────────────────────────
-- Tabla: metodos_pago_usuario
-- Usada por: usuario-ruum → components/views/ViewCuenta.tsx (PagosSeccion)
--
-- Qué resuelve:
-- `metodos_pago` (ver docs/sql/configuracion_admin_settings.sql) es el
-- CATÁLOGO global que administra Torre de Control en Configuración →
-- Métodos de pago (qué formas de pago existen y cuáles están activas).
-- `metodos_pago_usuario` es la elección/registro de CADA usuario sobre
-- ese catálogo (ej. "Tarjeta de crédito · terminación 4321 · alias
-- Tarjeta principal"). Un usuario puede tener varios registros, incluso
-- repitiendo el mismo método del catálogo (dos tarjetas, por ejemplo).
--
-- Requiere que ya existan (ver docs/security-rls-checklist.md y
-- docs/sql/evidencias_multicanal.sql):
--   - public.is_admin()
--   - public.mi_usuario_id()
-- Ambas se redefinen aquí con `create or replace` por seguridad/idempotencia,
-- pero si ya existen con esta misma forma no hay ningún cambio funcional.
-- ─────────────────────────────────────────────────────────────────────────

-- ─── Helpers (idempotentes) ────────────────────────────────────────────────
create or replace function public.mi_usuario_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.usuarios where auth_id = auth.uid();
$$;

revoke all on function public.mi_usuario_id() from public;
grant execute on function public.mi_usuario_id() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Tabla ──────────────────────────────────────────────────────────────
create table if not exists public.metodos_pago_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  metodo_pago_id uuid not null references public.metodos_pago(id) on delete restrict,
  alias text,
  titular text,
  ultimos_digitos text,
  predeterminado boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint metodos_pago_usuario_ultimos_digitos_chk
    check (ultimos_digitos is null or ultimos_digitos ~ '^[0-9]{4}$')
);

create index if not exists metodos_pago_usuario_usuario_id_idx
on public.metodos_pago_usuario (usuario_id);

-- Garantiza a nivel de base de datos que un usuario tenga, a lo más, un
-- método marcado como predeterminado (índice único parcial).
create unique index if not exists metodos_pago_usuario_predeterminado_uidx
on public.metodos_pago_usuario (usuario_id)
where predeterminado;

drop trigger if exists trg_metodos_pago_usuario_updated_at on public.metodos_pago_usuario;
create trigger trg_metodos_pago_usuario_updated_at
before update on public.metodos_pago_usuario
for each row execute function public.set_updated_at();

-- ─── RPC: cambiar el método predeterminado de forma atómica ──────────────
-- El índice único parcial de arriba impide tener dos filas con
-- `predeterminado = true` para el mismo usuario, así que el cambio de
-- "cuál es el predeterminado" no puede hacerse con dos UPDATE sueltos desde
-- el cliente (el segundo chocaría con el índice si el primero no se aplicó
-- todavía). Esta función lo hace en una sola transacción y de paso valida
-- que el registro sea del usuario en sesión.
create or replace function public.establecer_metodo_pago_predeterminado(p_metodo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid := public.mi_usuario_id();
begin
  if v_usuario_id is null then
    raise exception 'No hay un usuario asociado a la sesión actual';
  end if;

  if not exists (
    select 1 from public.metodos_pago_usuario
    where id = p_metodo_id and usuario_id = v_usuario_id
  ) then
    raise exception 'El método de pago no pertenece al usuario actual';
  end if;

  update public.metodos_pago_usuario
  set predeterminado = false
  where usuario_id = v_usuario_id and predeterminado = true and id <> p_metodo_id;

  update public.metodos_pago_usuario
  set predeterminado = true
  where id = p_metodo_id;
end;
$$;

revoke all on function public.establecer_metodo_pago_predeterminado(uuid) from public;
grant execute on function public.establecer_metodo_pago_predeterminado(uuid) to authenticated;

-- ─── RLS: metodos_pago_usuario ─────────────────────────────────────────────
-- Cada usuario lee y modifica únicamente sus propios registros.
alter table public.metodos_pago_usuario enable row level security;

drop policy if exists "Usuario lee sus métodos de pago" on public.metodos_pago_usuario;
create policy "Usuario lee sus métodos de pago"
on public.metodos_pago_usuario
for select
to authenticated
using (usuario_id = public.mi_usuario_id());

drop policy if exists "Usuario agrega sus métodos de pago" on public.metodos_pago_usuario;
create policy "Usuario agrega sus métodos de pago"
on public.metodos_pago_usuario
for insert
to authenticated
with check (usuario_id = public.mi_usuario_id());

drop policy if exists "Usuario actualiza sus métodos de pago" on public.metodos_pago_usuario;
create policy "Usuario actualiza sus métodos de pago"
on public.metodos_pago_usuario
for update
to authenticated
using (usuario_id = public.mi_usuario_id())
with check (usuario_id = public.mi_usuario_id());

drop policy if exists "Usuario elimina sus métodos de pago" on public.metodos_pago_usuario;
create policy "Usuario elimina sus métodos de pago"
on public.metodos_pago_usuario
for delete
to authenticated
using (usuario_id = public.mi_usuario_id());

-- Nota: a propósito NO se agrega aquí una política para que admins lean
-- los métodos guardados de los usuarios desde Torre. Si en el futuro se
-- necesita (p. ej. para soporte), agregar:
--   using (usuario_id = public.mi_usuario_id() or public.is_admin())
-- en la política de SELECT de arriba.

-- ─── RLS: metodos_pago (catálogo) ──────────────────────────────────────────
-- `configuracion_admin_settings.sql` solo deja leer el catálogo a admins
-- (public.is_admin()), que es correcto para Torre pero bloquea a la app de
-- usuario, que necesita ver qué métodos están activos para poder elegirlos.
-- Esta política es ADITIVA (las políticas de SELECT se combinan con OR):
-- los admins conservan acceso total vía su política existente, y ahora
-- cualquier usuario autenticado puede ver además los métodos activos.
alter table public.metodos_pago enable row level security;

drop policy if exists "Usuarios autenticados leen métodos de pago activos" on public.metodos_pago;
create policy "Usuarios autenticados leen métodos de pago activos"
on public.metodos_pago
for select
to authenticated
using (activo = true);
