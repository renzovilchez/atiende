import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import StatusBadge from '../../components/StatusBadge'

// Iconos como componentes (puedes reemplazar con lucide-react)
const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)

const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const HistoryIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const CancelIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const EmptyStateIcon = () => (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)

const FILTERS = [
    { label: 'Todas', value: 'all', icon: null },
    { label: 'Próximas', value: 'upcoming', icon: ClockIcon },
    { label: 'Completadas', value: 'completed', icon: null },
    { label: 'Canceladas', value: 'cancelled', icon: null },
]

function formatDate(dateStr) {
    const datePart = dateStr?.split('T')[0] ?? dateStr
    return new Date(datePart + 'T12:00:00').toLocaleDateString('es-PE', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
}

function formatTime(timeStr) {
    if (!timeStr) return ''
    return timeStr.substring(0, 5) // "09:00:00" -> "09:00"
}

function CancelModal({ appointment, onClose, onConfirm }) {
    const [reason, setReason] = useState('')
    const [saving, setSaving] = useState(false)

    async function handleConfirm() {
        setSaving(true)
        await onConfirm(reason)
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slideUp">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <CancelIcon />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Cancelar cita</h3>
                        <p className="text-sm text-gray-500">
                            Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                        </p>
                    </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                    {formatDate(appointment.date)}
                </p>

                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Motivo de cancelación (opcional)..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                />

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Volver
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-400 text-white rounded-xl text-sm font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                    >
                        {saving ? 'Cancelando...' : 'Confirmar cancelación'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function HistoryModal({ appointment, onClose }) {
    const { data, isLoading } = useQuery({
        queryKey: ['history', appointment.id],
        queryFn: () => api.get(`/appointments/${appointment.id}/history`).then(r => r.data.data),
    })

    const STATUS_LABELS = {
        scheduled: 'Agendada', confirmed: 'Confirmada', in_progress: 'En consulta',
        completed: 'Completada', cancelled: 'Cancelada', no_show: 'No asistió',
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl animate-slideUp">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <HistoryIcon />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Historial de la cita</h3>
                                <p className="text-sm text-gray-500">
                                    Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            <span className="text-xl text-gray-500">×</span>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Línea vertical de timeline */}
                            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>

                            <div className="space-y-6">
                                {data?.map((event, index) => (
                                    <div key={event.id} className="relative flex gap-4 animate-slideUp" style={{ animationDelay: `${index * 50}ms` }}>
                                        <div className="relative z-10">
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center
                                                ${event.to_status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'}
                                            `}>
                                                <div className={`w-3 h-3 rounded-full ${event.to_status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                            </div>
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <p className="text-sm font-medium text-gray-900 mb-1">
                                                    {event.from_status ? `${STATUS_LABELS[event.from_status]} → ` : ''}
                                                    <span className={event.to_status === 'cancelled' ? 'text-red-600' : 'text-blue-600'}>
                                                        {STATUS_LABELS[event.to_status]}
                                                    </span>
                                                </p>
                                                {event.reason && (
                                                    <p className="text-sm text-gray-600 bg-white rounded-lg p-2 mt-2 border border-gray-100">
                                                        "{event.reason}"
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(event.created_at).toLocaleString('es-PE', {
                                                        dateStyle: 'long',
                                                        timeStyle: 'short'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function CitaCard({ appt, onCancel, onHistory }) {
    const [isHovered, setIsHovered] = useState(false)
    const isPast = (appt.date?.split('T')[0] ?? appt.date) < new Date().toISOString().split('T')[0]
    const canCancel = !['completed', 'cancelled', 'no_show'].includes(appt.status) && !isPast

    const dateFormatted = formatDate(appt.date)
    const dayNumber = new Date((appt.date?.split('T')[0] ?? appt.date) + 'T12:00:00').getDate()
    const monthShort = new Date((appt.date?.split('T')[0] ?? appt.date) + 'T12:00:00')
        .toLocaleDateString('es-PE', { month: 'short' })

    return (
        <div
            className={`
                group relative bg-white border border-gray-200 rounded-2xl p-6
                transition-all duration-300 hover:shadow-xl hover:border-blue-200
                ${appt.status === 'cancelled' ? 'opacity-70' : ''}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Efecto de gradiente en hover */}
            <div className={`
                absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl
                transition-opacity duration-300 pointer-events-none
                ${isHovered ? 'opacity-100' : 'opacity-0'}
            `} />

            <div className="relative flex gap-4 items-start">
                {/* Fecha destacada */}
                <div className="flex-shrink-0 w-16 text-center bg-gradient-to-b from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600 leading-none">{dayNumber}</div>
                    <div className="text-xs font-medium text-blue-400 uppercase mt-1">{monthShort}</div>
                </div>

                {/* Información principal */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Dr. {appt.doctor_first_name} {appt.doctor_last_name}
                        </h3>
                        <StatusBadge status={appt.status} size="sm" />
                    </div>

                    {appt.specialty_name && (
                        <p className="text-sm text-gray-600 mb-2">{appt.specialty_name}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <CalendarIcon />
                            {dateFormatted}
                        </span>
                        {appt.queue_position && (
                            <span className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                Turno #{appt.queue_position}
                            </span>
                        )}
                    </div>

                    {appt.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic bg-gray-50 p-2 rounded-lg">
                            "{appt.notes}"
                        </p>
                    )}

                    {appt.extra_service && (
                        <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
                            <span>+</span>
                            {appt.extra_service}
                        </div>
                    )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => onHistory(appt)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                        <HistoryIcon />
                        Detalle
                    </button>
                    {canCancel && (
                        <button
                            onClick={() => onCancel(appt)}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <CancelIcon />
                            Cancelar
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function MisCitas() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [cancelModal, setCancelModal] = useState(null)
    const [historyModal, setHistoryModal] = useState(null)
    const [filter, setFilter] = useState('upcoming')

    const { data: appointments = [], isLoading } = useQuery({
        queryKey: ['my-appointments'],
        queryFn: () => api.get('/appointments/mine')
            .then(r => r.data.data)
            .catch(err => {
                console.error('FETCH ERROR:', err.response?.status, err.message);
                return []
            }),
        staleTime: 30_000,
        retry: 1,
    })

    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }) => api.patch(`/appointments/${id}/cancel`, { reason }),
        onSuccess: () => {
            setCancelModal(null)
            queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
        },
    })

    const today = new Date().toISOString().split('T')[0]

    const filtered = appointments.filter(a => {
        if (filter === 'upcoming') return !['completed', 'cancelled', 'no_show'].includes(a.status) && a.date >= today
        if (filter === 'completed') return a.status === 'completed'
        if (filter === 'cancelled') return ['cancelled', 'no_show'].includes(a.status)
        return true
    })

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header con estadísticas */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis citas</h1>
                        <p className="text-gray-600">Gestiona y da seguimiento a tus citas médicas</p>
                    </div>
                    <button
                        onClick={() => navigate('/agendar')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva cita
                    </button>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-3xl font-bold mb-1">
                            {appointments.filter(a => !['completed', 'cancelled', 'no_show'].includes(a.status) && a.date >= today).length}
                        </div>
                        <div className="text-blue-100 text-sm">Próximas citas</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                            {appointments.filter(a => a.status === 'completed').length}
                        </div>
                        <div className="text-gray-600 text-sm">Completadas</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                            {appointments.filter(a => a.status === 'cancelled').length}
                        </div>
                        <div className="text-gray-600 text-sm">Canceladas</div>
                    </div>
                </div>

                {/* Filtros con estilo de tabs */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${filter === f.value
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }
                            `}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de citas */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
                    <EmptyStateIcon />
                    <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                        No tienes citas {filter === 'upcoming' ? 'próximas' : ''}
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {filter === 'upcoming'
                            ? 'Agenda tu primera cita para comenzar'
                            : 'No hay citas en esta categoría'
                        }
                    </p>
                    {filter === 'upcoming' && (
                        <button
                            onClick={() => navigate('/agendar')}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all"
                        >
                            Agendar una cita
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered
                        .sort((a, b) => a.date < b.date ? -1 : 1)
                        .map(appt => (
                            <CitaCard
                                key={appt.id}
                                appt={appt}
                                onCancel={setCancelModal}
                                onHistory={setHistoryModal}
                            />
                        ))}
                </div>
            )}

            {/* Modales */}
            {cancelModal && (
                <CancelModal
                    appointment={cancelModal}
                    onClose={() => setCancelModal(null)}
                    onConfirm={(reason) => cancelMutation.mutateAsync({ id: cancelModal.id, reason })}
                />
            )}
            {historyModal && (
                <HistoryModal
                    appointment={historyModal}
                    onClose={() => setHistoryModal(null)}
                />
            )}
        </div>
    )
}