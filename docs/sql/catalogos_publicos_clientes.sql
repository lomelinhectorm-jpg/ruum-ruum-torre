-- ─────────────────────────────────────────────────────────────────────────
-- Catálogos públicos para clientes (usuario-ruum)
-- Usada por: lib/queries/usuario.ts en usuario-ruum
--   - getCatalogoTiposVehiculo()  -> public.configuracion (clave='tipos_vehiculo')
--   - getCatalogoTiposServicio()  -> public.tipos_servicio
--
-- Contexto: usuario-ruum consulta estas tablas directamente con la sesión
-- del CLIENTE final (no es un usuario_interno / admin). Las políticas que
-- ya existen sobre estas tablas solo dejan pasar a public.is_admin(), así
-- que un cliente normal recibe 0 filas (RLS no es un error visible, solo
-- devuelve vacío) al intentar cargar estos catálogos.
--
-- - usuario.ts (getCatalogoTiposVehiculo) ya tenía un comentario apuntando
--   a "docs/sql/solicitar_viaje_tipo_vehiculo_km.sql en torre" para esta
--   RLS aditiva, pero ese archivo no existe en este repo. Puede que ya se
--   haya aplicado manualmente en Supabase; si no, este script la agrega
--   bajo un nombre real y versionado.
-- - tipos_servicio es nueva (se conecta aquí por primera vez al flujo de
--   solicitud de viaje del cliente).
--
-- Estas políticas son ADITIVAS: se combinan con OR junto a las políticas
-- "Admins can read ..." que ya existen, no las reemplazan. Solo expone
-- columnas/filas pensadas para mostrarse a un cliente: catálogos activos,
-- nunca datos operativos ni el resto de claves de `configuracion`
-- (seguridad, ciclo_pago, datos_fiscales, etc. siguen bloqueadas).
--
-- Requiere que tipos_servicio y configuracion ya tengan RLS habilitada
-- (ver configuracion_zonas_servicios_roles_usuarios.sql y
-- configuracion_admin_settings.sql / configuracion_tipos_vehiculo.sql).
-- Es idempotente y no modifica datos.
-- ─────────────────────────────────────────────────────────────────────────

-- tipos_servicio: cualquier usuario autenticado puede ver los servicios activos.
drop policy if exists "Clientes pueden leer tipos_servicio activos" on public.tipos_servicio;
create policy "Clientes pueden leer tipos_servicio activos"
on public.tipos_servicio
for select
to authenticated
using (activo = true);

-- configuracion: solo la clave 'tipos_vehiculo' es un catálogo pensado para
-- mostrarse al cliente. El resto de claves (seguridad, ciclo_pago,
-- datos_fiscales, reglas_evidencia...) NO quedan expuestas por esta policy.
drop policy if exists "Clientes pueden leer catalogos publicos" on public.configuracion;
create policy "Clientes pueden leer catalogos publicos"
on public.configuracion
for select
to authenticated
using (clave = 'tipos_vehiculo');
