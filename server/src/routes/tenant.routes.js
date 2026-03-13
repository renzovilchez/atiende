const router = require('express').Router()
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { getAll, getById, getMe, create, update, updateMe, remove } = require('../controllers/tenant.controller')

// Admin ve y edita SU clínica
router.get('/me', authenticate, authorize('admin'), getMe)
router.patch('/me', authenticate, authorize('admin'), updateMe)

// Super admin gestiona TODAS las clínicas
router.get('/', authenticate, authorize('super_admin'), getAll)
router.get('/:id', authenticate, authorize('super_admin'), getById)
router.post('/', authenticate, authorize('super_admin'), create)
router.patch('/:id', authenticate, authorize('super_admin'), update)
router.delete('/:id', authenticate, authorize('super_admin'), remove)

module.exports = router