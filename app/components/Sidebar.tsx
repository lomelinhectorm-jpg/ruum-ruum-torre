'use client'

import { 
  ChartBarIcon, 
  TruckIcon, 
  IdentificationIcon, 
  UsersIcon,
  Square3Stack3DIcon,
  CameraIcon,
  ExclamationTriangleIcon,
  WalletIcon,
  DocumentTextIcon,
  TagIcon,
  BuildingOffice2Icon,
  PresentationChartLineIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

interface NavItem {
  id: string
  name: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: <ChartBarIcon className="w-5 h-5" /> },
  { id: 'viajes', name: 'Viajes', icon: <TruckIcon className="w-5 h-5" /> },
  { id: 'conductores', name: 'Conductores', icon: <IdentificationIcon className="w-5 h-5" /> },
  { id: 'usuarios', name: 'Usuarios', icon: <UsersIcon className="w-5 h-5" /> },
  { id: 'vehiculos', name: 'Vehículos', icon: <Square3Stack3DIcon className="w-5 h-5" /> },
  { id: 'evidencia', name: 'Evidencia', icon: <CameraIcon className="w-5 h-5" /> },
  { id: 'incidencias', name: 'Incidencias', icon: <ExclamationTriangleIcon className="w-5 h-5" /> },
  { id: 'pagos', name: 'Pagos', icon: <WalletIcon className="w-5 h-5" /> },
  { id: 'documentos', name: 'Documentos', icon: <DocumentTextIcon className="w-5 h-5" /> },
  { id: 'tarifas', name: 'Tarifas', icon: <TagIcon className="w-5 h-5" /> },
  { id: 'empresas', name: 'Empresas', icon: <BuildingOffice2Icon className="w-5 h-5" /> },
  { id: 'reportes', name: 'Reportes', icon: <PresentationChartLineIcon className="w-5 h-5" /> },
  { id: 'configuracion', name: 'Configuración', icon: <Cog6ToothIcon className="w-5 h-5" /> },
]

interface SidebarProps {
  activeView: string
  onNavigate: (viewId: string) => void
  isOpen: boolean
  isMobile: boolean
  onClose?: () => void
  /** ids de vista que el usuario actual puede ver (ver useAdminPerfil). */
  vistasPermitidas: string[]
  nombre?: string
  apellido?: string
  rolNombre?: string
}

export default function Sidebar({ activeView, onNavigate, isOpen, isMobile, onClose, vistasPermitidas, nombre, apellido, rolNombre }: SidebarProps) {
  const handleNavigate = (viewId: string) => {
    onNavigate(viewId)
    if (isMobile && onClose) {
      onClose()
    }
  }

  if (!isOpen && isMobile) return null

  const itemsVisibles = navItems.filter(item => vistasPermitidas.includes(item.id))
  const nombreCompleto = `${nombre ?? ''} ${apellido ?? ''}`.trim() || 'Usuario interno'

  return (
    <aside className={`
      bg-rr-asphalt text-white flex flex-col transition-all duration-300
      ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'w-64 flex-shrink-0'}
    `}>
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 bg-rr-route rounded-xl flex items-center justify-center font-black text-rr-asphalt">
          RR
        </div>
        <div>
          <h1 className="font-display font-bold text-lg tracking-tight">ruum<span className="text-rr-route">ruum</span></h1>
          <p className="text-xs text-rr-steelLight">Torre de Control</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {itemsVisibles.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavigate(item.id)}
                className={`sidebar-link w-full text-left ${activeView === item.id ? 'active' : ''}`}
              >
                {item.icon}
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=FFC400&color=14141A`}
            alt={nombreCompleto}
            className="w-9 h-9 rounded-full"
          />
          <div>
            <p className="text-sm font-medium">{nombreCompleto}</p>
            <p className="text-xs text-rr-steelLight">{rolNombre || 'Sin rol asignado'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
