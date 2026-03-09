const router = require('express').Router()
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { getAll, getMe, create, updateMe } = require('../controllers/tenant.controller')

// Solo super_admin ve todas las clínicas
router.get('/', authenticate, authorize('super_admin'), getAll)

// Admin ve y edita su propia clínica
router.get('/me', authenticate, authorize('admin', 'super_admin'), getMe)
router.patch('/me', authenticate, authorize('admin'), updateMe)

// Solo super_admin crea clínicas
router.post('/', authenticate, authorize('super_admin'), create)

module.exports = router