const router = require('express').Router()
const { authenticate, authorize } = require('../middleware/auth.middleware')
const c = require('../controllers/specialty.controller')

const allRoles = ['admin', 'receptionist', 'doctor', 'patient', 'super_admin']
const adminRoles = ['admin', 'super_admin']

router.get('/', authenticate, authorize(...allRoles), c.getAll)
router.get('/:id', authenticate, authorize(...allRoles), c.getById)
router.get('/:id/doctors', authenticate, authorize(...allRoles), c.getDoctors)
router.post('/', authenticate, authorize(...adminRoles), c.create)
router.patch('/:id', authenticate, authorize(...adminRoles), c.update)

module.exports = router