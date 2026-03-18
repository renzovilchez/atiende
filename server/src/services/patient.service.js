const bcrypt = require("bcryptjs");
const PatientRepository = require("../repositories/patient.repository");
const { AppError } = require("../middleware/error.middleware");

async function getAll(tenantId, search = null) {
  return new PatientRepository(tenantId).findAll(search);
}

async function getById(tenantId, id) {
  const patient = await new PatientRepository(tenantId).findById(id);
  if (!patient) throw new AppError("Paciente no encontrado", 404);
  return patient;
}

async function create(tenantId, data) {
  const exists = await new PatientRepository(tenantId).findByEmail(data.email);
  if (exists) throw new AppError("Ya existe un usuario con ese email", 409);

  const password_hash = await bcrypt.hash(data.password, 10);

  return new PatientRepository(tenantId).create({
    email: data.email.toLowerCase(),
    password_hash,
    first_name: data.first_name,
    last_name: data.last_name,
    phone: data.phone || null,
    dni: data.dni || null,
  });
}

async function update(tenantId, id, data) {
  const repo = new PatientRepository(tenantId);
  const patient = await repo.findById(id);
  if (!patient) throw new AppError("Paciente no encontrado", 404);
  return repo.update(id, data);
}

async function getProfile(tenantId, userId) {
  const repo = new PatientRepository(tenantId);
  const patient = await repo.findById(userId);
  if (!patient) throw new AppError("Paciente no encontrado", 404);
  const profile = await repo.findProfile(userId);
  return { ...patient, profile: profile || null };
}

async function updateProfile(tenantId, userId, data) {
  const repo = new PatientRepository(tenantId);
  const patient = await repo.findById(userId);
  if (!patient) throw new AppError("Paciente no encontrado", 404);
  return repo.upsertProfile(userId, data);
}

async function remove(tenantId, id) {
  const repo = new PatientRepository(tenantId);
  const patient = await repo.findById(id);
  if (!patient) throw new AppError("Paciente no encontrado", 404);
  await repo.delete(id);
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  getProfile,
  updateProfile,
  remove,
};
