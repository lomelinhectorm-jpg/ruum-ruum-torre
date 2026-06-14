'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

type TripStatus = 'todos' | 'pendientes' | 'en-curso' | 'finalizados'

const trips = [
  {
    id: '#TR-8842',
    vehicle: { name: 'Toyota Hilux', plate: 'XYZ-987', year: '2022' },
    origin: 'Av. Reforma 222, CDMX',
    destination: 'Taller Norte, Satélite',
    driver: { name: 'Ana R.', initial: 'AR' },
    evidence: { status: 'ok', text: 'Inicial OK' },
    status: 'En Traslado',
    statusColor: 'blue',
  },
  {
    id: '#TR-8843',
    vehicle: { name: 'Honda Civic', plate: 'DEF-456', year: '2020' },
    origin: 'Agencia Sur',
    destination: 'Domicilio Cliente',
    driver: null,
    evidence: { status: 'pending', text: 'Pendiente' },
    status: 'Pendiente de Asignación',
    statusColor: 'amber',
  },
]

export default function ViajesView() {
  const [activeFilter, setActiveFilter] = useState<TripStatus>('todos')
  const [searchTerm, setSearchTerm] = useState('')

  const filters: { id: TripStatus; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendientes', label: 'Pendientes' },
    { id: 'en-curso', label: 'En curso' },
    { id: 'finalizados', label: 'Finalizados' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, placa o conductor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4">ID Viaje</th>
                <th className="px-6 py-4">Vehículo</th>
                <th className="px-6 py-4">Origen → Destino</th>
                <th className="px-6 py-4">Conductor</th>
                <th className="px-6 py-4">Evidencia</th>
                <th className="px-6 py-4">Estatus</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-blue-600">{trip.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{trip.vehicle.name}</div>
                    <div className="text-xs text-slate-500">{trip.vehicle.plate} • {trip.vehicle.year}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-500">Origen:</div>
                    <div className="font-medium">{trip.origin}</div>
                    <div className="text-xs text-slate-500 mt-1">Destino:</div>
                    <div className="font-medium">{trip.destination}</div>
                  </td>
                  <td className="px-6 py-4">
                    {trip.driver ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                          {trip.driver.initial}
                        </div>
                        <span>{trip.driver.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      trip.evidence.status === 'ok' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <i className={`fas fa-${trip.evidence.status === 'ok' ? 'check-circle' : 'clock'}`}></i>
                      {trip.evidence.text}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      trip.statusColor === 'blue' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-blue-600 mx-1" title="Ver detalle">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="text-slate-400 hover:text-amber-600 mx-1" title="Asignar/Editar">
                      <i className="fas fa-edit"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}