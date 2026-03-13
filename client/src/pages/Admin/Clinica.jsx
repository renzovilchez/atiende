import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function AdminClinica() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', ruc: '', phone: '', address: '', city: '' })
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const { data: tenant, isLoading } = useQuery({
        queryKey: ['tenant-me'],
        queryFn: () => api.get('/tenants/me').then(r => r.data.data),
    })

    useEffect(() => {
        if (tenant) {
            setForm({
                name: tenant.name || '',
                ruc: tenant.ruc || '',
                phone: tenant.phone || '',
                address: tenant.address || '',
                city: tenant.city || '',
            })
        }
    }, [tenant])

    const mutation = useMutation({
        mutationFn: (data) => api.patch('/tenants/me', data),
        onSuccess: () => { setSuccess(true); setTimeout(() => setSuccess(false), 3000) },
        onError: (err) => setError(err.response?.data?.error || 'Error al guardar'),
    })

    function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        mutation.mutate(form)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
                    ← Volver
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Mi clínica</h1>
                <p className="text-gray-500 mt-1">Datos y configuración de la clínica</p>
            </div>

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-medium text-green-700">Datos actualizados correctamente</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la clínica *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">RUC</label>
                        <input value={form.ruc} onChange={e => set('ruc', e.target.value)}
                            placeholder="20XXXXXXXXX"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                        <input value={form.phone} onChange={e => set('phone', e.target.value)}
                            placeholder="01 234 5678"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
                    <input value={form.address} onChange={e => set('address', e.target.value)}
                        placeholder="Av. Principal 123"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ciudad</label>
                    <input value={form.city} onChange={e => set('city', e.target.value)}
                        placeholder="Lima"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <button type="submit" disabled={mutation.isPending}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all">
                    {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </form>
        </div>
    )
}