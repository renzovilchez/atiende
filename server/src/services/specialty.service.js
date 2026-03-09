const SpecialtyRepository = require('../repositories/specialty.repository')
const DoctorRepository = require('../repositories/doctor.repository')
const { AppError } = require('../middleware/error.middleware')
const { z } = require('zod')
const db = require('../db/knex')

const createSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    duration_minutes: z.number().int().min(5).max(180).optional(),
})

const updateSchema = createSchema.partial().strict()

async function getAll(tenantId) {
    const repo = new SpecialtyRepository(tenantId)
    return repo.findAll()
}

async function getById(tenantId, id) {
    const repo = new SpecialtyRepository(tenantId)
    const specialty = await repo.findById(id)
    if (!specialty) throw new AppError('Especialidad no encontrada', 404)
    return specialty
}

async function getDoctors(tenantId, specialtyId) {
    const repo = new DoctorRepository(tenantId)
    return repo.findBySpecialty(specialtyId)
}

async function create(tenantId, data) {
    const validated = createSchema.parse(data)
    const [row] = await db('specialties')
        .insert({ ...validated, tenant_id: tenantId })
        .returning('*')
    return row
}

async function update(tenantId, id, data) {
    const validated = updateSchema.parse(data)
    const [row] = await db('specialties')
        .where({ id, tenant_id: tenantId })
        .update({ ...validated, updated_at: db.fn.now() })
        .returning('*')
    if (!row) throw new AppError('Especialidad no encontrada', 404)
    return row
}

module.exports = { getAll, getById, getDoctors, create, update }