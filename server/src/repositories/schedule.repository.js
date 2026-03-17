const db = require('../db/knex')

class ScheduleRepository {
    constructor(tenantId) {
        this.tenantId = tenantId
    }

    findByDoctor(doctorId) {
        const query = db('schedules as sc')
            .leftJoin('rooms as r', 'r.id', 'sc.room_id')
            .where('sc.doctor_id', doctorId)
            .select('sc.*', 'r.name as room_name', 'r.number as room_number')
            .orderBy('sc.day_of_week');

        // Solo filtrar por tenant si hay tenantId
        if (this.tenantId) {
            query.where('sc.tenant_id', this.tenantId);
        }

        return query;
    }

    findById(id) {
        const query = db('schedules').where({ id });

        // Solo filtrar por tenant si hay tenantId
        if (this.tenantId) {
            query.where('tenant_id', this.tenantId);
        }

        return query.first();
    }

    async create(data) {
        // data ya debe incluir tenant_id cuando se llama desde create()
        const [row] = await db('schedules')
            .insert(data)
            .returning('*')
        return row
    }

    async update(id, data) {
        const query = db('schedules')
            .where({ id });

        // Solo filtrar por tenant si hay tenantId
        if (this.tenantId) {
            query.where('tenant_id', this.tenantId);
        }

        const [row] = await query
            .update({ ...data, updated_at: db.fn.now() })
            .returning('*')
        return row
    }

    async createOverride(data) {
        const [row] = await db('schedule_overrides')
            .insert({ ...data, tenant_id: this.tenantId })
            .onConflict(['schedule_id', 'date']).merge()
            .returning('*')
        return row
    }

    async delete(id) {
        await db('schedules')
            .where({ id, ...(this.tenantId && { tenant_id: this.tenantId }) })
            .delete()
    }

    findOverrides(scheduleId) {
        const query = db('schedule_overrides')
            .where({ schedule_id: scheduleId })
            .orderBy('date');

        // Solo filtrar por tenant si hay tenantId
        if (this.tenantId) {
            query.where('tenant_id', this.tenantId);
        }

        return query;
    }
}

module.exports = ScheduleRepository