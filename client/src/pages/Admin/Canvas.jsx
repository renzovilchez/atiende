import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getMyLayout } from "../../api/layout.api";
import { getRoomsStatus } from "../../api/rooms.api";
import { getSocket } from "../../hooks/useSocket";
import useAuthStore from "../../store/auth.store";

// ─── Colores por estado ───────────────────────────────────────────────────────
const STATUS_COLOR = {
  available: { fill: "#dcfce7", stroke: "#16a34a", label: "Libre" },
  in_progress: { fill: "#fee2e2", stroke: "#dc2626", label: "En consulta" },
  waiting: { fill: "#fef9c3", stroke: "#ca8a04", label: "En espera" },
};

function getColor(status) {
  return STATUS_COLOR[status] || STATUS_COLOR.available;
}

// ─── Hook: fusiona layout + status ───────────────────────────────────────────
function useCanvasData() {
  const layout = useQuery({
    queryKey: ["layout"],
    queryFn: getMyLayout,
  });

  const status = useQuery({
    queryKey: ["rooms-status"],
    queryFn: getRoomsStatus,
    refetchInterval: 5_000, // fallback por si el socket falla
  });

  // Mapa roomId → status para lookup O(1)
  const statusMap = {};
  if (status.data) {
    status.data.forEach((r) => {
      statusMap[r.id] = {
        ...r,
        status: r.status === "occupied" ? "in_progress" : r.status,
      };
    });
  }

  return {
    layout: layout.data,
    statusMap,
    isLoading: layout.isLoading || status.isLoading,
    isError: layout.isError || status.isError,
  };
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────
function ClinicCanvas({ floor, statusMap, liveStatus, onHover }) {
  const canvasRef = useRef(null);
  const CANVAS_H = 500;

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || !floor || !floor.rooms) return;

    const dpr = window.devicePixelRatio || 1;
    const CANVAS_W = canvas.parentElement.offsetWidth - 32;

    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    floor.rooms.forEach((room) => {
      const liveRoom = statusMap[room.id] || {};
      const rawStatus = liveRoom.status || room.status || "available";
      const { position_x: x, position_y: y, width: w, height: h } = room;
      if (x == null || y == null) return;

      const roomStatus = rawStatus === "occupied" ? "in_progress" : rawStatus;
      const { fill, stroke, label } = getColor(roomStatus);

      ctx.shadowColor = "rgba(0,0,0,0.08)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(x, y, w || 120, h || 80, 8);
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w || 120, h || 80, 8);
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const centerX = x + (w || 120) / 2;
      const centerY = y + (h || 80) / 2 - 16;
      ctx.fillText(room.name, centerX, centerY, (w || 120) - 12);

      if (room.number) {
        ctx.fillStyle = "#64748b";
        ctx.font = "11px Inter, system-ui, sans-serif";
        ctx.fillText(`#${room.number}`, centerX, centerY + 16);
      }

      // Doctor asignado
      const doctor = liveRoom.current_doctor;
      if (doctor) {
        ctx.fillStyle = "#475569";
        ctx.font = "11px Inter, system-ui, sans-serif";
        ctx.fillText(`Dr. ${doctor}`, centerX, centerY + 30, (w || 120) - 12);
      }

      // Paciente actual
      const patient = liveRoom.current_patient;
      if (patient && roomStatus !== "available") {
        ctx.fillStyle = "#64748b";
        ctx.font = "10px Inter, system-ui, sans-serif";
        ctx.fillText(`👤 ${patient}`, centerX, centerY + 44, (w || 120) - 12);
      }

      ctx.fillStyle = stroke;
      ctx.font = "bold 10px Inter, system-ui, sans-serif";
      ctx.fillText(label.toUpperCase(), centerX, y + (h || 80) - 12);
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    draw();

    const observer = new ResizeObserver(() => draw());
    observer.observe(canvas.parentElement);

    return () => observer.disconnect();
  }, [floor, statusMap, liveStatus]);

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hit = floor.rooms.find((room) => {
      const { position_x: x, position_y: y, width: w, height: h } = room;
      if (x == null) return false;
      return mx >= x && mx <= x + (w || 120) && my >= y && my <= y + (h || 80);
    });

    canvas.style.cursor = hit ? "pointer" : "default";
    onHover(hit ? { room: hit, mx: e.clientX, my: e.clientY } : null);
  }

  function handleMouseLeave() {
    onHover(null);
  }

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="rounded-xl border border-gray-200"
      style={{ display: "block" }}
    />
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ data, statusMap }) {
  if (!data) return null;
  const { room, mx, my } = data;
  const live = statusMap[room.id] || {};
  const status = live.status || room.status || "available";
  const { fill, stroke, label } = getColor(status);

  return (
    <div
      className="fixed z-50 pointer-events-none bg-white border shadow-xl rounded-xl p-3 min-w-[180px]"
      style={{ left: mx + 12, top: my - 10, borderColor: stroke }}
    >
      <p className="font-semibold text-gray-900 text-sm">{room.name}</p>
      {room.number && (
        <p className="text-xs text-gray-400 mb-2">Código: {room.number}</p>
      )}
      <div
        className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold mb-2"
        style={{ background: fill, color: stroke }}
      >
        {label}
      </div>
      {live.current_patient && (
        <p className="text-xs text-gray-600">👤 {live.current_patient}</p>
      )}
      {live.queue_count > 0 && (
        <p className="text-xs text-gray-500">🕐 {live.queue_count} en espera</p>
      )}
    </div>
  );
}

