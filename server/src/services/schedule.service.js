const { z } = require('zod')
const ScheduleRepository = require('../repositories/schedule.repository')
const { AppError } = require('../middleware/error.middleware')

const createSchema = z.object({
    doctor_id: z.string().uuid(),
    room_id: z.string().uuid().optional(),
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
    max_patients: z.number().int().min(1).max(100).optional(),
})

const updateSchema = createSchema.omit({ doctor_id: true }).partial().strict()

const overrideSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    is_blocked: z.boolean().optional(),
    room_id: z.string().uuid().optional(),
    start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    max_patients: z.number().int().min(1).optional(),
    reason: z.string().max(500).optional(),
})

async function getByDoctor(tenantId, doctorId) {
    const repo = new ScheduleRepository(tenantId)
    return repo.findByDoctor(doctorId)
}

async function create(tenantId, data, createdBy) {
    const validated = createSchema.parse(data)
    const repo = new ScheduleRepository(tenantId)
    return repo.create(validated)
}

async function update(tenantId, id, data) {
    const validated = updateSchema.parse(data)
    const repo = new ScheduleRepository(tenantId)
    const schedule = await repo.findById(id)
    if (!schedule) throw new AppError('Turno no encontrado', 404)
    return repo.update(id, validated)
}

async function createOverride(tenantId, scheduleId, data, createdBy) {
    const validated = overrideSchema.parse(data)
    const repo = new ScheduleRepository(tenantId)
    const schedule = await repo.findById(scheduleId)
    if (!schedule) throw new AppError('Turno no encontrado', 404)
    return repo.createOverride({ ...validated, schedule_id: scheduleId, created_by: createdBy })
}

async function getOverrides(tenantId, scheduleId) {
    const repo = new ScheduleRepository(tenantId)
    const schedule = await repo.findById(scheduleId)
    if (!schedule) throw new AppError('Turno no encontrado', 404)
    return repo.findOverrides(scheduleId)
}

module.exports = { getByDoctor, create, update, createOverride, getOverrides }