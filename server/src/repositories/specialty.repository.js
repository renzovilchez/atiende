const db = require('../db/knex')

class SpecialtyRepository {
    constructor(tenantId) {
        this.tenantId = tenantId
    }

    findAll() {
        const query = db('specialties').where({ is_active: true });

        // Si tenantId es null (super_admin viendo todos), no filtrar por tenant
        if (this.tenantId) {
            query.where({ tenant_id: this.tenantId });
        }

        return query.orderBy('name');
    }

    findById(id) {
        const query = db('specialties').where({ id });

        // Si tenantId es null, no filtrar por tenant
        if (this.tenantId) {
            query.where({ tenant_id: this.tenantId });
        }

        return query.first();
    }
}

module.exports = SpecialtyRepository