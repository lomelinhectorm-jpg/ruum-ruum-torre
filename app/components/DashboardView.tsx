'use client'

// Cambiar las importaciones de Heroicons
import { 
  ChartBarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  ExclamationTriangleIcon,
  BellAlertIcon,
  ClockIcon as HistoryIcon
} from '@heroicons/react/24/outline'

const kpiCards = [
  { title: 'Viajes Activos', value: '12', icon: ChartBarIcon, color: 'blue', trend: '+3 programados para hoy' },
  { title: 'Pendientes de Asignación', value: '4', icon: ClockIcon, color: 'amber', trend: 'Requieren atención inmediata' },
  { title: 'Conductores Disponibles', value: '28', icon: UserGroupIcon, color: 'green', trend: 'De 45 conductores certificados' },
  { title: 'Incidencias Abiertas', value: '2', icon: ExclamationTriangleIcon, color: 'red', trend: '1 daño reportado, 1 retraso' },
]

const alerts = [
  { type: 'error', title: 'Evidencia incompleta', message: 'Viaje #TR-8842: Falta foto interior final.', icon: 'exclamation-triangle' },
  { type: 'warning', title: 'Viaje sin conductor', message: 'Viaje #TR-8845 programado en 30 min.', icon: 'user-clock' },
  { type: 'info', title: 'Documento por vencer', message: 'Licencia de J. Pérez vence en 5 días.', icon: 'file-contract' },
]

const recentTrips = [
  { id: '#TR-8841', vehicle: 'Nissan Versa (ABC-123)', driver: 'Carlos M.', status: 'Finalizado', time: '10:45 AM', statusColor: 'green' },
  { id: '#TR-8842', vehicle: 'Toyota Hilux (XYZ-987)', driver: 'Ana R.', status: 'En Traslado', time: '11:15 AM', statusColor: 'blue' },
  { id: '#TR-8843', vehicle: 'Honda Civic (DEF-456)', driver: 'Sin asignar', status: 'Pendiente', time: '12:00 PM', statusColor: 'amber' },
]

const getStatusBadge = (status: string, color: string) => {
  const colors = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`px-2 py-1 ${colors[color as keyof typeof colors]} rounded-full text-xs font-medium`}>
      {status}
    </span>
  )
}

const getAlertStyles = (type: string) => {
  const styles = {
    error: 'bg-red-50 border-red-100 text-red-800',
    warning: 'bg-amber-50 border-amber-100 text-amber-800',
    info: 'bg-blue-50 border-blue-100 text-blue-800',
  }
  return styles[type as keyof typeof styles] || styles.info
}

export default function DashboardView() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            amber: 'bg-amber-50 text-amber-600',
            green: 'bg-green-50 text-green-600',
            red: 'bg-red-50 text-red-600',
          }
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{card.title}</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">{card.value}</h3>
                </div>
                <div className={`p-2 ${colorClasses[card.color as keyof typeof colorClasses]} rounded-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className={`text-xs mt-3 font-medium ${
                card.color === 'red' ? 'text-red-500' : 
                card.color === 'green' ? 'text-green-600' : 
                'text-slate-500'
              }`}>
                {card.trend}
              </p>
            </div>
          )
        })}
      </div>

      {/* Operational Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas Operativas */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BellAlertIcon className="w-5 h-5 text-amber-500" />
            Alertas Operativas
          </h3>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`flex gap-3 p-3 border rounded-lg ${getAlertStyles(alert.type)}`}>
                <i className={`fas fa-${alert.icon} mt-1`}></i>
                <div>
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-blue-500" />
            Actividad Reciente
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3">ID Viaje</th>
                  <th className="px-4 py-3">Vehículo</th>
                  <th className="px-4 py-3">Conductor</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTrips.map((trip, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{trip.id}</td>
                    <td className="px-4 py-3">{trip.vehicle}</td>
                    <td className="px-4 py-3">{trip.driver}</td>
                    <td className="px-4 py-3">{getStatusBadge(trip.status, trip.statusColor)}</td>
                    <td className="px-4 py-3 text-slate-500">{trip.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}