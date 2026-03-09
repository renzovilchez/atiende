const UserRepository = require('../repositories/user.repository')

async function getAll(tenantId, isSuperAdmin) {
    const repo = new UserRepository(isSuperAdmin ? null : tenantId)
    if (isSuperAdmin) return repo.findAllGlobal()
    return repo.findAll()
}

module.exports = { getAll }