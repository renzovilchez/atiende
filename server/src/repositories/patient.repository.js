const db = require('../db/knex')

class PatientRepository {
    constructor(tenantId) {
        this.tenantId = tenantId
    }

    findAll(search = null) {
        const q = db('users')
            .where({ tenant_id: this.tenantId, role: 'patient', is_active: true })
            .select('id', 'first_name', 'last_name', 'email', 'phone', 'dni', 'created_at')
            .orderBy('last_name')

        if (search) {
            q.where(function () {
                this.whereILike('first_name', `%${search}%`)
                    .orWhereILike('last_name', `%${search}%`)
                    .orWhereILike('dni', `%${search}%`)
                    .orWhereILike('email', `%${search}%`)
            })
        }

        return q
    }

    findById(id) {
        return db('users')
            .where({ id, tenant_id: this.tenantId, role: 'patient' })
            .select('id', 'first_name', 'last_name', 'email', 'phone', 'dni', 'is_active', 'created_at')
            .first()
    }

    async create(data) {
        const [user] = await db('users')
            .insert({ ...data, tenant_id: this.tenantId, role: 'patient' })
            .returning(['id', 'first_name', 'last_name', 'email', 'phone', 'dni', 'is_active', 'created_at'])
        return user
    }

    async update(id, data) {
        const [user] = await db('users')
            .where({ id, tenant_id: this.tenantId, role: 'patient' })
            .update({ ...data, updated_at: db.fn.now() })
            .returning(['id', 'first_name', 'last_name', 'email', 'phone', 'dni', 'is_active'])
        return user
    }

    findProfile(userId) {
        return db('patient_profiles')
            .where({ user_id: userId, tenant_id: this.tenantId })
            .first()
    }

    async upsertProfile(userId, data) {
        const [profile] = await db('patient_profiles')
            .insert({ ...data, user_id: userId, tenant_id: this.tenantId })
            .onConflict(['tenant_id', 'user_id']).merge()
            .returning('*')
        return profile
    }

    async delete(id) {
        await db('users')
            .where({ id, tenant_id: this.tenantId, role: 'patient' })
            .update({ is_active: false, updated_at: db.fn.now() })
    }
}

module.exports = PatientRepository