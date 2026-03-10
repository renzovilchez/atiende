import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/auth.store'
import LiveClock from '../components/LiveClock'

const NAV_ITEMS = {
    receptionist: [
        { to: '/recepcion', label: 'Citas del día', icon: '📋' },
        { to: '/agendar', label: 'Agendar cita', icon: '➕' },
    ],
    doctor: [
        { to: '/medico/cola', label: 'Mi cola', icon: '🏥' },
        { to: '/medico/agenda', label: 'Mi agenda', icon: '📅' },
    ],
    admin: [
        { to: '/recepcion', label: 'Citas del día', icon: '📋' },
        { to: '/agendar', label: 'Agendar cita', icon: '➕' },
        { to: '/admin/doctores', label: 'Doctores', icon: '👨‍⚕️' },
        { to: '/admin/especialidades', label: 'Especialidades', icon: '🔬' },
        { to: '/admin/turnos', label: 'Turnos', icon: '🗓️' },
        { to: '/admin/clinica', label: 'Mi clínica', icon: '🏢' },
    ],
    super_admin: [
        { to: '/admin/clinicas', label: 'Clínicas', icon: '🏢' },
        { to: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
        { to: '/recepcion', label: 'Citas del día', icon: '📋' },
        { to: '/admin/doctores', label: 'Doctores', icon: '👨‍⚕️' },
        { to: '/admin/especialidades', label: 'Especialidades', icon: '🔬' },
    ],
}

export default function StaffLayout({ children }) {
    const { user, logout } = useAuthStore()
    const [collapsed, setCollapsed] = useState(false)
    const navigate = useNavigate()

    const navItems = NAV_ITEMS[user?.role] || []

    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside
                style={{
                    width: collapsed ? '64px' : '240px',
                    transition: 'width 0.2s ease',
                    background: 'linear-gradient(180deg, #0f2942 0%, #1a3a5c 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                }}
            >
                {/* Logo */}
                <div style={{
                    padding: collapsed ? '20px 0' : '20px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                }}>
                    {!collapsed && (
                        <div>
                            <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '18px', letterSpacing: '0.05em' }}>
                                ATIENDE
                            </div>
                            {user?.tenantName && (
                                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                    {user.tenantName}
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', padding: '4px', lineHeight: 1 }}
                    >
                        {collapsed ? '→' : '←'}
                    </button>
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: collapsed ? '10px 0' : '10px 20px',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                                background: isActive ? 'rgba(96,165,250,0.15)' : 'transparent',
                                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                                transition: 'all 0.15s ease',
                            })}
                        >
                            <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User + logout */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: collapsed ? '16px 0' : '16px 20px' }}>
                    {!collapsed && (
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>
                                {user?.firstName} {user?.lastName}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'capitalize', marginTop: '2px' }}>
                                {user?.role?.replace('_', ' ')}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: collapsed ? '8px 0' : '8px 12px',
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    >
                        <span>🚪</span>
                        {!collapsed && <span>Cerrar sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <header style={{
                    height: '56px',
                    background: '#fff',
                    borderBottom: '1px solid #e8edf2',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 28px',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <LiveClock />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: '#1a3a5c', color: '#60a5fa',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 700,
                        }}>
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
                    {children}
                </main>
            </div>
        </div>
    )
}