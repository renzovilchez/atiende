const BaseRepository = require('./base.repository')
const db = require('../db/knex')

class UserRepository extends BaseRepository {
    constructor(tenantId = null) {
        super('users', tenantId)
    }

    async findAll(role = null) {
        const q = this.query()
            .select('id', 'email', 'role', 'first_name', 'last_name', 'phone', 'dni', 'is_active', 'created_at')
            .orderBy('role')
            .orderBy('last_name')
        if (role) q.where({ role })
        return q
    }

    async findById(id) {
        return this.query().where({ id }).first()
    }

    async findPatients() {
        return this.query()
            .where({ role: 'patient' })
            .select('id', 'first_name', 'last_name', 'email', 'phone', 'dni')
            .orderBy('last_name')
    }

    async findAllPlatform() {
        return db('users as u')
            .leftJoin('tenants as t', 't.id', 'u.tenant_id')
            .select(
                'u.id', 'u.email', 'u.role',
                'u.first_name', 'u.last_name',
                'u.is_active', 'u.created_at',
                't.name as tenant_name'
            )
            .orderBy('u.role')
            .orderBy('u.last_name')
    }

    async findByEmail(email) {
        return db('users').where({ email }).first()
    }

    async create(data) {
        const [user] = await this.query()
            .insert(data)
            .returning(['id', 'email', 'role', 'first_name', 'last_name', 'phone', 'dni', 'is_active', 'created_at'])
        return user
    }

    async update(id, data) {
        const [user] = await this.query()
            .where({ id })
            .update({ ...data, updated_at: db.fn.now() })
            .returning(['id', 'email', 'role', 'first_name', 'last_name', 'phone', 'dni', 'is_active'])
        return user
    }

    async deactivate(id) {
        const [user] = await this.query()
            .where({ id })
            .update({ is_active: false })
            .returning(['id', 'email', 'role', 'first_name', 'last_name', 'is_active'])
        return user
    }
}

module.exports = UserRepository