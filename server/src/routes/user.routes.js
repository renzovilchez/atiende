const router = require('express').Router();
const { authenticate, authorize, requireTenant } = require('../middleware/auth.middleware');
const { query } = require('../db/pool');

// GET /api/users — lista usuarios del tenant (admin ve los suyos, super_admin ve todos)
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const { rows } = await query(
      `SELECT id, email, role, first_name, last_name, phone, is_active, created_at
       FROM users
       WHERE ($1 OR tenant_id = $2)
       ORDER BY role, last_name`,
      [isSuperAdmin, req.tenantId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
