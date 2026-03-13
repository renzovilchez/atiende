import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function AdminTurnos() {
    const navigate = useNavigate()
    const [selectedDoctor, setSelectedDoctor] = useState('')

    const { data: doctors = [] } = useQuery({
        queryKey: ['admin-doctors'],
        queryFn: () => api.get('/doctors').then(r => r.data.data),
    })

    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ['schedules', selectedDoctor],
        queryFn: () => api.get(`/schedules?doctor_id=${selectedDoctor}`).then(r => r.data.data),
        enabled: !!selectedDoctor,
    })

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
                    ← Volver
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Turnos</h1>
                <p className="text-gray-500 mt-1">Horarios de atención por doctor</p>
            </div>

            {/* Selector de doctor */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Seleccionar doctor</label>
                <select
                    value={selectedDoctor}
                    onChange={e => setSelectedDoctor(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
                >
                    <option value="">Elegir doctor...</option>
                    {doctors.map(d => (
                        <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
                    ))}
                </select>
            </div>

            {/* Horarios */}
            {!selectedDoctor ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <div className="text-4xl mb-3">🗓️</div>
                    <p className="text-gray-500">Selecciona un doctor para ver sus turnos</p>
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : schedules.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-500">Este doctor no tiene turnos registrados</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {schedules.map(s => (
                        <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">{DAYS[s.day_of_week]}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {s.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Horario</span>
                                    <span className="font-medium">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Cupo máximo</span>
                                    <span className="font-medium">{s.max_patients} pacientes</span>
                                </div>
                                {s.room_name && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Consultorio</span>
                                        <span className="font-medium">{s.room_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}