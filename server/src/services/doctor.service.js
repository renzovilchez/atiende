const DoctorRepository = require('../repositories/doctor.repository')
const AppointmentRepository = require('../repositories/appointment.repository')
const UserRepository = require('../repositories/user.repository')
const { AppError } = require('../middleware/error.middleware')

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
    const userRepo = new UserRepository(tenantId)

    // Verificar que el usuario existe y es doctor
    const user = await userRepo.findById(data.user_id)
    if (!user) throw new AppError('Usuario no encontrado', 404)
    if (user.role !== 'doctor') throw new AppError('El usuario no tiene rol de doctor', 400)

    const repo = new DoctorRepository(tenantId)
    return repo.create({
        user_id: data.user_id,
        specialty_id: data.specialty_id || null,
        license_number: data.license_number || null,
        bio: data.bio || null,
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

module.exports = { getAll, getById, getBySpecialty, getAvailability, getSchedules, create, update, deactivate }