import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import Layout from '../layouts'
import Login from '../pages/Login'
import Recepcion from '../pages/Recepcion'
import Agendar from '../pages/Agendar'

const Placeholder = ({ title }) => (
    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚧</div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#475569' }}>{title}</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>Próximamente</div>
    </div>
)

function WithLayout({ children }) {
    return <Layout>{children}</Layout>
}

const router = createBrowserRouter([
    { path: '/login', element: <Login /> },

    // ─── PACIENTE ────────────────────────────────────────────
    {
        path: '/mis-citas',
        element: <ProtectedRoute roles={['patient']}><WithLayout><Placeholder title="Mis citas" /></WithLayout></ProtectedRoute>,
    },
    {
        path: '/agendar',
        element: <ProtectedRoute roles={['patient', 'admin', 'receptionist', 'super_admin']}>
            <WithLayout><Agendar /></WithLayout>
        </ProtectedRoute>,
    },

    // ─── RECEPCIÓN ───────────────────────────────────────────
    {
        path: '/recepcion',
        element: <ProtectedRoute roles={['receptionist', 'admin', 'super_admin']}>
            <WithLayout><Recepcion /></WithLayout>
        </ProtectedRoute>,
    },

    // ─── DOCTOR ──────────────────────────────────────────────
    {
        path: '/medico/cola',
        element: <ProtectedRoute roles={['doctor']}><WithLayout><Placeholder title="Mi cola" /></WithLayout></ProtectedRoute>,
    },
    {
        path: '/medico/agenda',
        element: <ProtectedRoute roles={['doctor']}><WithLayout><Placeholder title="Mi agenda" /></WithLayout></ProtectedRoute>,
    },

    // ─── ADMIN ───────────────────────────────────────────────
    {
        path: '/admin/doctores',
        element: <ProtectedRoute roles={['admin', 'super_admin']}><WithLayout><Placeholder title="Doctores" /></WithLayout></ProtectedRoute>,
    },
    {
        path: '/admin/especialidades',
        element: <ProtectedRoute roles={['admin', 'super_admin']}><WithLayout><Placeholder title="Especialidades" /></WithLayout></ProtectedRoute>,
    },
    {
        path: '/admin/turnos',
        element: <ProtectedRoute roles={['admin', 'super_admin']}><WithLayout><Placeholder title="Turnos" /></WithLayout></ProtectedRoute>,
    },
    {
        path: '/admin/clinica',
        element: <ProtectedRoute roles={['admin']}><WithLayout><Placeholder title="Mi clínica" /></WithLayout></ProtectedRoute>,
    },
    {
        path: '/admin/clinicas',
        element: <ProtectedRoute roles={['super_admin']}><WithLayout><Placeholder title="Clínicas" /></WithLayout></ProtectedRoute>,
    },
    {
        path: '/admin/usuarios',
        element: <ProtectedRoute roles={['super_admin']}><WithLayout><Placeholder title="Usuarios" /></WithLayout></ProtectedRoute>,
    },

    // ─── REDIRECTS ───────────────────────────────────────────
    { path: '/', element: <ProtectedRoute /> },
    {
        path: '/unauthorized',
        element: (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px' }}>🔒</div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#475569', marginTop: '12px' }}>Sin permisos</div>
                    <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>No tienes acceso a esta página</div>
                </div>
            </div>
        ),
    },
    { path: '*', element: <Navigate to="/" replace /> },
])

export default function Router() {
    return <RouterProvider router={router} />
}