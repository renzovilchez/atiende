const { z } = require('zod')
const doctorService = require('../services/doctor.service')

const createSchema = z.object({
    user_id: z.string().uuid(),
    specialty_id: z.string().uuid().optional(),
    license_number: z.string().optional(),
    bio: z.string().optional(),
})

const updateSchema = z.object({
    specialty_id: z.string().uuid().optional(),
    license_number: z.string().optional(),
    bio: z.string().optional(),
})

async function getAll(req, res, next) {
    try {
        const doctors = await doctorService.getAll(req.tenantId)
        res.json({ success: true, data: doctors })
    } catch (err) { next(err) }
}

async function getById(req, res, next) {
    try {
        const doctor = await doctorService.getById(req.tenantId, req.params.id)
        res.json({ success: true, data: doctor })
    } catch (err) { next(err) }
}

async function getAvailability(req, res, next) {
    try {
        const { date } = req.query
        if (!date) return res.status(400).json({ success: false, error: 'date es requerido' })
        const availability = await doctorService.getAvailability(req.tenantId, req.params.id, date)
        res.json({ success: true, data: availability })
    } catch (err) { next(err) }
}

async function getSchedules(req, res, next) {
    try {
        const schedules = await doctorService.getSchedules(req.tenantId, req.params.id)
        res.json({ success: true, data: schedules })
    } catch (err) { next(err) }
}

async function create(req, res, next) {
    try {
        const data = createSchema.parse(req.body)
        const doctor = await doctorService.create(req.tenantId, data)
        res.status(201).json({ success: true, data: doctor })
    } catch (err) { next(err) }
}

async function update(req, res, next) {
    try {
        const data = updateSchema.parse(req.body)
        const doctor = await doctorService.update(req.tenantId, req.params.id, data)
        res.json({ success: true, data: doctor })
    } catch (err) { next(err) }
}

async function deactivate(req, res, next) {
    try {
        const doctor = await doctorService.deactivate(req.tenantId, req.params.id)
        res.json({ success: true, data: doctor })
    } catch (err) { next(err) }
}

async function getMe(req, res, next) {
    try {
        const doctor = await doctorService.getMe(req.tenantId, req.user.id)
        res.json({ success: true, data: doctor })
    } catch (err) { next(err) }
}

module.exports = { getAll, getById, getAvailability, getSchedules, create, update, deactivate, getMe }