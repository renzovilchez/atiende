import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useTenantSlug } from "../../hooks/useTenantSlug";

const DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function ScheduleModal({
  schedule,
  doctorId,
  rooms,
  usedDays = [],
  onClose,
  onSuccess,
}) {
  const isEdit = !!schedule;
  const [form, setForm] = useState({
    day_of_week: schedule?.day_of_week ?? "",
    start_time: schedule?.start_time?.slice(0, 5) || "",
    end_time: schedule?.end_time?.slice(0, 5) || "",
    max_patients: schedule?.max_patients || 20,
    room_id: schedule?.room_id || "",
  });
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? api.patch(`/schedules/${schedule.id}`, data)
        : api.post("/schedules", { ...data, doctor_id: doctorId }),
    onSuccess: (res) => onSuccess(res.data.data),
    onError: (err) => setError(err.response?.data?.error || "Error al guardar"),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    mutation.mutate({
      day_of_week: parseInt(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      max_patients: parseInt(form.max_patients),
      ...(form.room_id && { room_id: form.room_id }),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Editar turno" : "Nuevo turno"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Día *
            </label>
            <select
              value={form.day_of_week}
              onChange={(e) => set("day_of_week", e.target.value)}
              required
              disabled={isEdit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Seleccionar día...</option>
              {DAYS.map((d, i) => (
                <option key={i} value={i} disabled={usedDays.includes(i)}>
                  {d} {usedDays.includes(i) ? "(ya tiene turno)" : ""}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="text-xs text-gray-400 mt-1">
                El día no se puede cambiar
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Inicio *
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Fin *
              </label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Cupo máximo *
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={form.max_patients}
              onChange={(e) => set("max_patients", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Consultorio
            </label>
            <select
              value={form.room_id}
              onChange={(e) => set("room_id", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Sin consultorio</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.number ? ` (${r.number})` : ""}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold"
            >
              {mutation.isPending
                ? "Guardando..."
                : isEdit
                  ? "Guardar"
                  : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminTurnos() {
  const navigate = useNavigate();
  const slug = useTenantSlug();
  const queryClient = useQueryClient();
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [modal, setModal] = useState(null); // null | 'create' | schedule object

  const { data: doctors = [] } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: () => api.get("/doctors").then((r) => r.data.data),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get("/rooms").then((r) => r.data.data),
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules", selectedDoctor],
    queryFn: () =>
      api
        .get(`/schedules?doctor_id=${selectedDoctor}`)
        .then((r) => r.data.data),
    enabled: !!selectedDoctor,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/schedules/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["schedules", selectedDoctor],
      }),
  });

  function handleSuccess() {
    setModal(null);
    queryClient.invalidateQueries({ queryKey: ["schedules", selectedDoctor] });
  }

  function handleDelete(s) {
    if (
      confirm(
        `¿Eliminar el turno del ${DAYS[s.day_of_week]}? Esta acción no se puede deshacer.`,
      )
    )
      deleteMutation.mutate(s.id);
  }

  const usedDays = schedules.map((s) => s.day_of_week);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate(`/${slug}/admin`)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
        >
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Turnos</h1>
        <p className="text-gray-500 mt-1">Horarios de atención por doctor</p>
      </div>

      {/* Selector de doctor */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seleccionar doctor
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
            >
              <option value="">Elegir doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.first_name} {d.last_name}
                </option>
              ))}
            </select>
          </div>
          {selectedDoctor && (
            <button
              onClick={() => setModal("create")}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all whitespace-nowrap"
            >
              + Nuevo turno
            </button>
          )}
        </div>
      </div>

      {/* Horarios */}
      {!selectedDoctor ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-3">🗓️</div>
          <p className="text-gray-500">
            Selecciona un doctor para ver sus turnos
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500 mb-4">
            Este doctor no tiene turnos registrados
          </p>
          <button
            onClick={() => setModal("create")}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {DAYS[s.day_of_week]}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {s.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Horario</span>
                  <span className="font-medium">
                    {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cupo máximo</span>
                  <span className="font-medium">
                    {s.max_patients} pacientes
                  </span>
                </div>
                {s.room_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Consultorio</span>
                    <span className="font-medium">{s.room_name}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setModal(s)}
                  className="flex-1 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ScheduleModal
          schedule={modal === "create" ? null : modal}
          doctorId={selectedDoctor}
          rooms={rooms}
          usedDays={usedDays}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
