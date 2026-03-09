const appointmentService = require('../services/appointment.service')

async function book(req, res, next) {
    try {
        const appointment = await appointmentService.book(req.tenantId, req.body, req.user.sub)
        res.status(201).json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function confirm(req, res, next) {
    try {
        const appointment = await appointmentService.confirm(req.tenantId, req.params.id, req.user.sub)
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function startProgress(req, res, next) {
    try {
        const appointment = await appointmentService.startProgress(req.tenantId, req.params.id, req.user.sub)
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function complete(req, res, next) {
    try {
        const appointment = await appointmentService.complete(req.tenantId, req.params.id, req.user.sub)
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function cancel(req, res, next) {
    try {
        const { reason } = req.body
        const appointment = await appointmentService.cancel(req.tenantId, req.params.id, req.user.sub, reason)
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function reschedule(req, res, next) {
    try {
        const appointment = await appointmentService.reschedule(req.tenantId, req.params.id, req.body, req.user.sub)
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function authorizeExtra(req, res, next) {
    try {
        const appointment = await appointmentService.authorizeExtra(req.tenantId, req.params.id, req.body, req.user.sub)
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function listByDate(req, res, next) {
    try {
        const { date, doctor_id } = req.query
        if (!date) return res.status(400).json({ success: false, error: 'El parámetro date es requerido' })
        const appointments = await appointmentService.listByDate(req.tenantId, date, doctor_id)
        res.json({ success: true, data: appointments })
    } catch (err) { next(err) }
}

async function getHistory(req, res, next) {
    try {
        const history = await appointmentService.getHistory(req.tenantId, req.params.id)
        res.json({ success: true, data: history })
    } catch (err) { next(err) }
}

async function getAvailability(req, res, next) {
    try {
        const { doctor_id, date } = req.query
        if (!doctor_id || !date) {
            return res.status(400).json({ success: false, error: 'doctor_id y date son requeridos' })
        }
        const availability = await appointmentService.getAvailability(req.tenantId, doctor_id, date)
        res.json({ success: true, data: availability })
    } catch (err) { next(err) }
}

module.exports = { book, confirm, startProgress, complete, cancel, reschedule, authorizeExtra, listByDate, getHistory, getAvailability }