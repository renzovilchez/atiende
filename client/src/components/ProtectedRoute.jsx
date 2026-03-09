import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/auth.store'

const DEFAULT_ROUTE = {
    patient: '/mis-citas',
    doctor: '/medico/cola',
    receptionist: '/recepcion',
    admin: '/recepcion',
    super_admin: '/admin/clinicas',
}

export default function ProtectedRoute({ children, roles = [] }) {
    const { user, isLoading } = useAuthStore()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-400 text-sm">Cargando...</div>
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />

    // Redirect raíz según rol
    if (window.location.pathname === '/') {
        const dest = DEFAULT_ROUTE[user.role] || '/recepcion'
        return <Navigate to={dest} replace />
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />
    }

    return children
}