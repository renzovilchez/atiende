const bcrypt = require('bcryptjs')
const { AppError } = require('../middleware/error.middleware')
const UserRepository = require('../repositories/user.repository')

async function getAll(tenantId, role = null) {
    const repo = new UserRepository(tenantId)
    return repo.findAll(role)
}

async function getPatients(tenantId) {
    const repo = new UserRepository(tenantId)
    return repo.findPatients()
}

async function getAllPlatform() {
    const repo = new UserRepository()
    return repo.findAllPlatform()
}

async function create(tenantId, data) {
    const repo = new UserRepository(tenantId)

    const exists = await repo.findByEmail(data.email)
    if (exists) throw new AppError('Ya existe un usuario con ese email', 409)

    const password_hash = await bcrypt.hash(data.password, 10)

    return repo.create({
        tenant_id: tenantId,
        role: data.role,
        email: data.email.toLowerCase(),
        password_hash,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || null,
        dni: data.dni || null,
    })
}

async function update(tenantId, userId, data) {
    const repo = new UserRepository(tenantId)
    const user = await repo.findById(userId)
    if (!user) throw new AppError('Usuario no encontrado', 404)
    return repo.update(userId, data)
}

async function deactivate(tenantId, userId) {
    const repo = new UserRepository(tenantId)
    const user = await repo.deactivate(userId)
    if (!user) throw new AppError('Usuario no encontrado', 404)
    return user
}

module.exports = { getAll, getPatients, getAllPlatform, create, update, deactivate }