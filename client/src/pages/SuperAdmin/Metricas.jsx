import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function SuperAdminMetricas() {
    const navigate = useNavigate()

    const { data: clinicas = [] } = useQuery({
        queryKey: ['sa-clinicas'],
        queryFn: () => api.get('/tenants').then(r => r.data.data),
    })

    const stats = [
        { label: 'Clínicas activas', value: clinicas.length, emoji: '🏥', color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Plataforma', value: 'v1.0', emoji: '🚀', color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Estado', value: 'Operativo', emoji: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ]

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <button onClick={() => navigate('/super-admin')} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
                    ← Volver
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Métricas</h1>
                <p className="text-gray-500 mt-1">Estado global de la plataforma</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {stats.map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-6">
                        <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                            {s.emoji}
                        </div>
                        <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</div>
                        <div className="text-sm text-gray-500">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <div className="text-5xl mb-4">📊</div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Métricas detalladas — Próximamente</h2>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    Gráficos de citas por clínica, crecimiento de usuarios y uso de la plataforma estarán disponibles próximamente.
                </p>
            </div>
        </div>
    )
}