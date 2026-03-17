const db = require('../db/knex')

class DoctorRepository {
    constructor(tenantId) {
        this.tenantId = tenantId
    }

    _baseQuery() {
        const q = db('doctors as d')
            .join('users as u', 'u.id', 'd.user_id')
            .leftJoin('specialties as s', 's.id', 'd.specialty_id')
            .select(
                'd.id', 'd.license_number', 'd.bio', 'd.is_active',
                'd.specialty_id', 'd.user_id',
                's.name as specialty_name', 's.duration_minutes',
                'u.first_name', 'u.last_name', 'u.email', 'u.phone', 'u.dni'
            )
        if (this.tenantId) q.where('d.tenant_id', this.tenantId)
        return q
    }

    findAll() {
        return this._baseQuery()
            .where('d.is_active', true)
            .orderBy('u.last_name')
    }

    findById(id) {
        return this._baseQuery()
            .where('d.id', id)
            .first()
    }

    findBySpecialty(specialtyId) {
        return this._baseQuery()
            .where('d.specialty_id', specialtyId)
            .where('d.is_active', true)
            .orderBy('u.last_name')
    }

    findSchedules(doctorId) {
        const q = db('schedules')
            .where({ doctor_id: doctorId, is_active: true })
            .orderBy('day_of_week')
        if (this.tenantId) q.where('tenant_id', this.tenantId)
        return q
    }

    findByUserId(userId) {
        return this._baseQuery()
            .where('d.user_id', userId)
            .first()
    }

    // ── CRUD ──────────────────────────────────────────────────────────────

    async create(data) {
        const [doctor] = await db('doctors')
            .insert({ tenant_id: this.tenantId, ...data })
            .returning(['id', 'user_id', 'specialty_id', 'license_number', 'bio', 'is_active', 'created_at'])
        return doctor
    }

    async update(id, data) {
        const [doctor] = await db('doctors')
            .where({ id, tenant_id: this.tenantId })
            .update({ ...data, updated_at: db.fn.now() })
            .returning(['id', 'user_id', 'specialty_id', 'license_number', 'bio', 'is_active'])
        return doctor
    }

    async deactivate(id) {
        const [doctor] = await db('doctors')
            .where({ id, tenant_id: this.tenantId })
            .update({ is_active: false, updated_at: db.fn.now() })
            .returning(['id', 'user_id', 'is_active'])
        return doctor
    }
}

module.exports = DoctorRepository