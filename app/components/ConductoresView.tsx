'use client'

const drivers = [
  {
    name: 'Carlos Méndez',
    email: 'carlos.m@email.com',
    certification: 'Aprobado',
    certificationColor: 'green',
    availability: true,
    documents: '4/4 vigentes',
    trips: 142,
  },
  {
    name: 'Juan Pérez',
    email: 'juan.p@email.com',
    certification: 'En Revisión',
    certificationColor: 'amber',
    availability: false,
    documents: 'Licencia por vencer',
    trips: 12,
  },
]

export default function ConductoresView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Gestión de Conductores Certificados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3">Conductor</th>
                <th className="px-6 py-3">Estatus Certificación</th>
                <th className="px-6 py-3">Disponibilidad</th>
                <th className="px-6 py-3">Documentos</th>
                <th className="px-6 py-3">Viajes</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.map((driver, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${driver.name.replace(' ', '+')}&background=random`} 
                        alt={driver.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{driver.name}</div>
                        <div className="text-xs text-slate-500">{driver.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 bg-${driver.certificationColor}-100 text-${driver.certificationColor}-700 rounded-full text-xs font-medium`}>
                      {driver.certification}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-2 text-xs font-medium ${
                      driver.availability ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${driver.availability ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                      {driver.availability ? 'Disponible' : 'No disponible'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-xs ${!driver.availability ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                    {driver.documents}
                  </td>
                  <td className="px-6 py-4 font-medium">{driver.trips}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-blue-600 mx-1">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="text-slate-400 hover:text-slate-600 mx-1">
                      <i className="fas fa-ellipsis-v"></i>
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