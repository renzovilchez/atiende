const router = require("express").Router();
const {
  authenticate,
  authorize,
  requireTenant,
} = require("../middleware/auth.middleware");
const c = require("../controllers/predict.controller");

// Admin obtiene predicción de demanda para su clínica
router.get(
  "/demand",
  authenticate,
  authorize("admin"),
  requireTenant,
  c.getDemand,
);

// Admin lista especialidades disponibles para predicción
router.get(
  "/specialties",
  authenticate,
  authorize("admin"),
  requireTenant,
  c.getSpecialties,
);

module.exports = router;
