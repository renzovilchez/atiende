// layouts/StaffLayout.jsx
import { useState, useEffect, memo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/auth.store";
import LiveClock from "../components/LiveClock";
import { useSocket } from "../hooks/useSocket";

// Iconos
const MenuIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const DashboardIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const UsersIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const BuildingIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const SpecialtiesIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 3v4a3 3 0 01-6 0V7L8 4z"
    />
  </svg>
);

const ReportsIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const QueueIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

// Configuración de navegación por rol (basada en las rutas del router)
const NAV_ITEMS = {
  receptionist: [
    { to: "/recepcion", label: "Citas del día", icon: CalendarIcon, end: true },
    { to: "/recepcion/agendar", label: "Agendar cita", icon: PlusIcon },
    { to: "/recepcion/pacientes", label: "Pacientes", icon: UsersIcon },
    { to: "/recepcion/plano", label: "Plano", icon: BuildingIcon },
  ],
  doctor: [
    { to: "/doctor", label: "Dashboard", icon: DashboardIcon, end: true },
    { to: "/doctor/cola", label: "Cola de espera", icon: QueueIcon },
    { to: "/doctor/agenda", label: "Mi agenda", icon: CalendarIcon },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: DashboardIcon, end: true },
    { to: "/recepcion", label: "Citas del día", icon: CalendarIcon, end: true },
    { to: "/recepcion/agendar", label: "Agendar cita", icon: PlusIcon },
    { to: "/recepcion/pacientes", label: "Pacientes", icon: UsersIcon },
    { to: "/admin/doctores", label: "Doctores", icon: UsersIcon },
    {
      to: "/admin/especialidades",
      label: "Especialidades",
      icon: SpecialtiesIcon,
    },
    { to: "/admin/turnos", label: "Turnos", icon: CalendarIcon },
    { to: "/admin/clinica", label: "Mi clínica", icon: BuildingIcon },
    {
      to: "/admin/plano",
      label: "Plano en tiempo real",
      icon: BuildingIcon,
      end: true,
    },
    {
      to: "/admin/plano/configurar",
      label: "Configurar plano",
      icon: BuildingIcon,
    },
    { to: "/admin/reportes", label: "Reportes", icon: ReportsIcon },
  ],
  super_admin: [
    { to: "/super-admin", label: "Dashboard", icon: DashboardIcon, end: true },
    { to: "/super-admin/clinicas", label: "Clínicas", icon: BuildingIcon },
    { to: "/super-admin/planes", label: "Planes", icon: SpecialtiesIcon },
    { to: "/super-admin/metricas", label: "Métricas", icon: ReportsIcon },
  ],
};

const StaffHeader = memo(function StaffHeader({ scrolled, onMobileMenuOpen }) {
  return (
    <header
      className={`sticky top-0 z-30 bg-white border-b border-gray-200 transition-all duration-200 ${scrolled ? "shadow-sm" : ""}`}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Abrir menú móvil"
          >
            <MenuIcon />
          </button>
          <LiveClock />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            🔔
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            ⚙️
          </button>
        </div>
      </div>
    </header>
  );
});

export default function StaffLayout({ children }) {
  useSocket();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navItems = NAV_ITEMS[user?.role] || [];

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
    navigate("/login");
  }

  const getInitials = () => {
    return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
  };

  const roleLabels = {
    admin: "Administrador",
    super_admin: "Super Administrador",
    receptionist: "Recepcionista",
    doctor: "Médico",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay para móvil con animación */}
      <div
        className={`
                    fixed inset-0 bg-black/50 z-40 lg:hidden
                    transition-opacity duration-300
                    ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
                `}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
                fixed top-0 left-0 h-full bg-white shadow-xl z-50
                transition-all duration-300 ease-in-out
                ${sidebarOpen ? "w-72" : "w-20"}
                ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
      >
        {/* Logo y toggle */}
        <div
          className={`
                    h-20 border-b border-gray-100 flex items-center
                    ${sidebarOpen ? "px-6 justify-between" : "px-0 justify-center"}
                `}
        >
          {sidebarOpen ? (
            <>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ATIENDE
                </div>
                {user?.tenantName && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {user.tenantName}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Cerrar sidebar"
              >
                <CloseIcon />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="Abrir sidebar"
            >
              <MenuIcon />
            </button>
          )}
        </div>

        {/* User profile */}
        <div
          className={`
                    p-6 border-b border-gray-100
                    ${sidebarOpen ? "" : "flex justify-center"}
                `}
        >
          <div
            className={`
                        flex items-center
                        ${sidebarOpen ? "gap-4" : "flex-col gap-2"}
                    `}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200">
              {getInitials()}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500">
                  {roleLabels[user?.role] || user?.role}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navegación */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `
                                        flex items-center rounded-xl transition-all duration-200
                                        ${sidebarOpen ? "px-4 py-3" : "px-0 py-3 justify-center"}
                                        ${
                                          isActive
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }
                                    `}
                >
                  <div
                    className={`
                                        flex items-center gap-3
                                        ${sidebarOpen ? "w-full" : "flex-col"}
                                    `}
                  >
                    <div
                      className={`
                                            flex items-center justify-center
                                            ${sidebarOpen ? "w-5 h-5" : "w-8 h-8"}
                                        `}
                    >
                      <Icon />
                    </div>
                    {sidebarOpen && (
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.label}</div>
                      </div>
                    )}
                  </div>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div
          className={`
                    p-4 border-t border-gray-100
                    ${sidebarOpen ? "" : "flex justify-center"}
                `}
        >
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
                            flex items-center gap-3 text-gray-500 hover:text-red-600
                            transition-all duration-200
                            ${
                              sidebarOpen
                                ? "w-full px-4 py-3 hover:bg-red-50 rounded-xl"
                                : "p-3 hover:bg-red-50 rounded-xl justify-center"
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
          >
            <LogoutIcon />
            {sidebarOpen && (
              <span className="text-sm font-medium">
                {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`
                transition-all duration-300
                ${sidebarOpen ? "lg:ml-72" : "lg:ml-20"}
            `}
      >
        {/* Header */}
        <StaffHeader
          scrolled={scrolled}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        {/* Page content */}
        <main key={location.pathname} className="p-4 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Estilos para animaciones */}
      <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
    </div>
  );
}
