import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/auth.store'

// roles: array de roles permitidos. Si está vacío, solo requiere estar autenticado.
export default function ProtectedRoute({ children, roles = [] }) {
    const { user, isLoading } = useAuthStore()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-400 text-sm">Cargando...</div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />
    }

    return children
}