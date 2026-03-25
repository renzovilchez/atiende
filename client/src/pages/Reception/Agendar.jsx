import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useTenantSlug } from "../../hooks/useTenantSlug";

function today() {
  return new Date().toISOString().split("T")[0];
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function RecepcionAgendar() {
  const navigate = useNavigate();
  const slug = useTenantSlug();
  const [form, setForm] = useState({
    patient_id: "",
    specialty_id: "",
    doctor_id: "",
    date: today(),
    notes: "",
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatients, setShowPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [success, setSuccess] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(patientSearch), 400);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Búsqueda de pacientes
  const { data: patients = [] } = useQuery({
    queryKey: ["patients", "search", debouncedSearch],
    queryFn: () =>
      api.get(`/patients?search=${debouncedSearch}`).then((r) => r.data.data),
    enabled: debouncedSearch.length >= 2,
  });

  // Especialidades
  const { data: specialties = [] } = useQuery({
    queryKey: ["specialties"],
    queryFn: () => api.get("/specialties").then((r) => r.data.data),
  });

  // Doctores por especialidad
  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors", "specialty", form.specialty_id],
    queryFn: () =>
      api
        .get(`/specialties/${form.specialty_id}/doctors`)
        .then((r) => r.data.data),
    enabled: !!form.specialty_id,
  });

  // Disponibilidad
  const { data: availability, isFetching: availabilityLoading } = useQuery({
    queryKey: ["availability", form.doctor_id, form.date],
    queryFn: () =>
      api
        .get(`/doctors/${form.doctor_id}/availability?date=${form.date}`)
        .then((r) => r.data.data),
    enabled: !!form.doctor_id && !!form.date,
  });

  const bookMutation = useMutation({
    mutationFn: (data) => api.post("/appointments", data),
    onSuccess: (res) => setSuccess(res.data.data),
  });

  function selectPatient(p) {
    setSelectedPatient(p);
    set("patient_id", p.id);
    setPatientSearch(`${p.first_name} ${p.last_name}`);
    setShowPatients(false);
  }

  function handleSpecialtyChange(val) {
    set("specialty_id", val);
    set("doctor_id", "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patient_id || !form.doctor_id || !form.date) return;
    await bookMutation.mutateAsync({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      date: form.date,
      notes: form.notes || undefined,
    });
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cita agendada</h2>
        <p className="text-gray-600 mb-2">
          <span className="font-semibold">
            {selectedPatient?.first_name} {selectedPatient?.last_name}
          </span>
        </p>
        <p className="text-gray-500 mb-8">Turno #{success.queue_position}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setSuccess(null);
              setForm({
                patient_id: "",
                specialty_id: "",
                doctor_id: "",
                date: today(),
                notes: "",
              });
              setSelectedPatient(null);
              setPatientSearch("");
            }}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-all"
          >
            Nueva cita
          </button>
          <button
            onClick={() => navigate(`/${slug}/recepcion`)}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
          >
            Ver panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/${slug}/recepcion`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Volver a recepción
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Agendar cita</h1>
        <p className="text-gray-500 mt-1">
          Registra una nueva cita para un paciente
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6"
      >
        {/* Buscar paciente */}
        <div className="relative min-h-[72px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Paciente <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => {
              setPatientSearch(e.target.value);
              setShowPatients(true);
              if (!e.target.value) {
                setSelectedPatient(null);
                set("patient_id", "");
              }
            }}
            placeholder="Buscar por nombre o DNI..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
          />
          {showPatients && patients.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {patients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPatient(p)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-gray-900">
                    {p.first_name} {p.last_name}
                  </span>
                  <span className="text-sm text-gray-400">
                    {p.dni || p.email}
                  </span>
                </button>
              ))}
            </div>
          )}
          {selectedPatient && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {selectedPatient.first_name[0]}
              </div>
              <span className="text-sm font-medium text-blue-700">
                {selectedPatient.first_name} {selectedPatient.last_name}
              </span>
              {selectedPatient.dni && (
                <span className="text-xs text-blue-500">
                  DNI: {selectedPatient.dni}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Especialidad */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Especialidad <span className="text-red-500">*</span>
          </label>
          <select
            value={form.specialty_id}
            onChange={(e) => handleSpecialtyChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white"
          >
            <option value="">Seleccionar especialidad...</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Doctor <span className="text-red-500">*</span>
          </label>
          <select
            value={form.doctor_id}
            onChange={(e) => set("doctor_id", e.target.value)}
            disabled={!form.specialty_id}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Seleccionar doctor...</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.first_name} {d.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.date}
            min={today()}
            onChange={(e) => set("date", e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Disponibilidad */}
        <div className="min-h-[56px]">
          {form.doctor_id &&
            (availabilityLoading ? (
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                <p className="text-sm text-gray-400">
                  Verificando disponibilidad...
                </p>
              </div>
            ) : availability ? (
              <div
                className={`p-4 rounded-xl border ${availability.available ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}
              >
                {availability.available ? (
                  <p className="text-sm font-medium text-green-700">
                    ✓ {availability.remaining} cupos disponibles ·{" "}
                    {availability.start_time?.slice(0, 5)} –{" "}
                    {availability.end_time?.slice(0, 5)}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-orange-700">
                    ⚠ Cupo lleno — se agendará como paciente adicional
                  </p>
                )}
              </div>
            ) : null)}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Notas <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Síntomas, motivo de consulta..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Error */}
        {bookMutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">
              {bookMutation.error?.response?.data?.error ||
                "Error al agendar la cita"}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={
            !form.patient_id ||
            !form.doctor_id ||
            !form.date ||
            bookMutation.isPending
          }
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
        >
          {bookMutation.isPending ? "Agendando..." : "Agendar cita"}
        </button>
      </form>
    </div>
  );
}
