// =============================================
// Tests para PATCH /api/appointments/:id/cancel
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

describe('PATCH /api/appointments/:id/cancel', () => {
    let tenantId;
    let doctorId;
    let doctorToken;
    let patientId;
    let patientToken;
    let otherPatientId;
    let otherPatientToken;
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

        // Token de doctor (para probar que NO puede cancelar)
        const doctorLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'doctor@test.com', password: 'doctor123' });
        doctorToken = doctorLogin.body.data.accessToken;

        await createTestSchedule(tenantId, doctorId, testDate);

        // Paciente principal
        const patient = await createPatientWithLogin(tenantId, 'patient@test.com', 'patient123');
        patientId = patient.id;
        patientToken = patient.token;

        // Otro paciente (para probar que no puede cancelar citas ajenas)
        const otherPatient = await createPatientWithToken(tenantId, 'other@test.com', 'other123');
        otherPatientId = otherPatient.id;
        otherPatientToken = otherPatient.token;

        // Admin
        admin = await createTestAdmin(tenantId, 'admin@test.com', 'admin123');
        adminToken = admin.token;

        // Recepcionista
        receptionist = await createTestReceptionist(tenantId, 'reception@test.com', 'reception123');
        receptionistToken = receptionist.token;

        // =============================================
        // Crear una cita en estado 'scheduled'
        // =============================================

        const bookRes = await request(app)
            .post('/api/appointments')
            .send({
                doctor_id: doctorId,
                patient_id: patientId,
                date: testDate,
                notes: 'Cita para cancelar'
            })
            .set('Authorization', `Bearer ${patientToken}`);

        expect(bookRes.status).toBe(201);
        appointmentId = bookRes.body.data.id;
    });

    describe('Validaciones y acceso', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`);
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para doctor', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .send({ reason: 'Motivo de prueba' })
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .send({ reason: 'Cancelado por admin' })
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a recepcionista', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .send({ reason: 'Cancelado por recepción' })
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso al paciente propietario de la cita', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .send({ reason: 'Me surgió un imprevisto' })
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(200);
        });

        it('debería denegar acceso a otro paciente', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .send({ reason: 'Intento de cancelar cita ajena' })
                .set('Authorization', `Bearer ${otherPatientToken}`);
            expect(res.status).toBe(403);
        });

        it('debería devolver 404 si la cita no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .patch(`/api/appointments/${fakeId}/cancel`)
                .send({ reason: 'No existe' })
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('Cancelación exitosa', () => {
        it('debería cambiar el estado a cancelled (como admin)', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .send({ reason: 'Cancelado por administración' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('cancelled');
        });

        it('debería cambiar el estado a cancelled (como paciente)', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .send({ reason: 'Me canceló el paciente' })
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('cancelled');
        });

        it('debería registrar el evento en queue_events', async () => {
            await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .send({ reason: 'Registro de evento' })
                .set('Authorization', `Bearer ${patientToken}`);

            const events = await db('queue_events')
                .where({ appointment_id: appointmentId })
                .orderBy('created_at', 'asc');

            // Deberían ser 2 eventos: creación y cancelación
            expect(events.length).toBe(2);

            // Verificar evento de cancelación
            const cancelEvent = events[1];
            expect(cancelEvent.from_status).toBe('scheduled');
            expect(cancelEvent.to_status).toBe('cancelled');
            expect(cancelEvent.changed_by).toBe(patientId);
            expect(cancelEvent.reason).toBe('Registro de evento');
        });

        it('debería funcionar sin enviar reason (opcional)', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('cancelled');

            const events = await db('queue_events')
                .where({ appointment_id: appointmentId })
                .first();

            expect(events.reason).toBeNull();
        });
    });

    describe('Validaciones de estado', () => {
        it('no debería cancelar una cita ya cancelada', async () => {
            // Cancelar primero
            await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .set('Authorization', `Bearer ${patientToken}`);

            // Intentar cancelar de nuevo
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .send({ reason: 'Segundo intento' })
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede cancelar una cita en estado: cancelled/);
        });

        it('no debería cancelar una cita completada', async () => {
            // Completar la cita (necesitamos pasar por todo el flujo)
            // 1. Confirmar
            await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${receptionistToken}`);

            // 2. Iniciar
            await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            // 3. Completar
            await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            // Intentar cancelar
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .send({ reason: 'Cancelar completada' })
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede cancelar una cita en estado: completed/);
        });

        it('no debería cancelar una cita en progreso', async () => {
            const otherPatient = await createPatientWithToken(tenantId, 'progress2@test.com', 'progress123');

            const bookRes = await request(app)
                .post('/api/appointments')
                .send({
                    doctor_id: doctorId,
                    patient_id: otherPatient.id,
                    date: testDate,
                    notes: 'Cita para test de progreso'
                })
                .set('Authorization', `Bearer ${otherPatient.token}`);

            expect(bookRes.status).toBe(201);
            const progressAppointmentId = bookRes.body.data.id;

            // Confirmar
            await request(app)
                .patch(`/api/appointments/${progressAppointmentId}/confirm`)
                .set('Authorization', `Bearer ${receptionistToken}`);

            // Iniciar
            await request(app)
                .patch(`/api/appointments/${progressAppointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);

            // Intentar cancelar con EL MISMO PACIENTE (otherPatient)
            const res = await request(app)
                .patch(`/api/appointments/${progressAppointmentId}/cancel`)
                .send({ reason: 'Cancelar en progreso' })
                .set('Authorization', `Bearer ${otherPatient.token}`); // Usar token del dueño

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede cancelar una cita en estado: in_progress/);
        });
    });

    describe('Aislamiento', () => {
        it('no debería cancelar citas de otro tenant', async () => {
            // Crear otro tenant
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

            // Intentar cancelar con admin del primer tenant
            const res = await request(app)
                .patch(`/api/appointments/${otherAppointmentId}/cancel`)
                .send({ reason: 'Intento de otro tenant' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('Casos borde', () => {
        it('debería manejar UUID inválido', async () => {
            const res = await request(app)
                .patch('/api/appointments/123/cancel')
                .send({ reason: 'UUID inválido' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect([400, 500]).toContain(res.status);
        });

        it('debería mantener la integridad de la cita si hay error', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .patch(`/api/appointments/${fakeId}/cancel`)
                .send({ reason: 'No existe' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);

            // Verificar que la cita original sigue igual
            const appointment = await db('appointments')
                .where({ id: appointmentId })
                .first();
            expect(appointment.status).toBe('scheduled');
        });

        it('debería aceptar reason con caracteres especiales', async () => {
            const reasonEspecial = 'Motivo con acentos y ñ: ¡Cancelado por paciente! #123';

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .send({ reason: reasonEspecial })
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.status).toBe(200);

            // Buscar el último evento de ESTA cita
            const events = await db('queue_events')
                .where({ appointment_id: appointmentId })
                .orderBy('created_at', 'desc')
                .first();

            expect(events.reason).toBe(reasonEspecial);
        });
    });
});