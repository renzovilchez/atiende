const router = require("express").Router();
const {
  authenticate,
  authorize,
  requireTenant,
} = require("../middleware/auth.middleware");
const c = require("../controllers/room.controller");

const allTenantRoles = ["admin", "receptionist", "doctor"];

router.get(
  "/status",
  authenticate,
  authorize(...allTenantRoles),
  requireTenant,
  c.getAllStatus,
);
router.get(
  "/",
  authenticate,
  authorize(...allTenantRoles),
  requireTenant,
  c.getAll,
);
router.get(
  "/:id",
  authenticate,
  authorize(...allTenantRoles),
  requireTenant,
  c.getById,
);
router.post("/", authenticate, authorize("admin"), requireTenant, c.create);
router.patch(
  "/:id/position",
  authenticate,
  authorize("admin"),
  requireTenant,
  c.updatePosition,
);
router.patch("/:id", authenticate, authorize("admin"), requireTenant, c.update);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  requireTenant,
  c.remove,
);

module.exports = router;
