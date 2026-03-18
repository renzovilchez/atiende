const router = require("express").Router();
const {
  authenticate,
  authorize,
  requireTenant,
} = require("../middleware/auth.middleware");
const c = require("../controllers/patient.controller");

const staffRoles = ["admin", "receptionist"];

// Buscar pacientes del tenant — staff
router.get(
  "/",
  authenticate,
  authorize(...staffRoles),
  requireTenant,
  c.getAll,
);
router.get(
  "/:id",
  authenticate,
  authorize(...staffRoles),
  requireTenant,
  c.getById,
);

// Registrar paciente nuevo — staff
router.post(
  "/",
  authenticate,
  authorize(...staffRoles),
  requireTenant,
  c.create,
);

// Editar datos del paciente — staff
router.patch(
  "/:id",
  authenticate,
  authorize(...staffRoles),
  requireTenant,
  c.update,
);

// Perfil clínico — staff lee y edita
router.get(
  "/:id/profile",
  authenticate,
  authorize(...staffRoles),
  requireTenant,
  c.getProfile,
);
router.patch(
  "/:id/profile",
  authenticate,
  authorize(...staffRoles),
  requireTenant,
  c.updateProfile,
);

// Solo admin puede eliminar
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  requireTenant,
  c.remove,
);

module.exports = router;
