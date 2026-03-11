const router = require('express').Router()
const { authenticate, authorize, requireTenant } = require('../middleware/auth.middleware')
const c = require('../controllers/appointment.controller')

const staffRoles = ['admin', 'receptionist', 'super_admin']
const doctorRoles = ['doctor']
const allRoles = ['admin', 'receptionist', 'doctor', 'patient', 'super_admin']

// Consultar disponibilidad — cualquier autenticado
router.get('/availability', authenticate, authorize(...allRoles), c.getAvailability)

// Listar citas del día — staff y doctor
router.get('/', authenticate, authorize(...staffRoles, ...doctorRoles), c.listByDate)

// Agendar — staff o el propio paciente
router.post('/', authenticate, authorize(...staffRoles, 'patient'), c.book)

// Historial de citas de un paciente
router.get('/mine', authenticate, authorize('patient'), requireTenant, c.listMine)

// Historial de una cita
router.get('/:id/history', authenticate, authorize(...staffRoles, ...doctorRoles), c.getHistory)

// Confirmar llegada — recepción
router.patch('/:id/confirm', authenticate, authorize(...staffRoles), c.confirm)

// Iniciar consulta — doctor
router.patch('/:id/start', authenticate, authorize(...doctorRoles), c.startProgress)

// Completar — doctor
router.patch('/:id/complete', authenticate, authorize(...doctorRoles), c.complete)

// Cancelar — staff o paciente
router.patch('/:id/cancel', authenticate, authorize(...staffRoles, 'patient'), c.cancel)

// Reagendar — staff
router.patch('/:id/reschedule', authenticate, authorize(...staffRoles), c.reschedule)

module.exports = router