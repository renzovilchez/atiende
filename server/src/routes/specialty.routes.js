const router = require('express').Router()
const { authenticate, authorize, requireTenant } = require('../middleware/auth.middleware')
const c = require('../controllers/specialty.controller')

const tenantRoles = ['admin', 'receptionist', 'doctor', 'patient']
const adminRoles = ['admin']

router.get('/', authenticate, authorize(...tenantRoles), requireTenant, c.getAll)
router.get('/:id', authenticate, authorize(...tenantRoles), requireTenant, c.getById)
router.get('/:id/doctors', authenticate, authorize(...tenantRoles), requireTenant, c.getDoctors)
router.post('/', authenticate, authorize(...adminRoles), requireTenant, c.create)
router.patch('/:id', authenticate, authorize(...adminRoles), requireTenant, c.update)

module.exports = router