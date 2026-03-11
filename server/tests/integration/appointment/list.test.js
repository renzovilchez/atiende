// =============================================
// Tests para GET /api/appointments (listar citas del día)
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

describe('GET /api/appointments', () => {
    let tenantId;
    let doctorId;
    let doctorToken;
    let patientId;
    let patientToken;
    let adminToken;
    let receptionistToken;
    let testDate;
    let specialty; // <-- Guardamos la especialidad aquí

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

        specialty = await createTestSpecialty(tenantId); // <-- Asignamos a la variable

        // Crear doctor y obtener su token
        const { doctor, user: doctorUser } = await createTestDoctor(tenantId, specialty.id, 'doctor@test.com', 'doctor123');
        doctorId = doctor.id;

        const doctorLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'doctor@test.com', password: 'doctor123' });
        doctorToken = doctorLogin.body.data.accessToken;

        // Crear horario
        await createTestSchedule(tenantId, doctorId, testDate);

        // Paciente principal
        const patient = await createPatientWithLogin(tenantId, 'patient@test.com', 'patient123');
        patientId = patient.id;
        patientToken = patient.token;

        // Admin
        const admin = await createTestAdmin(tenantId);
        adminToken = admin.token;

        // Recepcionista
        const receptionist = await createTestReceptionist(tenantId);
        receptionistToken = receptionist.token;

        // Crear citas de prueba con diferentes estados
        // Cita 1: scheduled (activa)
        await db('appointments').insert({
            tenant_id: tenantId,
            doctor_id: doctorId,
            patient_id: patientId,
            date: testDate,
            status: 'scheduled',
            queue_position: 1,
            created_by: patientId,
            notes: 'Cita programada',
        });

        // Cita 2: confirmed (activa) para otro paciente
        const otherUser = await insertPatientOnly(tenantId, 'other@test.com');
        await db('appointments').insert({
            tenant_id: tenantId,
            doctor_id: doctorId,
            patient_id: otherUser.id,
            date: testDate,
            status: 'confirmed',
            queue_position: 2,
            created_by: otherUser.id,
            notes: 'Cita confirmada',
        });

        // Cita 3: cancelled (debería aparecer según el repository actual)
        const cancelledUser = await insertPatientOnly(tenantId, 'cancelled@test.com');
        await db('appointments').insert({
            tenant_id: tenantId,
            doctor_id: doctorId,
            patient_id: cancelledUser.id,
            date: testDate,
            status: 'cancelled',
            queue_position: 3,
            created_by: cancelledUser.id,
            notes: 'Cita cancelada',
        });

        // Cita 4: en otra fecha (no debería aparecer)
        const otroDia = getFutureDate(8);
        await db('appointments').insert({
            tenant_id: tenantId,
            doctor_id: doctorId,
            patient_id: patientId,
            date: otroDia,
            status: 'scheduled',
            queue_position: 1,
            created_by: patientId,
            notes: 'Cita en otro día',
        });
    });

    describe('Validaciones', () => {
        it('debería devolver 400 si falta el parámetro date', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('El parámetro date es requerido');
        });

        it('debería devolver 401 sin token', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ date: testDate });
            expect(res.status).toBe(401);
        });
    });

    describe('Acceso por roles', () => {
        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ date: testDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(3);
        });

        it('debería permitir acceso a recepcionista', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ date: testDate })
                .set('Authorization', `Bearer ${receptionistToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(3);
        });

        it('debería permitir acceso a doctor', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ date: testDate })
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(3);
        });

        it('debería denegar acceso a paciente', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ date: testDate })
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('Filtrado por doctor_id', () => {
        it('debería filtrar por doctor_id cuando se proporciona', async () => {
            // Crear otro doctor USANDO LA VARIABLE specialty
            const { doctor: doctor2 } = await createTestDoctor(tenantId, specialty.id, 'doctor2@test.com', 'doctor123');

            // Asignarle una cita
            await db('appointments').insert({
                tenant_id: tenantId,
                doctor_id: doctor2.id,
                patient_id: patientId,
                date: testDate,
                status: 'scheduled',
                queue_position: 4,
                created_by: patientId,
                notes: 'Cita del segundo doctor',
            });

            const res = await request(app)
                .get('/api/appointments')
                .query({ date: testDate, doctor_id: doctorId })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(3); // solo las del primer doctor
            expect(res.body.data.every(a => a.doctor_id === doctorId)).toBe(true);
        });

        it('debería devolver array vacío si no hay citas para ese doctor', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ date: testDate, doctor_id: '00000000-0000-0000-0000-000000000000' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]);
        });
    });

    describe('Datos devueltos', () => {
        it('debería incluir información del doctor y paciente', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ date: testDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            const cita = res.body.data[0];

            expect(cita).toHaveProperty('doctor_first_name');
            expect(cita).toHaveProperty('doctor_last_name');
            expect(cita).toHaveProperty('patient_first_name');
            expect(cita).toHaveProperty('patient_last_name');
            expect(cita).toHaveProperty('specialty_name');
        });

        it('debería ordenar por queue_position', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ date: testDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            const positions = res.body.data.map(a => a.queue_position);
            expect(positions).toEqual([1, 2, 3]);
        });

        it('debería incluir citas canceladas (comportamiento actual)', async () => {
            const res = await request(app)
                .get('/api/appointments')
                .query({ date: testDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            const cancelledCitas = res.body.data.filter(a => a.status === 'cancelled');
            expect(cancelledCitas.length).toBe(1);
            expect(cancelledCitas[0].notes).toBe('Cita cancelada');
        });
    });

    describe('Aislamiento multitenant', () => {
        it('no debería mostrar citas de otro tenant', async () => {
            // Crear otro tenant con sus propias citas
            const [otherTenant] = await db('tenants').insert({
                name: 'Otra Clínica',
                slug: 'otra-clinica',
            }).returning('*');

            const [otherSpecialty] = await db('specialties').insert({
                tenant_id: otherTenant.id,
                name: 'Otra especialidad',
            }).returning('*');

            const { doctor: otherDoctor } = await createTestDoctor(otherTenant.id, otherSpecialty.id, 'otherdoctor@test.com', 'doctor123');

            const otherPatient = await insertPatientOnly(otherTenant.id, 'otherpatient@test.com');

            await db('appointments').insert({
                tenant_id: otherTenant.id,
                doctor_id: otherDoctor.id,
                patient_id: otherPatient.id,
                date: testDate,
                status: 'scheduled',
                queue_position: 1,
                created_by: otherPatient.id,
            });

            const res = await request(app)
                .get('/api/appointments')
                .query({ date: testDate })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(3);
        });
    });
});