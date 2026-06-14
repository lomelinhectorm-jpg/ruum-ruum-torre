'use client'

import { Bars3Icon, BellIcon, PlusIcon } from '@heroicons/react/24/outline'

interface TopBarProps {
  title: string
  onMenuClick: () => void
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden text-slate-600 hover:text-slate-900"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-blue-600 transition-colors">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Nuevo Viaje
        </button>
      </div>
    </header>
  )
}