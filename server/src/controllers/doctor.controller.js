const doctorService = require('../services/doctor.service')

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

module.exports = { getAll, getById, getAvailability, getSchedules }