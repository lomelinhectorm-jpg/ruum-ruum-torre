-- MIGRACIÓN BLOQUEADA: NO APLICAR.
--
-- Este archivo fue sobrescrito accidentalmente con TypeScript antes del
-- 21-06-2026. Las funciones siguen activas en Supabase, pero sus cuerpos no
-- son recuperables desde PostgREST/OpenAPI. El contrato vivo de argumentos
-- quedó registrado en docs/contracts/viaje.contract.json.
--
-- Faltan las definiciones versionadas de:
--   public.asignar_conductor_admin
--   public.aceptar_viaje_conductor
--   public.cerrar_viaje_conductor
--   public.cancelar_viaje_usuario
--
-- Recuperación requerida desde una conexión PostgreSQL autorizada:
--
-- select pg_get_functiondef(p.oid)
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname in (
--     'asignar_conductor_admin',
--     'aceptar_viaje_conductor',
--     'cerrar_viaje_conductor',
--     'cancelar_viaje_usuario'
--   )
-- order by p.proname, pg_get_function_identity_arguments(p.oid);
--
-- Después de recuperar cada cuerpo se deben añadir explícitamente:
--   * SECURITY INVOKER salvo necesidad demostrada de DEFINER;
--   * search_path fijo si se usa SECURITY DEFINER;
--   * validación de auth.uid() y del rol/propietario;
--   * bloqueo de fila y transición de estado válida;
--   * idempotencia ante reintentos;
--   * timeline/auditoría dentro de la misma transacción;
--   * REVOKE FROM PUBLIC y GRANT mínimo a authenticated.

do $$
begin
  raise exception using
    message = 'Migración bloqueada: recuperar primero las definiciones RPC vivas con pg_get_functiondef().';
end;
$$;
