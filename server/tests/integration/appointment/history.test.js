// =============================================
// Tests para GET /api/appointments/:id/history
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

describe('GET /api/appointments/:id/history', () => {
    let tenantId;
    let doctorId;
    let doctorUser;        // usuario del doctor (para changed_by)
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
        doctorUser = user; // Guardamos el usuario del doctor

        // Token de doctor
        const doctorLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'doctor@test.com', password: 'doctor123' });
        doctorToken = doctorLogin.body.data.accessToken;

        await createTestSchedule(tenantId, doctorId, testDate);

        // Paciente principal
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
        // Crear una cita
        // =============================================
        const [appointment] = await db('appointments').insert({
            tenant_id: tenantId,
            doctor_id: doctorId,
            patient_id: patientId,
            date: testDate,
            status: 'scheduled',
            queue_position: 1,
            created_by: patientId,
            notes: 'Cita de prueba',
        }).returning('*');

        appointmentId = appointment.id;

        // =============================================
        // Crear historial de eventos (queue_events)
        // =============================================

        // Evento 1: Creación (paciente)
        await db('queue_events').insert({
            tenant_id: tenantId,
            appointment_id: appointmentId,
            from_status: null,
            to_status: 'scheduled',
            changed_by: patientId,
            created_at: new Date(Date.now() - 3600000), // hace 1 hora
        });

        // Evento 2: Confirmación (admin)
        await db('queue_events').insert({
            tenant_id: tenantId,
            appointment_id: appointmentId,
            from_status: 'scheduled',
            to_status: 'confirmed',
            changed_by: admin.id,
            created_at: new Date(Date.now() - 1800000), // hace 30 minutos
        });

        // Evento 3: Inicio consulta (doctor) - usamos user.id, no doctor.id
        await db('queue_events').insert({
            tenant_id: tenantId,
            appointment_id: appointmentId,
            from_status: 'confirmed',
            to_status: 'in_progress',
            changed_by: doctorUser.id,
            created_at: new Date(Date.now() - 900000), // hace 15 minutos
        });

        // Evento 4: Completada (doctor)
        await db('queue_events').insert({
            tenant_id: tenantId,
            appointment_id: appointmentId,
            from_status: 'in_progress',
            to_status: 'completed',
            changed_by: doctorUser.id,
            created_at: new Date(Date.now() - 300000), // hace 5 minutos
        });
    });

    describe('Validaciones y acceso', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app)
                .get(`/api/appointments/${appointmentId}/history`);
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para paciente', async () => {
            const res = await request(app)
                .get(`/api/appointments/${appointmentId}/history`)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .get(`/api/appointments/${appointmentId}/history`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a recepcionista', async () => {
            const res = await request(app)
                .get(`/api/appointments/${appointmentId}/history`)
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a doctor', async () => {
            const res = await request(app)
                .get(`/api/appointments/${appointmentId}/history`)
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.status).toBe(200);
        });

        it('debería devolver 404 si la cita no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .get(`/api/appointments/${fakeId}/history`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('Datos devueltos', () => {
        it('debería devolver todos los eventos en orden cronológico', async () => {
            const res = await request(app)
                .get(`/api/appointments/${appointmentId}/history`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);

            // Debería tener 4 eventos
            expect(res.body.data.length).toBe(4);

            // Verificar orden (más antiguo primero)
            const fechas = res.body.data.map(e => new Date(e.created_at));
            for (let i = 0; i < fechas.length - 1; i++) {
                expect(fechas[i] <= fechas[i + 1]).toBe(true);
            }
        });

        it('cada evento debería incluir la información del usuario que hizo el cambio', async () => {
            const res = await request(app)
                .get(`/api/appointments/${appointmentId}/history`)
                .set('Authorization', `Bearer ${adminToken}`);

            const evento = res.body.data[0];
            expect(evento).toHaveProperty('first_name');
            expect(evento).toHaveProperty('last_name');
            expect(evento).toHaveProperty('role');
            expect(evento).toHaveProperty('from_status');
            expect(evento).toHaveProperty('to_status');
            expect(evento).toHaveProperty('created_at');
        });

        it('debería mostrar los cambios de estado correctamente', async () => {
            const res = await request(app)
                .get(`/api/appointments/${appointmentId}/history`)
                .set('Authorization', `Bearer ${adminToken}`);

            const estados = res.body.data.map(e => ({
                from: e.from_status,
                to: e.to_status
            }));

            expect(estados).toContainEqual({ from: null, to: 'scheduled' });
            expect(estados).toContainEqual({ from: 'scheduled', to: 'confirmed' });
            expect(estados).toContainEqual({ from: 'confirmed', to: 'in_progress' });
            expect(estados).toContainEqual({ from: 'in_progress', to: 'completed' });
        });
    });

    describe('Aislamiento', () => {
        it('no debería mostrar historial de citas de otro tenant', async () => {
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

            const otherPatient = await insertPatientOnly(otherTenant.id, 'otherpatient@test.com');

            const [otherAppointment] = await db('appointments').insert({
                tenant_id: otherTenant.id,
                doctor_id: otherDoctor.id,
                patient_id: otherPatient.id,
                date: testDate,
                status: 'scheduled',
                queue_position: 1,
                created_by: otherPatient.id,
            }).returning('*');

            // Intentar ver el historial de esa cita con token del primer tenant
            const res = await request(app)
                .get(`/api/appointments/${otherAppointment.id}/history`)
                .set('Authorization', `Bearer ${adminToken}`);

            // Debería ser 404 porque la cita no pertenece al tenant
            expect(res.status).toBe(404);
        });
    });

    describe('Casos borde', () => {
        it('debería devolver array vacío si la cita no tiene eventos', async () => {
            // Crear cita sin eventos
            const [newAppointment] = await db('appointments').insert({
                tenant_id: tenantId,
                doctor_id: doctorId,
                patient_id: patientId,
                date: getFutureDate(8),
                status: 'scheduled',
                queue_position: 2,
                created_by: patientId,
            }).returning('*');

            const res = await request(app)
                .get(`/api/appointments/${newAppointment.id}/history`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]);
        });

        it('debería manejar UUID inválido', async () => {
            const res = await request(app)
                .get('/api/appointments/123/history')
                .set('Authorization', `Bearer ${adminToken}`);

            // Depende de tu validación de UUID (400 o 404)
            // La mayoría de las veces es 400 por parámetro inválido
            expect([400, 404]).toContain(res.status);
        });
    });
});