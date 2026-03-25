import { useNavigate, useParams } from 'react-router-dom'

export default function AdminReportes() {
    const navigate = useNavigate()
    const { slug } = useParams()

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <button onClick={() => navigate(`/${slug}/admin`)} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
                    ← Volver
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
                <p className="text-gray-500 mt-1">Estadísticas y métricas de la clínica</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Próximamente</h2>
                <p className="text-gray-400 max-w-sm mx-auto">
                    Los reportes de ocupación, citas por especialidad y métricas de rendimiento estarán disponibles en la siguiente versión.
                </p>
            </div>
        </div>
    )
}