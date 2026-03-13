const db = require('../db/knex')

class SpecialtyRepository {
    constructor(tenantId) {
        this.tenantId = tenantId
    }

    findAll() {
        const q = db('specialties').where({ is_active: true })
        if (this.tenantId) q.where({ tenant_id: this.tenantId })
        return q.orderBy('name')
    }

    findById(id) {
        const q = db('specialties').where({ id })
        if (this.tenantId) q.where({ tenant_id: this.tenantId })
        return q.first()
    }

    async create(data) {
        const [row] = await db('specialties')
            .insert({ ...data, tenant_id: this.tenantId })
            .returning('*')
        return row
    }

    async update(id, data) {
        const [row] = await db('specialties')
            .where({ id, tenant_id: this.tenantId })
            .update({ ...data, updated_at: db.fn.now() })
            .returning('*')
        return row
    }
}

module.exports = SpecialtyRepository