const DoctorRepository = require('../repositories/doctor.repository')
const AppointmentRepository = require('../repositories/appointment.repository')
const UserRepository = require('../repositories/user.repository')
const { AppError } = require('../middleware/error.middleware')

const db = require('../db/knex')
const bcrypt = require('bcryptjs')

async function getAll(tenantId) {
    return new DoctorRepository(tenantId).findAll()
}

async function getById(tenantId, id) {
    const doctor = await new DoctorRepository(tenantId).findById(id)
    if (!doctor) throw new AppError('Doctor no encontrado', 404)
    return doctor
}

async function getBySpecialty(tenantId, specialtyId) {
    return new DoctorRepository(tenantId).findBySpecialty(specialtyId)
}

async function getAvailability(tenantId, doctorId, date) {
    const doctorRepo = new DoctorRepository(tenantId)
    const doctor = await doctorRepo.findById(doctorId)
    if (!doctor) throw new AppError('Doctor no encontrado', 404)

    const apptRepo = new AppointmentRepository(tenantId)
    const schedule = await apptRepo.getScheduleForDate(doctorId, date)
    if (!schedule) return { available: false, reason: 'El doctor no tiene turno en esa fecha' }

    const count = await apptRepo.countAppointments(doctorId, date)
    const remaining = schedule.max_patients - count

    return {
        available: remaining > 0,
        remaining,
        max_patients: schedule.max_patients,
        booked: count,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room_id: schedule.room_id,
    }
}

async function getSchedules(tenantId, doctorId) {
    const repo = new DoctorRepository(tenantId)
    const doctor = await repo.findById(doctorId)
    if (!doctor) throw new AppError('Doctor no encontrado', 404)
    return repo.findSchedules(doctorId)
}

async function create(tenantId, data) {
    return db.transaction(async (trx) => {
        const userRepo = new UserRepository(tenantId)

        // Verificar email único
        const exists = await trx('users').where({ email: data.email.toLowerCase() }).first()
        if (exists) throw new AppError('Ya existe un usuario con ese email', 409)

        // Crear usuario
        const password_hash = await bcrypt.hash(data.password, 10)
        const [user] = await trx('users')
            .insert({
                tenant_id: tenantId,
                role: 'doctor',
                email: data.email.toLowerCase(),
                password_hash,
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone || null,
                dni: data.dni || null,
            })
            .returning(['id', 'first_name', 'last_name', 'email'])

        // Crear perfil doctor
        const [doctor] = await trx('doctors')
            .insert({
                tenant_id: tenantId,
                user_id: user.id,
                specialty_id: data.specialty_id || null,
                license_number: data.license_number || null,
                bio: data.bio || null,
            })
            .returning(['id', 'user_id', 'specialty_id', 'license_number', 'bio', 'is_active'])

        return { ...doctor, ...user }
    })
}

async function update(tenantId, id, data) {
    const repo = new DoctorRepository(tenantId)
    const doctor = await repo.update(id, {
        specialty_id: data.specialty_id,
        license_number: data.license_number,
        bio: data.bio,
    })
    if (!doctor) throw new AppError('Doctor no encontrado', 404)
    return doctor
}

async function deactivate(tenantId, id) {
    const repo = new DoctorRepository(tenantId)
    const doctor = await repo.deactivate(id)
    if (!doctor) throw new AppError('Doctor no encontrado', 404)
    return doctor
}

async function getMe(tenantId, userId) {
    const doctor = await new DoctorRepository(tenantId).findByUserId(userId)
    if (!doctor) throw new AppError('Perfil de doctor no encontrado', 404)
    return doctor
}

module.exports = { getAll, getById, getBySpecialty, getAvailability, getSchedules, create, update, deactivate, getMe }