const userService = require('../services/user.service')

async function getAll(req, res, next) {
    try {
        const isSuperAdmin = req.user.role === 'super_admin'
        const users = await userService.getAll(req.tenantId, isSuperAdmin)
        res.json({ success: true, data: users })
    } catch (err) { next(err) }
}

module.exports = { getAll }