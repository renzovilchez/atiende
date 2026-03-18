const db = require("../db/knex");

class AppointmentRepository {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  // Obtiene el schedule activo para un doctor en una fecha dada
  // Primero busca override, si no existe usa el patrón semanal
  async getScheduleForDate(doctorId, date) {
    const dayOfWeek = new Date(date).getUTCDay();

    const schedule = await db("schedules")
      .where({ doctor_id: doctorId, day_of_week: dayOfWeek, is_active: true })
      .first();

    if (!schedule) return null;

    const override = await db("schedule_overrides")
      .where({ schedule_id: schedule.id, date })
      .first();

    if (override?.is_blocked) return null;

    return {
      ...schedule,
      // Si hay override, sus valores tienen prioridad
      room_id: override?.room_id ?? schedule.room_id,
      start_time: override?.start_time ?? schedule.start_time,
      end_time: override?.end_time ?? schedule.end_time,
      max_patients: override?.max_patients ?? schedule.max_patients,
    };
  }

  // Cuenta cuántas citas activas hay para un doctor en una fecha
  async countAppointments(doctorId, date) {
    const { count } = await db("appointments")
      .where({ tenant_id: this.tenantId, doctor_id: doctorId, date })
      .whereNotIn("status", ["cancelled", "no_show"])
      .count("id as count")
      .first();
    return parseInt(count);
  }

  // Siguiente número en la cola para ese doctor y fecha
  async nextQueuePosition(doctorId, date) {
    const { max } = await db("appointments")
      .where({ tenant_id: this.tenantId, doctor_id: doctorId, date })
      .max("queue_position as max")
      .first();
    return (max || 0) + 1;
  }

  // Crea una cita
  async create(data) {
    const [row] = await db("appointments")
      .insert({ ...data, tenant_id: this.tenantId })
      .returning("*");
    return row;
  }

  // Obtiene una cita por su id
  async findById(id) {
    return db("appointments").where({ id, tenant_id: this.tenantId }).first();
  }

  // Obtiene todas las citas de un doctor en una fecha
  async findByDate(date, filters = {}) {
    return db("appointments as a")
      .join("doctors as d", "d.id", "a.doctor_id")
      .join("users as du", "du.id", "d.user_id")
      .join("users as pu", "pu.id", "a.patient_id")
      .leftJoin("specialties as s", "s.id", "d.specialty_id")
      .leftJoin("rooms as r", "r.id", "a.room_id")
      .where("a.tenant_id", this.tenantId)
      .where("a.date", date)
      .where(filters)
      .select(
        "a.*",
        "du.first_name as doctor_first_name",
        "du.last_name as doctor_last_name",
        "pu.first_name as patient_first_name",
        "pu.last_name as patient_last_name",
        "s.name as specialty_name",
        "r.name as room_name",
      )
      .orderBy("a.queue_position");
  }

  // Actualiza una cita
  async update(id, data) {
    const [row] = await db("appointments")
      .where({ id, tenant_id: this.tenantId })
      .update({ ...data, updated_at: db.fn.now() })
      .returning("*");
    return row;
  }

  // Registra un evento en la cola
  async logEvent({
    appointmentId,
    fromStatus,
    toStatus,
    changedBy,
    reason,
    metadata,
  }) {
    await db("queue_events").insert({
      tenant_id: this.tenantId,
      appointment_id: appointmentId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: changedBy,
      reason,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  }

  // Obtiene todas las citas de un paciente
  async findByPatient(patientId) {
    return db("appointments as a")
      .join("doctors as d", "a.doctor_id", "d.id")
      .join("users as du", "d.user_id", "du.id")
      .join("specialties as s", "d.specialty_id", "s.id")
      .leftJoin("rooms as r", "a.room_id", "r.id")
      .where({ "a.tenant_id": this.tenantId, "a.patient_id": patientId })
      .select(
        "a.*",
        "du.first_name as doctor_first_name",
        "du.last_name as doctor_last_name",
        "s.name as specialty_name",
        "r.name as room_name",
      )
      .orderBy("a.date", "desc");
  }

  // Verifica que un doctor existe y pertenece al tenant
  async findDoctor(doctorId) {
    return db("doctors")
      .where({ id: doctorId, tenant_id: this.tenantId })
      .first();
  }

  // Obtiene el historial de eventos de una cita
  async findHistory(appointmentId) {
    return db("queue_events as qe")
      .leftJoin("users as u", "u.id", "qe.changed_by")
      .where("qe.appointment_id", appointmentId)
      .select("qe.*", "u.first_name", "u.last_name", "u.role")
      .orderBy("qe.created_at");
  }

  // Verifica si ya existe una cita activa para ese paciente/doctor/fecha
  async findExisting(doctorId, patientId, date) {
    return db("appointments")
      .where({
        tenant_id: this.tenantId,
        doctor_id: doctorId,
        patient_id: patientId,
        date,
      })
      .whereNotIn("status", ["cancelled", "no_show"])
      .first();
  }

  // Transacción de agendamiento
  async bookTransaction(tenantId, data) {
    return db.transaction(async (trx) => {
      await trx.raw(
        `SELECT id FROM appointments WHERE tenant_id = ? AND doctor_id = ? AND date = ? FOR UPDATE`,
        [tenantId, data.doctor_id, data.date],
      );

      const [appointment] = await trx("appointments")
        .insert({
          tenant_id: tenantId,
          doctor_id: data.doctor_id,
          patient_id: data.patient_id,
          schedule_id: data.schedule_id,
          room_id: data.room_id,
          date: data.date,
          queue_position: data.queue_position,
          notes: data.notes,
          created_by: data.created_by,
          is_extra: data.is_extra,
        })
        .returning("*");

      await trx("queue_events").insert({
        tenant_id: tenantId,
        appointment_id: appointment.id,
        from_status: null,
        to_status: "scheduled",
        changed_by: data.created_by,
      });

      return appointment;
    });
  }

  // Transacción de reagendamiento
  async rescheduleTransaction(tenantId, appointmentId, data) {
    return db.transaction(async (trx) => {
      await trx.raw(
        `SELECT id FROM appointments WHERE tenant_id = ? AND doctor_id = ? AND date = ? FOR UPDATE`,
        [tenantId, data.doctor_id, data.date],
      );

      const [updated] = await trx("appointments")
        .where({ id: appointmentId, tenant_id: tenantId })
        .update({
          doctor_id: data.doctor_id,
          date: data.date,
          queue_position: data.queue_position,
          schedule_id: data.schedule_id,
          room_id: data.room_id,
          status: "scheduled",
          updated_at: db.fn.now(),
        })
        .returning("*");

      await trx("queue_events").insert({
        tenant_id: tenantId,
        appointment_id: appointmentId,
        from_status: data.from_status,
        to_status: "scheduled",
        changed_by: data.changed_by,
        reason: data.reason,
        metadata: JSON.stringify({
          old_date: data.old_date,
          new_date: data.date,
          old_doctor_id: data.old_doctor_id,
          new_doctor_id: data.doctor_id,
        }),
      });

      return updated;
    });
  }
}

module.exports = AppointmentRepository;
