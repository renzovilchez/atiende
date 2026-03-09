const STATUS_CONFIG = {
    scheduled: { label: 'Agendada', bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
    confirmed: { label: 'Confirmada', bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
    in_progress: { label: 'En consulta', bg: '#fff7ed', color: '#c2410c', dot: '#f97316' },
    completed: { label: 'Completada', bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
    cancelled: { label: 'Cancelada', bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
    no_show: { label: 'No asistió', bg: '#fdf4ff', color: '#9333ea', dot: '#a855f7' },
}

export default function StatusBadge({ status, size = 'md' }) {
    const config = STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' }
    const fontSize = size === 'sm' ? '11px' : '12px'
    const padding = size === 'sm' ? '2px 8px' : '3px 10px'

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding,
            borderRadius: '999px',
            background: config.bg,
            color: config.color,
            fontSize,
            fontWeight: 600,
            whiteSpace: 'nowrap',
        }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: config.dot, flexShrink: 0 }} />
            {config.label}
        </span>
    )
}