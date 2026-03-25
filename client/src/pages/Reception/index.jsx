import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import StatusBadge from "../../components/StatusBadge";
import { getSocket } from "../../hooks/useSocket";

function today() {
  return new Date().toISOString().split("T")[0];
}

// ─── Modal cancelar ────────────────────────────────────────────────────────
function CancelModal({ appointment, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    await onConfirm(reason);
    setSaving(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "28px",
          width: "420px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <h3
          style={{
            margin: "0 0 4px",
            fontSize: "16px",
            fontWeight: 600,
            color: "#0f172a",
          }}
        >
          Cancelar cita
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
          {appointment.patient_first_name} {appointment.patient_last_name} — N°{" "}
          {appointment.queue_position}
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo de cancelación (opcional)..."
          rows={3}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "14px",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "16px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              background: "#fff",
              fontSize: "13px",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              background: "#dc2626",
              color: "#fff",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 500,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Cancelando..." : "Confirmar cancelación"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fila de cita ──────────────────────────────────────────────────────────
function AppointmentRow({
  appt,
  onConfirm,
  onStart,
  onComplete,
  onCancel,
  onHistory,
}) {
  const canConfirm = appt.status === "scheduled";
  const canCancel = !["completed", "cancelled"].includes(appt.status);
  const canStart = appt.status === "confirmed";
  const canComplete = appt.status === "in_progress";

  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
      <td
        style={{
          padding: "14px 16px",
          fontSize: "15px",
          fontWeight: 700,
          color: "#1a3a5c",
          width: "48px",
        }}
      >
        #{appt.queue_position}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
          {appt.patient_first_name} {appt.patient_last_name}
        </div>
        {appt.notes && (
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
            {appt.notes}
          </div>
        )}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: "13px", color: "#475569" }}>
          Dr. {appt.doctor_last_name}
        </div>
        {appt.specialty_name && (
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
            {appt.specialty_name}
          </div>
        )}
      </td>
      <td style={{ padding: "14px 16px" }}>
        {appt.room_name && (
          <div style={{ fontSize: "13px", color: "#475569" }}>
            {appt.room_name}
          </div>
        )}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <StatusBadge status={appt.status} />
        {appt.is_extra && (
          <div
            style={{
              fontSize: "11px",
              color: "#f97316",
              marginTop: "4px",
              fontWeight: 500,
            }}
          >
            + Adicional
          </div>
        )}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {canConfirm && (
            <button onClick={() => onConfirm(appt)} style={btnStyle("#16a34a")}>
              ✓ Llegó
            </button>
          )}
          {canStart && (
            <button onClick={() => onStart(appt)} style={btnStyle("#2563eb")}>
              Iniciar
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => onComplete(appt)}
              style={btnStyle("#7c3aed")}
            >
              Completar
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onCancel(appt)}
              style={btnStyle("#dc2626", true)}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={() => onHistory(appt)}
            style={btnStyle("#64748b", true)}
          >
            Historial
          </button>
        </div>
      </td>
    </tr>
  );
}

function btnStyle(color, outline = false) {
  return {
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: 500,
    borderRadius: "5px",
    cursor: "pointer",
    border: outline ? `1px solid ${color}` : "none",
    background: outline ? "transparent" : color,
    color: outline ? color : "#fff",
    whiteSpace: "nowrap",
  };
}

