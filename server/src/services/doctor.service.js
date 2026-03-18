const DoctorRepository = require("../repositories/doctor.repository");
const AppointmentRepository = require("../repositories/appointment.repository");
const { AppError } = require("../middleware/error.middleware");
const bcrypt = require("bcryptjs");

async function getAll(tenantId) {
  return new DoctorRepository(tenantId).findAll();
}

async function getById(tenantId, id) {
  const doctor = await new DoctorRepository(tenantId).findById(id);
  if (!doctor) throw new AppError("Doctor no encontrado", 404);
  return doctor;
}

async function getBySpecialty(tenantId, specialtyId) {
  return new DoctorRepository(tenantId).findBySpecialty(specialtyId);
}

async function getAvailability(tenantId, doctorId, date) {
  const doctor = await new DoctorRepository(tenantId).findById(doctorId);
  if (!doctor) throw new AppError("Doctor no encontrado", 404);

  const apptRepo = new AppointmentRepository(tenantId);
  const schedule = await apptRepo.getScheduleForDate(doctorId, date);
  if (!schedule)
    return {
      available: false,
      reason: "El doctor no tiene turno en esa fecha",
    };

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
  if (!doctor) throw new AppError("Doctor no encontrado", 404);
  return repo.findSchedules(doctorId);
}

async function create(tenantId, data) {
  const password_hash = await bcrypt.hash(data.password, 10);
  return new DoctorRepository(tenantId).createWithUser(
    tenantId,
    {
      email: data.email,
      password_hash,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      dni: data.dni,
    },
    {
      specialty_id: data.specialty_id,
      license_number: data.license_number,
      bio: data.bio,
    },
  );
}

async function update(tenantId, id, data) {
  const doctor = await new DoctorRepository(tenantId).update(id, {
    specialty_id: data.specialty_id,
    license_number: data.license_number,
    bio: data.bio,
  });
  if (!doctor) throw new AppError("Doctor no encontrado", 404);
  return doctor;
}

async function deactivate(tenantId, id) {
  const doctor = await new DoctorRepository(tenantId).deactivate(id);
  if (!doctor) throw new AppError("Doctor no encontrado", 404);
  return doctor;
}

async function getMe(tenantId, userId) {
  const doctor = await new DoctorRepository(tenantId).findByUserId(userId);
  if (!doctor) throw new AppError("Perfil de doctor no encontrado", 404);
  return doctor;
}

module.exports = {
  getAll,
  getById,
  getBySpecialty,
  getAvailability,
  getSchedules,
  create,
  update,
  deactivate,
  getMe,
};
