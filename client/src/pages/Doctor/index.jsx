import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import useAuthStore from '../../store/auth.store'
import StatusBadge from '../../components/StatusBadge'

// Iconos
const ClockIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const UsersIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
)

const CalendarIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)

const ArrowIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
)

export default function DoctorDashboard() {
    const { user } = useAuthStore()
    const today = new Date().toISOString().split('T')[0]

    // Obtener ID del doctor
    const { data: doctorData } = useQuery({
        queryKey: ['doctor-profile'],
        queryFn: () => api.get('/doctors/me').then(r => r.data.data),
        enabled: !!user?.id,
    })

    // Citas de hoy
    const { data: todayAppointments = [] } = useQuery({
        queryKey: ['doctor-today', doctorData?.id, today],
        queryFn: () => api.get(`/appointments?date=${today}&doctor_id=${doctorData?.id}`).then(r => r.data.data),
        enabled: !!doctorData?.id,
    })

    const stats = {
        waiting: todayAppointments.filter(a => a.status === 'confirmed').length,
        inProgress: todayAppointments.filter(a => a.status === 'in_progress').length,
        completed: todayAppointments.filter(a => a.status === 'completed').length,
        total: todayAppointments.length,
    }

    if (!doctorData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header con botón de inicio */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Dr. {doctorData.first_name} {doctorData.last_name}
                    </h1>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <ClockIcon />
                        </div>
                        <span className="text-3xl font-bold text-blue-600">{stats.waiting}</span>
                    </div>
                    <p className="text-sm text-gray-600">Pacientes en espera</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <UsersIcon />
                        </div>
                        <span className="text-3xl font-bold text-yellow-600">{stats.inProgress}</span>
                    </div>
                    <p className="text-sm text-gray-600">En consulta</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <span className="text-xl">✓</span>
                        </div>
                        <span className="text-3xl font-bold text-green-600">{stats.completed}</span>
                    </div>
                    <p className="text-sm text-gray-600">Atendidos hoy</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <CalendarIcon />
                        </div>
                        <span className="text-3xl font-bold text-purple-600">{stats.total}</span>
                    </div>
                    <p className="text-sm text-gray-600">Total citas hoy</p>
                </div>
            </div>

            {/* Accesos rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Link
                    to="/doctor/cola"
                    className="group bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white hover:shadow-xl transition-all"
                >
                    <h2 className="text-2xl font-bold mb-2">Mi cola de atención</h2>
                    <p className="text-blue-100 mb-4">
                        {stats.waiting} pacientes esperando · {stats.inProgress} en consulta
                    </p>
                    <div className="flex items-center gap-2 text-blue-100 group-hover:gap-3 transition-all">
                        <span>Ir a la cola</span>
                        <ArrowIcon />
                    </div>
                </Link>

                <Link
                    to="/doctor/agenda"
                    className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Mi agenda</h2>
                    <p className="text-gray-600 mb-4">
                        Revisa tus citas programadas
                    </p>
                    <div className="flex items-center gap-2 text-blue-600 group-hover:gap-3 transition-all">
                        <span>Ver agenda</span>
                        <ArrowIcon />
                    </div>
                </Link>
            </div>

            {/* Próximas citas */}
            {todayAppointments.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximas citas de hoy</h2>
                    <div className="space-y-3">
                        {todayAppointments
                            .filter(a => a.status === 'confirmed')
                            .slice(0, 3)
                            .map(appt => (
                                <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium">{appt.patient_first_name} {appt.patient_last_name}</p>
                                        <p className="text-sm text-gray-500">Turno #{appt.queue_position}</p>
                                    </div>
                                    <StatusBadge status={appt.status} size="sm" />
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    )
}