import { Navigate } from "react-router-dom";
import useAuthStore from "../store/auth.store";

function getDefaultRoute(user) {
  if (!user) return "/login";
  const slug = user.tenantSlug;
  switch (user.role) {
    case "super_admin":
      return "/super-admin";
    case "admin":
      return `/${slug}/admin`;
    case "receptionist":
      return `/${slug}/recepcion`;
    case "doctor":
      return `/${slug}/doctor`;
    case "patient":
      return `/${slug}/mis-citas`;
    default:
      return `/${slug}/recepcion`;
  }
}

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (window.location.pathname === "/") {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
