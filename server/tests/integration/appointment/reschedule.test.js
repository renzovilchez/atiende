// =============================================
// Tests para PATCH /api/appointments/:id/reschedule
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
    insertPatientOnly,
} = require('./helpers');

describe('PATCH /api/appointments/:id/reschedule', () => {
    let tenantId;
    let doctorId;
    let doctor2Id;
    let doctorToken;
    let patientId;
    let patientToken;
    let admin;
    let receptionist;
    let adminToken;
    let receptionistToken;
    let testDate;
    let newDate;
    let appointmentId;

    beforeAll(() => {
        testDate = getFutureDate(7);
        newDate = getFutureDate(14); // 14 días en futuro
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

        // Doctor 1
        const { doctor, user } = await createTestDoctor(tenantId, specialty.id, 'doctor@test.com', 'doctor123');
        doctorId = doctor.id;

        // Doctor 2 (para probar cambio de doctor)
        const { doctor: doctor2 } = await createTestDoctor(tenantId, specialty.id, 'doctor2@test.com', 'doctor123');
        doctor2Id = doctor2.id;

        // Token de doctor (para probar que NO puede reagendar)
        const doctorLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'doctor@test.com', password: 'doctor123' });
        doctorToken = doctorLogin.body.data.accessToken;

        // Crear horarios para ambos doctores en ambas fechas
        await createTestSchedule(tenantId, doctorId, testDate);
        await createTestSchedule(tenantId, doctorId, newDate);
        await createTestSchedule(tenantId, doctor2Id, testDate);
        await createTestSchedule(tenantId, doctor2Id, newDate);

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
        // Crear una cita en estado 'scheduled'
        // =============================================

        const bookRes = await request(app)
            .post('/api/appointments')
            .send({
                doctor_id: doctorId,
                patient_id: patientId,
                date: testDate,
                notes: 'Cita para reagendar'
            })
            .set('Authorization', `Bearer ${patientToken}`);

        expect(bookRes.status).toBe(201);
        appointmentId = bookRes.body.data.id;
    });

    describe('Validaciones y acceso', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate });
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para paciente', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(403);
        });

        it('debería devolver 403 para doctor', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate, reason: 'Reagendado por admin' })
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a recepcionista', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(200);
        });

        it('debería devolver 404 si la cita no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .patch(`/api/appointments/${fakeId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });

        it('debería devolver 400 si falta date', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({})
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
        });

        it('debería devolver 400 si date tiene formato inválido', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: '2025/03/20' })
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
        });

        it('debería devolver 400 si date es pasada', async () => {
            const fechaPasada = '2020-01-01';
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: fechaPasada })
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede agendar en una fecha pasada/);
        });
    });

    describe('Reagendamiento exitoso', () => {
        it('debería cambiar la fecha de la cita', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate, reason: 'Cambio de fecha' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.date.split('T')[0]).toBe(newDate);
            expect(res.body.data.status).toBe('scheduled'); // Vuelve a scheduled
        });

        it('debería permitir cambiar de doctor', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({
                    date: newDate,
                    doctor_id: doctor2Id,
                    reason: 'Cambio de doctor'
                })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.doctor_id).toBe(doctor2Id);
        });

        it('debería mantener el mismo doctor si no se especifica', async () => {
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.doctor_id).toBe(doctorId);
        });

        it('debería actualizar queue_position', async () => {
            // Crear otra cita en la nueva fecha para que no sea la primera
            const otherPatient = await insertPatientOnly(tenantId, 'other@test.com');
            await db('appointments').insert({
                tenant_id: tenantId,
                doctor_id: doctorId,
                patient_id: otherPatient.id,
                date: newDate,
                status: 'scheduled',
                queue_position: 1,
                created_by: otherPatient.id,
            });

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.queue_position).toBe(2); // Segunda en la cola
        });

        it('debería registrar el evento con metadata', async () => {
            await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({
                    date: newDate,
                    doctor_id: doctor2Id,
                    reason: 'Cambio de fecha y doctor'
                })
                .set('Authorization', `Bearer ${adminToken}`);

            const events = await db('queue_events')
                .where({ appointment_id: appointmentId })
                .orderBy('created_at', 'asc');

            // Deberían ser 2 eventos: creación y reagendamiento
            expect(events.length).toBe(2);

            const rescheduleEvent = events[1];
            expect(rescheduleEvent.from_status).toBe('scheduled');
            expect(rescheduleEvent.to_status).toBe('scheduled');
            expect(rescheduleEvent.changed_by).toBe(admin.id);
            expect(rescheduleEvent.reason).toBe('Cambio de fecha y doctor');

            // Verificar metadata
            const metadata = rescheduleEvent.metadata;
            expect(metadata.old_date.split('T')[0]).toBe(testDate);
            expect(metadata.new_date.split('T')[0]).toBe(newDate);
            expect(metadata.old_doctor_id).toBe(doctorId);
            expect(metadata.new_doctor_id).toBe(doctor2Id);
        });
    });

    describe('Validaciones de disponibilidad', () => {
        it('no debería reagendar si el doctor no tiene horario en la nueva fecha', async () => {
            const fechaSinHorario = getFutureDate(20); // Fecha sin horario

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: fechaSinHorario })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/El doctor no tiene turno en esa fecha/);
        });

        it('no debería reagendar si no hay cupos disponibles', async () => {
            // Llenar los cupos para la nueva fecha (max_patients = 10)
            for (let i = 0; i < 10; i++) {
                const patient = await insertPatientOnly(tenantId, `fill${i}@test.com`);
                await db('appointments').insert({
                    tenant_id: tenantId,
                    doctor_id: doctorId,
                    patient_id: patient.id,
                    date: newDate,
                    status: 'scheduled',
                    queue_position: i + 1,
                    created_by: patient.id,
                });
            }

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(409);
            expect(res.body.error).toMatch(/No hay cupos disponibles/);
        });

        it('debería respetar el límite de cupos por doctor', async () => {
            // Llenar cupos del doctor1
            for (let i = 0; i < 10; i++) {
                const patient = await insertPatientOnly(tenantId, `doc1_${i}@test.com`);
                await db('appointments').insert({
                    tenant_id: tenantId,
                    doctor_id: doctorId,
                    patient_id: patient.id,
                    date: newDate,
                    status: 'scheduled',
                    queue_position: i + 1,
                    created_by: patient.id,
                });
            }

            // Cambiar a doctor2 que sí tiene cupos
            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate, doctor_id: doctor2Id })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.doctor_id).toBe(doctor2Id);
        });
    });

    describe('Validaciones de estado', () => {
        it('no debería reagendar una cita cancelada', async () => {
            // Cancelar la cita
            await request(app)
                .patch(`/api/appointments/${appointmentId}/cancel`)
                .set('Authorization', `Bearer ${patientToken}`);

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede reagendar una cita en estado: cancelled/);
        });

        it('no debería reagendar una cita completada', async () => {
            // Completar la cita
            await request(app)
                .patch(`/api/appointments/${appointmentId}/confirm`)
                .set('Authorization', `Bearer ${receptionistToken}`);

            await request(app)
                .patch(`/api/appointments/${appointmentId}/start`)
                .set('Authorization', `Bearer ${doctorToken}`);
            await request(app)
                .patch(`/api/appointments/${appointmentId}/complete`)
                .set('Authorization', `Bearer ${doctorToken}`);

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede reagendar una cita en estado: completed/);
        });

        // En reschedule.test.js - test de cita en progreso
        it('no debería reagendar una cita en progreso', async () => {
            const otherPatient = await createPatientWithToken(tenantId, 'progress@test.com', 'progress123');

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

            // Intentar reagendar
            const res = await request(app)
                .patch(`/api/appointments/${progressAppointmentId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/No se puede reagendar una cita en estado: in_progress/);
        });
    });

    describe('Aislamiento', () => {
        it('no debería reagendar citas de otro tenant', async () => {
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
            await createTestSchedule(otherTenant.id, otherDoctor.id, newDate);

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

            // Intentar reagendar con admin del primer tenant
            const res = await request(app)
                .patch(`/api/appointments/${otherAppointmentId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('Casos borde', () => {
        it('debería manejar UUID inválido', async () => {
            const res = await request(app)
                .patch('/api/appointments/123/reschedule')
                .send({ date: newDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect([400, 500]).toContain(res.status);
        });

        it('debería mantener la integridad de la cita si hay error', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .patch(`/api/appointments/${fakeId}/reschedule`)
                .send({ date: newDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);

            // Verificar que la cita original no cambió
            const appointment = await db('appointments')
                .where({ id: appointmentId })
                .first();
            expect(new Date(appointment.date).toISOString().split('T')[0]).toBe(testDate);
            expect(appointment.status).toBe('scheduled');
        });

        it('debería aceptar reason largo', async () => {
            const reasonLargo = 'a'.repeat(499);

            const res = await request(app)
                .patch(`/api/appointments/${appointmentId}/reschedule`)
                .send({ date: newDate, reason: reasonLargo })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);

            // Buscar el último evento de ESTA cita (appointmentId)
            const events = await db('queue_events')
                .where({ appointment_id: appointmentId })
                .orderBy('created_at', 'desc')
                .first();

            expect(events.reason).toBe(reasonLargo);
        });
    });
});