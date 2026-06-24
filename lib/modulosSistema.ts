// lib/modulosSistema.ts — admin-web
//
// Fuente única de verdad para los módulos del panel. Antes había tres
// listas independientes que podían desincronizarse:
//   - app/components/Sidebar.tsx        (id de vista + ícono)
//   - app/page.tsx                       (id de vista + título de TopBar)
//   - app/components/ConfiguracionView.tsx (label usado en roles.permisos)
//
// De hecho ya estaban desincronizadas: "Vehículos" tiene vista en Sidebar
// y en page.tsx, pero nunca existió como opción marcable en
// "Roles y permisos" — ningún rol podía tener ese módulo en su arreglo
// `permisos`. Quedó agregado aquí.
//
// `label` es el valor que se guarda dentro de roles.permisos (string[]).
// Si cambias un label aquí, los roles ya guardados en Supabase con el
// label anterior dejarán de coincidir — actualízalos a mano si lo haces.

export interface ModuloSistema {
  /** Coincide con el id de vista usado en Sidebar/page.tsx (activeView). */
  id: string
  /** Coincide con el string guardado en roles.permisos. */
  label: string
  /** Título mostrado en el TopBar al entrar a ese módulo. */
  titulo: string
}

export const MODULOS_SISTEMA: ModuloSistema[] = [
  { id: 'dashboard', label: 'Dashboard', titulo: 'Dashboard Operativo' },
  { id: 'viajes', label: 'Viajes', titulo: 'Gestión de Viajes' },
  { id: 'conductores', label: 'Conductores', titulo: 'Conductores Certificados' },
  { id: 'usuarios', label: 'Usuarios', titulo: 'Usuarios y Empresas' },
  { id: 'vehiculos', label: 'Vehículos', titulo: 'Gestión de Vehículos' },
  { id: 'evidencia', label: 'Evidencia', titulo: 'Revisión de Evidencia' },
  { id: 'incidencias', label: 'Incidencias', titulo: 'Control de Incidencias' },
  { id: 'pagos', label: 'Pagos', titulo: 'Pagos y Finanzas' },
  { id: 'documentos', label: 'Documentos', titulo: 'Validación Documental' },
  { id: 'tarifas', label: 'Tarifas', titulo: 'Configuración de Tarifas' },
  { id: 'empresas', label: 'Empresas', titulo: 'Gestión de Empresas' },
  { id: 'reportes', label: 'Reportes', titulo: 'Reportes y Analítica' },
  { id: 'configuracion', label: 'Configuración', titulo: 'Configuración del Sistema' },
]

// Roles cuyo acceso en el panel NO se filtra por roles.permisos.
//
// Por qué: public.is_admin() (ver docs/sql/reparar_is_admin.sql) ya les da
// acceso total a nivel de datos a estos 4 roles por nombre — el arreglo
// `permisos` nunca controló nada a nivel de base de datos, solo decide qué
// ve la UI. Si filtráramos por permisos también para estos roles, el
// primer despliegue de este cambio dejaría a cualquier cuenta existente
// sin acceso a módulos que SÍ necesita, porque hasta ahora esos checkboxes
// en "Roles y permisos" no tenían ningún efecto y es probable que estén
// incompletos.
//
// Recomendación antes de quitar un rol de esta lista: entra a
// Configuración → Roles y permisos y marca explícitamente todos los
// módulos que ese rol debe poder ver. En cuanto lo quites de aquí, el
// filtrado por permisos empieza a aplicar de verdad para ese rol.
export const ROLES_ACCESO_TOTAL = ['super administrador']

export function normalizarRol(nombre: string | null | undefined): string {
  return (nombre ?? '').trim().toLowerCase()
}
