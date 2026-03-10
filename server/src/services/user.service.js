const UserRepository = require('../repositories/user.repository')

async function getAll(tenantId, isSuperAdmin, role = null) {
    const repo = new UserRepository(isSuperAdmin ? null : tenantId)
    const users = isSuperAdmin ? await repo.findAllGlobal() : await repo.findAll()
    if (role) return users.filter(u => u.role === role)
    return users
}

module.exports = { getAll }