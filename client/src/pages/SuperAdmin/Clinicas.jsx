import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

function toSlug(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
}

function ClinicaModal({ clinica, onClose, onSuccess }) {
    const isEdit = !!clinica
    const [form, setForm] = useState({
        name: clinica?.name || '',
        slug: clinica?.slug || '',
        ruc: clinica?.ruc || '',
        phone: clinica?.phone || '',
        address: clinica?.address || '',
        city: clinica?.city || '',
    })
    const [error, setError] = useState(null)

    const set = (k, v) => {
        setForm(f => ({
            ...f,
            [k]: v,
            ...(!isEdit && k === 'name' ? { slug: toSlug(v) } : {}),
        }))
    }

    const mutation = useMutation({
        mutationFn: (data) => isEdit
            ? api.patch(`/tenants/${clinica.id}`, data)
            : api.post('/tenants', data),
        onSuccess: (res) => onSuccess(res.data.data),
        onError: (err) => setError(err.response?.data?.error || 'Error al guardar'),
    })

    function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        mutation.mutate(form)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{isEdit ? 'Editar clínica' : 'Nueva clínica'}</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                        <input value={form.name} onChange={e => set('name', e.target.value)}
                            placeholder="Clínica San Juan" required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                    </div>

                    {/* Slug — solo visible al crear, readonly al editar */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Slug {!isEdit && <span className="text-gray-400 font-normal">(se genera desde el nombre, editable)</span>}
                        </label>
                        <input value={form.slug} onChange={e => set('slug', e.target.value)}
                            placeholder="clinica-san-juan"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:border-blue-500 focus:outline-none" />
                        {isEdit && (
                            <p className="text-xs text-amber-500 mt-1">⚠ Cambiar el slug puede afectar integraciones existentes</p>
                        )}
                    </div>

                    {/* Resto de campos */}
                    {[
                        { key: 'ruc', label: 'RUC', placeholder: '20XXXXXXXXX' },
                        { key: 'phone', label: 'Teléfono', placeholder: '01 234 5678' },
                        { key: 'address', label: 'Dirección', placeholder: 'Av. Principal 123' },
                        { key: 'city', label: 'Ciudad', placeholder: 'Lima' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                            <input value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                                placeholder={f.placeholder}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                        </div>
                    ))}

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
                            {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function SuperAdminClinicas() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [modal, setModal] = useState(null)
    const [search, setSearch] = useState('')

    const { data: clinicas = [], isLoading } = useQuery({
        queryKey: ['sa-clinicas'],
        queryFn: () => api.get('/tenants').then(r => r.data.data),
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/tenants/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sa-clinicas'] }),
    })

    const filtered = clinicas.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase())
    )

    function handleSuccess() {
        setModal(null)
        queryClient.invalidateQueries({ queryKey: ['sa-clinicas'] })
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button onClick={() => navigate('/super-admin')} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
                        ← Volver
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Clínicas</h1>
                    <p className="text-gray-500 mt-1">{clinicas.length} tenants registrados</p>
                </div>
                <button onClick={() => setModal('create')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all">
                    + Nueva clínica
                </button>
            </div>

            <div className="mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o ciudad..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-3">🏥</div>
                        <p className="text-gray-500">No se encontraron clínicas</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {['Clínica', 'Slug', 'RUC', 'Ciudad', 'Teléfono', 'Acciones'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                                {c.name[0]}
                                            </div>
                                            <span className="font-medium text-gray-900">{c.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{c.slug}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{c.ruc || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{c.city || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{c.phone || '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => setModal(c)}
                                                className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                                                Editar
                                            </button>
                                            <button onClick={() => {
                                                if (confirm(`¿Eliminar ${c.name}? Esta acción no se puede deshacer.`))
                                                    deleteMutation.mutate(c.id)
                                            }}
                                                className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
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

            {modal && (
                <ClinicaModal
                    clinica={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}