const { z } = require('zod')
const DoctorRepository = require('../repositories/doctor.repository')
const AppointmentRepository = require('../repositories/appointment.repository')
const { AppError } = require('../middleware/error.middleware')

async function getAll(tenantId) {
    const repo = new DoctorRepository(tenantId)
    return repo.findAll()
}

async function getById(tenantId, id) {
    const repo = new DoctorRepository(tenantId)
    const doctor = await repo.findById(id)
    if (!doctor) throw new AppError('Doctor no encontrado', 404)
    return doctor
}

async function getBySpecialty(tenantId, specialtyId) {
    const repo = new DoctorRepository(tenantId)
    return repo.findBySpecialty(specialtyId)
}

async function getAvailability(tenantId, doctorId, date) {
    const doctorRepo = new DoctorRepository(tenantId);
    const doctor = await doctorRepo.findById(doctorId);
    if (!doctor) throw new AppError('Doctor no encontrado', 404);

    const apptRepo = new AppointmentRepository(tenantId);
    const schedule = await apptRepo.getScheduleForDate(doctorId, date);

    if (!schedule) return { available: false, reason: 'El doctor no tiene turno en esa fecha' };

    const count = await apptRepo.countAppointments(doctorId, date);
    const remaining = schedule.max_patients - count;

    return {
        available: remaining > 0,
        remaining,
        max_patients: schedule.max_patients,
        booked: count,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room_id: schedule.room_id,
    };
}

async function getSchedules(tenantId, doctorId) {
    const repo = new DoctorRepository(tenantId);
    const doctor = await repo.findById(doctorId);
    if (!doctor) throw new AppError('Doctor no encontrado', 404);
    return repo.findSchedules(doctorId);
}

module.exports = { getAll, getById, getBySpecialty, getAvailability, getSchedules }