const router = require('express').Router()
const { authenticate, authorize, requireTenant } = require('../middleware/auth.middleware')
const c = require('../controllers/doctor.controller')

const tenantRoles = ['admin', 'receptionist', 'doctor', 'patient']
const staffRoles = ['admin', 'receptionist']

router.get('/', authenticate, authorize(...tenantRoles), requireTenant, c.getAll)
router.get('/me', authenticate, authorize('doctor'), requireTenant, c.getMe)
router.get('/:id', authenticate, authorize(...tenantRoles), requireTenant, c.getById)
router.get('/:id/availability', authenticate, authorize(...tenantRoles), requireTenant, c.getAvailability)
router.get('/:id/schedules', authenticate, authorize(...staffRoles), requireTenant, c.getSchedules)

// CRUD — admin Y receptionist gestionan doctores (decisión que tomamos)
router.post('/', authenticate, authorize(...staffRoles), requireTenant, c.create)
router.patch('/:id', authenticate, authorize(...staffRoles), requireTenant, c.update)
router.delete('/:id', authenticate, authorize(...staffRoles), requireTenant, c.deactivate)

module.exports = router