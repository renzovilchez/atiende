const scheduleService = require('../services/schedule.service')

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
        const schedule = await scheduleService.create(req.tenantId, req.body, req.user.sub)
        res.status(201).json({ success: true, data: schedule })
    } catch (err) { next(err) }
}

async function update(req, res, next) {
    try {
        const schedule = await scheduleService.update(req.tenantId, req.params.id, req.body)
        res.json({ success: true, data: schedule })
    } catch (err) { next(err) }
}

async function createOverride(req, res, next) {
    try {
        const override = await scheduleService.createOverride(req.tenantId, req.params.id, req.body, req.user.sub)
        res.status(201).json({ success: true, data: override })
    } catch (err) { next(err) }
}

async function getOverrides(req, res, next) {
    try {
        const overrides = await scheduleService.getOverrides(req.tenantId, req.params.id)
        res.json({ success: true, data: overrides })
    } catch (err) { next(err) }
}

module.exports = { getByDoctor, create, update, createOverride, getOverrides }