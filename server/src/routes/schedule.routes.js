const router = require('express').Router()
const { authenticate, authorize } = require('../middleware/auth.middleware')
const c = require('../controllers/schedule.controller')

const staffRoles = ['admin', 'receptionist', 'super_admin']

router.get('/', authenticate, authorize(...staffRoles), c.getByDoctor)
router.post('/', authenticate, authorize(...staffRoles), c.create)
router.patch('/:id', authenticate, authorize(...staffRoles), c.update)
router.get('/:id/overrides', authenticate, authorize(...staffRoles), c.getOverrides)
router.post('/:id/overrides', authenticate, authorize(...staffRoles), c.createOverride)

module.exports = router