const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { query } = require('../db/pool');

// GET /api/tenants — solo super_admin
router.get('/', authenticate, authorize('super_admin'), async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, slug, city, is_active, plan, created_at FROM tenants ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/tenants/me — admin ve su propia clínica
router.get('/me', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM tenants WHERE id = $1',
      [req.tenantId]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Clínica no encontrada' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
