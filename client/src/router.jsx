import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layouts";
import Login from "./pages/Login";
import TenantLogin from "./pages/TenantLogin";
import Pricing from "./pages/Pricing";

// ── Paciente ──────────────────────────────────────────────
import MisCitas from "./pages/Patient/MisCitas";
import Agendar from "./pages/Patient/Agendar";

// ── Recepción ─────────────────────────────────────────────
import Recepcion from "./pages/Reception/index";
import RecepcionAgendar from "./pages/Reception/Agendar";
import RecepcionPacientes from "./pages/Reception/Pacientes";

// ── Doctor ────────────────────────────────────────────────
import DoctorDashboard from "./pages/Doctor/index";
import DoctorCola from "./pages/Doctor/Cola";
import DoctorAgenda from "./pages/Doctor/Agenda";

// ── Admin de clínica ──────────────────────────────────────
import AdminDashboard from "./pages/Admin/index";
import AdminDoctores from "./pages/Admin/Doctores";
import AdminEspecialidades from "./pages/Admin/Especialidades";
import AdminTurnos from "./pages/Admin/Turnos";
import AdminClinica from "./pages/Admin/Clinica";
import AdminReportes from "./pages/Admin/Reportes";
import AdminCanvas from "./pages/Admin/Canvas";
import AdminPlano from "./pages/Admin/Plano";
import AdminConsultorios from "./pages/Admin/Consultorios";
import PlanoEditor from "./pages/Admin/PlanoEditor";

// ── Super Admin (plataforma) ──────────────────────────────
import SuperAdminDashboard from "./pages/SuperAdmin/index";
import SuperAdminClinicas from "./pages/SuperAdmin/Clinicas";
import SuperAdminPlanes from "./pages/SuperAdmin/Planes";
import SuperAdminMetricas from "./pages/SuperAdmin/Metricas";

// ── Shared ────────────────────────────────────────────────
import NotFound from "./pages/NotFound";

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder temporal para páginas aún no implementadas
// ─────────────────────────────────────────────────────────────────────────────
const Placeholder = ({ title }) => (
  <div className="py-20 text-center">
    <div className="text-6xl mb-4">🚧</div>
    <h2 className="text-2xl font-semibold text-gray-700 mb-2">{title}</h2>
    <p className="text-gray-400">Próximamente</p>
  </div>
);

function WithLayout({ children }) {
  return <Layout>{children}</Layout>;
}

function P(element, roles = []) {
  return (
    <ProtectedRoute roles={roles}>
      <WithLayout>{element}</WithLayout>
    </ProtectedRoute>
  );
}

const router = createBrowserRouter([
  // ── Públicas ─────────────────────────────────────────────
  { path: "/login", element: <Login /> },
  { path: "/pricing", element: <Pricing /> },
  { path: "/:slug/login", element: <TenantLogin /> },

  // ── Super Admin (sin slug, opera a nivel plataforma) ─────
  {
    path: "/super-admin",
    element: P(<SuperAdminDashboard />, ["super_admin"]),
  },
  {
    path: "/super-admin/clinicas",
    element: P(<SuperAdminClinicas />, ["super_admin"]),
  },
  {
    path: "/super-admin/planes",
    element: P(<SuperAdminPlanes />, ["super_admin"]),
  },
  {
    path: "/super-admin/metricas",
    element: P(<SuperAdminMetricas />, ["super_admin"]),
  },

  // ── Tenant routes (con slug) ──────────────────────────────
  { path: "/:slug/mis-citas", element: P(<MisCitas />, ["patient"]) },
  { path: "/:slug/agendar", element: P(<Agendar />, ["patient"]) },
  { path: "/:slug/historial", element: P(<Placeholder />, ["patient"]) },

  {
    path: "/:slug/recepcion",
    element: P(<Recepcion />, ["receptionist", "admin"]),
  },
  {
    path: "/:slug/recepcion/agendar",
    element: P(<RecepcionAgendar />, ["receptionist", "admin"]),
  },
  {
    path: "/:slug/recepcion/pacientes",
    element: P(<RecepcionPacientes />, ["receptionist", "admin"]),
  },
  {
    path: "/:slug/recepcion/plano",
    element: P(<AdminCanvas />, ["receptionist", "admin"]),
  },

  { path: "/:slug/doctor", element: P(<DoctorDashboard />, ["doctor"]) },
  { path: "/:slug/doctor/cola", element: P(<DoctorCola />, ["doctor"]) },
  { path: "/:slug/doctor/agenda", element: P(<DoctorAgenda />, ["doctor"]) },

  { path: "/:slug/admin", element: P(<AdminDashboard />, ["admin"]) },
  { path: "/:slug/admin/doctores", element: P(<AdminDoctores />, ["admin"]) },
  {
    path: "/:slug/admin/especialidades",
    element: P(<AdminEspecialidades />, ["admin"]),
  },
  { path: "/:slug/admin/turnos", element: P(<AdminTurnos />, ["admin"]) },
  { path: "/:slug/admin/clinica", element: P(<AdminClinica />, ["admin"]) },
  { path: "/:slug/admin/reportes", element: P(<AdminReportes />, ["admin"]) },
  { path: "/:slug/admin/plano", element: P(<AdminCanvas />, ["admin"]) },
  {
    path: "/:slug/admin/plano/configurar",
    element: P(<AdminPlano />, ["admin"]),
  },
  {
    path: "/:slug/admin/plano/configurar/:floorId/consultorios",
    element: P(<AdminConsultorios />, ["admin"]),
  },
  {
    path: "/:slug/admin/plano/configurar/:floorId/editor",
    element: P(<PlanoEditor />, ["admin"]),
  },

  // ── Raíz ─────────────────────────────────────────────────
  { path: "/", element: <ProtectedRoute /> },

  // ── 404 ──────────────────────────────────────────────────
  { path: "/404", element: <NotFound /> },
  { path: "*", element: <Navigate to="/404" replace /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
