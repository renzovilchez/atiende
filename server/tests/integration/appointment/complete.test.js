// =============================================
// Tests para PATCH /api/appointments/:id/complete
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
    createPatientWithToken,
} = require('./helpers');

describe('PATCH /api/appointments/:id/complete', () => {
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
        doctorUser = user;

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
        // Crear una cita y dejarla en 'in_progress'
        // =============================================

        // 1. Crear cita (scheduled)
        const bookRes = await request(app)
            .post('/api/appointments')
            .send({
                doctor_id: doctorId,
                patient_id: patientId,
                date: testDate,
                notes: 'Cita para completar'
            })
            .set('Authorization', `Bearer ${patientToken}`);

        expect(bookRes.status).toBe(201);
        appointmentId = bookRes.body.data.id;

        // 2. Confirmar (confirmed)
        await request(app)
            .patch(`/api/appointments/${appointmentId}/confirm`)
            .set('Authorization', `Bearer ${receptionistToken}`);

        // 3. Iniciar (in_progress)
        await request(app)
            .patch(`/api/appointments/${appointmentId}/start`)
            .set('Authorization', `Bearer ${doctorToken}`);
    });

    describe('Validaciones y acceso', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`);
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para paciente', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(403);
        });

        it('debería devolver 403 para admin', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(403);
        });

        it('debería devolver 403 para recepcionista', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a doctor', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.status).toBe(200);
        });

        it('debería devolver 404 si la cita no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .patch(`/api/appointments/${fakeId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('Completado exitoso', () => {
        it('debería cambiar el estado a completed', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('completed');
        });

        it('debería registrar el evento en queue_events', async () => {
            await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            const events = await db('queue_events')
                .where({ appointment_id: appointmentId })
                .orderBy('created_at', 'asc');

            // Deberían ser 4 eventos: creación, confirmación, inicio, completado
            expect(events.length).toBe(4);

            // Verificar evento de completado
            const completeEvent = events[3];
            expect(completeEvent.from_status).toBe('in_progress');
            expect(completeEvent.to_status).toBe('completed');
            expect(completeEvent.changed_by).toBe(doctorUser.id);
        });

        it('debería usar el ID del usuario del doctor como changed_by', async () => {
            await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            const events = await db('queue_events')
                .where({ appointment_id: appointmentId })
                .orderBy('created_at', 'desc');

            expect(events[0].changed_by).toBe(doctorUser.id);
        });
    });

    describe('Validaciones de estado', () => {
        it('no debería completar una cita en estado scheduled', async () => {
            // Crear otro paciente para evitar conflicto de cita duplicada
            const otherPatient = await createPatientWithToken(tenantId, 'other@test.com', 'other123');

            // Crear cita sin confirmar (scheduled)
            const bookRes = await request(app)
                .post('/api/appointments')
                .send({
                    doctor_id: doctorId,
                    patient_id: otherPatient.id,
                    date: testDate,
                    notes: 'Cita sin iniciar'
                })
                .set('Authorization', `Bearer ${otherPatient.token}`);

            expect(bookRes.status).toBe(201);
            const newAppointmentId = bookRes.body.data.id;

            const res = await request(app)
                .patch(`/api/appointments/${newAppointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede completar una cita en estado: scheduled/);
        });

        it('no debería completar una cita en estado confirmed', async () => {
            // Crear otro paciente
            const otherPatient = await createPatientWithToken(tenantId, 'other2@test.com', 'other123');

            // Crear cita y confirmarla (confirmed)
            const bookRes = await request(app)
                .post('/api/appointments')
                .send({
                    doctor_id: doctorId,
                    patient_id: otherPatient.id,
                    date: testDate,
                    notes: 'Cita confirmada'
                })
                .set('Authorization', `Bearer ${otherPatient.token}`);

            expect(bookRes.status).toBe(201);
            const newAppointmentId = bookRes.body.data.id;

            await request(app)
                .patch(`/api/appointments/${newAppointmentId}/confirm`)
                .set('Authorization', `Bearer ${receptionistToken}`);

            const res = await request(app)
                .patch(`/api/appointments/${newAppointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede completar una cita en estado: confirmed/);
        });

        it('no debería completar una cita ya completada', async () => {
            // Completar la cita
            await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            // Intentar completar de nuevo
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede completar una cita en estado: completed/);
        });

        it('no debería completar una cita cancelada', async () => {
            // Cancelar la cita
            await db('appointments')
                .where({ id: appointmentId })
                .update({ status: 'cancelled' });

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede completar una cita en estado: cancelled/);
        });
    });

    describe('Aislamiento', () => {
        it('no debería completar citas de otro tenant', async () => {
            // Crear otro tenant
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

            // Crear paciente en otro tenant
            const otherPatient = await createPatientWithLogin(otherTenant.id, 'otherpatient@test.com', 'patient123');

            // Crear cita en otro tenant
            const otherBookRes = await request(app)
                .post('/api/appointments')
                .send({
                    doctor_id: otherDoctor.id,
                    patient_id: otherPatient.id,
                    date: testDate,
                    notes: 'Cita en otro tenant'
                })
                .set('Authorization', `Bearer ${otherPatient.token}`);

            expect(otherBookRes.status).toBe(201);
            const otherAppointmentId = otherBookRes.body.data.id;

            // Confirmar
            const otherReceptionist = await createTestReceptionist(otherTenant.id, 'otherreception@test.com', 'reception123');
            await request(app)
                .patch(`/api/appointments/${otherAppointmentId}/confirm`)
                .set('Authorization', `Bearer ${otherReceptionist.token}`);

            // Iniciar
            const otherDoctorLogin = await request(app)
                .post('/api/auth/login')
                .send({ email: 'otherdoctor@test.com', password: 'doctor123' });
            const otherDoctorToken = otherDoctorLogin.body.data.accessToken;

            await request(app)
                .patch(`/api/appointments/${otherAppointmentId}/start`)
                .set('Authorization', `Bearer ${otherDoctorToken}`);

            // Intentar completar con doctor del primer tenant
            const res = await request(app)
                .patch(`/api/appointments/${otherAppointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('Casos borde', () => {
        it('debería manejar UUID inválido', async () => {
            const res = await request(app)
                .patch('/api/appointments/123/complete')
                .set('Authorization', `Bearer ${doctorToken}`);

            expect([400, 500]).toContain(res.status);
        });

        it('debería mantener la integridad de la cita si hay error', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .patch(`/api/appointments/${fakeId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(404);

            const appointment = await db('appointments')
                .where({ id: appointmentId })
                .first();
            expect(appointment.status).toBe('in_progress');
        });
    });
});