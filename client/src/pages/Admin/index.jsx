import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import useAuthStore from "../../store/auth.store";
import { getSocket } from "../../hooks/useSocket";

function today() {
  return new Date().toISOString().split("T")[0];
}

const NAV_CARDS = [
  {
    to: "/admin/doctores",
    emoji: "👨‍⚕️",
    title: "Doctores",
    desc: "Gestiona el equipo médico",
  },
  {
    to: "/admin/especialidades",
    emoji: "🔬",
    title: "Especialidades",
    desc: "Servicios que ofrece la clínica",
  },
  {
    to: "/admin/turnos",
    emoji: "🗓️",
    title: "Turnos",
    desc: "Horarios de atención",
  },
  {
    to: "/admin/clinica",
    emoji: "🏥",
    title: "Mi clínica",
    desc: "Datos y configuración",
  },
  {
    to: "/admin/plano",
    emoji: "🟢",
    title: "Plano en tiempo real",
    desc: "Plano visual de la clínica",
  },
  {
    to: "/admin/plano/configurar",
    emoji: "🗺️",
    title: "Configurar plano",
    desc: "Configura pisos y consultorios",
  },
  {
    to: "/admin/reportes",
    emoji: "📊",
    title: "Reportes",
    desc: "Estadísticas y métricas",
  },
];

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: appointments = [] } = useQuery({
    queryKey: ["admin-today", today()],
    queryFn: () =>
      api.get(`/appointments?date=${today()}`).then((r) => r.data.data),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: () => api.get("/doctors").then((r) => r.data.data),
  });

  const stats = [
    {
      label: "Citas hoy",
      value: appointments.length,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "En consulta",
      value: appointments.filter((a) => a.status === "in_progress").length,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Completadas hoy",
      value: appointments.filter((a) => a.status === "completed").length,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Doctores activos",
      value: doctors.length,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-today", today()] });
    };

    socket.on("appointment:created", handleUpdate);
    socket.on("appointment:updated", handleUpdate);
    socket.on("appointment:cancelled", handleUpdate);
    socket.on("appointment:rescheduled", handleUpdate);

    return () => {
      socket.off("appointment:created", handleUpdate);
      socket.off("appointment:updated", handleUpdate);
      socket.off("appointment:cancelled", handleUpdate);
      socket.off("appointment:rescheduled", handleUpdate);
    };
  }, [user?.id]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Panel de administración
        </h1>
        <p className="text-gray-500 mt-1">
          Bienvenido, {user?.firstName} ·{" "}
          {new Date().toLocaleDateString("es-PE", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-200 p-6"
          >
            <div className={`text-3xl font-bold mb-1 ${s.color}`}>
              {s.value}
            </div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {NAV_CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all"
          >
            <div className="text-4xl mb-4">{card.emoji}</div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
              {card.title}
            </h3>
            <p className="text-sm text-gray-500">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
