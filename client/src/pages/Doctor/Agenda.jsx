import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { format, addDays, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import api from "../../api/axios";
import useAuthStore from "../../store/auth.store";
import StatusBadge from "../../components/StatusBadge";
import { getSocket } from "../../hooks/useSocket";

// Iconos
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

const ChevronLeftIcon = () => (
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
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const ChevronRightIcon = () => (
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
      d="M9 5l7 7-7 7"
    />
  </svg>
);

export default function DoctorAgenda() {
  const { user } = useAuthStore();
  const { slug } = useParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  const queryClient = useQueryClient();

  // Obtener ID del doctor
  const { data: doctorData } = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: () => api.get("/doctors/me").then((r) => r.data.data),
    enabled: !!user?.id,
  });

  const dateStr = selectedDate.toISOString().split("T")[0];

  // Obtener citas del día seleccionado
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["doctor-agenda", doctorData?.id, dateStr],
    queryFn: () =>
      api
        .get(`/appointments?date=${dateStr}&doctor_id=${doctorData?.id}`)
        .then((r) => r.data.data),
    enabled: !!doctorData?.id,
  });

  // Calcular días de la semana basados en el offset
  const baseDate = addDays(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    weekOffset * 7,
  );

  const weekDays = [...Array(7)].map((_, i) => {
    const date = addDays(baseDate, i);
    return {
      date,
      dayName: format(date, "EEEE", { locale: es }),
      dayNumber: format(date, "d"),
      monthName: format(date, "MMMM", { locale: es }),
      isToday: format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
      isSelected: format(date, "yyyy-MM-dd") === dateStr,
    };
  });

  useEffect(() => {
    if (!doctorData?.id) return;
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({
        queryKey: ["doctor-agenda", doctorData.id, dateStr],
      });
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
  }, [doctorData?.id, dateStr]);

  const handlePrevWeek = () => {
    setWeekOffset((prev) => prev - 1);
    setSelectedDate(addDays(weekDays[0].date, -7));
  };

  const handleNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
    setSelectedDate(addDays(weekDays[6].date, 1));
  };

  const handleToday = () => {
    setWeekOffset(0);
    setSelectedDate(new Date());
  };

  if (!doctorData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header con botón de inicio */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi agenda</h1>
          <p className="text-gray-600 flex items-center gap-2">
            Dr. {doctorData.first_name} {doctorData.last_name}
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-sm text-gray-500">
              {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </span>
          </p>
        </div>
        <Link
          to={`/${slug}/doctor`}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <HomeIcon />
          Inicio
        </Link>
      </div>

      {/* Selector de semana mejorado */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-gray-700">
              Semana del{" "}
              {format(weekDays[0].date, "d 'de' MMMM", { locale: es })}
            </h2>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Hoy
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`
                                    p-4 rounded-xl text-center transition-all duration-200
                                    hover:scale-105 active:scale-95
                                    ${
                                      day.isSelected
                                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200"
                                        : day.isToday
                                          ? "bg-blue-50 text-blue-600 border-2 border-blue-200"
                                          : "hover:bg-gray-50 border-2 border-transparent"
                                    }
                                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <p className="text-xs uppercase font-medium mb-1">
                  {day.dayName.slice(0, 3)}
                </p>
                <p className="text-2xl font-bold mb-1">{day.dayNumber}</p>
                <p className="text-xs opacity-75">
                  {day.monthName.slice(0, 3)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <CalendarIcon />
              Citas del {format(selectedDate, "d 'de' MMMM", { locale: es })}
            </h2>
            <span className="text-sm text-gray-500">
              {appointments.length}{" "}
              {appointments.length === 1 ? "cita" : "citas"}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center animate-fadeIn">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-500 mb-2">
              No hay citas programadas para este día
            </p>
            <p className="text-sm text-gray-400">
              Selecciona otro día en el calendario
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {appointments.map((appt, index) => (
              <div
                key={appt.id}
                className="p-4 hover:bg-gray-50 transition-all duration-200 hover:pl-6 group animate-slideUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center font-bold text-blue-600 group-hover:scale-110 transition-transform">
                        #{appt.queue_position}
                      </div>
                      {appt.notes && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {appt.patient_first_name} {appt.patient_last_name}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {appt.notes ? (
                          <span className="italic">"{appt.notes}"</span>
                        ) : (
                          <span>Sin notas</span>
                        )}
                        {appt.extra_service && (
                          <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-orange-500 font-medium">
                              + {appt.extra_service}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={appt.status} size="sm" />
                    <button
                      onClick={() => {
                        /* Aquí podrías agregar acción de ver detalles */
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Ver detalles"
                    >
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
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estilos para animaciones */}
      <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
    </div>
  );
}
