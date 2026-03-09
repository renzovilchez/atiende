import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/auth.store'

export default function PatientLayout({ children }) {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
            {/* Navbar */}
            <nav style={{
                background: '#fff',
                borderBottom: '1px solid #e8edf2',
                position: 'sticky',
                top: 0,
                zIndex: 50,
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <div style={{ color: '#1a3a5c', fontWeight: 700, fontSize: '18px', letterSpacing: '0.05em' }}>
                        ATIENDE
                        {user?.tenantName && (
                            <span style={{ fontWeight: 400, fontSize: '13px', color: '#94a3b8', marginLeft: '10px' }}>
                                {user.tenantName}
                            </span>
                        )}
                    </div>

                    {/* Nav links */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <NavLink
                            to="/mis-citas"
                            style={({ isActive }) => ({
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: 500,
                                textDecoration: 'none',
                                color: isActive ? '#1a3a5c' : '#64748b',
                                background: isActive ? '#eff6ff' : 'transparent',
                                transition: 'all 0.15s',
                            })}
                        >
                            Mis citas
                        </NavLink>
                        <NavLink
                            to="/agendar"
                            style={({ isActive }) => ({
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: 500,
                                textDecoration: 'none',
                                color: isActive ? '#fff' : '#fff',
                                background: isActive ? '#1e40af' : '#2563eb',
                                transition: 'all 0.15s',
                            })}
                        >
                            + Agendar cita
                        </NavLink>

                        {/* User menu */}
                        <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>
                                {user?.firstName}
                            </span>
                            <button
                                onClick={handleLogout}
                                style={{
                                    padding: '6px 12px',
                                    background: 'none',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                }}
                            >
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
                {children}
            </main>
        </div>
    )
}