const BaseRepository = require('./base.repository')
const db = require('../db/knex')

class UserRepository extends BaseRepository {
    constructor(tenantId = null) {
        super('users', tenantId)
    }

    async findAll() {
        return this.query()
            .select('id', 'email', 'role', 'first_name', 'last_name', 'phone', 'is_active', 'created_at')
            .orderBy('role')
            .orderBy('last_name')
    }

    async findAllGlobal() {
        return db('users')
            .select('id', 'email', 'role', 'first_name', 'last_name', 'phone', 'is_active', 'tenant_id', 'created_at')
            .orderBy('role')
            .orderBy('last_name')
    }

    async findByEmail(email) {
        return db('users').where({ email }).first()
    }
}

module.exports = UserRepository