const { z } = require('zod')
const tenantService = require('../services/tenant.service')

const createSchema = z.object({
    name: z.string().min(2).max(255),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
    ruc: z.string().max(20).optional(),
    phone: z.string().max(30).optional(),
    city: z.string().max(100).optional(),
    address: z.string().max(500).optional(),
})

const updateSchema = z.object({
    name: z.string().min(2).max(255).optional(),
    phone: z.string().max(30).optional(),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    ruc: z.string().max(20).optional(),
}).strict()

async function getAll(req, res, next) {
    try {
        const tenants = await tenantService.getAll()
        res.json({ success: true, data: tenants })
    } catch (err) { next(err) }
}

async function getById(req, res, next) {
    try {
        const tenant = await tenantService.getById(req.params.id)
        res.json({ success: true, data: tenant })
    } catch (err) { next(err) }
}

async function getMe(req, res, next) {
    try {
        const tenant = await tenantService.getById(req.tenantId)
        res.json({ success: true, data: tenant })
    } catch (err) { next(err) }
}

async function create(req, res, next) {
    try {
        const data = createSchema.parse(req.body)
        const tenant = await tenantService.create(data)
        res.status(201).json({ success: true, data: tenant })
    } catch (err) { next(err) }
}

async function update(req, res, next) {
    try {
        const data = updateSchema.parse(req.body)
        const tenant = await tenantService.update(req.params.id, data)
        res.json({ success: true, data: tenant })
    } catch (err) { next(err) }
}

async function updateMe(req, res, next) {
    try {
        const data = updateSchema.parse(req.body)
        const tenant = await tenantService.update(req.tenantId, data)
        res.json({ success: true, data: tenant })
    } catch (err) { next(err) }
}

async function remove(req, res, next) {
    try {
        await tenantService.remove(req.params.id)
        res.json({ success: true })
    } catch (err) { next(err) }
}

module.exports = { getAll, getById, getMe, create, update, updateMe, remove }