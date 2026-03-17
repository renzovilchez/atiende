const { z } = require('zod')
const patientService = require('../services/patient.service')

const createSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    phone: z.string().max(30).optional(),
    dni: z.string().max(20).optional(),
})

const updateSchema = z.object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional(),
    dni: z.string().max(20).optional(),
}).strict()

const profileSchema = z.object({
    birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    allergies: z.string().max(1000).optional(),
    notes: z.string().max(1000).optional(),
}).strict()

async function getAll(req, res, next) {
    try {
        const search = req.query.search || null
        const patients = await patientService.getAll(req.tenantId, search)
        res.json({ success: true, data: patients })
    } catch (err) { next(err) }
}

async function getById(req, res, next) {
    try {
        const patient = await patientService.getById(req.tenantId, req.params.id)
        res.json({ success: true, data: patient })
    } catch (err) { next(err) }
}

async function create(req, res, next) {
    try {
        const data = createSchema.parse(req.body)
        const patient = await patientService.create(req.tenantId, data)
        res.status(201).json({ success: true, data: patient })
    } catch (err) { next(err) }
}

async function update(req, res, next) {
    try {
        const data = updateSchema.parse(req.body)
        const patient = await patientService.update(req.tenantId, req.params.id, data)
        res.json({ success: true, data: patient })
    } catch (err) { next(err) }
}

async function getProfile(req, res, next) {
    try {
        const profile = await patientService.getProfile(req.tenantId, req.params.id)
        res.json({ success: true, data: profile })
    } catch (err) { next(err) }
}

async function updateProfile(req, res, next) {
    try {
        const data = profileSchema.parse(req.body)
        const profile = await patientService.updateProfile(req.tenantId, req.params.id, data)
        res.json({ success: true, data: profile })
    } catch (err) { next(err) }
}

async function remove(req, res, next) {
    try {
        await patientService.remove(req.tenantId, req.params.id)
        res.json({ success: true })
    } catch (err) { next(err) }
}

module.exports = { getAll, getById, create, update, getProfile, updateProfile, remove }