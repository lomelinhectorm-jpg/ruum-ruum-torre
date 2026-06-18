'use client'

import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import DashboardView from './components/DashboardView'
import ViajesView from './components/ViajesView'
import ConductoresView from './components/ConductoresView'
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

const titles: Record<string, string> = {
  dashboard: 'Dashboard Operativo',
  viajes: 'Gestión de Viajes',
  conductores: 'Conductores Certificados',
  usuarios: 'Usuarios y Empresas',
  evidencia: 'Revisión de Evidencia',
  incidencias: 'Control de Incidencias',
  pagos: 'Pagos y Finanzas',
  documentos: 'Validación Documental',
  tarifas: 'Configuración de Tarifas',
  empresas: 'Gestión de Empresas',
  reportes: 'Reportes y Analítica',
  configuracion: 'Configuración del Sistema',
}

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard')
  const { isOpen, isMobile, toggle, close } = useSidebar()

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveView} />
      case 'viajes':
        return <ViajesView />
      case 'conductores':
        return <ConductoresView />
      case 'usuarios':
        return <UsuariosView />
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        activeView={activeView}
        onNavigate={setActiveView}
        isOpen={isOpen}
        isMobile={isMobile}
        onClose={close}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar title={titles[activeView] || 'Ruum Ruum Torre de Control'} onMenuClick={toggle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          {renderView()}
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={close}
        />
      )}
    </div>
  )
}