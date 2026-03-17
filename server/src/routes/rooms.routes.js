const router = require('express').Router()
const { authenticate, authorize, requireTenant } = require('../middleware/auth.middleware')
const c = require('../controllers/room.controller')

const tenantRoles = ['admin', 'receptionist', 'doctor']

router.get('/', authenticate, authorize(...tenantRoles), requireTenant, c.getAll)

module.exports = router