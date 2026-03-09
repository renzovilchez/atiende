import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import Login from '../pages/Login'

// Placeholders — se reemplazan en Fase 2 con las páginas reales
const Dashboard = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Dashboard — próximamente</p>
    </div>
)
const Unauthorized = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500">Sin permisos para esta página.</p>
    </div>
)

const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: '/admin',
        element: (
            <ProtectedRoute roles={['admin', 'super_admin']}>
                <Dashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: '/recepcion',
        element: (
            <ProtectedRoute roles={['receptionist']}>
                <Dashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: '/medico',
        element: (
            <ProtectedRoute roles={['doctor']}>
                <Dashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: '/unauthorized',
        element: <Unauthorized />,
    },
    {
        path: '*',
        element: <Navigate to="/" replace />,
    },
])

export default function Router() {
    return <RouterProvider router={router} />
}