'use client'

import { 
  ChartBarIcon, 
  TruckIcon, 
  IdentificationIcon, 
  UsersIcon,
  CameraIcon,
  ExclamationTriangleIcon,
  WalletIcon,
  DocumentTextIcon,
  TagIcon,
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
  { id: 'evidencia', name: 'Evidencia', icon: <CameraIcon className="w-5 h-5" /> },
  { id: 'incidencias', name: 'Incidencias', icon: <ExclamationTriangleIcon className="w-5 h-5" /> },
  { id: 'pagos', name: 'Pagos', icon: <WalletIcon className="w-5 h-5" /> },
  { id: 'documentos', name: 'Documentos', icon: <DocumentTextIcon className="w-5 h-5" /> },
  { id: 'tarifas', name: 'Tarifas', icon: <TagIcon className="w-5 h-5" /> },
  { id: 'configuracion', name: 'Configuración', icon: <Cog6ToothIcon className="w-5 h-5" /> },
]

interface SidebarProps {
  activeView: string
  onNavigate: (viewId: string) => void
  isOpen: boolean
  isMobile: boolean
  onClose?: () => void
}

export default function Sidebar({ activeView, onNavigate, isOpen, isMobile, onClose }: SidebarProps) {
  const handleNavigate = (viewId: string) => {
    onNavigate(viewId)
    if (isMobile && onClose) {
      onClose()
    }
  }

  if (!isOpen && isMobile) return null

  return (
    <aside className={`
      bg-slate-900 text-white flex flex-col transition-all duration-300
      ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'w-64 flex-shrink-0'}
    `}>
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white">
          R
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">Ruum Ruum</h1>
          <p className="text-xs text-slate-400">Admin By MoviliaX</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
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

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <img 
            src="https://ui-avatars.com/api/?name=Admin+Ops&background=3b82f6&color=fff" 
            alt="Admin"
            className="w-9 h-9 rounded-full"
          />
          <div>
            <p className="text-sm font-medium">Operaciones</p>
            <p className="text-xs text-slate-400">Super Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  )
}