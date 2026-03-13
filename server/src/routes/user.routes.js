const router = require('express').Router()
const { authenticate, authorize, requireTenant } = require('../middleware/auth.middleware')
const c = require('../controllers/user.controller')

// Admin ve todos los usuarios de su clínica
router.get('/', authenticate, authorize('admin'), requireTenant, c.getAll)

// Receptionist solo busca pacientes (para agendar)
router.get('/patients', authenticate, authorize('receptionist', 'admin'), requireTenant, c.getPatients)

// Admin crea usuarios (doctores, recepcionistas, etc.)
router.post('/', authenticate, authorize('admin'), requireTenant, c.create)

// Admin desactiva un usuario
router.patch('/:id/deactivate', authenticate, authorize('admin'), requireTenant, c.deactivate)

// Super admin ve usuarios de toda la plataforma
router.get('/platform', authenticate, authorize('super_admin'), c.getAllPlatform)

module.exports = router