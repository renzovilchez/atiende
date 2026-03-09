const db = require('../db/knex')

class AppointmentRepository {
    constructor(tenantId) {
        this.tenantId = tenantId
    }

    // Obtiene el schedule activo para un doctor en una fecha dada
    // Primero busca override, si no existe usa el patrón semanal
    async getScheduleForDate(doctorId, date) {
        const dayOfWeek = new Date(date).getUTCDay()

        const schedule = await db('schedules')
            .where({ doctor_id: doctorId, day_of_week: dayOfWeek, is_active: true })
            .first()

        if (!schedule) return null

        const override = await db('schedule_overrides')
            .where({ schedule_id: schedule.id, date })
            .first()

        if (override?.is_blocked) return null

        return {
            ...schedule,
            // Si hay override, sus valores tienen prioridad
            room_id: override?.room_id ?? schedule.room_id,
            start_time: override?.start_time ?? schedule.start_time,
            end_time: override?.end_time ?? schedule.end_time,
            max_patients: override?.max_patients ?? schedule.max_patients,
        }
    }

    // Cuenta cuántas citas activas hay para un doctor en una fecha
    async countAppointments(doctorId, date) {
        const { count } = await db('appointments')
            .where({ tenant_id: this.tenantId, doctor_id: doctorId, date })
            .whereNotIn('status', ['cancelled', 'no_show'])
            .count('id as count')
            .first()
        return parseInt(count)
    }

    // Siguiente número en la cola para ese doctor y fecha
    async nextQueuePosition(doctorId, date) {
        const { max } = await db('appointments')
            .where({ tenant_id: this.tenantId, doctor_id: doctorId, date })
            .max('queue_position as max')
            .first()
        return (max || 0) + 1
    }

    async create(data) {
        const [row] = await db('appointments')
            .insert({ ...data, tenant_id: this.tenantId })
            .returning('*')
        return row
    }

    async findById(id) {
        return db('appointments')
            .where({ id, tenant_id: this.tenantId })
            .first()
    }

    async findByDate(date, filters = {}) {
        return db('appointments as a')
            .join('doctors as d', 'd.id', 'a.doctor_id')
            .join('users as du', 'du.id', 'd.user_id')
            .join('users as pu', 'pu.id', 'a.patient_id')
            .leftJoin('specialties as s', 's.id', 'd.specialty_id')
            .leftJoin('rooms as r', 'r.id', 'a.room_id')
            .where('a.tenant_id', this.tenantId)
            .where('a.date', date)
            .where(filters)
            .select(
                'a.*',
                'du.first_name as doctor_first_name',
                'du.last_name as doctor_last_name',
                'pu.first_name as patient_first_name',
                'pu.last_name as patient_last_name',
                's.name as specialty_name',
                'r.name as room_name'
            )
            .orderBy('a.queue_position')
    }

    async update(id, data) {
        const [row] = await db('appointments')
            .where({ id, tenant_id: this.tenantId })
            .update({ ...data, updated_at: db.fn.now() })
            .returning('*')
        return row
    }

    async logEvent({ appointmentId, fromStatus, toStatus, changedBy, reason, metadata }) {
        await db('queue_events').insert({
            tenant_id: this.tenantId,
            appointment_id: appointmentId,
            from_status: fromStatus,
            to_status: toStatus,
            changed_by: changedBy,
            reason,
            metadata: metadata ? JSON.stringify(metadata) : null,
        })
    }
}

module.exports = AppointmentRepository