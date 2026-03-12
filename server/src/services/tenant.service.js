const { z } = require('zod')
const tenantRepository = require('../repositories/tenant.repository')
const { AppError } = require('../middleware/error.middleware')

const updateTenantSchema = z.object({
    name: z.string().min(2).max(255).optional(),
    phone: z.string().max(30).optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    ruc: z.string().max(20).optional(),
}).strict() // no permite campos extra

const createTenantSchema = z.object({
    name: z.string().min(2).max(255),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
    ruc: z.string().max(20).optional(),
    phone: z.string().max(30).optional(),
    city: z.string().max(100).optional(),
})

async function getAll() {
    return tenantRepository.findAll()
}

async function getById(id) {
    const tenant = await tenantRepository.findById(id)
    if (!tenant) throw new AppError('Clínica no encontrada', 404)
    return tenant
}

async function create(data) {
    const validated = createTenantSchema.parse(data)

    const existing = await tenantRepository.findBySlug(validated.slug)
    if (existing) throw new AppError('Ya existe una clínica con ese slug', 409)

    return tenantRepository.create(validated)
}

async function update(id, data) {
    const validated = updateTenantSchema.parse(data)

    const tenant = await tenantRepository.findById(id)
    if (!tenant) throw new AppError('Clínica no encontrada', 404)

    return tenantRepository.update(id, validated)
}

async function remove(id) {
    const tenant = await tenantRepository.findById(id)
    if (!tenant) throw new AppError('Clínica no encontrada', 404)

    return tenantRepository.delete(id)
}

module.exports = { getAll, getById, create, update, remove }