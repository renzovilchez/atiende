const { z } = require('zod')
const db = require('../db/knex')
const AppointmentRepository = require('../repositories/appointment.repository')
const { AppError } = require('../middleware/error.middleware')

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const bookSchema = z.object({
    doctor_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    notes: z.string().max(500).optional(),
})

const rescheduleSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    doctor_id: z.string().uuid().optional(),
    reason: z.string().max(500).optional(),
})

const extraSchema = z.object({
    extra_service: z.string().min(1).max(500),
})

// Valida que la fecha no sea pasada
function validateFutureDate(date) {
    const today = new Date().toISOString().split('T')[0]
    if (date < today) throw new AppError('No se puede agendar en una fecha pasada', 400)
}

// ─── AGENDAR ───────────────────────────────────────────────────────────────
// Usa FOR UPDATE para evitar race conditions en cupos
async function book(tenantId, data, createdBy, createdByRole) {
    const validated = bookSchema.parse(data)
    validateFutureDate(validated.date)

    const doctor = await db('doctors')
        .where({
            id: validated.doctor_id,
            tenant_id: tenantId
        })
        .first();

    if (!doctor) {
        throw new AppError('Doctor no encontrado o no pertenece a esta clínica', 404);
    }

    const repo = new AppointmentRepository(tenantId)

    return db.transaction(async (trx) => {
        await trx.raw(
            `SELECT id FROM appointments
             WHERE tenant_id = ? AND doctor_id = ? AND date = ?
             FOR UPDATE`,
            [tenantId, validated.doctor_id, validated.date]
        )

        const schedule = await repo.getScheduleForDate(validated.doctor_id, validated.date)
        if (!schedule) throw new AppError('El doctor no tiene turno en esa fecha', 400)

        const count = await repo.countAppointments(validated.doctor_id, validated.date)
        const isFull = count >= schedule.max_patients

        if (isFull && createdByRole === 'patient') {
            throw new AppError(`No hay cupos disponibles. Máximo: ${schedule.max_patients}`, 409)
        }

        const existing = await trx('appointments')
            .where({
                tenant_id: tenantId,
                doctor_id: validated.doctor_id,
                patient_id: validated.patient_id,
                date: validated.date,
            })
            .whereNotIn('status', ['cancelled', 'no_show'])
            .first()

        if (existing) throw new AppError('El paciente ya tiene una cita con este doctor en esa fecha', 409)

        const queuePosition = await repo.nextQueuePosition(validated.doctor_id, validated.date)

        const [appointment] = await trx('appointments')
            .insert({
                tenant_id: tenantId,
                doctor_id: validated.doctor_id,
                patient_id: validated.patient_id,
                schedule_id: schedule.id,
                room_id: schedule.room_id,
                date: validated.date,
                queue_position: queuePosition,
                notes: validated.notes,
                created_by: createdBy,
                is_extra: isFull,
            })
            .returning('*')

        await trx('queue_events').insert({
            tenant_id: tenantId,
            appointment_id: appointment.id,
            from_status: null,
            to_status: 'scheduled',
            changed_by: createdBy,
        })

        return appointment
    })
}

// ─── CONFIRMAR LLEGADA ─────────────────────────────────────────────────────
async function confirm(tenantId, appointmentId, changedBy) {

    if (!uuidRegex.test(appointmentId)) {
        throw new AppError('ID de cita inválido', 400);
    }

    const repo = new AppointmentRepository(tenantId)
    const appointment = await repo.findById(appointmentId)

    if (!appointment) throw new AppError('Cita no encontrada', 404)
    if (appointment.status !== 'scheduled') {
        throw new AppError(`No se puede confirmar una cita en estado: ${appointment.status}`, 400)
    }

    const updated = await repo.update(appointmentId, { status: 'confirmed' })
    await repo.logEvent({
        appointmentId,
        fromStatus: 'scheduled',
        toStatus: 'confirmed',
        changedBy,
    })

    return updated
}

// ─── INICIAR CONSULTA ──────────────────────────────────────────────────────
async function startProgress(tenantId, appointmentId, changedBy) {

    if (!uuidRegex.test(appointmentId)) {
        throw new AppError('ID de cita inválido', 400);
    }

    const repo = new AppointmentRepository(tenantId)
    const appointment = await repo.findById(appointmentId)

    if (!appointment) throw new AppError('Cita no encontrada', 404)
    if (appointment.status !== 'confirmed') {
        throw new AppError(`No se puede iniciar una cita en estado: ${appointment.status}`, 400)
    }

    const updated = await repo.update(appointmentId, { status: 'in_progress' })
    await repo.logEvent({
        appointmentId,
        fromStatus: 'confirmed',
        toStatus: 'in_progress',
        changedBy,
    })

    return updated
}

// ─── COMPLETAR ─────────────────────────────────────────────────────────────
async function complete(tenantId, appointmentId, changedBy) {

    if (!uuidRegex.test(appointmentId)) {
        throw new AppError('ID de cita inválido', 400);
    }

    const repo = new AppointmentRepository(tenantId)
    const appointment = await repo.findById(appointmentId)

    if (!appointment) throw new AppError('Cita no encontrada', 404)
    if (appointment.status !== 'in_progress') {
        throw new AppError(`No se puede completar una cita en estado: ${appointment.status}`, 400)
    }

    const updated = await repo.update(appointmentId, { status: 'completed' })
    await repo.logEvent({
        appointmentId,
        fromStatus: 'in_progress',
        toStatus: 'completed',
        changedBy,
    })

    return updated
}