// ─── Leyenda ──────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {Object.entries(STATUS_COLOR).map(([key, { fill, stroke, label }]) => (
        <div key={key} className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded"
            style={{ background: fill, border: `2px solid ${stroke}` }}
          />
          <span className="text-xs text-gray-600">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AdminCanvas() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { layout, statusMap, isLoading, isError } = useCanvasData();
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const { user } = useAuthStore();

  // Socket: actualizar statusMap en tiempo real
  const [liveStatus, setLiveStatus] = useState({});

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleRoomStatus({
      room_id,
      status,
      current_patient,
      current_doctor,
      queue_count,
    }) {
      const normalizedStatus = status === "occupied" ? "in_progress" : status;
      setLiveStatus((prev) => ({
        ...prev,
        [room_id]: {
          status: normalizedStatus,
          current_patient: current_patient ?? null,
          current_doctor: current_doctor ?? null,
          queue_count: queue_count ?? 0,
        },
      }));
    }

    socket.on("room:status_changed", handleRoomStatus);
    return () => socket.off("room:status_changed", handleRoomStatus);
  }, []);

  // Merge statusMap de la API con updates en tiempo real del socket
  const mergedStatusMap = { ...statusMap, ...liveStatus };

  // Seleccionar primer piso por defecto cuando carga el layout
  useEffect(() => {
    if (layout?.floors?.length && !selectedFloorId) {
      setSelectedFloorId(layout.floors[0].id);
    }
  }, [layout]);

  const currentFloor = layout?.floors?.find((f) => f.id === selectedFloorId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-32">
        <p className="text-red-500 font-medium">Error al cargar el plano</p>
      </div>
    );
  }

  const hasRooms = layout?.floors?.some((f) => f.rooms?.length > 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() =>
              navigate(user?.role === "admin" ? `/${slug}/admin` : `/${slug}/recepcion`)
            }
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Plano en tiempo real
          </h1>
          <p className="text-gray-500 mt-1">
            Estado actual de los consultorios de la clínica
          </p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => navigate(`/${slug}/admin/plano/configurar`)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ⚙️ Configurar plano
          </button>
        )}
      </div>

      {!hasRooms ? (
        <div className="text-center py-32 bg-white rounded-2xl border border-gray-200">
          <div className="text-5xl mb-4">🗺️</div>
          <p className="text-gray-500 font-medium mb-2">
            No hay consultorios configurados
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Configura los pisos y consultorios para ver el plano
          </p>
          <button
            onClick={() => navigate(`/${slug}/admin/plano/configurar`)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm"
          >
            Ir a configuración
          </button>
        </div>
      ) : (
        <>
          {/* Selector de piso */}
          {layout.floors.length > 1 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {layout.floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => setSelectedFloorId(floor.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selectedFloorId === floor.id
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {floor.name}
                </button>
              ))}
            </div>
          )}

          {/* Canvas */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">
                {currentFloor?.name}
                <span className="ml-2 text-gray-400 font-normal">
                  {currentFloor?.rooms?.length ?? 0} consultorio
                  {currentFloor?.rooms?.length !== 1 ? "s" : ""}
                </span>
              </p>
              <Legend />
            </div>

            {currentFloor && currentFloor.rooms ? (
              currentFloor.rooms.length === 0 ? (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🚪</div>
                    <p className="text-gray-400 text-sm">
                      Este piso no tiene consultorios
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/${slug}/admin/plano/configurar/${currentFloor.id}/consultorios`)
                      }
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Agregar consultorios
                    </button>
                  </div>
                </div>
              ) : (
                <ClinicCanvas
                  floor={currentFloor}
                  statusMap={mergedStatusMap}
                  liveStatus={liveStatus}
                  onHover={setTooltip}
                />
              )
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            )}
          </div>
        </>
      )}

      <Tooltip data={tooltip} statusMap={mergedStatusMap} />
    </div>
  );
}
