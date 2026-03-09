const db = require('../db/knex')

class BaseRepository {
    constructor(table, tenantId = null) {
        this.table = table
        this.tenantId = tenantId
    }

    query() {
        const q = db(this.table)
        if (this.tenantId) q.where({ tenant_id: this.tenantId })
        return q
    }

    rawQuery() {
        return db(this.table)
    }

    async findAll(filters = {}) {
        return this.query().where(filters)
    }

    async findById(id) {
        return this.query().where({ id }).first()
    }

    async create(data) {
        const [row] = await db(this.table).insert(data).returning('*')
        return row
    }

    async update(id, data) {
        const [row] = await this.query()
            .where({ id })
            .update({ ...data, updated_at: db.fn.now() })
            .returning('*')
        return row
    }

    async delete(id) {
        return this.query().where({ id }).delete()
    }
}

module.exports = BaseRepository