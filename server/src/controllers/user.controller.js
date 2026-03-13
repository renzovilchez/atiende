const { z } = require('zod')
const userService = require('../services/user.service')

const createSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['admin', 'receptionist', 'doctor', 'patient']),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    phone: z.string().optional(),
    dni: z.string().optional(),
})

async function getAll(req, res, next) {
    try {
        const role = req.query.role || null
        const users = await userService.getAll(req.tenantId, role)
        res.json({ success: true, data: users })
    } catch (err) { next(err) }
}

async function getPatients(req, res, next) {
    try {
        const patients = await userService.getPatients(req.tenantId)
        res.json({ success: true, data: patients })
    } catch (err) { next(err) }
}

async function getAllPlatform(req, res, next) {
    try {
        const users = await userService.getAllPlatform()
        res.json({ success: true, data: users })
    } catch (err) { next(err) }
}

async function create(req, res, next) {
    try {
        const data = createSchema.parse(req.body)
        const user = await userService.create(req.tenantId, data)
        res.status(201).json({ success: true, data: user })
    } catch (err) { next(err) }
}

async function deactivate(req, res, next) {
    try {
        const user = await userService.deactivate(req.tenantId, req.params.id)
        res.json({ success: true, data: user })
    } catch (err) { next(err) }
}

module.exports = { getAll, getPatients, getAllPlatform, create, deactivate }