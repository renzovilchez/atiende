const specialtyService = require('../services/specialty.service')

async function getAll(req, res, next) {
    try {
        const specialties = await specialtyService.getAll(req.tenantId)
        res.json({ success: true, data: specialties })
    } catch (err) { next(err) }
}

async function getById(req, res, next) {
    try {
        const specialty = await specialtyService.getById(req.tenantId, req.params.id)
        res.json({ success: true, data: specialty })
    } catch (err) { next(err) }
}

async function getDoctors(req, res, next) {
    try {
        const doctors = await specialtyService.getDoctors(req.tenantId, req.params.id)
        res.json({ success: true, data: doctors })
    } catch (err) { next(err) }
}

async function create(req, res, next) {
    try {
        const specialty = await specialtyService.create(req.tenantId, req.body)
        res.status(201).json({ success: true, data: specialty })
    } catch (err) { next(err) }
}

async function update(req, res, next) {
    try {
        const specialty = await specialtyService.update(req.tenantId, req.params.id, req.body)
        res.json({ success: true, data: specialty })
    } catch (err) { next(err) }
}

module.exports = { getAll, getById, getDoctors, create, update }