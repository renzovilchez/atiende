import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/auth.store'

// ─── Helpers ───────────────────────────────────────────────────────────────
function today() {
    return new Date().toISOString().split('T')[0]
}

function addDays(date, days) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
}

// ─── Step indicator ────────────────────────────────────────────────────────
function StepBar({ step }) {
    const steps = ['Especialidad', 'Doctor y fecha', 'Confirmar']
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
            {steps.map((label, i) => {
                const num = i + 1
                const active = num === step
                const done = num < step
                return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: done ? '#16a34a' : active ? '#2563eb' : '#e2e8f0',
                                color: done || active ? '#fff' : '#94a3b8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '13px', fontWeight: 700, flexShrink: 0,
                            }}>
                                {done ? '✓' : num}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? '#0f172a' : done ? '#16a34a' : '#94a3b8', whiteSpace: 'nowrap' }}>
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{ flex: 1, height: '2px', background: done ? '#16a34a' : '#e2e8f0', margin: '0 12px' }} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ─── Step 1: Especialidad ──────────────────────────────────────────────────
function StepEspecialidad({ onSelect }) {
    const { data: specialties = [], isLoading } = useQuery({
        queryKey: ['specialties'],
        queryFn: () => api.get('/specialties').then(r => r.data.data),
    })

    if (isLoading) return <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Cargando especialidades...</div>

    return (
        <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>¿Qué especialidad necesitas?</h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b' }}>Selecciona la especialidad médica para tu cita</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {specialties.map(s => (
                    <button
                        key={s.id}
                        onClick={() => onSelect(s)}
                        style={{
                            padding: '20px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            background: '#fff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' }}
                    >
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔬</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
                        {s.description && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{s.description}</div>}
                        {s.duration_minutes && (
                            <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '8px', fontWeight: 500 }}>
                                ⏱ {s.duration_minutes} min aprox.
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── Step 2: Doctor y fecha ────────────────────────────────────────────────
function StepDoctorFecha({ specialty, onSelect, onBack, isPatient }) {
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [date, setDate] = useState(addDays(today(), 1))

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
        <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Elige doctor y fecha</h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b' }}>
                Especialidad: <strong>{specialty.name}</strong>
            </p>

            {/* Doctores */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Médico disponible
                </div>
                {loadingDoctors ? (
                    <div style={{ color: '#94a3b8', fontSize: '14px' }}>Cargando médicos...</div>
                ) : doctors.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '14px' }}>No hay médicos disponibles para esta especialidad</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {doctors.map(d => (
                            <button
                                key={d.id}
                                onClick={() => setSelectedDoctor(d)}
                                style={{
                                    padding: '14px 16px',
                                    border: `2px solid ${selectedDoctor?.id === d.id ? '#2563eb' : '#e2e8f0'}`,
                                    borderRadius: '10px',
                                    background: selectedDoctor?.id === d.id ? '#eff6ff' : '#fff',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: selectedDoctor?.id === d.id ? '#2563eb' : '#e2e8f0',
                                    color: selectedDoctor?.id === d.id ? '#fff' : '#64748b',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', fontWeight: 700, flexShrink: 0,
                                }}>
                                    {d.first_name[0]}{d.last_name[0]}
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                        Dr. {d.first_name} {d.last_name}
                                    </div>
                                    {d.license_number && (
                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>CMP {d.license_number}</div>
                                    )}
                                </div>
                                {selectedDoctor?.id === d.id && (
                                    <div style={{ marginLeft: 'auto', color: '#2563eb', fontSize: '18px' }}>✓</div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Fecha */}
            {selectedDoctor && (
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Fecha
                    </div>
                    <input
                        type="date"
                        value={date}
                        min={addDays(today(), 1)}
                        onChange={e => setDate(e.target.value)}
                        style={{ padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#0f172a' }}
                    />

                    {/* Disponibilidad */}
                    {date && (
                        <div style={{ marginTop: '12px' }}>
                            {loadingAvail ? (
                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Verificando disponibilidad...</div>
                            ) : availability ? (
                                availability.available ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                                        <span style={{ color: '#16a34a', fontSize: '16px' }}>✓</span>
                                        <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>
                                            {availability.remaining} cupos disponibles · {availability.start_time?.slice(0, 5)} – {availability.end_time?.slice(0, 5)}
                                        </span>
                                    </div>
                                ) : isPatient ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                                        <span style={{ color: '#dc2626', fontSize: '16px' }}>✕</span>
                                        <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>Sin cupos disponibles</span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '16px' }}>⚠️</span>
                                        <span style={{ fontSize: '13px', color: '#c2410c', fontWeight: 500 }}>
                                            Cupo lleno — se agendará como paciente adicional
                                        </span>
                                    </div>
                                )
                            ) : null}
                        </div>
                    )}
                </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button onClick={onBack} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer', color: '#475569' }}>
                    ← Volver
                </button>
                <button
                    onClick={() => onSelect({ doctor: selectedDoctor, date })}
                    disabled={!selectedDoctor || (isPatient && !availability?.available)}
                    style={{
                        padding: '10px 24px', border: 'none', borderRadius: '8px',
                        background: (selectedDoctor && (!isPatient || availability?.available)) ? '#2563eb' : '#e2e8f0',
                        color: (selectedDoctor && (!isPatient || availability?.available)) ? '#fff' : '#94a3b8',
                        fontSize: '14px', fontWeight: 500,
                        cursor: (selectedDoctor && (!isPatient || availability?.available)) ? 'pointer' : 'not-allowed',
                    }}
                >
                    Continuar →
                </button>
            </div>
        </div>
    )
}

// ─── Step 3: Confirmar ─────────────────────────────────────────────────────
function StepConfirmar({ specialty, doctor, date, onBack, onConfirm, isPatient, patientId }) {
    const { user } = useAuthStore()
    const [notes, setNotes] = useState('')
    const [selectedPatientId, setSelectedPatientId] = useState(patientId || user?.id)

    const { data: patients = [] } = useQuery({
        queryKey: ['patients'],
        queryFn: () => api.get('/users?role=patient').then(r => r.data.data),
        enabled: !isPatient,
    })

    const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('es-PE', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    return (
        <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Confirmar cita</h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b' }}>Revisa los datos antes de agendar</p>

            {/* Resumen */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                {[
                    { label: 'Especialidad', value: specialty.name },
                    { label: 'Médico', value: `Dr. ${doctor.first_name} ${doctor.last_name}` },
                    { label: 'Fecha', value: dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1) },
                ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e8edf2' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>{item.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{item.value}</span>
                    </div>
                ))}
            </div>

            {/* Paciente (solo para staff) */}
            {!isPatient && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                        Paciente
                    </label>
                    <select
                        value={selectedPatientId}
                        onChange={e => setSelectedPatientId(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none' }}
                    >
                        <option value="">Seleccionar paciente...</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Notas */}
            <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Notas (opcional)
                </label>
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Síntomas, motivo de consulta..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onBack} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer', color: '#475569' }}>
                    ← Volver
                </button>
                <button
                    onClick={() => onConfirm({ notes, patientId: isPatient ? user.id : selectedPatientId })}
                    disabled={!isPatient && !selectedPatientId}
                    style={{
                        padding: '10px 28px', border: 'none', borderRadius: '8px',
                        background: (!isPatient && !selectedPatientId) ? '#e2e8f0' : '#2563eb',
                        color: (!isPatient && !selectedPatientId) ? '#94a3b8' : '#fff',
                        fontSize: '14px', fontWeight: 600, cursor: (!isPatient && !selectedPatientId) ? 'not-allowed' : 'pointer',
                    }}
                >
                    Confirmar cita
                </button>
            </div>
        </div>
    )
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function Agendar() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
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
            <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>¡Cita agendada!</h2>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 28px' }}>
                    Tu cita con Dr. {doctor.first_name} {doctor.last_name} ha sido registrada exitosamente.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        onClick={() => { setStep(1); setSpecialty(null); setDoctor(null); setDate(null); setSuccess(false) }}
                        style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer', color: '#475569' }}
                    >
                        Agendar otra
                    </button>
                    <button
                        onClick={() => navigate(isPatient ? '/mis-citas' : '/recepcion')}
                        style={{ padding: '10px 24px', border: 'none', borderRadius: '8px', background: '#2563eb', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        {isPatient ? 'Ver mis citas' : 'Ver panel'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '640px' }}>
            <StepBar step={step} />

            {bookMutation.isError && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', color: '#dc2626' }}>
                    {bookMutation.error?.response?.data?.error || 'Error al agendar la cita'}
                </div>
            )}

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
    )
}