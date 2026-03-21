const db = require("../db/knex");

class FloorRepository {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  findAll() {
    return db("floors")
      .where({ "floors.tenant_id": this.tenantId, "floors.is_active": true })
      .leftJoin("rooms", function () {
        this.on("rooms.floor_id", "floors.id").andOn(
          "rooms.is_active",
          db.raw("true"),
        );
      })
      .select(
        "floors.id",
        "floors.name",
        "floors.number",
        "floors.is_active",
        "floors.created_at",
        db.raw("COUNT(rooms.id)::int AS room_count"),
      )
      .groupBy("floors.id")
      .orderBy("floors.number");
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
