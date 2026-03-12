// =============================================
// Tests para PATCH /api/appointments/:id/confirm
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

describe('PATCH /api/appointments/:id/confirm', () => {
    let tenantId;
    let doctorId;
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
        const { doctor } = await createTestDoctor(tenantId, specialty.id, 'doctor@test.com', 'doctor123');
        doctorId = doctor.id;

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
        // Crear una cita en estado 'scheduled' USANDO EL ENDPOINT
        // =============================================
        const bookRes = await request(app)
            .post('/api/appointments')
            .send({
                doctor_id: doctorId,
                patient_id: patientId,
                date: testDate,
                notes: 'Cita para confirmar'
            })
            .set('Authorization', `Bearer ${patientToken}`);

        expect(bookRes.status).toBe(201);
        appointmentId = bookRes.body.data.id;
    });

    describe('Validaciones y acceso', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`);
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para paciente', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(403);
        });

        it('debería devolver 403 para doctor', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a recepcionista', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(200);
        });

        it('debería devolver 404 si la cita no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .patch(`/api/appointments/${fakeId}/confirm`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('Confirmación exitosa', () => {
        it('debería cambiar el estado a confirmed', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('confirmed');
        });

        it('debería registrar el evento en queue_events', async () => {
            await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${adminToken}`);

            const events = await db('queue_events')
                .where({ appointment_id: appointmentId })
                .orderBy('created_at', 'asc'); // asc para que el primero sea el de creación

            // Ahora deberían ser 2: creación + confirmación
            expect(events.length).toBe(2);

            // Verificar evento de creación
            expect(events[0].from_status).toBe(null);
            expect(events[0].to_status).toBe('scheduled');
            expect(events[0].changed_by).toBe(patientId);

            // Verificar evento de confirmación
            expect(events[1].from_status).toBe('scheduled');
            expect(events[1].to_status).toBe('confirmed');
            expect(events[1].changed_by).toBe(admin.id);
        });

        it('debería funcionar con recepcionista como changed_by', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${receptionistToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('confirmed');

            const events = await db('queue_events')
                .where({ appointment_id: appointmentId })
                .orderBy('created_at', 'desc');

            expect(events[0].changed_by).toBe(receptionist.id);
        });
    });

    describe('Validaciones de estado', () => {
        it('no debería confirmar una cita que no está en scheduled', async () => {
            // Primero confirmar la cita (cambia a confirmed)
            await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${adminToken}`);

            // Intentar confirmar de nuevo
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede confirmar una cita en estado: confirmed/);
        });

        it('no debería confirmar una cita cancelada', async () => {
            // Cancelar la cita primero (necesitamos implementar cancel después)
            await db('appointments')
                .where({ id: appointmentId })
                .update({ status: 'cancelled' });

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede confirmar una cita en estado: cancelled/);
        });

        it('no debería confirmar una cita completada', async () => {
            await db('appointments')
                .where({ id: appointmentId })
                .update({ status: 'completed' });

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede confirmar una cita en estado: completed/);
        });
    });

    describe('Aislamiento', () => {
        it('no debería confirmar citas de otro tenant', async () => {
            // Crear otro tenant con otra cita
            const [otherTenant] = await db('tenants').insert({
                name: 'Otra Clínica',
                slug: 'otra-clinica',
            }).returning('*');

            const [otherSpecialty] = await db('specialties').insert({
                tenant_id: otherTenant.id,
                name: 'Otra especialidad',
            }).returning('*');

            const { doctor: otherDoctor } = await createTestDoctor(
                otherTenant.id,
                otherSpecialty.id,
                'otherdoctor@test.com',
                'doctor123'
            );

            await createTestSchedule(otherTenant.id, otherDoctor.id, testDate);

            const otherPatient = await insertPatientOnly(otherTenant.id, 'otherpatient@test.com');

            // Crear cita en otro tenant usando el endpoint (necesitamos token de ese tenant)
            const otherPatientLogin = await request(app)
                .post('/api/auth/login')
                .send({ email: 'otherpatient@test.com', password: 'pass123' }); // La contraseña por defecto en insertPatientOnly es 'pass123'

            const otherPatientToken = otherPatientLogin.body.data.accessToken;

            const otherBookRes = await request(app)
                .post('/api/appointments')
                .send({
                    doctor_id: otherDoctor.id,
                    patient_id: otherPatient.id,
                    date: testDate,
                    notes: 'Cita en otro tenant'
                })
                .set('Authorization', `Bearer ${otherPatientToken}`);

            expect(otherBookRes.status).toBe(201);
            const otherAppointmentId = otherBookRes.body.data.id;

            // Intentar confirmar con admin del primer tenant
            const res = await request(app)
                .patch(`/api/appointments/${otherAppointmentId}/confirm`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('Casos borde', () => {
        it('debería manejar UUID inválido', async () => {
            const res = await request(app)
                .patch('/api/appointments/123/confirm')
                .set('Authorization', `Bearer ${adminToken}`);

            expect([400]).toContain(res.status);
        });

        it('debería mantener la integridad de la cita si hay error', async () => {
            // Intentar confirmar con ID válido pero que no existe
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .patch(`/api/appointments/${fakeId}/confirm`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);

            // Verificar que la cita original sigue igual
            const appointment = await db('appointments')
                .where({ id: appointmentId })
                .first();
            expect(appointment.status).toBe('scheduled');
        });
    });
});