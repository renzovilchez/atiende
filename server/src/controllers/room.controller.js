const { z } = require("zod");
const roomService = require("../services/room.service");

const createSchema = z.object({
  floor_id: z.string().uuid().optional(),
  name: z.string().min(1).max(50),
  number: z.string().max(10).optional(),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const updateSchema = createSchema.partial().strict();

const positionSchema = z.object({
  position_x: z.number(),
  position_y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
});

async function getAll(req, res, next) {
  try {
    const rooms = await roomService.getAll(req.tenantId);
    res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const room = await roomService.getById(req.tenantId, req.params.id);
    res.json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
}

async function getByFloor(req, res, next) {
  try {
    const rooms = await roomService.getByFloor(
      req.tenantId,
      req.params.floorId,
    );
    res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = createSchema.parse(req.body);
    const room = await roomService.create(req.tenantId, data);
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = updateSchema.parse(req.body);
    const room = await roomService.update(req.tenantId, req.params.id, data);
    res.json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
}

async function updatePosition(req, res, next) {
  try {
    const data = positionSchema.parse(req.body);
    const room = await roomService.updatePosition(
      req.tenantId,
      req.params.id,
      data,
    );
    res.json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await roomService.remove(req.tenantId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getAllStatus(req, res, next) {
  try {
    const rooms = await roomService.getAllStatus(req.tenantId);
    res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getById,
  getByFloor,
  create,
  update,
  updatePosition,
  remove,
  getAllStatus,
};
