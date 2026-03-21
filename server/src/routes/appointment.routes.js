const router = require("express").Router();
const {
  authenticate,
  authorize,
  requireTenant,
} = require("../middleware/auth.middleware");
const c = require("../controllers/appointment.controller");

const staffRoles = ["admin", "receptionist"];
const doctorRoles = ["doctor"];
const patientRoles = ["patient"];
const tenantRoles = [...staffRoles, ...doctorRoles, ...patientRoles];

// Disponibilidad — cualquier usuario del tenant
router.get(
  "/availability",
  authenticate,
  authorize(...tenantRoles),
  requireTenant,
  c.getAvailability,
);

// Listar citas del día — staff y doctor
router.get(
  "/",
  authenticate,
  authorize(...staffRoles, ...doctorRoles),
  requireTenant,
  c.listByDate,
);

// Agendar — staff o paciente
router.post(
  "/",
  authenticate,
  authorize(...staffRoles, ...patientRoles),
  requireTenant,
  c.book,
);

// Mis citas — solo paciente
router.get(
  "/mine",
  authenticate,
  authorize(...patientRoles),
  requireTenant,
  c.listMine,
);

// Detalle de una cita
router.get(
  "/:id",
  authenticate,
  authorize(...staffRoles, ...doctorRoles),
  requireTenant,
  c.getById,
);

// Historial de una cita
router.get(
  "/:id/history",
  authenticate,
  authorize(...staffRoles, ...doctorRoles),
  requireTenant,
  c.getHistory,
);

// Confirmar llegada — recepción
router.patch(
  "/:id/confirm",
  authenticate,
  authorize(...staffRoles),
  requireTenant,
  c.confirm,
);

// Iniciar consulta — doctor
router.patch(
  "/:id/start",
  authenticate,
  authorize(...staffRoles),
  requireTenant,
  c.startProgress,
);

// Completar — doctor
router.patch(
  "/:id/complete",
  authenticate,
  authorize(...staffRoles),
  requireTenant,
  c.complete,
);

// Cancelar — staff o paciente
router.patch(
  "/:id/cancel",
  authenticate,
  authorize(...staffRoles, ...patientRoles),
  requireTenant,
  c.cancel,
);

// Reagendar — staff
router.patch(
  "/:id/reschedule",
  authenticate,
  authorize(...staffRoles),
  requireTenant,
  c.reschedule,
);

module.exports = router;