// ─── CANCELAR ──────────────────────────────────────────────────────────────
async function cancel(tenantId, appointmentId, changedBy, changedByRole, reason) {

    if (!uuidRegex.test(appointmentId)) {
        throw new AppError('ID de cita inválido', 400);
    }

    const repo = new AppointmentRepository(tenantId)
    const appointment = await repo.findById(appointmentId)

    if (!appointment) throw new AppError('Cita no encontrada', 404)

    if (changedByRole === 'patient' && appointment.patient_id !== changedBy) {
        throw new AppError('No puedes cancelar una cita que no te pertenece', 403)
    }

    if (['completed', 'cancelled', 'in_progress'].includes(appointment.status)) {
        throw new AppError(`No se puede cancelar una cita en estado: ${appointment.status}`, 400)
    }

    const updated = await repo.update(appointmentId, { status: 'cancelled' })

    await repo.logEvent({
        appointmentId,
        fromStatus: appointment.status,
        toStatus: 'cancelled',
        changedBy,
        reason,
    })

    return updated
}

// ─── REAGENDAR ─────────────────────────────────────────────────────────────
async function reschedule(tenantId, appointmentId, data, changedBy) {

    if (!uuidRegex.test(appointmentId)) {
        throw new AppError('ID de cita inválido', 400);
    }

    const validated = rescheduleSchema.parse(data)

    validateFutureDate(validated.date)

    const repo = new AppointmentRepository(tenantId)
    const appointment = await repo.findById(appointmentId)

    if (!appointment) throw new AppError('Cita no encontrada', 404)
    if (['completed', 'cancelled', 'in_progress'].includes(appointment.status)) {
        throw new AppError(`No se puede reagendar una cita en estado: ${appointment.status}`, 400)
    }

    const doctorId = validated.doctor_id || appointment.doctor_id

    if (validated.doctor_id) {
        const doctor = await db('doctors')
            .where({
                id: validated.doctor_id,
                tenant_id: tenantId
            })
            .first();

        if (!doctor) {
            throw new AppError('Doctor no encontrado o no pertenece a esta clínica', 404);
        }
    }

    return db.transaction(async (trx) => {
        await trx.raw(
            `SELECT id FROM appointments
       WHERE tenant_id = ? AND doctor_id = ? AND date = ?
       FOR UPDATE`,
            [tenantId, doctorId, validated.date]
        )

        const schedule = await repo.getScheduleForDate(doctorId, validated.date)
        if (!schedule) throw new AppError('El doctor no tiene turno en esa fecha', 400)

        const count = await repo.countAppointments(doctorId, validated.date)
        if (count >= schedule.max_patients) {
            throw new AppError('No hay cupos disponibles en esa fecha', 409)
        }

        const queuePosition = await repo.nextQueuePosition(doctorId, validated.date)

        const [updated] = await trx('appointments')
            .where({ id: appointmentId, tenant_id: tenantId })
            .update({
                doctor_id: doctorId,
                date: validated.date,
                queue_position: queuePosition,
                schedule_id: schedule.id,
                room_id: schedule.room_id,
                status: 'scheduled',
                updated_at: db.fn.now(),
            })
            .returning('*')

        await trx('queue_events').insert({
            tenant_id: tenantId,
            appointment_id: appointmentId,
            from_status: appointment.status,
            to_status: 'scheduled',
            changed_by: changedBy,
            reason: validated.reason,
            metadata: JSON.stringify({
                old_date: appointment.date,
                new_date: validated.date,
                old_doctor_id: appointment.doctor_id,
                new_doctor_id: doctorId,
            }),
        })

        return updated
    })
}

// ─── LISTAR CITAS DEL DÍA ─────────────────────────────────────────────────
async function listByDate(tenantId, date, doctorId = null) {
    const repo = new AppointmentRepository(tenantId)
    const filters = doctorId ? { 'a.doctor_id': doctorId } : {}
    return repo.findByDate(date, filters)
}

// ─── HISTORIAL DE UNA CITA ─────────────────────────────────────────────────
async function getHistory(tenantId, appointmentId) {

    if (!uuidRegex.test(appointmentId)) {
        throw new AppError('ID de cita inválido', 400);
    }

    const repo = new AppointmentRepository(tenantId)
    const appointment = await repo.findById(appointmentId)
    if (!appointment) throw new AppError('Cita no encontrada', 404)

    return db('queue_events as qe')
        .leftJoin('users as u', 'u.id', 'qe.changed_by')
        .where('qe.appointment_id', appointmentId)
        .select(
            'qe.*',
            'u.first_name',
            'u.last_name',
            'u.role'
        )
        .orderBy('qe.created_at')
}

// ─── CUPOS DISPONIBLES ─────────────────────────────────────────────────────
async function getAvailability(tenantId, doctorId, date) {
    const repo = new AppointmentRepository(tenantId)
    const schedule = await repo.getScheduleForDate(doctorId, date)

    if (!schedule) return { available: false, reason: 'El doctor no tiene turno en esa fecha' }

    const count = await repo.countAppointments(doctorId, date)
    const remaining = schedule.max_patients - count

    return {
        available: remaining > 0,
        remaining,
        max_patients: schedule.max_patients,
        booked: count,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
    }
}

// ─── LISTAR CITAS POR PACIENTE ─────────────────────────────────────────────
async function listByPatient(tenantId, patientId) {
    const repo = new AppointmentRepository(tenantId)
    return repo.findByPatient(patientId)
}

module.exports = { book, confirm, startProgress, complete, cancel, reschedule, listByDate, getHistory, getAvailability, listByPatient }