import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import useAuthStore from '../../store/auth.store'
import StatusBadge from '../../components/StatusBadge'

// ─── Iconos ────────────────────────────────────────────────────────────────
const PlayIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
)

const HistoryIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const RefreshIcon = ({ className = '' }) => (
    <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
)

const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
)

const HomeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
)

// ─── Modal de historial ────────────────────────────────────────────────────
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
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto p-6 animate-slideUp">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                        Historial - {appointment.patient_first_name} {appointment.patient_last_name}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                </div>

                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data?.map((event, index) => (
                            <div
                                key={event.id}
                                className="flex gap-3 animate-slideUp"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="w-2 h-2 mt-2 rounded-full bg-blue-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {event.from_status
                                            ? `${STATUS_LABELS[event.from_status]} → `
                                            : ''}
                                        {STATUS_LABELS[event.to_status]}
                                    </p>
                                    {event.reason && (
                                        <p className="text-xs text-gray-600 mt-1">"{event.reason}"</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {event.first_name} {event.last_name} · {new Date(event.created_at).toLocaleString('es-PE')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Tarjeta de paciente en cola ───────────────────────────────────────────
function PatientCard({ patient, onStart, onComplete, onHistory }) {
    const [isHovered, setIsHovered] = useState(false)

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-yellow-50 border-yellow-200'
            case 'in_progress': return 'bg-blue-50 border-blue-200'
            default: return 'bg-white border-gray-200'
        }
    }

    return (
        <div
            className={`
                relative border rounded-xl p-5 transition-all duration-300
                ${getStatusColor(patient.status)}
                ${isHovered ? 'shadow-lg scale-[1.02]' : 'shadow-sm'}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Número de turno destacado */}
            <div className="absolute -top-2 -left-2 w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                #{patient.queue_position}
            </div>

            <div className="ml-8">
                {/* Header con nombre y estado */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {patient.patient_first_name} {patient.patient_last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {patient.specialty_name || 'Consulta general'}
                        </p>
                    </div>
                    <StatusBadge status={patient.status} />
                </div>

                {/* Detalles */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <UserIcon />
                        <span>Edad: -- años</span>
                    </div>
                    {patient.notes && (
                        <div className="col-span-2 text-sm text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                            "{patient.notes}"
                        </div>
                    )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                    {patient.status === 'confirmed' && (
                        <button
                            onClick={() => onStart(patient)}
                            className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <PlayIcon />
                            Iniciar consulta
                        </button>
                    )}
                    {patient.status === 'in_progress' && (
                        <button
                            onClick={() => onComplete(patient)}
                            className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <CheckIcon />
                            Completar
                        </button>
                    )}
                    <button
                        onClick={() => onHistory(patient)}
                        className="py-2 px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 active:scale-95"
                        title="Ver historial"
                    >
                        <HistoryIcon />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function DoctorCola() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const [historyModal, setHistoryModal] = useState(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const today = new Date().toISOString().split('T')[0]

    // Obtener el ID del doctor
    const { data: doctorData } = useQuery({
        queryKey: ['doctor-profile'],
        queryFn: () => api.get('/doctors/me').then(r => r.data.data),
        enabled: !!user?.id,
    })

    // Obtener citas del día para este doctor
    const { data: appointments = [], isLoading, error, refetch } = useQuery({
        queryKey: ['doctor-queue', doctorData?.id, today],
        queryFn: () => api.get(`/appointments?date=${today}&doctor_id=${doctorData?.id}`).then(r => r.data.data),
        enabled: !!doctorData?.id,
        refetchInterval: 30000, // Refrescar cada 30 segundos
    })

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['doctor-queue', doctorData?.id, today] })
    }

    const startMutation = useMutation({
        mutationFn: (id) => api.patch(`/appointments/${id}/start`),
        onSuccess: invalidate,
    })

    const completeMutation = useMutation({
        mutationFn: (id) => api.patch(`/appointments/${id}/complete`),
        onSuccess: invalidate,
    })

    // Separar pacientes por estado
    const waitingPatients = appointments.filter(a => a.status === 'confirmed')
    const inProgressPatients = appointments.filter(a => a.status === 'in_progress')
    const completedToday = appointments.filter(a => a.status === 'completed')

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await refetch()
        setTimeout(() => setIsRefreshing(false), 500)
    }

    if (!doctorData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando perfil...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header con botón de inicio */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi cola de atención</h1>
                    <p className="text-gray-600 flex items-center gap-2">
                        Dr. {doctorData.first_name} {doctorData.last_name}
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-sm text-gray-500">
                            {new Date().toLocaleDateString('es-PE', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                            })}
                        </span>
                    </p>
                </div>
                <Link
                    to="/"
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    <HomeIcon />
                    Inicio
                </Link>
            </div>

            {/* Botón de actualizar mejorado */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                    title="Actualizar lista"
                >
                    <RefreshIcon className={`transition-transform duration-500 ${isRefreshing ? 'animate-spin' : 'hover:rotate-180'}`} />
                    <span className="text-sm">Actualizar</span>
                </button>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center animate-fadeIn">
                    <p className="text-red-600">Error al cargar las citas</p>
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : (
                <div className="space-y-8">
                    {/* En consulta */}
                    {inProgressPatients.length > 0 && (
                        <div className="animate-fadeIn">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                En consulta actual
                            </h2>
                            <div className="grid gap-4">
                                {inProgressPatients.map(patient => (
                                    <PatientCard
                                        key={patient.id}
                                        patient={patient}
                                        onStart={(patient) => startMutation.mutate(patient.id)}
                                        onComplete={(patient) => completeMutation.mutate(patient.id)}
                                        onHistory={setHistoryModal}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pacientes en espera */}
                    <div className="animate-fadeIn">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Pacientes en espera ({waitingPatients.length})
                        </h2>
                        {waitingPatients.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                                <p className="text-gray-500">No hay pacientes en espera</p>
                                <p className="text-sm text-gray-400 mt-2">Tómate un descanso o revisa tu agenda</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {waitingPatients.map(patient => (
                                    <PatientCard
                                        key={patient.id}
                                        patient={patient}
                                        onStart={startMutation.mutate}
                                        onComplete={completeMutation.mutate}
                                        onHistory={setHistoryModal}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Resumen del día */}
                    {completedToday.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-fadeIn">
                            <p className="text-sm text-green-700 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="font-semibold">{completedToday.length}</span> pacientes atendidos hoy
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de historial */}
            {historyModal && (
                <HistoryModal
                    appointment={historyModal}
                    onClose={() => setHistoryModal(null)}
                />
            )}
        </div>
    )
}