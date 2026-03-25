import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getRooms, updateRoomPosition } from "../../api/rooms.api";
import { getFloors } from "../../api/floors.api";

const CANVAS_H = 600;
const GRID = 20;
const MIN_SIZE = 80;

function snap(val) {
  return Math.round(val / GRID) * GRID;
}

const STATUS_COLOR = {
  available: { fill: "#dcfce7", stroke: "#16a34a" },
  in_progress: { fill: "#fee2e2", stroke: "#dc2626" },
  waiting: { fill: "#fef9c3", stroke: "#ca8a04" },
};

export default function PlanoEditor() {
  const { floorId, slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const localRoomsRef = useRef(null);
  const selectedIdRef = useRef(null);

  // Estado local de rooms (se edita sin guardar hasta que el user presiona Guardar)
  const [localRooms, setLocalRooms] = useState(null);
  const [dirty, setDirty] = useState(false); // hay cambios sin guardar
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Drag state
  const dragRef = useRef(null); // { type: 'move'|'resize', roomId, startMx, startMy, startX, startY, startW, startH, handle }

  const { data: floors = [] } = useQuery({
    queryKey: ["floors"],
    queryFn: getFloors,
  });
  const currentFloor = floors.find((f) => String(f.id) === String(floorId));

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms", floorId],
    queryFn: getRooms,
    select: (data) =>
      data.filter((r) => String(r.floor_id) === String(floorId)),
  });

  // Inicializa localRooms cuando llegan los datos
  useEffect(() => {
    if (rooms.length && !localRooms) {
      setLocalRooms(rooms.map((r) => ({ ...r })));
    }
  }, [rooms]);

  useEffect(() => {
    localRoomsRef.current = localRooms;
  }, [localRooms]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // ─── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !localRoomsRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const CANVAS_W = container.offsetWidth;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Fondo
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < CANVAS_W; x += GRID) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += GRID) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    localRoomsRef.current.forEach((room) => {
      const { position_x: x, position_y: y, width: w, height: h } = room;
      if (x == null || y == null) return;

      const isSelected = room.id === selectedIdRef.current;
      const { fill, stroke } = STATUS_COLOR.available;

      // Sombra
      ctx.shadowColor = isSelected ? "rgba(37,99,235,0.2)" : "rgba(0,0,0,0.08)";
      ctx.shadowBlur = isSelected ? 12 : 6;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = isSelected ? "#eff6ff" : fill;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.strokeStyle = isSelected ? "#2563eb" : stroke;
      ctx.lineWidth = isSelected ? 2.5 : 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.stroke();

      // Nombre
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(room.name, x + w / 2, y + h / 2 - 8, w - 12);

      if (room.number) {
        ctx.fillStyle = "#64748b";
        ctx.font = "11px Inter, system-ui, sans-serif";
        ctx.fillText(`#${room.number}`, x + w / 2, y + h / 2 + 10);
      }

      // Handles de resize si está seleccionado
      if (isSelected) {
        const handles = getHandles(room);
        handles.forEach(({ hx, hy }) => {
          ctx.fillStyle = "#fff";
          ctx.strokeStyle = "#2563eb";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hx, hy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }
    });
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => requestAnimationFrame(draw));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    requestAnimationFrame(draw);
  }, [localRooms, selectedId]);

  // ─── Handles de resize ───────────────────────────────────────────────────────
  function getHandles(room) {
    const { position_x: x, position_y: y, width: w, height: h } = room;
    return [
      { hx: x, hy: y, cursor: "nw-resize", handle: "nw" },
      { hx: x + w, hy: y, cursor: "ne-resize", handle: "ne" },
      { hx: x, hy: y + h, cursor: "sw-resize", handle: "sw" },
      { hx: x + w, hy: y + h, cursor: "se-resize", handle: "se" },
      { hx: x + w / 2, hy: y, cursor: "n-resize", handle: "n" },
      { hx: x + w / 2, hy: y + h, cursor: "s-resize", handle: "s" },
      { hx: x, hy: y + h / 2, cursor: "w-resize", handle: "w" },
      { hx: x + w, hy: y + h / 2, cursor: "e-resize", handle: "e" },
    ];
  }

  function getHandleAt(mx, my) {
    if (!selectedId || !localRooms) return null;
    const room = localRooms.find((r) => r.id === selectedId);
    if (!room) return null;
    for (const h of getHandles(room)) {
      const dx = mx - h.hx,
        dy = my - h.hy;
      if (Math.sqrt(dx * dx + dy * dy) <= 8) return h;
    }
    return null;
  }

  function getRoomAt(mx, my) {
    if (!localRooms) return null;
    // Recorre en reversa para seleccionar el que está encima
    for (let i = localRooms.length - 1; i >= 0; i--) {
      const r = localRooms[i];
      if (r.position_x == null) continue;
      if (
        mx >= r.position_x &&
        mx <= r.position_x + r.width &&
        my >= r.position_y &&
        my <= r.position_y + r.height
      ) {
        return r;
      }
    }
    return null;
  }

  // ─── Mouse events ─────────────────────────────────────────────────────────────
  function getCanvasXY(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { mx: e.clientX - rect.left, my: e.clientY - rect.top };
  }

  function handleMouseDown(e) {
    const { mx, my } = getCanvasXY(e);

    // Primero revisar handles
    const handle = getHandleAt(mx, my);
    if (handle) {
      const room = localRooms.find((r) => r.id === selectedId);
      dragRef.current = {
        type: "resize",
        roomId: selectedId,
        handle: handle.handle,
        startMx: mx,
        startMy: my,
        startX: room.position_x,
        startY: room.position_y,
        startW: room.width,
        startH: room.height,
      };
      return;
    }

    // Luego revisar rooms
    const room = getRoomAt(mx, my);
    if (room) {
      setSelectedId(room.id);
      dragRef.current = {
        type: "move",
        roomId: room.id,
        startMx: mx,
        startMy: my,
        startX: room.position_x,
        startY: room.position_y,
      };
    } else {
      setSelectedId(null);
    }
  }

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    const { mx, my } = getCanvasXY(e);

    // Cursor
    const handle = getHandleAt(mx, my);
    if (handle) {
      canvas.style.cursor = handle.cursor;
    } else if (getRoomAt(mx, my)) {
      canvas.style.cursor = "grab";
    } else {
      canvas.style.cursor = "default";
    }

    if (!dragRef.current) return;

    const drag = dragRef.current;
    const dx = mx - drag.startMx;
    const dy = my - drag.startMy;

    setLocalRooms((prev) => {
      const next = prev.map((r) => {
        if (r.id !== drag.roomId) return r;

        if (drag.type === "move") {
          return {
            ...r,
            position_x: snap(Math.max(0, drag.startX + dx)),
            position_y: snap(Math.max(0, drag.startY + dy)),
          };
        }

        if (drag.type === "resize") {
          let { startX: x, startY: y, startW: w, startH: h } = drag;
          const handle = drag.handle;

          if (handle.includes("e")) w = snap(Math.max(MIN_SIZE, w + dx));
          if (handle.includes("s")) h = snap(Math.max(MIN_SIZE, h + dy));
          if (handle.includes("w")) {
            const newW = snap(Math.max(MIN_SIZE, w - dx));
            x = snap(drag.startX + w - newW);
            w = newW;
          }
          if (handle.includes("n")) {
            const newH = snap(Math.max(MIN_SIZE, h - dy));
            y = snap(drag.startY + h - newH);
            h = newH;
          }

          return { ...r, position_x: x, position_y: y, width: w, height: h };
        }

        return r;
      });
      localRoomsRef.current = next;
      requestAnimationFrame(draw);
      return next;
    });

    setDirty(true);
  }

  function handleMouseUp() {
    dragRef.current = null;
  }

  // ─── Guardar ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all(
        localRooms.map((room) =>
          updateRoomPosition(room.id, {
            position_x: room.position_x,
            position_y: room.position_y,
            width: room.width,
            height: room.height,
          }),
        ),
      );
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["rooms", floorId] });
      queryClient.invalidateQueries({ queryKey: ["layout"] });
    } catch {
      alert("Error al guardar posiciones");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setLocalRooms(rooms.map((r) => ({ ...r })));
    setDirty(false);
    setSelectedId(null);
  }

  const selectedRoom = localRooms?.find((r) => r.id === selectedId);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() =>
              navigate(`/${slug}/admin/plano/configurar/${floorId}/consultorios`)
            }
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            ← Volver a lista
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Editor visual
            {currentFloor && (
              <span className="text-gray-400 font-normal ml-2">
                — {currentFloor.name}
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Arrastra los consultorios para moverlos · Arrastra las esquinas para
            redimensionar
          </p>
        </div>

        <div className="flex gap-3">
          {dirty && (
            <button
              onClick={handleDiscard}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Descartar cambios
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all"
          >
            {saving
              ? "Guardando..."
              : dirty
                ? "💾 Guardar plano"
                : "Sin cambios"}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ display: "block", userSelect: "none" }}
          />
        </div>

        {/* Panel lateral — propiedades del room seleccionado */}
        {selectedRoom && (
          <div className="w-64 bg-white rounded-2xl border border-gray-200 p-4 h-fit">
            <p className="text-sm font-semibold text-gray-900 mb-4">
              {selectedRoom.name}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  X
                </label>
                <input
                  type="number"
                  value={selectedRoom.position_x}
                  onChange={(e) => {
                    const val = snap(Number(e.target.value));
                    setLocalRooms((prev) =>
                      prev.map((r) =>
                        r.id === selectedId ? { ...r, position_x: val } : r,
                      ),
                    );
                    setDirty(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Y
                </label>
                <input
                  type="number"
                  value={selectedRoom.position_y}
                  onChange={(e) => {
                    const val = snap(Number(e.target.value));
                    setLocalRooms((prev) =>
                      prev.map((r) =>
                        r.id === selectedId ? { ...r, position_y: val } : r,
                      ),
                    );
                    setDirty(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Ancho
                </label>
                <input
                  type="number"
                  value={selectedRoom.width}
                  min={MIN_SIZE}
                  onChange={(e) => {
                    const val = snap(Number(e.target.value));
                    setLocalRooms((prev) =>
                      prev.map((r) =>
                        r.id === selectedId
                          ? { ...r, width: Math.max(MIN_SIZE, val) }
                          : r,
                      ),
                    );
                    setDirty(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Alto
                </label>
                <input
                  type="number"
                  value={selectedRoom.height}
                  min={MIN_SIZE}
                  onChange={(e) => {
                    const val = snap(Number(e.target.value));
                    setLocalRooms((prev) =>
                      prev.map((r) =>
                        r.id === selectedId
                          ? { ...r, height: Math.max(MIN_SIZE, val) }
                          : r,
                      ),
                    );
                    setDirty(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Los valores se ajustan automáticamente a la cuadrícula de {GRID}
                px
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
