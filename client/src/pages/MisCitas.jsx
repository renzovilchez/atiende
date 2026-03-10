import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'

const FILTERS = [
    { label: 'Todas', value: 'all' },
    { label: 'Próximas', value: 'upcoming' },
    { label: 'Completadas', value: 'completed' },
    { label: 'Canceladas', value: 'cancelled' },
]

function formatDate(dateStr) {
    const datePart = dateStr?.split('T')[0] ?? dateStr
    return new Date(datePart + 'T12:00:00').toLocaleDateString('es-PE', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Cancelar cita</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                    Dr. {appointment.doctor_first_name} {appointment.doctor_last_name} — {formatDate(appointment.date)}
                </p>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Motivo de cancelación (opcional)..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>
                        Volver
                    </button>
                    <button onClick={handleConfirm} disabled={saving} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', background: '#dc2626', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 500, opacity: saving ? 0.7 : 1 }}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '480px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Detalle de cita</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
                </div>
                {isLoading ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Cargando...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {data?.map(event => (
                            <div key={event.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', marginTop: '5px', flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>
                                        {event.from_status ? `${STATUS_LABELS[event.from_status]} → ` : ''}{STATUS_LABELS[event.to_status]}
                                    </div>
                                    {event.reason && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{event.reason}</div>}
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                        {new Date(event.created_at).toLocaleString('es-PE')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function CitaCard({ appt, onCancel, onHistory }) {
    const isPast = (appt.date?.split('T')[0] ?? appt.date) < new Date().toISOString().split('T')[0]
    const canCancel = !['completed', 'cancelled', 'no_show'].includes(appt.status) && !isPast

    const dateFormatted = formatDate(appt.date)

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #e8edf2',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
            opacity: appt.status === 'cancelled' ? 0.6 : 1,
        }}>
            {/* Fecha destacada */}
            <div style={{
                flexShrink: 0,
                width: '56px',
                textAlign: 'center',
                background: '#f0f6ff',
                borderRadius: '10px',
                padding: '10px 8px',
            }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>
                    {new Date((appt.date?.split('T')[0] ?? appt.date) + 'T12:00:00').getDate()}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
                    {new Date((appt.date?.split('T')[0] ?? appt.date) + 'T12:00:00').toLocaleDateString('es-PE', { month: 'short' })}
                </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        Dr. {appt.doctor_first_name} {appt.doctor_last_name}
                    </div>
                    <StatusBadge status={appt.status} size="sm" />
                </div>
                {appt.specialty_name && (
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{appt.specialty_name}</div>
                )}
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)}
                    {appt.queue_position && ` · Turno #${appt.queue_position}`}
                </div>
                {appt.notes && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>"{appt.notes}"</div>
                )}
                {appt.extra_service && (
                    <div style={{ fontSize: '12px', color: '#f97316', marginTop: '4px', fontWeight: 500 }}>+ {appt.extra_service}</div>
                )}
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                <button
                    onClick={() => onHistory(appt)}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#64748b', whiteSpace: 'nowrap' }}
                >
                    Ver detalle
                </button>
                {canCancel && (
                    <button
                        onClick={() => onCancel(appt)}
                        style={{ padding: '6px 12px', border: '1px solid #fecaca', borderRadius: '6px', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#dc2626', whiteSpace: 'nowrap' }}
                    >
                        Cancelar
                    </button>
                )}
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
            .catch(err => { console.error('FETCH ERROR:', err.response?.status, err.message); return [] }),
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
        <div style={{ maxWidth: '720px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Mis citas</h1>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Historial y citas próximas</p>
                </div>
                <button
                    onClick={() => navigate('/agendar')}
                    style={{ padding: '9px 18px', border: 'none', borderRadius: '8px', background: '#2563eb', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                    + Nueva cita
                </button>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                {FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '999px',
                            border: '1px solid',
                            borderColor: filter === f.value ? '#2563eb' : '#e2e8f0',
                            background: filter === f.value ? '#eff6ff' : '#fff',
                            color: filter === f.value ? '#2563eb' : '#64748b',
                            fontSize: '13px',
                            fontWeight: filter === f.value ? 600 : 400,
                            cursor: 'pointer',
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Lista */}
            {isLoading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px' }}>Cargando citas...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>No tienes citas {filter === 'upcoming' ? 'próximas' : ''}</div>
                    {filter === 'upcoming' && (
                        <button
                            onClick={() => navigate('/agendar')}
                            style={{ marginTop: '16px', padding: '9px 20px', border: 'none', borderRadius: '8px', background: '#2563eb', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Agendar una cita
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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