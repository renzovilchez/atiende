const router = require('express').Router()
const { authenticate, authorize } = require('../middleware/auth.middleware')
const {
    getAll,
    getById,
    getMe,
    create,
    update,
    updateMe,
    remove
} = require('../controllers/tenant.controller')

// Ruta para admin (su propia clínica)
router.get('/me', authenticate, authorize('admin', 'super_admin'), getMe)
router.patch('/me', authenticate, authorize('admin'), updateMe)

// Rutas para super_admin (gestión de todas las clínicas)
router.get('/', authenticate, authorize('super_admin'), getAll)
router.get('/:id', authenticate, authorize('super_admin'), getById)
router.post('/', authenticate, authorize('super_admin'), create)
router.patch('/:id', authenticate, authorize('super_admin'), update)
router.delete('/:id', authenticate, authorize('super_admin'), remove)

module.exports = router