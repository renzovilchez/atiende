const FloorRepository = require("../repositories/floor.repository");
const { AppError } = require("../middleware/error.middleware");

async function getAll(tenantId) {
  return new FloorRepository(tenantId).findAll();
}

async function getById(tenantId, id) {
  const floor = await new FloorRepository(tenantId).findById(id);
  if (!floor) throw new AppError("Piso no encontrado", 404);
  return floor;
}

async function create(tenantId, data) {
  return new FloorRepository(tenantId).create(data);
}

async function update(tenantId, id, data) {
  const floor = await new FloorRepository(tenantId).findById(id);
  if (!floor) throw new AppError("Piso no encontrado", 404);
  return new FloorRepository(tenantId).update(id, data);
}

async function remove(tenantId, id) {
  const floor = await new FloorRepository(tenantId).findById(id);
  if (!floor) throw new AppError("Piso no encontrado", 404);
  return new FloorRepository(tenantId).remove(id);
}

module.exports = { getAll, getById, create, update, remove };
