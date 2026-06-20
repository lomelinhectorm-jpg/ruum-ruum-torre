-- ─────────────────────────────────────────────────────────────────────────
-- Tabla: estados_viaje
-- Usada por: app/components/ConfiguracionView.tsx (TabEstados)
--
-- IMPORTANTE: la columna `nombre` debe coincidir EXACTAMENTE (mismo texto,
-- mismas mayúsculas/acentos) con el tipo StatusKey definido en
-- app/components/ViajesView.tsx, porque ese tipo controla colores y filtros
-- de la sección de Viajes. No renombres estos valores sin actualizar también
-- ViajesView.tsx.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.estados_viaje (
  id uuid primary key default gen_random_uuid(),
  orden integer not null,
  nombre text not null unique,
  siguiente text not null default '—',
  color text not null default 'slate',
  auto boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists estados_viaje_orden_idx on public.estados_viaje (orden);

-- Mantener updated_at al día en cada cambio
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_estados_viaje_updated_at on public.estados_viaje;
create trigger trg_estados_viaje_updated_at
before update on public.estados_viaje
for each row execute function public.set_updated_at();

-- ─── Migración + seed: los 12 estados del ciclo de vida de un viaje ───────
-- Los viajes históricos en el estado retirado continúan por el siguiente
-- paso operativo útil.
update public.viajes
set status = 'Pendiente de asignación'
where status = 'Pendiente de revisión';

delete from public.estados_viaje where nombre = 'Pendiente de revisión';

-- Evita colisiones temporales con el índice único de `orden` al reenumerar.
update public.estados_viaje set orden = orden + 100 where orden < 100;

insert into public.estados_viaje (orden, nombre, siguiente, color, auto, activo)
values
  (1,  'Solicitud recibida',          'Pendiente de asignación',      'slate',  true,  true),
  (2,  'Pendiente de asignación',     'Conductor asignado',           'amber',  false, true),
  (3,  'Conductor asignado',          'Conductor en camino',          'blue',   false, true),
  (4,  'Conductor en camino',         'Recolección en proceso',       'blue',   false, true),
  (5,  'Recolección en proceso',      'Evidencia inicial pendiente',  'indigo', false, true),
  (6,  'Evidencia inicial pendiente', 'Traslado en curso',            'orange', false, true),
  (7,  'Traslado en curso',           'Entrega en proceso',           'purple', false, true),
  (8,  'Entrega en proceso',          'Evidencia final pendiente',    'violet', false, true),
  (9,  'Evidencia final pendiente',   'Finalizado',                   'orange', false, true),
  (10, 'Finalizado',                  '—',                            'green',  false, true),
  (11, 'Cancelado',                   '—',                            'red',    false, true),
  (12, 'En revisión por incidencia',  'Finalizado / Cancelado',       'rose',   false, true)
on conflict (nombre) do update set
  orden = excluded.orden,
  siguiente = excluded.siguiente,
  color = excluded.color,
  auto = excluded.auto,
  activo = excluded.activo;

-- ─── RLS: mismo patrón que el resto del proyecto (is_admin()) ─────────────
-- Requiere que la función public.is_admin() ya exista (ver docs/security-rls-checklist.md).
alter table public.estados_viaje enable row level security;

drop policy if exists "Admins can read estados_viaje" on public.estados_viaje;
create policy "Admins can read estados_viaje"
on public.estados_viaje
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update estados_viaje" on public.estados_viaje;
create policy "Admins can update estados_viaje"
on public.estados_viaje
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Nota: a propósito NO se agrega política de insert/delete. El admin panel
-- (TabEstados) solo permite editar `siguiente` y `auto` por fila; el alta o
-- baja de estados del ciclo de vida requiere también actualizar el tipo
-- StatusKey en ViajesView.tsx, así que se gestiona por migración, no desde la UI.
