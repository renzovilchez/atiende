const { z } = require('zod')
const scheduleService = require('../services/schedule.service')

const createSchema = z.object({
    doctor_id: z.string().uuid(),
    room_id: z.string().uuid().optional(),
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM requerido'),
    end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM requerido'),
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

async function getByDoctor(req, res, next) {
    try {
        const { doctor_id } = req.query
        if (!doctor_id) return res.status(400).json({ success: false, error: 'doctor_id es requerido' })
        const schedules = await scheduleService.getByDoctor(req.tenantId, doctor_id)
        res.json({ success: true, data: schedules })
    } catch (err) { next(err) }
}

async function create(req, res, next) {
    try {
        const data = createSchema.parse(req.body)
        const schedule = await scheduleService.create(req.tenantId, data, req.user.id)
        res.status(201).json({ success: true, data: schedule })
    } catch (err) { next(err) }
}

async function update(req, res, next) {
    try {
        const data = updateSchema.parse(req.body)
        const schedule = await scheduleService.update(req.tenantId, req.params.id, data)
        res.json({ success: true, data: schedule })
    } catch (err) { next(err) }
}

async function createOverride(req, res, next) {
    try {
        const data = overrideSchema.parse(req.body)
        const override = await scheduleService.createOverride(req.tenantId, req.params.id, data, req.user.id)
        res.status(201).json({ success: true, data: override })
    } catch (err) { next(err) }
}

async function getOverrides(req, res, next) {
    try {
        const overrides = await scheduleService.getOverrides(req.tenantId, req.params.id)
        res.json({ success: true, data: overrides })
    } catch (err) { next(err) }
}

async function remove(req, res, next) {
    try {
        await scheduleService.remove(req.tenantId, req.params.id)
        res.json({ success: true })
    } catch (err) { next(err) }
}

module.exports = { getByDoctor, create, update, createOverride, getOverrides, remove }