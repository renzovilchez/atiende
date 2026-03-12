const router = require('express').Router()
const { authenticate, authorize, requireTenant } = require('../middleware/auth.middleware')
const c = require('../controllers/specialty.controller')

const allRoles = ['admin', 'receptionist', 'doctor', 'patient', 'super_admin']
const adminRoles = ['admin', 'super_admin']

router.get('/', authenticate, authorize(...allRoles), requireTenant, c.getAll)
router.get('/:id', authenticate, authorize(...allRoles), requireTenant, c.getById)
router.get('/:id/doctors', authenticate, authorize(...allRoles), requireTenant, c.getDoctors)
router.post('/', authenticate, authorize(...adminRoles), requireTenant, c.create)
router.patch('/:id', authenticate, authorize(...adminRoles), requireTenant, c.update)

module.exports = router