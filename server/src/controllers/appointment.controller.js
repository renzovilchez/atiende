const { z } = require('zod')
const appointmentService = require('../services/appointment.service')

const bookSchema = z.object({
    doctor_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
    notes: z.string().max(500).optional(),
})

const rescheduleSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    doctor_id: z.string().uuid().optional(),
    reason: z.string().max(500).optional(),
})

const cancelSchema = z.object({
    reason: z.string().max(500).optional(),
})

async function book(req, res, next) {
    try {
        const data = bookSchema.parse(req.body)
        const appointment = await appointmentService.book(req.tenantId, data, req.user.id, req.user.role)
        res.status(201).json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function getById(req, res, next) {
    try {
        const appointment = await appointmentService.getById(req.tenantId, req.params.id)
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function confirm(req, res, next) {
    try {
        const appointment = await appointmentService.confirm(req.tenantId, req.params.id, req.user.id)
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function startProgress(req, res, next) {
    try {
        const appointment = await appointmentService.startProgress(req.tenantId, req.params.id, req.user.id)
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function complete(req, res, next) {
    try {
        const appointment = await appointmentService.complete(req.tenantId, req.params.id, req.user.id)
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function cancel(req, res, next) {
    try {
        const { reason } = cancelSchema.parse(req.body)
        const appointment = await appointmentService.cancel(
            req.tenantId, req.params.id, req.user.id, req.user.role, reason
        )
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function reschedule(req, res, next) {
    try {
        const data = rescheduleSchema.parse(req.body)
        const appointment = await appointmentService.reschedule(req.tenantId, req.params.id, data, req.user.id)
        res.json({ success: true, data: appointment })
    } catch (err) { next(err) }
}

async function listByDate(req, res, next) {
    try {
        const { date, doctor_id } = req.query
        if (!date) return res.status(400).json({ success: false, error: 'date es requerido' })
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

async function listMine(req, res, next) {
    try {
        // authorize('patient') en la ruta ya garantiza el rol — check redundante eliminado
        const data = await appointmentService.listByPatient(req.tenantId, req.user.id)
        res.json({ success: true, data })
    } catch (err) { next(err) }
}

module.exports = {
    book, getById, confirm, startProgress, complete,
    cancel, reschedule, listByDate, getHistory, getAvailability, listMine
}