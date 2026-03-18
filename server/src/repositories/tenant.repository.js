const BaseRepository = require("./base.repository");
const db = require("../db/knex");

class TenantRepository extends BaseRepository {
  constructor() {
    super("tenants", null); // tenants no tiene tenant_id propio
  }

  async findById(id) {
    return db("tenants").where({ id }).first();
  }

  async findBySlug(slug) {
    return db("tenants").where({ slug }).first();
  }

  async findAll() {
    return db("tenants").orderBy("created_at", "desc");
  }

  async create(data) {
    const [row] = await db("tenants").insert(data).returning("*");
    return row;
  }

  async update(id, data) {
    const [row] = await db("tenants")
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning("*");
    return row;
  }

  async delete(id) {
    await db("tenants").where({ id }).delete();
    return true;
  }

  async findLayout(tenantId) {
    const floors = await db("floors")
      .where({ tenant_id: tenantId, is_active: true })
      .select("id", "name", "number")
      .orderBy("number");

    const rooms = await db("rooms")
      .where({ tenant_id: tenantId, is_active: true })
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

    return { floors, rooms };
  }
}

module.exports = new TenantRepository();
