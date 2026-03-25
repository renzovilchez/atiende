import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import useAuthStore from '../../store/auth.store'

function RegisterModal({ onClose, onSuccess }) {
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '',
        password: '', phone: '', dni: '',
    })
    const [error, setError] = useState(null)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const mutation = useMutation({
        mutationFn: (data) => api.post('/patients', data),
        onSuccess: (res) => onSuccess(res.data.data),
        onError: (err) => setError(err.response?.data?.error || 'Error al registrar'),
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
                    <h3 className="text-lg font-semibold text-gray-900">Registrar paciente</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                            <input value={form.first_name} onChange={e => set('first_name', e.target.value)} required
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Apellido *</label>
                            <input value={form.last_name} onChange={e => set('last_name', e.target.value)} required
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">DNI</label>
                        <input value={form.dni} onChange={e => set('dni', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
                        <input value={form.phone} onChange={e => set('phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña *</label>
                        <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                        <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={mutation.isPending}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-colors">
                            {mutation.isPending ? 'Registrando...' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function EditModal({ patient, onClose, onSuccess }) {
    const [form, setForm] = useState({
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        phone: patient.phone || '',
        dni: patient.dni || '',
    })
    const [error, setError] = useState(null)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const mutation = useMutation({
        mutationFn: (data) => api.patch(`/patients/${patient.id}`, data),
        onSuccess: (res) => onSuccess(res.data.data),
        onError: (err) => setError(err.response?.data?.error || 'Error al actualizar'),
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
                    <h3 className="text-lg font-semibold text-gray-900">Editar paciente</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                            <input value={form.first_name} onChange={e => set('first_name', e.target.value)} required
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Apellido *</label>
                            <input value={form.last_name} onChange={e => set('last_name', e.target.value)} required
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">DNI</label>
                        <input value={form.dni} onChange={e => set('dni', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
                        <input value={form.phone} onChange={e => set('phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={mutation.isPending}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition-colors">
                            {mutation.isPending ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function Pacientes() {
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const isAdmin = user?.role === 'admin'
    const [search, setSearch] = useState('')
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [editingPatient, setEditingPatient] = useState(null)
    const [successMsg, setSuccessMsg] = useState(null)
    const navigate = useNavigate()
    const { slug } = useParams()

    const { data: patients = [], isLoading } = useQuery({
        queryKey: ['patients', search],
        queryFn: () => api.get(`/patients${search ? `?search=${search}` : ''}`).then(r => r.data.data),
        staleTime: 30_000,
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/patients/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] })
            showSuccess('Paciente eliminado correctamente')
        },
    })

    function showSuccess(msg) {
        setSuccessMsg(msg)
        setTimeout(() => setSuccessMsg(null), 4000)
    }

    function handleRegistered(patient) {
        setShowRegisterModal(false)
        queryClient.invalidateQueries({ queryKey: ['patients'] })
        showSuccess(`${patient.first_name} ${patient.last_name} registrado correctamente`)
    }

    function handleEdited(patient) {
        setEditingPatient(null)
        queryClient.invalidateQueries({ queryKey: ['patients'] })
        showSuccess(`${patient.first_name} ${patient.last_name} actualizado correctamente`)
    }

    function handleDelete(patient) {
        if (confirm(`¿Eliminar a ${patient.first_name} ${patient.last_name}? Esta acción no se puede deshacer.`))
            deleteMutation.mutate(patient.id)
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate(`/${slug}/recepcion`)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver a recepción
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
                    <p className="text-gray-500 mt-1">Busca o registra pacientes de la clínica</p>
                </div>
                <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo paciente
                </button>
            </div>

            {/* Éxito */}
            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-medium text-green-700">{successMsg}</p>
                </div>
            )}

            {/* Buscador */}
            <div className="relative mb-6">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, apellido, DNI o email..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
            </div>

            {/* Lista */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : patients.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-3">👤</div>
                        <p className="text-gray-500 font-medium">
                            {search ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
                        </p>
                        {!search && (
                            <button onClick={() => setShowRegisterModal(true)}
                                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Registrar el primero
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {['Paciente', 'DNI', 'Teléfono', 'Email', 'Acciones'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {patients.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                                                {p.first_name[0]}{p.last_name[0]}
                                            </div>
                                            <span className="font-medium text-gray-900">{p.first_name} {p.last_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{p.dni || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{p.phone || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{p.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingPatient(p)}
                                                className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                                Editar
                                            </button>
                                            {isAdmin && (
                                                <button onClick={() => handleDelete(p)}
                                                    disabled={deleteMutation.isPending}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showRegisterModal && (
                <RegisterModal
                    onClose={() => setShowRegisterModal(false)}
                    onSuccess={handleRegistered}
                />
            )}

            {editingPatient && (
                <EditModal
                    patient={editingPatient}
                    onClose={() => setEditingPatient(null)}
                    onSuccess={handleEdited}
                />
            )}
        </div>
    )
}