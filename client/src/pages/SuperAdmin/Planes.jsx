import { useNavigate } from 'react-router-dom'

const PLANES = [
    { nombre: 'Básico', precio: 'S/ 99/mes', doctores: '3', citas: '200/mes', color: 'border-gray-200' },
    { nombre: 'Profesional', precio: 'S/ 199/mes', doctores: '10', citas: '1,000/mes', color: 'border-blue-400' },
    { nombre: 'Empresarial', precio: 'S/ 399/mes', doctores: 'Ilimitado', citas: 'Ilimitadas', color: 'border-purple-400' },
]

export default function SuperAdminPlanes() {
    const navigate = useNavigate()

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <button onClick={() => navigate('/super-admin')} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
                    ← Volver
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Planes</h1>
                <p className="text-gray-500 mt-1">Estructura de suscripciones de la plataforma</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {PLANES.map(p => (
                    <div key={p.nombre} className={`bg-white rounded-2xl border-2 ${p.color} p-6`}>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{p.nombre}</h3>
                        <div className="text-2xl font-bold text-blue-600 mb-4">{p.precio}</div>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Doctores</span>
                                <span className="font-medium">{p.doctores}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Citas</span>
                                <span className="font-medium">{p.citas}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <div className="text-5xl mb-4">🚧</div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Gestión de planes — Próximamente</h2>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    La configuración dinámica de planes y asignación a clínicas estará disponible en la siguiente versión.
                </p>
            </div>
        </div>
    )
}