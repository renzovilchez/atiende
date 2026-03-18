const db = require("../db/knex");

class RoomRepository {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  findAll() {
    return db("rooms as r")
      .leftJoin("floors as f", "f.id", "r.floor_id")
      .where({ "r.tenant_id": this.tenantId, "r.is_active": true })
      .select(
        "r.id",
        "r.name",
        "r.number",
        "r.floor_id",
        "r.position_x",
        "r.position_y",
        "r.width",
        "r.height",
        "r.is_active",
        "r.created_at",
        "f.name as floor_name",
        "f.number as floor_number",
      )
      .orderBy(["f.number", "r.name"]);
  }

  findById(id) {
    return db("rooms").where({ id, tenant_id: this.tenantId }).first();
  }

  findByFloor(floorId) {
    return db("rooms")
      .where({ floor_id: floorId, tenant_id: this.tenantId, is_active: true })
      .select(
        "id",
        "name",
        "number",
        "floor_id",
        "position_x",
        "position_y",
        "width",
        "height",
      )
      .orderBy("name");
  }

  create(data) {
    return db("rooms")
      .insert({ ...data, tenant_id: this.tenantId })
      .returning("*")
      .then((rows) => rows[0]);
  }

  update(id, data) {
    return db("rooms")
      .where({ id, tenant_id: this.tenantId })
      .update({ ...data, updated_at: db.fn.now() })
      .returning("*")
      .then((rows) => rows[0]);
  }

  updatePosition(id, position_x, position_y, width, height) {
    return db("rooms")
      .where({ id, tenant_id: this.tenantId })
      .update({
        position_x,
        position_y,
        width,
        height,
        updated_at: db.fn.now(),
      })
      .returning("*")
      .then((rows) => rows[0]);
  }

  remove(id) {
    return db("rooms")
      .where({ id, tenant_id: this.tenantId })
      .update({ is_active: false, updated_at: db.fn.now() });
  }
}

module.exports = RoomRepository;
