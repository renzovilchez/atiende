import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

function DoctorModal({ doctor, specialties, onClose, onSuccess }) {
    const isEdit = !!doctor
    const [form, setForm] = useState({
        first_name: doctor?.first_name || '',
        last_name: doctor?.last_name || '',
        email: doctor?.email || '',
        password: '',
        phone: doctor?.phone || '',
        dni: doctor?.dni || '',
        specialty_id: doctor?.specialty_id || '',
        license_number: doctor?.license_number || '',
        bio: doctor?.bio || '',
    })
    const [error, setError] = useState(null)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const mutation = useMutation({
        mutationFn: async (data) => {
            if (isEdit) {
                const [, doctorRes] = await Promise.all([
                    api.patch(`/users/${doctor.user_id}`, {
                        first_name: data.first_name,
                        last_name: data.last_name,
                        email: data.email,
                        phone: data.phone || null,
                        dni: data.dni || null,
                    }),
                    api.patch(`/doctors/${doctor.id}`, {
                        specialty_id: data.specialty_id || null,
                        license_number: data.license_number || null,
                        bio: data.bio || null,
                    }),
                ])
                return doctorRes.data.data
            } else {
                const userRes = await api.post('/users', {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    password: data.password,
                    role: 'doctor',
                    ...(data.phone && { phone: data.phone }),
                    ...(data.dni && { dni: data.dni }),
                })
                const newUser = userRes.data.data
                const doctorRes = await api.post('/doctors', {
                    user_id: newUser.id,
                    specialty_id: data.specialty_id || null,
                    license_number: data.license_number || null,
                    bio: data.bio || null,
                })
                return doctorRes.data.data
            }
        },
        onSuccess: (res) => onSuccess(res),
        onError: (err) => setError(err.response?.data?.error || 'Error al guardar'),
    })

    function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        mutation.mutate(form)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {isEdit ? 'Editar doctor' : 'Agregar doctor'}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Datos personales — siempre visible */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Datos personales</p>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
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
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                            </div>
                            {!isEdit && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña *</label>
                                    <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                                        required minLength={8}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                                    <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
                                    <input value={form.phone} onChange={e => set('phone', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">DNI</label>
                                    <input value={form.dni} onChange={e => set('dni', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Datos médicos — siempre visible */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Datos médicos</p>
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-semibold text-gray-600">Especialidad</label>
                                    <a href="/admin/especialidades" target="_blank"
                                        className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
                                        Gestionar especialidades ↗
                                    </a>
                                </div>
                                <select value={form.specialty_id} onChange={e => set('specialty_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none">
                                    <option value="">Sin especialidad</option>
                                    {specialties.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">N° de colegiatura (CMP)</label>
                                <input value={form.license_number} onChange={e => set('license_number', e.target.value)}
                                    placeholder="Ej: 12345"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Biografía</label>
                                <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3}
                                    placeholder="Descripción breve del doctor..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none resize-none" />
                            </div>
                        </div>
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
                            {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar doctor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function AdminDoctores() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [modal, setModal] = useState(null) // null | 'create' | doctor object

    const { data: doctors = [], isLoading } = useQuery({
        queryKey: ['admin-doctors'],
        queryFn: () => api.get('/doctors').then(r => r.data.data),
    })

    const { data: specialties = [] } = useQuery({
        queryKey: ['specialties'],
        queryFn: () => api.get('/specialties').then(r => r.data.data),
    })

    const deactivateMutation = useMutation({
        mutationFn: (id) => api.delete(`/doctors/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-doctors'] }),
    })

    function handleSuccess() {
        setModal(null)
        queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
                        ← Volver
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Doctores</h1>
                    <p className="text-gray-500 mt-1">Gestiona el equipo médico de la clínica</p>
                </div>
                <button onClick={() => setModal('create')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2">
                    + Agregar doctor
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : doctors.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-3">👨‍⚕️</div>
                        <p className="text-gray-500 font-medium">No hay doctores registrados</p>
                        <button onClick={() => setModal('create')} className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Agregar el primero
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {['Doctor', 'Especialidad', 'CMP', 'Estado', 'Acciones'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {doctors.map(d => (
                                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                                {d.first_name[0]}{d.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Dr. {d.first_name} {d.last_name}</p>
                                                <p className="text-xs text-gray-400">{d.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{d.specialty_name || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{d.license_number || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {d.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => setModal(d)}
                                                className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                                Editar
                                            </button>
                                            {d.is_active && (
                                                <button onClick={() => deactivateMutation.mutate(d.id)}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                                                    Desactivar
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

            {modal && (
                <DoctorModal
                    doctor={modal === 'create' ? null : modal}
                    specialties={specialties}
                    onClose={() => setModal(null)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}