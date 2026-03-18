const { z } = require("zod");
const floorService = require("../services/floor.service");

const createSchema = z.object({
  name: z.string().min(1).max(50),
  number: z.number().int().min(1),
});

const updateSchema = createSchema.partial().strict();

async function getAll(req, res, next) {
  try {
    const floors = await floorService.getAll(req.tenantId);
    res.json({ success: true, data: floors });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const floor = await floorService.getById(req.tenantId, req.params.id);
    res.json({ success: true, data: floor });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = createSchema.parse(req.body);
    const floor = await floorService.create(req.tenantId, data);
    res.status(201).json({ success: true, data: floor });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = updateSchema.parse(req.body);
    const floor = await floorService.update(req.tenantId, req.params.id, data);
    res.json({ success: true, data: floor });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await floorService.remove(req.tenantId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
