const router = require('express').Router()
const { authenticate, authorize, requireTenant } = require('../middleware/auth.middleware')
const c = require('../controllers/schedule.controller')

const staffRoles = ['admin', 'receptionist']

router.get('/', authenticate, authorize(...staffRoles), requireTenant, c.getByDoctor)
router.get('/:id/overrides', authenticate, authorize(...staffRoles), requireTenant, c.getOverrides)
router.post('/', authenticate, authorize(...staffRoles), requireTenant, c.create)
router.patch('/:id', authenticate, authorize(...staffRoles), requireTenant, c.update)
router.post('/:id/overrides', authenticate, authorize(...staffRoles), requireTenant, c.createOverride)
router.delete('/:id', authenticate, authorize('admin'), requireTenant, c.remove)

module.exports = router