// ─── Modal historial ───────────────────────────────────────────────────────
function HistoryModal({ appointment, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["history", appointment.id],
    queryFn: () =>
      api
        .get(`/appointments/${appointment.id}/history`)
        .then((r) => r.data.data),
  });

  const STATUS_LABELS = {
    scheduled: "Agendada",
    confirmed: "Confirmada",
    in_progress: "En consulta",
    completed: "Completada",
    cancelled: "Cancelada",
    no_show: "No asistió",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "28px",
          width: "480px",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Historial — {appointment.patient_first_name}{" "}
            {appointment.patient_last_name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#94a3b8",
            }}
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div
            style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}
          >
            Cargando...
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {data?.map((event) => (
              <div
                key={event.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#2563eb",
                    marginTop: "5px",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#0f172a",
                      fontWeight: 500,
                    }}
                  >
                    {event.from_status
                      ? `${STATUS_LABELS[event.from_status]} → `
                      : ""}
                    {STATUS_LABELS[event.to_status]}
                  </div>
                  {event.reason && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        marginTop: "2px",
                      }}
                    >
                      {event.reason}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      marginTop: "2px",
                    }}
                  >
                    {event.first_name
                      ? `${event.first_name} ${event.last_name} · `
                      : ""}
                    {new Date(event.created_at).toLocaleString("es-PE")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function Recepcion() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [date, setDate] = useState(today());
  const [cancelModal, setCancelModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["appointments", date],
    queryFn: () =>
      api.get(`/appointments?date=${date}`).then((r) => r.data.data),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["appointments", date] });

  const startMutation = useMutation({
    mutationFn: (id) => api.patch(`/appointments/${id}/start`),
    onSuccess: invalidate,
  });

  const completeMutation = useMutation({
    mutationFn: (id) => api.patch(`/appointments/${id}/complete`),
    onSuccess: invalidate,
  });

  // Socket — tiempo real
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () =>
      queryClient.invalidateQueries({ queryKey: ["appointments", date] });

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
  }, [date, queryClient]);

  const confirmMutation = useMutation({
    mutationFn: (id) => api.patch(`/appointments/${id}/confirm`),
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      api.patch(`/appointments/${id}/cancel`, { reason }),
    onSuccess: () => {
      setCancelModal(null);
      invalidate();
    },
  });

  const appointments = data || [];
  const stats = {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === "scheduled").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    in_progress: appointments.filter((a) => a.status === "in_progress").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Citas del día
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748b" }}>
            Panel de recepción
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => navigate(`/${slug}/recepcion/pacientes`)}
            style={{
              padding: "8px 14px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              background: "#fff",
              fontSize: "13px",
              cursor: "pointer",
              color: "#475569",
              fontWeight: 500,
            }}
          >
            👤 Pacientes
          </button>
          <button
            onClick={() => navigate(`/${slug}/recepcion/agendar`)}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: "8px",
              background: "#2563eb",
              fontSize: "13px",
              cursor: "pointer",
              color: "#fff",
              fontWeight: 500,
            }}
          >
            + Agendar
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#0f172a",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total", value: stats.total, color: "#2563eb" },
          { label: "Pendientes", value: stats.scheduled, color: "#f59e0b" },
          { label: "Confirmadas", value: stats.confirmed, color: "#16a34a" },
          { label: "En consulta", value: stats.in_progress, color: "#f97316" },
          { label: "Completadas", value: stats.completed, color: "#64748b" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              border: "1px solid #e8edf2",
              borderRadius: "10px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "28px", fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
            <div
              style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8edf2",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div
            style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}
          >
            Cargando citas...
          </div>
        ) : error ? (
          <div
            style={{ padding: "48px", textAlign: "center", color: "#dc2626" }}
          >
            Error al cargar citas
          </div>
        ) : appointments.length === 0 ? (
          <div
            style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
            No hay citas para esta fecha
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #e8edf2",
                }}
              >
                {[
                  "N°",
                  "Paciente",
                  "Doctor",
                  "Consultorio",
                  "Estado",
                  "Acciones",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <AppointmentRow
                  key={appt.id}
                  appt={appt}
                  onConfirm={(a) => confirmMutation.mutate(a.id)}
                  onStart={(a) => startMutation.mutate(a.id)}
                  onComplete={(a) => completeMutation.mutate(a.id)}
                  onCancel={(a) => setCancelModal(a)}
                  onHistory={(a) => setHistoryModal(a)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {cancelModal && (
        <CancelModal
          appointment={cancelModal}
          onClose={() => setCancelModal(null)}
          onConfirm={(reason) =>
            cancelMutation.mutateAsync({ id: cancelModal.id, reason })
          }
        />
      )}
      {historyModal && (
        <HistoryModal
          appointment={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
}
