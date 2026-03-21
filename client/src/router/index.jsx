import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../layouts";
import Login from "../pages/Login";
import Pricing from "../pages/Pricing";

// ── Paciente ──────────────────────────────────────────────
import MisCitas from "../pages/Patient/MisCitas";
import Agendar from "../pages/Patient/Agendar";

// ── Recepción ─────────────────────────────────────────────
import Recepcion from "../pages/Reception/index";
import RecepcionAgendar from "../pages/Reception/Agendar";
import RecepcionPacientes from "../pages/Reception/Pacientes";

// ── Doctor ────────────────────────────────────────────────
import DoctorDashboard from "../pages/Doctor/index";
import DoctorCola from "../pages/Doctor/Cola";
import DoctorAgenda from "../pages/Doctor/Agenda";

// ── Admin de clínica ──────────────────────────────────────
import AdminDashboard from "../pages/Admin/index";
import AdminDoctores from "../pages/Admin/Doctores";
import AdminEspecialidades from "../pages/Admin/Especialidades";
import AdminTurnos from "../pages/Admin/Turnos";
import AdminClinica from "../pages/Admin/Clinica";
import AdminReportes from "../pages/Admin/Reportes";
import AdminCanvas from "../pages/Admin/Canvas";
import AdminPlano from "../pages/Admin/Plano";
import AdminConsultorios from "../pages/Admin/Consultorios";
import PlanoEditor from "../pages/Admin/PlanoEditor";

// ── Super Admin (plataforma) ──────────────────────────────
import SuperAdminDashboard from "../pages/SuperAdmin/index";
import SuperAdminClinicas from "../pages/SuperAdmin/Clinicas";
import SuperAdminPlanes from "../pages/SuperAdmin/Planes";
import SuperAdminMetricas from "../pages/SuperAdmin/Metricas";

// ── Shared ────────────────────────────────────────────────
import NotFound from "../pages/NotFound";

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

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS
//
// Separación estricta por dominio:
//
//  /login              → público
//  /mis-citas          → patient
//  /agendar            → patient (autoservicio)
//  /recepcion/*        → receptionist + admin (dentro de la clínica)
//  /doctor/*           → doctor
//  /admin/*            → admin (de su clínica, tenant-scoped)
//  /super-admin/*      → super_admin (plataforma, NUNCA datos clínicos)
//
// ─────────────────────────────────────────────────────────────────────────────

