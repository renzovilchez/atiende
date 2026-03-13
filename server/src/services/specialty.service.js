const SpecialtyRepository = require('../repositories/specialty.repository')
const DoctorRepository = require('../repositories/doctor.repository')
const { AppError } = require('../middleware/error.middleware')

async function getAll(tenantId) {
    return new SpecialtyRepository(tenantId).findAll()
}

async function getById(tenantId, id) {
    const specialty = await new SpecialtyRepository(tenantId).findById(id)
    if (!specialty) throw new AppError('Especialidad no encontrada', 404)
    return specialty
}

async function getDoctors(tenantId, specialtyId) {
    return new DoctorRepository(tenantId).findBySpecialty(specialtyId)
}

async function create(tenantId, data) {
    return new SpecialtyRepository(tenantId).create(data)
}

async function update(tenantId, id, data) {
    const specialty = await new SpecialtyRepository(tenantId).update(id, data)
    if (!specialty) throw new AppError('Especialidad no encontrada', 404)
    return specialty
}

module.exports = { getAll, getById, getDoctors, create, update }