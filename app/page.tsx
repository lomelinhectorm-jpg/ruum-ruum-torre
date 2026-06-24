'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import DashboardView from './components/DashboardView'
import ViajesView from './components/ViajesView'
import ConductoresView from './components/ConductoresView'
import VehiculosView from './components/VehiculosView'
import UsuariosView from './components/UsuariosView'
import EvidenciaView from './components/EvidenciaView'
import IncidenciasView from './components/IncidenciasView'
import PagosView from './components/PagosView'
import DocumentosView from './components/DocumentosView'
import TarifasView from './components/TarifasView'
import EmpresasView from './components/EmpresasView'
import ReportesView from './components/ReportesView'
import ConfiguracionView from './components/ConfiguracionView'
import { useSidebar } from './hooks/useSidebar'
import { useAdminPerfil } from './hooks/useAdminPerfil'
import { MODULOS_SISTEMA } from '@/lib/modulosSistema'

const titles: Record<string, string> = Object.fromEntries(MODULOS_SISTEMA.map(m => [m.id, m.titulo]))

export default function Home() {
  const router = useRouter()
  const [activeView, setActiveView] = useState('dashboard')
  const { isOpen, isMobile, toggle, close } = useSidebar()
  const perfil = useAdminPerfil()

  // No existía ningún guard de sesión en esta página: un visitante sin
  // sesión veía igual todo el shell del panel (Sidebar, TopBar, formularios)
  // aunque las consultas a Supabase fallaran por RLS. Ahora se redirige a
  // /login en cuanto se confirma que no hay sesión.
  useEffect(() => {
    if (!perfil.cargando && !perfil.autenticado) {
      router.replace('/login')
    }
  }, [perfil.cargando, perfil.autenticado, router])

  // Si la vista activa no está dentro de lo que permite el rol del usuario
  // (roles.permisos), saltar a la primera vista permitida en cuanto se
  // conoce el perfil — antes este arreglo no se aplicaba en ningún lado.
  useEffect(() => {
    if (perfil.cargando || !perfil.autenticado) return
    if (!perfil.tienePermiso(activeView) && perfil.vistasPermitidas.length > 0) {
      setActiveView(perfil.vistasPermitidas[0])
    }
    // perfil.tienePermiso se recrea cada render; lo que realmente nos
    // interesa para decidir si hay que saltar de vista es vistasPermitidas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil.cargando, perfil.autenticado, perfil.vistasPermitidas, activeView])

  const renderView = () => {
    if (!perfil.tienePermiso(activeView)) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-500">
            No tienes permiso para ver este módulo. Si crees que es un error, contacta a un administrador
            para que revise tu rol en Configuración → Roles y permisos.
          </p>
        </div>
      )
    }
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveView} />
      case 'viajes':
        return <ViajesView />
      case 'conductores':
        return <ConductoresView />
      case 'usuarios':
        return <UsuariosView />
      case 'vehiculos':
        return <VehiculosView />
      case 'evidencia':
        return <EvidenciaView />
      case 'incidencias':
        return <IncidenciasView />
      case 'pagos':
        return <PagosView />
      case 'documentos':
        return <DocumentosView />
      case 'tarifas':
        return <TarifasView />
      case 'empresas':
        return <EmpresasView />
      case 'reportes':
        return <ReportesView />
      case 'configuracion':
        return <ConfiguracionView />
      default:
        return <DashboardView onNavigate={setActiveView} />
    }
  }

  if (perfil.cargando || !perfil.autenticado) {
    return (
      <div className="flex h-screen items-center justify-center bg-rr-evidence">
        <p className="text-sm text-slate-400">Verificando sesión...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isOpen={isOpen}
        isMobile={isMobile}
        onClose={close}
        vistasPermitidas={perfil.vistasPermitidas}
        nombre={perfil.nombre}
        apellido={perfil.apellido}
        rolNombre={perfil.rolNombre}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar title={titles[activeView] || 'Ruum Ruum Torre de Control'} onMenuClick={toggle} />
        <main className="flex-1 overflow-y-auto bg-rr-evidence p-4 md:p-8">
          {renderView()}
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-rr-asphalt/60 z-40"
          onClick={close}
        />
      )}
    </div>
  )
}
