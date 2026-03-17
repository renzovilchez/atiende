const RoomRepository = require('../repositories/room.repository')

async function getAll(tenantId) {
    return new RoomRepository(tenantId).findAll()
}

module.exports = { getAll }