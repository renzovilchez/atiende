const db = require('../db/knex')

class DoctorRepository {
    constructor(tenantId) {
        this.tenantId = tenantId
    }

    findAll() {
        return db('doctors as d')
            .join('users as u', 'u.id', 'd.user_id')
            .leftJoin('specialties as s', 's.id', 'd.specialty_id')
            .where('d.tenant_id', this.tenantId)
            .where('d.is_active', true)
            .select(
                'd.id',
                'd.license_number',
                'd.bio',
                'd.specialty_id',
                's.name as specialty_name',
                's.duration_minutes',
                'u.first_name',
                'u.last_name',
                'u.email',
                'u.phone'
            )
            .orderBy('u.last_name')
    }

    findById(id) {
        return db('doctors as d')
            .join('users as u', 'u.id', 'd.user_id')
            .leftJoin('specialties as s', 's.id', 'd.specialty_id')
            .where('d.id', id)
            .where('d.tenant_id', this.tenantId)
            .select(
                'd.id',
                'd.license_number',
                'd.bio',
                'd.specialty_id',
                's.name as specialty_name',
                's.duration_minutes',
                'u.first_name',
                'u.last_name',
                'u.email',
                'u.phone'
            )
            .first()
    }

    findBySpecialty(specialtyId) {
        return db('doctors as d')
            .join('users as u', 'u.id', 'd.user_id')
            .leftJoin('specialties as s', 's.id', 'd.specialty_id')
            .where('d.tenant_id', this.tenantId)
            .where('d.specialty_id', specialtyId)
            .where('d.is_active', true)
            .select(
                'd.id',
                'd.license_number',
                'd.bio',
                'd.specialty_id',
                's.name as specialty_name',
                's.duration_minutes',
                'u.first_name',
                'u.last_name',
                'u.email',
                'u.phone'
            )
            .orderBy('u.last_name')
    }

    findSchedules(doctorId) {
        return db('schedules')
            .where({ doctor_id: doctorId, tenant_id: this.tenantId, is_active: true })
            .orderBy('day_of_week')
    }
}

module.exports = DoctorRepository