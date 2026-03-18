const db = require("../db/knex");

class FloorRepository {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  findAll() {
    return db("floors")
      .where({ tenant_id: this.tenantId, is_active: true })
      .select("id", "name", "number", "is_active", "created_at")
      .orderBy("number");
  }

  findById(id) {
    return db("floors").where({ id, tenant_id: this.tenantId }).first();
  }

  create(data) {
    return db("floors")
      .insert({ ...data, tenant_id: this.tenantId })
      .returning("*")
      .then((rows) => rows[0]);
  }

  update(id, data) {
    return db("floors")
      .where({ id, tenant_id: this.tenantId })
      .update({ ...data, updated_at: db.fn.now() })
      .returning("*")
      .then((rows) => rows[0]);
  }

  remove(id) {
    return db("floors")
      .where({ id, tenant_id: this.tenantId })
      .update({ is_active: false, updated_at: db.fn.now() });
  }
}

module.exports = FloorRepository;
