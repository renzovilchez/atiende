const router = require('express').Router()
const { authenticate, authorize, requireTenant } = require('../middleware/auth.middleware')
const c = require('../controllers/doctor.controller')

const allRoles = ['admin', 'receptionist', 'doctor', 'patient', 'super_admin']
const staffRoles = ['admin', 'receptionist', 'super_admin']

router.get('/', authenticate, authorize(...allRoles), requireTenant, c.getAll)
router.get('/:id', authenticate, authorize(...allRoles), requireTenant, c.getById)
router.get('/:id/availability', authenticate, authorize(...allRoles), requireTenant, c.getAvailability)
router.get('/:id/schedules', authenticate, authorize(...staffRoles), requireTenant, c.getSchedules)

module.exports = router