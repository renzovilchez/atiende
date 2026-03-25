// layouts/PatientLayout.jsx
import { NavLink, useNavigate, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuthStore from "../store/auth.store";
import { useSocket } from "../hooks/useSocket";

// Iconos (los mismos)
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

const UserIcon = () => (
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
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
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

const HomeIcon = () => (
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

const HistoryIcon = () => (
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
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export default function PatientLayout({ children }) {
  const { user, logout } = useAuthStore();
  useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
    navigate("/login");
  }

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Rutas específicas para paciente
  const patientNavItems = [
    { to: "/", label: "Inicio", icon: HomeIcon, end: true },
    { to: `/${slug}/mis-citas`, label: "Mis citas", icon: CalendarIcon },
    { to: `/${slug}/agendar`, label: "Agendar cita", icon: PlusIcon, highlight: true },
    { to: `/${slug}/historial`, label: "Historial", icon: HistoryIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navbar */}
      <nav
        className={`
                fixed top-0 left-0 right-0 z-50 transition-all duration-300
                ${
                  scrolled
                    ? "bg-white/80 backdrop-blur-lg shadow-sm border-b border-blue-100/50"
                    : "bg-transparent"
                }
            `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg lg:text-xl">
                  A
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-800 text-lg lg:text-xl leading-tight">
                  ATIENDE
                </span>
                {user?.tenantName && (
                  <span className="text-xs lg:text-sm text-blue-600 font-medium -mt-1">
                    {user.tenantName}
                  </span>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {patientNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `
                                            px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                                            ${
                                              item.highlight
                                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200"
                                                : isActive
                                                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                                            }
                                        `}
                  >
                    <span className="flex items-center gap-2">
                      <Icon />
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}

              {/* User menu */}
              <div className="relative ml-4">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-md">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">Paciente</p>
                  </div>
                </button>

                {/* Dropdown menu con animación mejorada */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-blue-100 py-1 animate-menu-slide-down">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <LogoutIcon />
                      {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-blue-50 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation con animación mejorada */}
          <div
            className={`
                        md:hidden overflow-hidden transition-all duration-300 ease-in-out
                        ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
                    `}
          >
            <div className="py-4 border-t border-blue-100">
              <div className="flex flex-col space-y-2">
                {patientNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) => `
                                                px-4 py-3 rounded-xl text-sm font-medium transition-colors
                                                ${
                                                  item.highlight
                                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                                    : isActive
                                                      ? "bg-blue-600 text-white"
                                                      : "text-gray-600 hover:bg-blue-50"
                                                }
                                            `}
                    >
                      <span className="flex items-center gap-3">
                        <Icon />
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}

                <div className="border-t border-blue-100 my-2 pt-2">
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user?.firstName?.charAt(0)}
                        {user?.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Paciente</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <LogoutIcon />
                      {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16 lg:h-20" />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-sm border border-blue-100/50">
          {children}
        </div>
      </main>

      {/* Estilos para animaciones */}
      <style>{`
                @keyframes menuSlideDown {
                    0% {
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-menu-slide-down {
                    animation: menuSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
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
