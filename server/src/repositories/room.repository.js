const db = require('../db/knex')

class RoomRepository {
    constructor(tenantId) {
        this.tenantId = tenantId
    }

    findAll() {
        return db('rooms')
            .where({ tenant_id: this.tenantId, is_active: true })
            .select('id', 'name', 'number', 'floor_id')
            .orderBy('name')
    }
}

module.exports = RoomRepository