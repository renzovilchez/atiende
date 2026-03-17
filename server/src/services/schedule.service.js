const ScheduleRepository = require('../repositories/schedule.repository')
const { AppError } = require('../middleware/error.middleware')

async function getByDoctor(tenantId, doctorId) {
    return new ScheduleRepository(tenantId).findByDoctor(doctorId)
}

async function create(tenantId, data, createdBy) {
    const repo = new ScheduleRepository(tenantId)
    return repo.create({ ...data, tenant_id: tenantId })
}

async function update(tenantId, id, data) {
    const repo = new ScheduleRepository(tenantId)
    const schedule = await repo.findById(id)
    if (!schedule) throw new AppError('Turno no encontrado', 404)
    return repo.update(id, data)
}

async function createOverride(tenantId, scheduleId, data, createdBy) {
    const repo = new ScheduleRepository(tenantId)
    const schedule = await repo.findById(scheduleId)
    if (!schedule) throw new AppError('Turno no encontrado', 404)
    return repo.createOverride({ ...data, schedule_id: scheduleId, created_by: createdBy })
}

async function getOverrides(tenantId, scheduleId) {
    const repo = new ScheduleRepository(tenantId)
    const schedule = await repo.findById(scheduleId)
    if (!schedule) throw new AppError('Turno no encontrado', 404)
    return repo.findOverrides(scheduleId)
}

async function remove(tenantId, id) {
    const repo = new ScheduleRepository(tenantId)
    const schedule = await repo.findById(id)
    if (!schedule) throw new AppError('Turno no encontrado', 404)
    await repo.delete(id)
}

module.exports = { getByDoctor, create, update, createOverride, getOverrides, remove }