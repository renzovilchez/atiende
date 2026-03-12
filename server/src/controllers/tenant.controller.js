const tenantService = require('../services/tenant.service')

// GET /api/tenants — solo super_admin
async function getAll(req, res, next) {
    try {
        const tenants = await tenantService.getAll()
        res.json({ success: true, data: tenants })
    } catch (err) { next(err) }
}

// GET /api/tenants/:id — solo super_admin
async function getById(req, res, next) {
    try {
        const tenant = await tenantService.getById(req.params.id)
        res.json({ success: true, data: tenant })
    } catch (err) { next(err) }
}

// PATCH /api/tenants/:id - super_admin actualiza cualquier clínica
async function update(req, res, next) {
    try {
        const tenant = await tenantService.update(req.params.id, req.body)
        res.json({ success: true, data: tenant })
    } catch (err) { next(err) }
}

// DELETE /api/tenants/:id - super_admin elimina una clínica (opcional)
async function remove(req, res, next) {
    try {
        await tenantService.remove(req.params.id)
        res.json({ success: true })
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
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Solo administradores pueden editar su clínica'
            });
        }

        const tenant = await tenantService.update(req.tenantId, req.body)
        res.json({ success: true, data: tenant })
    } catch (err) { next(err) }
}

module.exports = { getAll, getById, getMe, create, update, updateMe, remove }