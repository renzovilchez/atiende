import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../api/rooms.api";
import { getFloors } from "../../api/floors.api";

// ─── Modal crear/editar consultorio ──────────────────────────────────────────
function RoomModal({ room, floorId, onClose, onSuccess }) {
  const isEdit = !!room;
  const [form, setForm] = useState({
    name: room?.name || "",
    number: room?.number || "",
    position_x: room?.position_x ?? 50,
    position_y: room?.position_y ?? 50,
    width: room?.width ?? 120,
    height: room?.height ?? 80,
  });
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateRoom(room.id, data) : createRoom(data),
    onSuccess: () => onSuccess(),
    onError: (err) => setError(err.response?.data?.error || "Error al guardar"),
  });

  function handleSubmit() {
    setError(null);
    if (!form.name.trim()) return setError("El nombre es requerido");
    mutation.mutate({
      name: form.name.trim(),
      ...(form.number && { number: form.number }),
      floor_id: floorId,
      position_x: Number(form.position_x),
      position_y: Number(form.position_y),
      width: Number(form.width),
      height: Number(form.height),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Editar consultorio" : "Nuevo consultorio"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Identificación */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Identificación
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Nombre *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ej: Consultorio A"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Número / código
                </label>
                <input
                  value={form.number}
                  onChange={(e) => set("number", e.target.value)}
                  placeholder="Ej: 101"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Posición en el canvas */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Posición en el plano
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  X (píxeles)
                </label>
                <input
                  type="number"
                  value={form.position_x}
                  onChange={(e) => set("position_x", e.target.value)}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Y (píxeles)
                </label>
                <input
                  type="number"
                  value={form.position_y}
                  onChange={(e) => set("position_y", e.target.value)}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Ancho (píxeles)
                </label>
                <input
                  type="number"
                  value={form.width}
                  onChange={(e) => set("width", e.target.value)}
                  min={40}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Alto (píxeles)
                </label>
                <input
                  type="number"
                  value={form.height}
                  onChange={(e) => set("height", e.target.value)}
                  min={40}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Estas coordenadas definen dónde aparece el consultorio en el
              Canvas. Puedes ajustarlas arrastrando directamente en el plano
              (Paso siguiente).
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold"
            >
              {mutation.isPending
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear consultorio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal confirmar eliminación ──────────────────────────────────────────────
function DeleteModal({ room, onClose, onConfirm, isPending }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Eliminar consultorio
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          ¿Estás seguro de eliminar{" "}
          <span className="font-semibold text-gray-800">{room.name}</span>? Esta
          acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold"
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AdminConsultorios() {
  const { floorId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'create' | room object
  const [deleting, setDeleting] = useState(null);

  // Nombre del piso actual para el breadcrumb
  const { data: floors = [] } = useQuery({
    queryKey: ["floors"],
    queryFn: getFloors,
  });
  const currentFloor = floors.find((f) => String(f.id) === String(floorId));

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms", floorId],
    queryFn: () => getRooms(),
    select: (data) =>
      data.filter((r) => String(r.floor_id) === String(floorId)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRoom(id),
    onSuccess: () => {
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["rooms", floorId] });
      queryClient.invalidateQueries({ queryKey: ["floors"] }); // actualiza room_count
    },
  });

  function handleSuccess() {
    setModal(null);
    queryClient.invalidateQueries({ queryKey: ["rooms", floorId] });
    queryClient.invalidateQueries({ queryKey: ["floors"] });
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate("/admin/plano/configurar")}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            ← Volver a pisos
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Consultorios
            {currentFloor && (
              <span className="text-gray-400 font-normal ml-2">
                — {currentFloor.name}
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona los consultorios de este piso y su posición en el plano
          </p>

          {/* Selector de piso */}
          {floors.length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() =>
                    navigate(`/admin/plano/configurar/${floor.id}/consultorios`)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    String(floor.id) === String(floorId)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {floor.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => navigate(`/admin/plano/configurar/${floorId}/editor`)}
          className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl transition-all flex items-center gap-2"
        >
          🗺️ Editor visual
        </button>
        <button
          onClick={() => setModal("create")}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
        >
          + Nuevo consultorio
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🚪</div>
            <p className="text-gray-500 font-medium">
              No hay consultorios en este piso
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Agrega el primero para verlo en el plano
            </p>
            <button
              onClick={() => setModal("create")}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Agregar el primero
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  "Consultorio",
                  "Código",
                  "Posición (X, Y)",
                  "Dimensiones",
                  "Acciones",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map((room) => (
                <tr
                  key={room.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                        🚪
                      </div>
                      <span className="font-medium text-gray-900">
                        {room.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {room.number || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {room.position_x != null
                      ? `(${room.position_x}, ${room.position_y})`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {room.width != null
                      ? `${room.width} × ${room.height} px`
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal(room)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleting(room)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <RoomModal
          room={modal === "create" ? null : modal}
          floorId={floorId}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
      {deleting && (
        <DeleteModal
          room={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