const ROUTES = {
  // ── Pública ───────────────────────────────────────────────────────────────
  public: [
    { path: "/login", element: <Login /> },
    { path: "/pricing", element: <Pricing /> },
  ],

  // ── Paciente ──────────────────────────────────────────────────────────────
  // El paciente agenda por su cuenta y ve sus propias citas.
  patient: [
    {
      path: "/mis-citas",
      element: <MisCitas />,
      roles: ["patient"],
    },
    {
      path: "/agendar",
      element: <Agendar />,
      roles: ["patient"],
    },
    {
      path: "/historial",
      element: <Placeholder />,
      roles: ["patient"],
    },
  ],

  // ── Recepción ─────────────────────────────────────────────────────────────
  // Recepcionista y admin de clínica comparten estas vistas operativas.
  // /recepcion           → cola de espera / check-in del día
  // /recepcion/agendar   → agendar a nombre de un paciente (flujo staff)
  // /recepcion/pacientes → buscar / registrar pacientes
  reception: [
    {
      path: "/recepcion",
      element: <Recepcion />,
      roles: ["receptionist", "admin"],
    },
    {
      path: "/recepcion/agendar",
      element: <RecepcionAgendar />,
      roles: ["receptionist", "admin"],
    },
    {
      path: "/recepcion/pacientes",
      element: <RecepcionPacientes />,
      roles: ["receptionist", "admin"],
    },
    {
      path: "/recepcion/plano",
      element: <AdminCanvas />,
      roles: ["receptionist", "admin"],
    },
  ],

  // ── Doctor ────────────────────────────────────────────────────────────────
  // /doctor          → resumen del día (próximas citas, métricas rápidas)
  // /doctor/cola     → pacientes en espera ahora mismo
  // /doctor/agenda   → agenda semanal del doctor
  doctor: [
    {
      path: "/doctor",
      element: <DoctorDashboard />,
      roles: ["doctor"],
    },
    {
      path: "/doctor/cola",
      element: <DoctorCola />,
      roles: ["doctor"],
    },
    {
      path: "/doctor/agenda",
      element: <DoctorAgenda />,
      roles: ["doctor"],
    },
  ],

  // ── Admin de clínica ──────────────────────────────────────────────────────
  // Todo aquí está scoped al clinic_id del JWT. El admin ve y gestiona
  // SOLO los recursos de su propia clínica.
  //
  // /admin               → dashboard: citas hoy, doctores activos, alertas
  // /admin/doctores      → CRUD doctores de la clínica
  // /admin/especialidades→ especialidades ofrecidas
  // /admin/turnos        → horarios y turnos de cada doctor
  // /admin/clinica       → configuración de la clínica (nombre, logo, etc.)
  // /admin/reportes      → reportes de ocupación, ingresos, cancelaciones
  admin: [
    {
      path: "/admin",
      element: <AdminDashboard />,
      roles: ["admin"],
    },
    {
      path: "/admin/doctores",
      element: <AdminDoctores />,
      roles: ["admin"],
    },
    {
      path: "/admin/especialidades",
      element: <AdminEspecialidades />,
      roles: ["admin"],
    },
    {
      path: "/admin/turnos",
      element: <AdminTurnos />,
      roles: ["admin"],
    },
    {
      path: "/admin/clinica",
      element: <AdminClinica />,
      roles: ["admin"],
    },
    {
      path: "/admin/reportes",
      element: <AdminReportes />,
      roles: ["admin"],
    },
    {
      path: "/admin/plano",
      element: <AdminCanvas />,
      roles: ["admin"],
    },
    {
      path: "/admin/plano/configurar",
      element: <AdminPlano />,
      roles: ["admin"],
    },
    {
      path: "/admin/plano/configurar/:floorId/consultorios",
      element: <AdminConsultorios />,
      roles: ["admin"],
    },
    {
      path: "/admin/plano/configurar/:floorId/editor",
      element: <PlanoEditor />,
      roles: ["admin"],
    },
  ],

  // ── Super Admin (plataforma) ──────────────────────────────────────────────
  // Opera a nivel de plataforma. NUNCA accede a datos clínicos directamente.
  // Si necesita "ver" una clínica por soporte, sería via impersonation
  // con log de auditoría (feature futura), no rutas directas.
  //
  // /super-admin             → métricas globales: clínicas activas, MRR, uso
  // /super-admin/clinicas    → CRUD clínicas: aprobar, suspender, cambiar plan
  // /super-admin/planes      → gestión de planes de suscripción y pricing
  // /super-admin/metricas    → analytics de plataforma (churn, growth, etc.)
  superAdmin: [
    {
      path: "/super-admin",
      element: <SuperAdminDashboard />,
      roles: ["super_admin"],
    },
    {
      path: "/super-admin/clinicas",
      element: <SuperAdminClinicas />,
      roles: ["super_admin"],
    },
    {
      path: "/super-admin/planes",
      element: <SuperAdminPlanes />,
      roles: ["super_admin"],
    },
    {
      path: "/super-admin/metricas",
      element: <SuperAdminMetricas />,
      roles: ["super_admin"],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Construye rutas protegidas con Layout
// ─────────────────────────────────────────────────────────────────────────────
const buildProtectedRoutes = (routes) =>
  routes.map(({ path, element, roles }) => ({
    path,
    element: (
      <ProtectedRoute roles={roles}>
        <WithLayout>{element}</WithLayout>
      </ProtectedRoute>
    ),
  }));

const router = createBrowserRouter([
  // Públicas
  ...ROUTES.public,

  // Protegidas
  ...buildProtectedRoutes(ROUTES.patient),
  ...buildProtectedRoutes(ROUTES.reception),
  ...buildProtectedRoutes(ROUTES.doctor),
  ...buildProtectedRoutes(ROUTES.admin),
  ...buildProtectedRoutes(ROUTES.superAdmin),

  // Raíz → ProtectedRoute decide a dónde redirigir según rol
  { path: "/", element: <ProtectedRoute /> },

  // 404
  { path: "/404", element: <NotFound /> },
  { path: "*", element: <Navigate to="/404" replace /> },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
