import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

function EspecialidadModal({ especialidad, onClose, onSuccess }) {
    const isEdit = !!especialidad
    const [form, setForm] = useState({
        name: especialidad?.name || '',
        description: especialidad?.description || '',
        duration_minutes: especialidad?.duration_minutes || 30,
    })
    const [error, setError] = useState(null)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const mutation = useMutation({
        mutationFn: (data) => isEdit
            ? api.patch(`/specialties/${especialidad.id}`, data)
            : api.post('/specialties', data),
        onSuccess: (res) => onSuccess(res.data.data),
        onError: (err) => setError(err.response?.data?.error || 'Error al guardar'),
    })

    function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        mutation.mutate({ ...form, duration_minutes: Number(form.duration_minutes) })
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {isEdit ? 'Editar especialidad' : 'Nueva especialidad'}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                        <input value={form.name} onChange={e => set('name', e.target.value)} required
                            placeholder="Ej: Cardiología"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                            placeholder="Descripción de la especialidad..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none resize-none" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Duración de consulta (minutos)</label>
                        <input type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)}
                            min={5} max={180}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={mutation.isPending}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold">
                            {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function AdminEspecialidades() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [modal, setModal] = useState(null)

    const { data: specialties = [], isLoading } = useQuery({
        queryKey: ['specialties'],
        queryFn: () => api.get('/specialties').then(r => r.data.data),
    })

    function handleSuccess() {
        setModal(null)
        queryClient.invalidateQueries({ queryKey: ['specialties'] })
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
                        ← Volver
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Especialidades</h1>
                    <p className="text-gray-500 mt-1">Servicios médicos que ofrece la clínica</p>
                </div>
                <button onClick={() => setModal('create')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2">
                    + Nueva especialidad
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                    <div className="col-span-2 flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : specialties.length === 0 ? (
                    <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-gray-200">
                        <div className="text-4xl mb-3">🔬</div>
                        <p className="text-gray-500 font-medium">No hay especialidades registradas</p>
                        <button onClick={() => setModal('create')} className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Crear la primera
                        </button>
                    </div>
                ) : (
                    specialties.map(s => (
                        <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
                                    {s.description && <p className="text-sm text-gray-500 mt-1">{s.description}</p>}
                                </div>
                                <button onClick={() => setModal(s)}
                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                                    Editar
                                </button>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                                ⏱ {s.duration_minutes} min por consulta
                            </div>
                        </div>
                    ))
                )}
            </div>

            {modal && (
                <EspecialidadModal
                    especialidad={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}