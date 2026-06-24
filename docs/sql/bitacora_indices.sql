-- ─────────────────────────────────────────────────────────────────────────
-- Bitácora: índices para soportar filtrado por módulo y paginación real
-- Usada por: app/components/ConfiguracionView.tsx (TabBitacora)
--
-- Contexto: hasta ahora TabBitacora cargaba los últimos 200 registros y
-- filtraba por módulo solo en el cliente. Eso significaba que un módulo
-- poco frecuente podía aparecer "vacío" aunque tuviera registros más
-- antiguos. El componente ahora filtra (`modulo = ...`) y pagina
-- (`created_at < cursor`) directamente contra Supabase, así que conviene
-- indexar esas columnas para que las consultas sigan siendo rápidas a
-- medida que la tabla crece.
--
-- Es idempotente: se puede ejecutar varias veces sin efectos secundarios.
-- No modifica políticas de RLS ni datos existentes.
-- ─────────────────────────────────────────────────────────────────────────

-- Listado general ordenado por fecha descendente (pantalla "Todos" + "Cargar más").
create index if not exists bitacora_created_at_idx
on public.bitacora (created_at desc);

-- Filtrado por módulo + orden por fecha (pestañas de filtro en TabBitacora).
create index if not exists bitacora_modulo_created_at_idx
on public.bitacora (modulo, created_at desc);

-- Nota: la tabla bitacora ya tiene RLS habilitada con políticas de
-- "select" e "insert" para administradores (ver configuracion_admin_settings.sql)
-- y, a propósito, no tiene políticas de "update" ni "delete": el registro
-- debe ser inmutable. No se modifica eso aquí.
