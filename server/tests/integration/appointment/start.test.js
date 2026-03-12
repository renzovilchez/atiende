// =============================================
// Tests para PATCH /api/appointments/:id/start
// =============================================

const request = require('supertest');
const app = require('../../../src/app');
const { db, cleanDb, closeDb } = require('../../helpers/db');
const {
    getFutureDate,
    createTestTenant,
    createTestSpecialty,
    createTestDoctor,
    createTestSchedule,
    createPatientWithLogin,
    createTestAdmin,
    createTestReceptionist,
    insertPatientOnly,
} = require('./helpers');

describe('PATCH /api/appointments/:id/start', () => {
    let tenantId;
    let doctorId;
    let doctorUser;
    let doctorToken;
    let patientId;
    let patientToken;
    let admin;
    let receptionist;
    let adminToken;
    let receptionistToken;
    let testDate;
    let appointmentId;

    beforeAll(() => {
        testDate = getFutureDate(7);
    });

    afterAll(async () => {
        await closeDb();
    });

    beforeEach(async () => {
        await cleanDb();

        // Setup básico
        const tenant = await createTestTenant();
        tenantId = tenant.id;

        const specialty = await createTestSpecialty(tenantId);
        const { doctor, user } = await createTestDoctor(tenantId, specialty.id, 'doctor@test.com', 'doctor123');
        doctorId = doctor.id;
        doctorUser = user; // Guardamos el usuario del doctor para changed_by

        // Token de doctor
        const doctorLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'doctor@test.com', password: 'doctor123' });
        doctorToken = doctorLogin.body.data.accessToken;

        await createTestSchedule(tenantId, doctorId, testDate);

        // Paciente
        const patient = await createPatientWithLogin(tenantId, 'patient@test.com', 'patient123');
        patientId = patient.id;
        patientToken = patient.token;

        // Admin
        admin = await createTestAdmin(tenantId, 'admin@test.com', 'admin123');
        adminToken = admin.token;

        // Recepcionista
        receptionist = await createTestReceptionist(tenantId, 'reception@test.com', 'reception123');
        receptionistToken = receptionist.token;

        // =============================================
        // Crear una cita y confirmarla para que quede en 'confirmed'
        // =============================================

        // 1. Crear cita (queda en 'scheduled')
        const bookRes = await request(app)
            .post('/api/appointments')
            .send({
                doctor_id: doctorId,
                patient_id: patientId,
                date: testDate,
                notes: 'Cita para iniciar'
            })
            .set('Authorization', `Bearer ${patientToken}`);

        expect(bookRes.status).toBe(201);
        appointmentId = bookRes.body.data.id;

        // 2. Confirmar la cita (pasa a 'confirmed')
        const confirmRes = await request(app)
            .patch(`/api/appointments/${appointmentId}/confirm`)
            .set('Authorization', `Bearer ${receptionistToken}`);

        expect(confirmRes.status).toBe(200);
    });

    describe('Validaciones y acceso', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/start`);
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para paciente', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(403);
        });

        it('debería devolver 403 para admin', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(403);
        });

        it('debería devolver 403 para recepcionista', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a doctor', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.status).toBe(200);
        });

        it('debería devolver 404 si la cita no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .patch(`/api/appointments/${fakeId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('Inicio exitoso', () => {
        it('debería cambiar el estado a in_progress', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('in_progress');
        });

        it('debería registrar el evento en queue_events', async () => {
            await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            const events = await db('queue_events')
                .where({ appointment_id: appointmentId })
                .orderBy('created_at', 'asc');

            // Deberían ser 3 eventos: creación, confirmación, inicio
            expect(events.length).toBe(3);

            // Verificar evento de inicio
            const startEvent = events[2];
            expect(startEvent.from_status).toBe('confirmed');
            expect(startEvent.to_status).toBe('in_progress');
            expect(startEvent.changed_by).toBe(doctorUser.id);
        });

        it('debería usar el ID del usuario del doctor como changed_by', async () => {
            await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            const events = await db('queue_events')
                .where({ appointment_id: appointmentId })
                .orderBy('created_at', 'desc');

            expect(events[0].changed_by).toBe(doctorUser.id);
        });
    });

    describe('Validaciones de estado', () => {
        it('no debería iniciar una cita en estado scheduled', async () => {
            // Crear OTRO paciente
            const otherPatient = await createPatientWithLogin(tenantId, 'otherpatient@test.com', 'patient123');

            // Crear cita para el otro paciente
            const bookRes = await request(app)
                .post('/api/appointments')
                .send({
                    doctor_id: doctorId,
                    patient_id: otherPatient.id,  // <-- OTRO paciente
                    date: testDate,
                    notes: 'Cita sin confirmar'
                })
                .set('Authorization', `Bearer ${otherPatient.token}`);

            expect(bookRes.status).toBe(201);
            const newAppointmentId = bookRes.body.data.id;

            // Intentar iniciarla sin confirmar (está en scheduled)
            const res = await request(app)
                .patch(`/api/appointments/${newAppointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede iniciar una cita en estado: scheduled/);
        });

        it('no debería iniciar una cita ya iniciada', async () => {
            // Iniciar la cita
            await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            // Intentar iniciar de nuevo
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede iniciar una cita en estado: in_progress/);
        });

        it('no debería iniciar una cita completada', async () => {
            // Completar la cita (necesitaremos complete después)
            await db('appointments')
                .where({ id: appointmentId })
                .update({ status: 'completed' });

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede iniciar una cita en estado: completed/);
        });

        it('no debería iniciar una cita cancelada', async () => {
            await db('appointments')
                .where({ id: appointmentId })
                .update({ status: 'cancelled' });

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede iniciar una cita en estado: cancelled/);
        });
    });

    describe('Aislamiento', () => {
        it('no debería iniciar citas de otro tenant', async () => {
            // Crear otro tenant...
            const [otherTenant] = await db('tenants').insert({
                name: 'Otra Clínica',
                slug: 'otra-clinica',
            }).returning('*');

            const [otherSpecialty] = await db('specialties').insert({
                tenant_id: otherTenant.id,
                name: 'Otra especialidad',
            }).returning('*');

            const { doctor: otherDoctor, user: otherDoctorUser } = await createTestDoctor(
                otherTenant.id,
                otherSpecialty.id,
                'otherdoctor@test.com',
                'doctor123'
            );

            await createTestSchedule(otherTenant.id, otherDoctor.id, testDate);

            // Crear PACIENTE en otro tenant (no usar insertPatientOnly, crear con login)
            const otherPatient = await createPatientWithLogin(otherTenant.id, 'otherpatient@test.com', 'patient123');

            // Crear cita en otro tenant como PACIENTE
            const otherBookRes = await request(app)
                .post('/api/appointments')
                .send({
                    doctor_id: otherDoctor.id,
                    patient_id: otherPatient.id,
                    date: testDate,
                    notes: 'Cita en otro tenant'
                })
                .set('Authorization', `Bearer ${otherPatient.token}`); // <-- Token del paciente

            expect(otherBookRes.status).toBe(201);
            const otherAppointmentId = otherBookRes.body.data.id;

            // Confirmar la cita en otro tenant (necesitamos recepcionista)
            const otherReceptionist = await createTestReceptionist(otherTenant.id, 'otherreception@test.com', 'reception123');

            await request(app)
                .patch(`/api/appointments/${otherAppointmentId}/confirm`)
                .set('Authorization', `Bearer ${otherReceptionist.token}`);

            // Intentar iniciar con doctor del primer tenant
            const res = await request(app)
                .patch(`/api/appointments/${otherAppointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('Casos borde', () => {
        it('debería manejar UUID inválido', async () => {
            const res = await request(app)
                .patch('/api/appointments/123/start')
                .set('Authorization', `Bearer ${doctorToken}`);

            expect([400, 500]).toContain(res.status);
        });

        it('debería mantener la integridad de la cita si hay error', async () => {
            // Intentar iniciar con ID válido pero que no existe
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .patch(`/api/appointments/${fakeId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(404);

            // Verificar que la cita original sigue igual
            const appointment = await db('appointments')
                .where({ id: appointmentId })
                .first();
            expect(appointment.status).toBe('confirmed');
        });
    });
});