import { Link } from 'react-router-dom'

const NAV_CARDS = [
    { to: '/super-admin/clinicas', emoji: '🏥', title: 'Clínicas', desc: 'Gestiona los tenants de la plataforma' },
    { to: '/super-admin/planes', emoji: '📋', title: 'Planes', desc: 'Planes de suscripción disponibles' },
    { to: '/super-admin/metricas', emoji: '📊', title: 'Métricas', desc: 'Estadísticas globales de la plataforma' },
]

export default function SuperAdminDashboard() {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Panel de plataforma</h1>
                <p className="text-gray-500 mt-1">Administración global de Atiende</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-sm text-amber-700 font-medium">Estás en el panel de Super Admin. Los cambios afectan a toda la plataforma.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {NAV_CARDS.map(card => (
                    <Link key={card.to} to={card.to}
                        className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all">
                        <div className="text-4xl mb-4">{card.emoji}</div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{card.title}</h3>
                        <p className="text-sm text-gray-500">{card.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}