-- ─────────────────────────────────────────────────────────────────────────
-- Zonas: cobertura real por estado/municipio
-- Usada por: app/components/ConfiguracionView.tsx (TabZonas) en torre,
--            lib/queries/usuario.ts (verificarCoberturaZona) en usuario-ruum
--
-- Contexto: `zonas` ya existía con (id, nombre, descripcion, radio_km,
-- activa), pero radio_km es un radio sin centro: no hay columnas de
-- latitud/longitud en ningún lado del proyecto, ni geocodificación. Ese
-- campo nunca pudo usarse para validar cobertura real.
--
-- En vez de agregar geocodificación (requeriría un proveedor de mapas con
-- costo y una integración nueva), la cobertura se valida contra el
-- estado/municipio que el formulario de solicitud YA captura como texto.
-- Ver lib/estadosMexico.ts para el catálogo fijo de estados usado en
-- ambos lados de la comparación.
--
-- radio_km se queda como está (no se borra, puede tener datos), pero deja
-- de ser parte de la lógica de cobertura — es solo informativo a partir
-- de ahora.
--
-- Es idempotente y no borra datos existentes.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.zonas
  add column if not exists estados text[] not null default '{}';

alter table public.zonas
  add column if not exists municipios text[] not null default '{}';

comment on column public.zonas.radio_km is
  'Informativo únicamente. La cobertura real se valida por estados/municipios — ver columnas estados y municipios.';

comment on column public.zonas.estados is
  'Estados (catálogo fijo, ver lib/estadosMexico.ts) que cubre esta zona. Vacío = la zona no cubre nada todavía.';

comment on column public.zonas.municipios is
  'Opcional. Si tiene valores, restringe la cobertura a esos municipios dentro de los estados de la columna estados. Vacío = cubre todo el estado.';

-- RLS aditiva para que el cliente final (usuario-ruum) pueda leer las
-- zonas activas y validar cobertura antes de enviar su solicitud. Se
-- combina con OR junto a la policy "Admins can read zonas" que ya existe
-- (ver configuracion_zonas_servicios_roles_usuarios.sql) — no la reemplaza.
drop policy if exists "Clientes pueden leer zonas activas" on public.zonas;
create policy "Clientes pueden leer zonas activas"
on public.zonas
for select
to authenticated
using (activa = true);
