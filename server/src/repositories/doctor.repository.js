const db = require('../db/knex')

class DoctorRepository {
    constructor(tenantId) {
        this.tenantId = tenantId
    }

    findAll() {
        const query = db('doctors as d')
            .join('users as u', 'u.id', 'd.user_id')
            .leftJoin('specialties as s', 's.id', 'd.specialty_id')
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
            .orderBy('u.last_name');

        // Solo filtrar por tenant si hay tenantId
        if (this.tenantId) {
            query.where('d.tenant_id', this.tenantId);
        }

        return query;
    }

    findById(id) {
        const query = db('doctors as d')
            .join('users as u', 'u.id', 'd.user_id')
            .leftJoin('specialties as s', 's.id', 'd.specialty_id')
            .where('d.id', id)
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
            );

        // Solo filtrar por tenant si hay tenantId
        if (this.tenantId) {
            query.where('d.tenant_id', this.tenantId);
        }

        return query.first();
    }

    findBySpecialty(specialtyId) {
        const query = db('doctors as d')
            .join('users as u', 'u.id', 'd.user_id')
            .leftJoin('specialties as s', 's.id', 'd.specialty_id')
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
            .orderBy('u.last_name');

        // Solo filtrar por tenant si hay tenantId
        if (this.tenantId) {
            query.where('d.tenant_id', this.tenantId);
        }

        return query;
    }

    findSchedules(doctorId) {
        const query = db('schedules')
            .where({ doctor_id: doctorId, is_active: true })
            .orderBy('day_of_week');

        // Solo filtrar por tenant si hay tenantId
        if (this.tenantId) {
            query.where('tenant_id', this.tenantId);
        }

        return query;
    }
}

module.exports = DoctorRepository