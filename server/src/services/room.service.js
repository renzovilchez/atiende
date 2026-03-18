const RoomRepository = require("../repositories/room.repository");
const { AppError } = require("../middleware/error.middleware");
const redis = require("../utils/redis");

async function getAll(tenantId) {
  return new RoomRepository(tenantId).findAll();
}

async function getById(tenantId, id) {
  const room = await new RoomRepository(tenantId).findById(id);
  if (!room) throw new AppError("Consultorio no encontrado", 404);
  return room;
}

async function getByFloor(tenantId, floorId) {
  return new RoomRepository(tenantId).findByFloor(floorId);
}

async function create(tenantId, data) {
  return new RoomRepository(tenantId).create(data);
}

async function update(tenantId, id, data) {
  const room = await new RoomRepository(tenantId).findById(id);
  if (!room) throw new AppError("Consultorio no encontrado", 404);
  return new RoomRepository(tenantId).update(id, data);
}

async function updatePosition(
  tenantId,
  id,
  { position_x, position_y, width, height },
) {
  const room = await new RoomRepository(tenantId).findById(id);
  if (!room) throw new AppError("Consultorio no encontrado", 404);
  return new RoomRepository(tenantId).updatePosition(
    id,
    position_x,
    position_y,
    width,
    height,
  );
}

async function remove(tenantId, id) {
  const room = await new RoomRepository(tenantId).findById(id);
  if (!room) throw new AppError("Consultorio no encontrado", 404);
  return new RoomRepository(tenantId).remove(id);
}

// Estado en tiempo real desde Redis
async function getStatus(tenantId, roomId) {
  const key = `room:${tenantId}:${roomId}`;
  const cached = await redis.hgetall(key);
  return cached && Object.keys(cached).length > 0
    ? cached
    : { status: "available", current_patient: null, queue_count: 0 };
}

async function getAllStatus(tenantId) {
  const rooms = await new RoomRepository(tenantId).findAll();
  const statuses = await Promise.all(
    rooms.map(async (room) => {
      const status = await getStatus(tenantId, room.id);
      return { ...room, ...status };
    }),
  );
  return statuses;
}

module.exports = {
  getAll,
  getById,
  getByFloor,
  create,
  update,
  updatePosition,
  remove,
  getStatus,
  getAllStatus,
};
