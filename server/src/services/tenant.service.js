const tenantRepository = require("../repositories/tenant.repository");
const { AppError } = require("../middleware/error.middleware");

async function getAll() {
  return tenantRepository.findAll();
}

async function getById(id) {
  const tenant = await tenantRepository.findById(id);
  if (!tenant) throw new AppError("Clínica no encontrada", 404);
  return tenant;
}

async function create(data) {
  const existing = await tenantRepository.findBySlug(data.slug);
  if (existing) throw new AppError("Ya existe una clínica con ese slug", 409);
  return tenantRepository.create(data);
}

async function update(id, data) {
  const tenant = await tenantRepository.findById(id);
  if (!tenant) throw new AppError("Clínica no encontrada", 404);
  return tenantRepository.update(id, data);
}

async function remove(id) {
  const tenant = await tenantRepository.findById(id);
  if (!tenant) throw new AppError("Clínica no encontrada", 404);
  return tenantRepository.delete(id);
}

async function getLayout(tenantId) {
  const tenant = await tenantRepository.findById(tenantId);
  if (!tenant) throw new AppError("Clínica no encontrada", 404);

  const { floors, rooms } = await tenantRepository.findLayout(tenantId);

  const floorsWithRooms = floors.map((floor) => ({
    ...floor,
    rooms: rooms.filter((r) => r.floor_id === floor.id),
  }));

  return {
    tenant: { id: tenant.id, name: tenant.name },
    floors: floorsWithRooms,
  };
}

module.exports = { getAll, getById, create, update, remove, getLayout };
