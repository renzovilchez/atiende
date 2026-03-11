// =============================================
// Tests para GET /api/appointments/availability
// =============================================

const request = require('supertest');
const app = require('../../../src/app');
const { db, cleanDb, closeDb } = require('../../helpers/db');
const bcrypt = require('bcryptjs');
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

describe('GET /api/appointments/availability', () => {
    let tenantId;
    let doctorId;
    let patientToken;
    let adminToken;
    let receptionistToken;
    let testDate;

    beforeAll(() => {
        testDate = getFutureDate(7);
    });

    afterAll(async () => {
        await closeDb();
    });

    beforeEach(async () => {
        await cleanDb();

        // Setup básico: tenant, especialidad, doctor, horario
        const tenant = await createTestTenant();
        tenantId = tenant.id;

        const specialty = await createTestSpecialty(tenantId);
        const { doctor } = await createTestDoctor(tenantId, specialty.id);
        doctorId = doctor.id;

        await createTestSchedule(tenantId, doctorId, testDate);

        // Paciente principal
        const patient = await createPatientWithLogin(tenantId, 'patient@test.com', 'patient123');
        patientToken = patient.token;

        // Admin
        const admin = await createTestAdmin(tenantId);
        adminToken = admin.token;

        // Recepcionista
        const receptionist = await createTestReceptionist(tenantId);
        receptionistToken = receptionist.token;
    });

    it('debería devolver disponibilidad cuando hay cupo', async () => {
        const res = await request(app)
            .get('/api/appointments/availability')
            .query({ doctor_id: doctorId, date: testDate })
            .set('Authorization', `Bearer ${patientToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
            available: true,
            remaining: 10,
            max_patients: 10,
            booked: 0,
            start_time: expect.stringMatching(/^09:00(:00)?$/),
            end_time: expect.stringMatching(/^13:00(:00)?$/),
        });
    });

    it('debería devolver available: false si ya no hay cupo', async () => {
        // Llenar los 10 cupos
        for (let i = 0; i < 10; i++) {
            const user = await insertPatientOnly(tenantId, `patient${i}@test.com`);
            await db('appointments').insert({
                tenant_id: tenantId,
                doctor_id: doctorId,
                patient_id: user.id,
                date: testDate,
                status: 'scheduled',
                queue_position: i + 1,
                created_by: user.id,
            });
        }

        const res = await request(app)
            .get('/api/appointments/availability')
            .query({ doctor_id: doctorId, date: testDate })
            .set('Authorization', `Bearer ${patientToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({
            available: false,
            remaining: 0,
            booked: 10,
        });
    });

    it('debería devolver available: false y mensaje si el doctor no tiene horario ese día', async () => {
        const otroDia = new Date(testDate);
        otroDia.setDate(otroDia.getDate() + 1);
        const fechaSinHorario = otroDia.toISOString().split('T')[0];

        const res = await request(app)
            .get('/api/appointments/availability')
            .query({ doctor_id: doctorId, date: fechaSinHorario })
            .set('Authorization', `Bearer ${patientToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({
            available: false,
            reason: 'El doctor no tiene turno en esa fecha',
        });
    });

    it('debería devolver 400 si falta doctor_id o date', async () => {
        const res1 = await request(app)
            .get('/api/appointments/availability')
            .query({ date: testDate })
            .set('Authorization', `Bearer ${patientToken}`);
        expect(res1.status).toBe(400);

        const res2 = await request(app)
            .get('/api/appointments/availability')
            .query({ doctor_id: doctorId })
            .set('Authorization', `Bearer ${patientToken}`);
        expect(res2.status).toBe(400);
    });

    it('debería devolver 401 sin token', async () => {
        const res = await request(app)
            .get('/api/appointments/availability')
            .query({ doctor_id: doctorId, date: testDate });
        expect(res.status).toBe(401);
    });

    it('debería permitir acceso a cualquier rol autenticado', async () => {
        const resAdmin = await request(app)
            .get('/api/appointments/availability')
            .query({ doctor_id: doctorId, date: testDate })
            .set('Authorization', `Bearer ${adminToken}`);
        expect(resAdmin.status).toBe(200);

        const resReception = await request(app)
            .get('/api/appointments/availability')
            .query({ doctor_id: doctorId, date: testDate })
            .set('Authorization', `Bearer ${receptionistToken}`);
        expect(resReception.status).toBe(200);
    });

    it('debería respetar aislamiento multitenant (doctor de otro tenant devuelve mensaje)', async () => {
        // Crear otro tenant y otro doctor
        const [otherTenant] = await db('tenants').insert({
            name: 'Otra Clínica',
            slug: 'otra-clinica',
        }).returning('*');

        const [otherSpecialty] = await db('specialties').insert({
            tenant_id: otherTenant.id,
            name: 'Otra especialidad',
        }).returning('*');

        const hashOtherDoctor = await bcrypt.hash('other123', 10);
        const [otherDoctorUser] = await db('users').insert({
            tenant_id: otherTenant.id,
            role: 'doctor',
            email: 'otherdoctor@test.com',
            password_hash: hashOtherDoctor,
            first_name: 'Otro',
            last_name: 'Doctor',
            is_active: true,
        }).returning('*');

        const [otherDoctor] = await db('doctors').insert({
            user_id: otherDoctorUser.id,
            tenant_id: otherTenant.id,
            specialty_id: otherSpecialty.id,
            license_number: '99999',
        }).returning('*');

        const res = await request(app)
            .get('/api/appointments/availability')
            .query({ doctor_id: otherDoctor.id, date: testDate })
            .set('Authorization', `Bearer ${patientToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({
            available: false,
            reason: 'El doctor no tiene turno en esa fecha',
        });
    });
});