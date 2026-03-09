const db = require('../db/knex')

class ScheduleRepository {
    constructor(tenantId) {
        this.tenantId = tenantId
    }

    findByDoctor(doctorId) {
        return db('schedules as sc')
            .leftJoin('rooms as r', 'r.id', 'sc.room_id')
            .where('sc.doctor_id', doctorId)
            .where('sc.tenant_id', this.tenantId)
            .select('sc.*', 'r.name as room_name', 'r.number as room_number')
            .orderBy('sc.day_of_week')
    }

    findById(id) {
        return db('schedules').where({ id, tenant_id: this.tenantId }).first()
    }

    async create(data) {
        const [row] = await db('schedules')
            .insert({ ...data, tenant_id: this.tenantId })
            .returning('*')
        return row
    }

    async update(id, data) {
        const [row] = await db('schedules')
            .where({ id, tenant_id: this.tenantId })
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

    findOverrides(scheduleId) {
        return db('schedule_overrides')
            .where({ schedule_id: scheduleId, tenant_id: this.tenantId })
            .orderBy('date')
    }
}

module.exports = ScheduleRepository