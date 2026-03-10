const router = require('express').Router()
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { getAll } = require('../controllers/user.controller')

router.get('/', authenticate, authorize('admin', 'super_admin', 'receptionist'), getAll)

module.exports = router