const db = require('../db/knex')

class SpecialtyRepository {
    constructor(tenantId) {
        this.tenantId = tenantId
    }

    findAll() {
        return db('specialties')
            .where({ tenant_id: this.tenantId, is_active: true })
            .orderBy('name')
    }

    findById(id) {
        return db('specialties')
            .where({ id, tenant_id: this.tenantId })
            .first()
    }
}

module.exports = SpecialtyRepository