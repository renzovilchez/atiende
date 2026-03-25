import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor,
} from "../../api/floors.api";
import { useTenantSlug } from "../../hooks/useTenantSlug";

// ─── Modal crear/editar piso ──────────────────────────────────────────────────
function FloorModal({ floor, onClose, onSuccess }) {
  const isEdit = !!floor;
  const [name, setName] = useState(floor?.name || "");
  const [number, setNumber] = useState(floor?.number ?? "");
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateFloor(floor.id, data) : createFloor(data),
    onSuccess: () => onSuccess(),
    onError: (err) => setError(err.response?.data?.error || "Error al guardar"),
  });

  function handleSubmit() {
    setError(null);
    if (!name.trim()) return setError("El nombre es requerido");
    mutation.mutate({
      name: name.trim(),
      ...(number !== "" && { number: Number(number) }),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Editar piso" : "Nuevo piso"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nombre *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Piso 1, Planta baja"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Número de piso
            </label>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Ej: 1"
              min={1}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Define en qué posición aparece este piso en el selector
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
                  : "Crear piso"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal confirmar eliminación ──────────────────────────────────────────────
function DeleteModal({ floor, onClose, onConfirm, isPending }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Eliminar piso
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          ¿Estás seguro de eliminar{" "}
          <span className="font-semibold text-gray-800">{floor.name}</span>? Se
          eliminarán también todos los consultorios asociados. Esta acción no se
          puede deshacer.
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
export default function AdminPlano() {
  const navigate = useNavigate();
  const slug = useTenantSlug();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'create' | floor object
  const [deleting, setDeleting] = useState(null); // null | floor object

  const { data: floors = [], isLoading } = useQuery({
    queryKey: ["floors"],
    queryFn: getFloors,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFloor(id),
    onSuccess: () => {
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    },
  });

  function handleSuccess() {
    setModal(null);
    queryClient.invalidateQueries({ queryKey: ["floors"] });
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate(`/${slug}/admin`)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Plano de la clínica
          </h1>
          <p className="text-gray-500 mt-1">
            Configura los pisos y consultorios de tu clínica
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
        >
          + Nuevo piso
        </button>
      </div>

      {/* Lista de pisos */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : floors.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🏢</div>
            <p className="text-gray-500 font-medium">
              No hay pisos configurados
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Empieza creando el primer piso de tu clínica
            </p>
            <button
              onClick={() => setModal("create")}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Piso", "Orden", "Consultorios", "Acciones"].map((h) => (
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
              {floors.map((floor) => (
                <tr
                  key={floor.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        🏢
                      </div>
                      <span className="font-medium text-gray-900">
                        {floor.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {floor.number ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {floor.room_count ?? 0} consultorio
                    {floor.room_count !== 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal(floor)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/${slug}/admin/plano/configurar/${floor.id}/consultorios`,
                          )
                        }
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Consultorios
                      </button>
                      <button
                        onClick={() => setDeleting(floor)}
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
        <FloorModal
          floor={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
      {deleting && (
        <DeleteModal
          floor={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
