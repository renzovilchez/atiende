const roomService = require('../services/room.service')

async function getAll(req, res, next) {
    try {
        const rooms = await roomService.getAll(req.tenantId)
        res.json({ success: true, data: rooms })
    } catch (err) { next(err) }
}

module.exports = { getAll }