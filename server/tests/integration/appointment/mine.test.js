// =============================================
// Tests para GET /api/appointments/mine (historial del paciente)
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
    createPatientWithToken,
    createTestAdmin,
    insertPatientOnly,
} = require('./helpers');

describe('GET /api/appointments/mine', () => {
    let tenantId;
    let doctorId;
    let patientId;
    let patientToken;
    let otherPatientToken;
    let adminToken;
    let testDateToday;
    let testDatePast;
    let testDateFuture;
    let patientWithManyAppointments; // para el test de muchas citas

    beforeAll(() => {
        testDateToday = getFutureDate(0);
        testDatePast = getFutureDate(-30);
        testDateFuture = getFutureDate(15);
    });

    afterAll(async () => {
        await closeDb();
    });

    beforeEach(async () => {
        await cleanDb();

        const tenant = await createTestTenant();
        tenantId = tenant.id;

        const specialty = await createTestSpecialty(tenantId);
        const { doctor } = await createTestDoctor(tenantId, specialty.id, 'doctor@test.com', 'doctor123');
        doctorId = doctor.id;

        await createTestSchedule(tenantId, doctorId, testDateToday);
        await createTestSchedule(tenantId, doctorId, testDatePast);
        await createTestSchedule(tenantId, doctorId, testDateFuture);

        // Paciente principal
        const patient = await createPatientWithLogin(tenantId, 'patient@test.com', 'patient123');
        patientId = patient.id;
        patientToken = patient.token;

        // Otro paciente
        const otherPatient = await createPatientWithToken(tenantId, 'other@test.com', 'other123');
        otherPatientToken = otherPatient.token;

        // Admin
        const admin = await createTestAdmin(tenantId);
        adminToken = admin.token;

        // Citas para el paciente principal
        await db('appointments').insert({
            tenant_id: tenantId,
            doctor_id: doctorId,
            patient_id: patientId,
            date: testDatePast,
            status: 'completed',
            queue_position: 1,
            created_by: patientId,
            notes: 'Cita completada hace un mes',
        });

        await db('appointments').insert({
            tenant_id: tenantId,
            doctor_id: doctorId,
            patient_id: patientId,
            date: testDatePast,
            status: 'cancelled',
            queue_position: 2,
            created_by: patientId,
            notes: 'Cita cancelada',
        });

        await db('appointments').insert({
            tenant_id: tenantId,
            doctor_id: doctorId,
            patient_id: patientId,
            date: testDateToday,
            status: 'scheduled',
            queue_position: 1,
            created_by: patientId,
            notes: 'Cita para hoy',
        });

        await db('appointments').insert({
            tenant_id: tenantId,
            doctor_id: doctorId,
            patient_id: patientId,
            date: testDateFuture,
            status: 'confirmed',
            queue_position: 1,
            created_by: patientId,
            notes: 'Cita futura',
        });

        // Cita para otro paciente
        const otherUserId = (await insertPatientOnly(tenantId, 'otherpatient@test.com')).id;
        await db('appointments').insert({
            tenant_id: tenantId,
            doctor_id: doctorId,
            patient_id: otherUserId,
            date: testDateToday,
            status: 'scheduled',
            queue_position: 2,
            created_by: otherUserId,
            notes: 'Cita de otro paciente',
        });

        // Crear paciente con muchas citas para el test específico
        const manyAppointmentsPatient = await createPatientWithToken(tenantId, 'many@test.com', 'many123');
        patientWithManyAppointments = manyAppointmentsPatient;

        // Crear 20 citas para este paciente con fechas únicas
        for (let i = 0; i < 20; i++) {
            const fecha = getFutureDate(-30 + i); // -30, -29, -28, ... -11
            // Alternar estados para evitar unique constraint
            const status = i % 3 === 0 ? 'completed' :
                i % 3 === 1 ? 'cancelled' :
                    'scheduled';

            await db('appointments').insert({
                tenant_id: tenantId,
                doctor_id: doctorId,
                patient_id: manyAppointmentsPatient.id,
                date: fecha,
                status: status,
                queue_position: 1,
                created_by: manyAppointmentsPatient.id,
            });
        }
    });

    describe('Validaciones y acceso', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app).get('/api/appointments/mine');
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para admin', async () => {
            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(403);
        });

        it('debería devolver 403 para doctor', async () => {
            const doctorLogin = await request(app)
                .post('/api/auth/login')
                .send({ email: 'doctor@test.com', password: 'doctor123' });
            const doctorToken = doctorLogin.body.data.accessToken;

            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a paciente', async () => {
            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('Datos devueltos', () => {
        it('debería devolver SOLO las citas del paciente autenticado', async () => {
            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(4);
            expect(res.body.data.every(a => a.patient_id === patientId)).toBe(true);
        });

        it('debería incluir todos los estados', async () => {
            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${patientToken}`);

            const estados = res.body.data.map(a => a.status);
            expect(estados).toContain('completed');
            expect(estados).toContain('cancelled');
            expect(estados).toContain('scheduled');
            expect(estados).toContain('confirmed');
        });

        it('debería incluir información del doctor y especialidad', async () => {
            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${patientToken}`);

            const cita = res.body.data[0];
            expect(cita).toHaveProperty('doctor_first_name');
            expect(cita).toHaveProperty('doctor_last_name');
            expect(cita).toHaveProperty('specialty_name');
        });

        it('debería ordenar por fecha descendente', async () => {
            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${patientToken}`);

            const fechas = res.body.data.map(a => a.date);
            for (let i = 0; i < fechas.length - 1; i++) {
                expect(new Date(fechas[i]) >= new Date(fechas[i + 1])).toBe(true);
            }
        });

        it('no debería incluir el password_hash', async () => {
            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${patientToken}`);

            const cita = res.body.data[0];
            expect(cita.password_hash).toBeUndefined();
        });
    });

    describe('Aislamiento entre pacientes', () => {
        it('otro paciente no debería ver las citas del principal', async () => {
            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${otherPatientToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
        });
    });

    describe('Aislamiento multitenant', () => {
        it('paciente no debería ver citas de otro tenant', async () => {
            const [otherTenant] = await db('tenants').insert({
                name: 'Otra Clínica',
                slug: 'otra-clinica',
            }).returning('*');

            const [otherSpecialty] = await db('specialties').insert({
                tenant_id: otherTenant.id,
                name: 'Otra especialidad',
            }).returning('*');

            const { doctor: otherDoctor } = await createTestDoctor(otherTenant.id, otherSpecialty.id, 'otherdoctor@test.com', 'doctor123');

            const otherPatient = await createPatientWithLogin(otherTenant.id, 'othertenant@test.com', 'pass123');

            await db('appointments').insert({
                tenant_id: otherTenant.id,
                doctor_id: otherDoctor.id,
                patient_id: otherPatient.id,
                date: testDateToday,
                status: 'scheduled',
                queue_position: 1,
                created_by: otherPatient.id,
            });

            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${patientToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(4);
        });
    });

    describe('Casos borde', () => {
        it('debería devolver array vacío si el paciente no tiene citas', async () => {
            const emptyPatient = await createPatientWithToken(tenantId, 'empty@test.com', 'empty123');

            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${emptyPatient.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]);
        });

        it('debería manejar correctamente cuando hay muchas citas', async () => {
            // Usamos el paciente que ya tiene 20 citas creadas en beforeEach
            const res = await request(app)
                .get('/api/appointments/mine')
                .set('Authorization', `Bearer ${patientWithManyAppointments.token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(20);
        });
    });
});