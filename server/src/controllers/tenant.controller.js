const tenantService = require('../services/tenant.service')

// GET /api/tenants — solo super_admin
async function getAll(req, res, next) {
    try {
        const tenants = await tenantService.getAll()
        res.json({ success: true, data: tenants })
    } catch (err) { next(err) }
}

// GET /api/tenants/me — admin ve su propia clínica
async function getMe(req, res, next) {
    try {
        const tenant = await tenantService.getById(req.tenantId)
        res.json({ success: true, data: tenant })
    } catch (err) { next(err) }
}

// POST /api/tenants — solo super_admin crea clínicas
async function create(req, res, next) {
    try {
        const tenant = await tenantService.create(req.body)
        res.status(201).json({ success: true, data: tenant })
    } catch (err) { next(err) }
}

// PATCH /api/tenants/me — admin edita su propia clínica
async function updateMe(req, res, next) {
    try {
        const tenant = await tenantService.update(req.tenantId, req.body)
        res.json({ success: true, data: tenant })
    } catch (err) { next(err) }
}

module.exports = { getAll, getMe, create, updateMe }