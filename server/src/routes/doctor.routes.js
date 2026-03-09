const router = require('express').Router()
const { authenticate, authorize } = require('../middleware/auth.middleware')
const c = require('../controllers/doctor.controller')

const allRoles = ['admin', 'receptionist', 'doctor', 'patient', 'super_admin']
const staffRoles = ['admin', 'receptionist', 'super_admin']

router.get('/', authenticate, authorize(...allRoles), c.getAll)
router.get('/:id', authenticate, authorize(...allRoles), c.getById)
router.get('/:id/availability', authenticate, authorize(...allRoles), c.getAvailability)
router.get('/:id/schedules', authenticate, authorize(...staffRoles), c.getSchedules)

module.exports = router