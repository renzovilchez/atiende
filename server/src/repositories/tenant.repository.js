const BaseRepository = require('./base.repository')
const db = require('../db/knex')

class TenantRepository extends BaseRepository {
    constructor() {
        super('tenants', null) // tenants no tiene tenant_id propio
    }

    async findById(id) {
        return db('tenants').where({ id }).first()
    }

    async findBySlug(slug) {
        return db('tenants').where({ slug }).first()
    }

    async findAll() {
        return db('tenants').orderBy('created_at', 'desc')
    }

    async create(data) {
        const [row] = await db('tenants').insert(data).returning('*')
        return row
    }

    async update(id, data) {
        const [row] = await db('tenants')
            .where({ id })
            .update({ ...data, updated_at: db.fn.now() })
            .returning('*')
        return row
    }

    async delete(id) {
        await db('tenants').where({ id }).delete()
        return true
    }
}

module.exports = new TenantRepository()