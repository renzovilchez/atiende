// =============================================
// Tests para GET /api/users
// =============================================

const request = require('supertest');
const app = require('../../src/app');
const { db, cleanDb, closeDb } = require('../helpers/db');
const bcrypt = require('bcryptjs');
const {
    createTestTenant,
    createTestAdmin,
    createTestReceptionist,
    createPatientWithLogin,
    createPatientWithToken,  // Asegúrate de importar esto
} = require('./appointment/helpers');

describe('GET /api/users', () => {
    let tenantId;
    let adminToken;
    let receptionistToken;
    let patientToken;
    let superAdminToken;

    beforeAll(async () => {
        await cleanDb();
    });

    afterAll(async () => {
        await closeDb();
    });

    beforeEach(async () => {
        await cleanDb();

        // Crear tenant principal
        const tenant = await createTestTenant();
        tenantId = tenant.id;

        // Crear admin
        const admin = await createTestAdmin(tenantId);
        adminToken = admin.token;

        // Crear recepcionista
        const receptionist = await createTestReceptionist(tenantId);
        receptionistToken = receptionist.token;

        // Crear paciente
        const patient = await createPatientWithLogin(tenantId, 'patient@test.com', 'patient123');
        patientToken = patient.token;

        // Crear super_admin (CON tenant_id = null)
        const hashSuper = await bcrypt.hash('super123', 10);
        const [superAdmin] = await db('users').insert({
            tenant_id: null,  // <-- CORREGIDO: null para super_admin
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

        // Crear algunos usuarios de prueba (todos con tenant_id)
        const users = [
            { email: 'user1@test.com', role: 'patient', first_name: 'User', last_name: 'One' },
            { email: 'user2@test.com', role: 'patient', first_name: 'User', last_name: 'Two' },
            { email: 'user3@test.com', role: 'doctor', first_name: 'Dr.', last_name: 'Three' },
        ];

        for (const u of users) {
            const hash = await bcrypt.hash('password123', 10);
            await db('users').insert({
                tenant_id: tenantId,  // <-- CON tenant_id
                ...u,
                password_hash: hash,
                is_active: true,
            });
        }
    });

    describe('Validaciones y acceso', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app).get('/api/users');
            expect(res.status).toBe(401);
        });

        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a recepcionista', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a super_admin', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('X-Tenant-ID', tenantId)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería denegar acceso a paciente', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(403);
        });
    });

    describe('Listado de usuarios', () => {
        it('debería devolver todos los usuarios del tenant', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);

            // Debería incluir: admin, recepcionista, patient, y los 3 usuarios creados
            // Total: 6 usuarios (super_admin no está en este tenant)
            expect(res.body.data.length).toBe(6);
        });

        it('no debería incluir passwords ni datos sensibles', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            const user = res.body.data[0];
            expect(user.password_hash).toBeUndefined();
        });

        it('debería incluir información básica del usuario', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            const user = res.body.data[0];
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('role');
            expect(user).toHaveProperty('first_name');
            expect(user).toHaveProperty('last_name');
            expect(user).toHaveProperty('is_active');
        });
    });

    describe('Aislamiento multitenant', () => {
        it('no debería mostrar usuarios de otro tenant', async () => {
            // Crear otro tenant con usuarios
            const [otherTenant] = await db('tenants').insert({
                name: 'Otra Clínica',
                slug: 'otra-clinica',
            }).returning('*');

            const hash = await bcrypt.hash('password123', 10);
            await db('users').insert({
                tenant_id: otherTenant.id,
                email: 'other@test.com',
                password_hash: hash,
                role: 'patient',
                first_name: 'Other',
                last_name: 'User',
                is_active: true,
            });

            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            // Solo debe ver los 6 usuarios de su tenant
            expect(res.body.data.length).toBe(6);

            // Verificar que todos los usuarios tienen tenant_id = tenantId
            // (Nota: algunos campos pueden no incluir tenant_id en la respuesta)
            // Mejor verificar por email o id
            const otherUser = res.body.data.find(u => u.email === 'other@test.com');
            expect(otherUser).toBeUndefined();
        });
    });

    describe('Filtros (si aplica)', () => {
        it('debería poder filtrar por rol (si el endpoint lo soporta)', async () => {
            // Si tu endpoint acepta ?role=patient, probarlo
            const res = await request(app)
                .get('/api/users?role=patient')
                .set('Authorization', `Bearer ${adminToken}`);

            // Ajustar según tu implementación
            if (res.status === 200) {
                expect(res.body.data.every(u => u.role === 'patient')).toBe(true);
            }
        });
    });
});