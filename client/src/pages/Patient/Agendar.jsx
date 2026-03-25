import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import useAuthStore from '../../store/auth.store'

// ─── Iconos ────────────────────────────────────────────────────────────────
const SpecialtyIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
)

const DoctorIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
)

const CalendarIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)

const CheckIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
)

const BackIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
)

const NextIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
)

const SuccessIcon = () => (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

// ─── Helpers ───────────────────────────────────────────────────────────────
function today() {
    return new Date().toISOString().split('T')[0]
}

function addDays(date, days) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
}

function formatDate(dateStr) {
    const datePart = dateStr?.split('T')[0] ?? dateStr
    return new Date(datePart + 'T12:00:00').toLocaleDateString('es-PE', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
}

// ─── Step indicator mejorado ───────────────────────────────────────────────
function StepBar({ step }) {
    const steps = ['Especialidad', 'Doctor y fecha', 'Confirmar']

    return (
        <div className="relative mb-12">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
                <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                />
            </div>
            <div className="relative flex justify-between">
                {steps.map((label, i) => {
                    const num = i + 1
                    const active = num === step
                    const done = num < step

                    return (
                        <div key={label} className="flex flex-col items-center">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                transition-all duration-300 transform
                                ${done
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white scale-100'
                                    : active
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-110 shadow-lg shadow-blue-200'
                                        : 'bg-gray-200 text-gray-400'
                                }
                            `}>
                                {done ? <CheckIcon /> : num}
                            </div>
                            <span className={`
                                mt-2 text-xs font-medium transition-colors
                                ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}
                            `}>
                                {label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Step 1: Especialidad (rediseñado) ─────────────────────────────────────
function StepEspecialidad({ onSelect }) {
    const { data: specialties = [], isLoading } = useQuery({
        queryKey: ['specialties'],
        queryFn: () => api.get('/specialties').then(r => r.data.data),
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="animate-fadeIn">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                    <SpecialtyIcon />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Qué especialidad necesitas?</h2>
                <p className="text-gray-600">Selecciona la especialidad médica para tu cita</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialties.map((s, index) => (
                    <button
                        key={s.id}
                        onClick={() => onSelect(s)}
                        className="group relative bg-white border-2 border-gray-100 rounded-2xl p-6 text-left hover:border-blue-500 hover:shadow-xl transition-all duration-300 animate-slideUp"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="text-4xl mb-4">🔬</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.name}</h3>
                            {s.description && (
                                <p className="text-sm text-gray-600 mb-3">{s.description}</p>
                            )}
                            {s.duration_minutes && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                                    <span>⏱</span>
                                    {s.duration_minutes} min aprox.
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── Step 2: Doctor y fecha (rediseñado) ───────────────────────────────────
function StepDoctorFecha({ specialty, onSelect, onBack, isPatient }) {
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [date, setDate] = useState(addDays(today(), 1))
    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        setAnimate(true)
    }, [])

    const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
        queryKey: ['doctors', 'specialty', specialty.id],
        queryFn: () => api.get(`/specialties/${specialty.id}/doctors`).then(r => r.data.data),
    })

    const { data: availability, isLoading: loadingAvail } = useQuery({
        queryKey: ['availability', selectedDoctor?.id, date],
        queryFn: () => api.get(`/doctors/${selectedDoctor.id}/availability?date=${date}`).then(r => r.data.data),
        enabled: !!selectedDoctor && !!date,
    })

    return (
        <div className={`animate-fadeIn ${animate ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                    <DoctorIcon />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Elige doctor y fecha</h2>
                <p className="text-gray-600">
                    Especialidad: <span className="font-semibold text-blue-600">{specialty.name}</span>
                </p>
            </div>

            {/* Doctores */}
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Médicos disponibles</h3>
                {loadingDoctors ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : doctors.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                        <p className="text-gray-500">No hay médicos disponibles para esta especialidad</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {doctors.map((d, index) => (
                            <button
                                key={d.id}
                                onClick={() => setSelectedDoctor(d)}
                                className={`
                                    w-full p-4 rounded-xl border-2 transition-all duration-300
                                    ${selectedDoctor?.id === d.id
                                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                    }
                                    animate-slideUp
                                `}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                                        ${selectedDoctor?.id === d.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                        }
                                    `}>
                                        {d.first_name[0]}{d.last_name[0]}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-gray-900">
                                            Dr. {d.first_name} {d.last_name}
                                        </p>
                                        {d.license_number && (
                                            <p className="text-sm text-gray-500">CMP {d.license_number}</p>
                                        )}
                                    </div>
                                    {selectedDoctor?.id === d.id && (
                                        <CheckIcon />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Fecha y disponibilidad */}
            {selectedDoctor && (
                <div className="mb-8 animate-slideUp">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Selecciona la fecha</h3>
                    <div className="bg-gray-50 rounded-xl p-6">
                        <input
                            type="date"
                            value={date}
                            min={addDays(today(), 1)}
                            onChange={e => setDate(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                        />

                        {date && (
                            <div className="mt-4">
                                {loadingAvail ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : availability ? (
                                    <div className={`
                                        p-4 rounded-xl animate-slideUp
                                        ${availability.available
                                            ? 'bg-green-50 border border-green-200'
                                            : isPatient
                                                ? 'bg-red-50 border border-red-200'
                                                : 'bg-orange-50 border border-orange-200'
                                        }
                                    `}>
                                        {availability.available ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <CheckIcon />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-green-700">Cupos disponibles</p>
                                                    <p className="text-sm text-green-600">
                                                        {availability.remaining} cupos · {availability.start_time?.slice(0, 5)} – {availability.end_time?.slice(0, 5)}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : isPatient ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                                                    !
                                                </div>
                                                <div>
                                                    <p className="font-medium text-red-700">Sin cupos disponibles</p>
                                                    <p className="text-sm text-red-600">Prueba con otra fecha</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                                                    ⚠
                                                </div>
                                                <div>
                                                    <p className="font-medium text-orange-700">Cupo lleno</p>
                                                    <p className="text-sm text-orange-600">Se agendará como paciente adicional</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                >
                    <BackIcon />
                    Volver
                </button>
                <button
                    onClick={() => onSelect({ doctor: selectedDoctor, date })}
                    disabled={!selectedDoctor || (isPatient && !availability?.available)}
                    className={`
                        flex-1 px-6 py-3 rounded-xl font-medium transition-all
                        flex items-center justify-center gap-2
                        ${selectedDoctor && (!isPatient || availability?.available)
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }
                    `}
                >
                    Continuar
                    <NextIcon />
                </button>
            </div>
        </div>
    )
}

// ─── Step 3: Confirmar (rediseñado) ────────────────────────────────────────
function StepConfirmar({ specialty, doctor, date, onBack, onConfirm, isPatient, patientId }) {
    const { user } = useAuthStore()
    const [notes, setNotes] = useState('')
    const [selectedPatientId, setSelectedPatientId] = useState(patientId || user?.id)
    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        setAnimate(true)
    }, [])

    const { data: patients = [] } = useQuery({
        queryKey: ['patients'],
        queryFn: () => api.get('/users?role=patient').then(r => r.data.data),
        enabled: !isPatient,
    })

    const dateFormatted = formatDate(date)

    return (
        <div className={`animate-fadeIn ${animate ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                    <CalendarIcon />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmar cita</h2>
                <p className="text-gray-600">Revisa los datos antes de agendar</p>
            </div>

            {/* Resumen visual */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-6 border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <SpecialtyIcon />
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Especialidad</p>
                        <p className="font-semibold text-gray-900">{specialty.name}</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <DoctorIcon />
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Médico</p>
                        <p className="font-semibold text-gray-900">Dr. {doctor.first_name} {doctor.last_name}</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <CalendarIcon />
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Fecha</p>
                        <p className="font-semibold text-gray-900 capitalize">{dateFormatted}</p>
                    </div>
                </div>
            </div>

            {/* Paciente (solo para staff) */}
            {!isPatient && (
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Paciente
                    </label>
                    <select
                        value={selectedPatientId}
                        onChange={e => setSelectedPatientId(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                    >
                        <option value="">Seleccionar paciente...</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.first_name} {p.last_name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Notas */}
            <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notas (opcional)
                </label>
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Síntomas, motivo de consulta..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                >
                    <BackIcon />
                    Volver
                </button>
                <button
                    onClick={() => onConfirm({ notes, patientId: isPatient ? user.id : selectedPatientId })}
                    disabled={!isPatient && !selectedPatientId}
                    className={`
                        flex-1 px-6 py-3 rounded-xl font-medium transition-all
                        flex items-center justify-center gap-2
                        ${!isPatient && !selectedPatientId
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200'
                        }
                    `}
                >
                    Confirmar cita
                    <CheckIcon />
                </button>
            </div>
        </div>
    )
}

// ─── Página principal con diseño mejorado ──────────────────────────────────
export default function Agendar() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const { slug } = useParams()
    const isPatient = user?.role === 'patient'

    const [step, setStep] = useState(1)
    const [specialty, setSpecialty] = useState(null)
    const [doctor, setDoctor] = useState(null)
    const [date, setDate] = useState(null)
    const [success, setSuccess] = useState(false)

    const bookMutation = useMutation({
        mutationFn: (data) => api.post('/appointments', data),
        onSuccess: () => setSuccess(true),
    })

    async function handleConfirm({ notes, patientId }) {
        await bookMutation.mutateAsync({
            doctor_id: doctor.id,
            patient_id: patientId,
            date,
            notes: notes || undefined,
        })
    }

    if (success) {
        return (
            <div className="max-w-lg mx-auto text-center py-12 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
                    <SuccessIcon />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">¡Cita agendada!</h2>
                <p className="text-gray-600 mb-8">
                    Tu cita con <span className="font-semibold">Dr. {doctor.first_name} {doctor.last_name}</span> ha sido registrada exitosamente.
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => {
                            setStep(1);
                            setSpecialty(null);
                            setDoctor(null);
                            setDate(null);
                            setSuccess(false)
                        }}
                        className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        Agendar otra
                    </button>
                    <button
                        onClick={() => navigate(isPatient ? `/${slug}/mis-citas` : `/${slug}/recepcion`)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 transition-all"
                    >
                        {isPatient ? 'Ver mis citas' : 'Ver panel'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            <StepBar step={step} />

            {bookMutation.isError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-slideDown">
                    <p className="text-sm text-red-600">
                        {bookMutation.error?.response?.data?.error || 'Error al agendar la cita'}
                    </p>
                </div>
            )}

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                {step === 1 && (
                    <StepEspecialidad onSelect={(s) => { setSpecialty(s); setStep(2) }} />
                )}
                {step === 2 && (
                    <StepDoctorFecha
                        specialty={specialty}
                        isPatient={isPatient}
                        onBack={() => setStep(1)}
                        onSelect={({ doctor: d, date: dt }) => { setDoctor(d); setDate(dt); setStep(3) }}
                    />
                )}
                {step === 3 && (
                    <StepConfirmar
                        specialty={specialty}
                        doctor={doctor}
                        date={date}
                        isPatient={isPatient}
                        onBack={() => setStep(2)}
                        onConfirm={handleConfirm}
                    />
                )}
            </div>
        </div>
    )
}