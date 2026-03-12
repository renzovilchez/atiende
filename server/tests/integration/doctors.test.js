// =============================================
// Tests para /api/doctors
// =============================================

const request = require('supertest');
const app = require('../../src/app');
const { db, cleanDb, closeDb } = require('../helpers/db');
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
} = require('./appointment/helpers');

describe('Doctors API', () => {
    let tenantId;
    let doctorId;
    let doctorUser;
    let doctorToken;
    let patientId;
    let patientToken;
    let admin;
    let adminToken;
    let receptionist;
    let receptionistToken;
    let superAdminToken;
    let specialtyId;
    let testDate;

    beforeAll(() => {
        testDate = getFutureDate(7);
    });

    afterAll(async () => {
        await closeDb();
    });

    beforeEach(async () => {
        await cleanDb();

        // =============================================
        // Setup básico
        // =============================================
        const tenant = await createTestTenant('Clínica Test', 'clinica-test');
        tenantId = tenant.id;

        // Crear especialidad
        const specialty = await createTestSpecialty(tenantId, 'Medicina General');
        specialtyId = specialty.id;

        // Crear doctor principal
        const { doctor, user } = await createTestDoctor(
            tenantId,
            specialtyId,
            'doctor@test.com',
            'doctor123'
        );
        doctorId = doctor.id;
        doctorUser = user;

        // Token de doctor
        const doctorLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'doctor@test.com', password: 'doctor123' });
        doctorToken = doctorLogin.body.data.accessToken;

        // Crear segundo doctor (para listados)
        await createTestDoctor(
            tenantId,
            specialtyId,
            'doctor2@test.com',
            'doctor123'
        );

        // Crear horario para el doctor principal
        await createTestSchedule(tenantId, doctorId, testDate, '09:00', '13:00', 10);

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

        // Super admin
        const hashSuper = await require('bcryptjs').hash('super123', 10);
        const [superAdmin] = await db('users').insert({
            tenant_id: null,
            role: 'super_admin',
            email: 'super@test.com',
            password_hash: hashSuper,
            first_name: 'Super',
            last_name: 'Admin',
            is_active: true,
        }).returning('*');

        const loginSuper = await request(app)
            .post('/api/auth/login')
            .send({ email: 'super@test.com', password: 'super123' });
        superAdminToken = loginSuper.body.data.accessToken;
    });

    // =============================================
    // GET /api/doctors (todos los roles)
    // =============================================
    describe('GET /api/doctors', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app).get('/api/doctors');
            expect(res.status).toBe(401);
        });

        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .get('/api/doctors')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a recepcionista', async () => {
            const res = await request(app)
                .get('/api/doctors')
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a doctor', async () => {
            const res = await request(app)
                .get('/api/doctors')
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a paciente', async () => {
            const res = await request(app)
                .get('/api/doctors')
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a super_admin', async () => {
            const res = await request(app)
                .get('/api/doctors')
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería devolver todos los doctores activos', async () => {
            const res = await request(app)
                .get('/api/doctors')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBe(2); // Dos doctores creados

            // Verificar estructura de datos
            const doctor = res.body.data[0];
            expect(doctor.id).toBeDefined();
            expect(doctor.first_name).toBeDefined();
            expect(doctor.last_name).toBeDefined();
            expect(doctor.email).toBeDefined();
            expect(doctor.specialty_name).toBeDefined();
            expect(doctor.license_number).toBeDefined();
        });

        it('debería ordenar por apellido', async () => {
            const res = await request(app)
                .get('/api/doctors')
                .set('Authorization', `Bearer ${adminToken}`);

            const lastNames = res.body.data.map(d => d.last_name);
            expect(lastNames).toEqual(lastNames.sort());
        });

        it('debería excluir doctores inactivos', async () => {
            // Desactivar un doctor
            await db('doctors')
                .where({ id: doctorId })
                .update({ is_active: false });

            const res = await request(app)
                .get('/api/doctors')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.body.data.length).toBe(1);
        });

        it('debería respetar aislamiento multitenant', async () => {
            // Crear otro tenant con otro doctor
            const [otherTenant] = await db('tenants').insert({
                name: 'Otra Clínica',
                slug: 'otra',
            }).returning('*');

            const [otherSpecialty] = await db('specialties').insert({
                tenant_id: otherTenant.id,
                name: 'Otra especialidad',
            }).returning('*');

            await createTestDoctor(otherTenant.id, otherSpecialty.id, 'otherdoctor@test.com', 'doctor123');

            const res = await request(app)
                .get('/api/doctors')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.body.data.length).toBe(2);
            expect(res.body.data.find(d => d.email === 'otherdoctor@test.com')).toBeUndefined();
        });
    });

    // =============================================
    // GET /api/doctors/:id
    // =============================================
    describe('GET /api/doctors/:id', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app).get(`/api/doctors/${doctorId}`);
            expect(res.status).toBe(401);
        });

        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a paciente', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}`)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(200);
        });

        it('debería devolver los datos del doctor', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(doctorId);
            expect(res.body.data.first_name).toBe('Carlos');
            expect(res.body.data.last_name).toBe('Médico');
            expect(res.body.data.email).toBe('doctor@test.com');
            expect(res.body.data.specialty_id).toBe(specialtyId);
            expect(res.body.data.specialty_name).toBe('Medicina General');
        });

        it('debería devolver 404 si el doctor no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .get(`/api/doctors/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });

        it('debería respetar aislamiento multitenant', async () => {
            // Crear doctor en otro tenant
            const [otherTenant] = await db('tenants').insert({
                name: 'Otra Clínica',
                slug: 'otra',
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

            const res = await request(app)
                .get(`/api/doctors/${otherDoctor.id}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });
    });

    // =============================================
    // GET /api/doctors/:id/availability
    // =============================================
    describe('GET /api/doctors/:id/availability', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/availability?date=${testDate}`);
            expect(res.status).toBe(401);
        });

        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/availability?date=${testDate}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a paciente', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/availability?date=${testDate}`)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(200);
        });

        it('debería devolver 400 si falta date', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/availability`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('date es requerido');
        });

        it('debería devolver disponibilidad cuando hay cupo', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/availability?date=${testDate}`)
                .set('Authorization', `Bearer ${adminToken}`);

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

        it('debería devolver available: false si no hay cupo', async () => {
            // Llenar los cupos
            for (let i = 0; i < 10; i++) {
                const patient = await createPatientWithToken(tenantId, `patient${i}@test.com`, 'pass123');
                await db('appointments').insert({
                    tenant_id: tenantId,
                    doctor_id: doctorId,
                    patient_id: patient.id,
                    date: testDate,
                    status: 'scheduled',
                    queue_position: i + 1,
                    created_by: patient.id,
                });
            }

            const res = await request(app)
                .get(`/api/doctors/${doctorId}/availability?date=${testDate}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toMatchObject({
                available: false,
                remaining: 0,
                booked: 10,
            });
        });

        it('debería devolver mensaje si el doctor no tiene horario', async () => {
            const otraFecha = getFutureDate(20);
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/availability?date=${otraFecha}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual({
                available: false,
                reason: 'El doctor no tiene turno en esa fecha',
            });
        });

        it('debería devolver 404 si el doctor no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .get(`/api/doctors/${fakeId}/availability?date=${testDate}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });
    });

    // =============================================
    // GET /api/doctors/:id/schedules (solo staff)
    // =============================================
    describe('GET /api/doctors/:id/schedules', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app).get(`/api/doctors/${doctorId}/schedules`);
            expect(res.status).toBe(401);
        });

        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/schedules`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a recepcionista', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/schedules`)
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a super_admin (con header)', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/schedules`)
                .set('X-Tenant-ID', tenantId)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería denegar acceso a doctor', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/schedules`)
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.status).toBe(403);
        });

        it('debería denegar acceso a paciente', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/schedules`)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(403);
        });

        it('debería devolver los horarios del doctor', async () => {
            const res = await request(app)
                .get(`/api/doctors/${doctorId}/schedules`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBe(1);

            const schedule = res.body.data[0];
            expect(schedule.doctor_id).toBe(doctorId);
            expect(schedule.start_time).toBe('09:00:00');
            expect(schedule.end_time).toBe('13:00:00');
            expect(schedule.max_patients).toBe(10);
        });

        it('debería devolver array vacío si no hay horarios', async () => {
            // Crear doctor sin horarios
            const { doctor: newDoctor } = await createTestDoctor(
                tenantId,
                specialtyId,
                'noschedule@test.com',
                'doctor123'
            );

            const res = await request(app)
                .get(`/api/doctors/${newDoctor.id}/schedules`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]);
        });

        it('debería devolver 404 si el doctor no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .get(`/api/doctors/${fakeId}/schedules`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });

        it('debería ordenar por día de la semana', async () => {
            // Agregar más horarios
            await createTestSchedule(tenantId, doctorId, getFutureDate(1), '14:00', '18:00', 8);
            await createTestSchedule(tenantId, doctorId, getFutureDate(2), '08:00', '12:00', 12);

            const res = await request(app)
                .get(`/api/doctors/${doctorId}/schedules`)
                .set('Authorization', `Bearer ${adminToken}`);

            const days = res.body.data.map(s => s.day_of_week);
            expect(days).toEqual(days.sort((a, b) => a - b));
        });
    });
});