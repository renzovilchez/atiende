// =============================================
// Tests para /api/tenants
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
} = require('./appointment/helpers');

describe('Tenants API', () => {
    let tenantId;
    let adminToken;
    let receptionistToken;
    let patientToken;
    let superAdminToken;
    let otherTenantId;

    beforeAll(async () => {
        await cleanDb();
    });

    afterAll(async () => {
        await closeDb();
    });

    beforeEach(async () => {
        await cleanDb();

        // =============================================
        // Crear tenant principal
        // =============================================
        const tenant = await createTestTenant('Clínica Principal', 'principal');
        tenantId = tenant.id;

        // =============================================
        // Crear admin de tenant principal
        // =============================================
        const admin = await createTestAdmin(tenantId, 'admin@principal.com', 'admin123');
        adminToken = admin.token;

        // =============================================
        // Crear recepcionista (para probar accesos)
        // =============================================
        const receptionist = await createTestReceptionist(tenantId, 'recep@principal.com', 'recep123');
        receptionistToken = receptionist.token;

        // =============================================
        // Crear paciente (para probar accesos)
        // =============================================
        const patient = await createPatientWithLogin(tenantId, 'patient@principal.com', 'patient123');
        patientToken = patient.token;

        // =============================================
        // Crear super_admin (tenant_id = null)
        // =============================================
        const hashSuper = await bcrypt.hash('super123', 10);
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

        // =============================================
        // Crear otro tenant (para pruebas de aislamiento)
        // =============================================
        const otherTenant = await createTestTenant('Otra Clínica', 'otra');
        otherTenantId = otherTenant.id;

        // Crear admin del otro tenant
        await createTestAdmin(otherTenantId, 'admin@otra.com', 'admin123');
    });

    // =============================================
    // GET /api/tenants (solo super_admin)
    // =============================================
    describe('GET /api/tenants', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app).get('/api/tenants');
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para admin', async () => {
            const res = await request(app)
                .get('/api/tenants')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(403);
        });

        it('debería devolver 403 para recepcionista', async () => {
            const res = await request(app)
                .get('/api/tenants')
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(403);
        });

        it('debería devolver 403 para paciente', async () => {
            const res = await request(app)
                .get('/api/tenants')
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a super_admin', async () => {
            const res = await request(app)
                .get('/api/tenants')
                .set('X-Tenant-ID', tenantId)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería devolver todos los tenants', async () => {
            const res = await request(app)
                .get('/api/tenants')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBe(2); // principal + otra

            const principal = res.body.data.find(t => t.slug === 'principal');
            const otra = res.body.data.find(t => t.slug === 'otra');

            expect(principal).toBeDefined();
            expect(principal.name).toBe('Clínica Principal');
            expect(otra).toBeDefined();
            expect(otra.name).toBe('Otra Clínica');
        });

        it('no debería incluir datos sensibles', async () => {
            const res = await request(app)
                .get('/api/tenants')
                .set('Authorization', `Bearer ${superAdminToken}`);

            const tenant = res.body.data[0];
            expect(tenant.password_hash).toBeUndefined();
        });
    });

    // =============================================
    // GET /api/tenants/:id (solo super_admin)
    // =============================================
    describe('GET /api/tenants/:id', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app).get(`/api/tenants/${tenantId}`);
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para admin', async () => {
            const res = await request(app)
                .get(`/api/tenants/${tenantId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a super_admin', async () => {
            const res = await request(app)
                .get(`/api/tenants/${tenantId}`)
                .set('X-Tenant-ID', tenantId)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería devolver los datos del tenant', async () => {
            const res = await request(app)
                .get(`/api/tenants/${tenantId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(tenantId);
            expect(res.body.data.name).toBe('Clínica Principal');
            expect(res.body.data.slug).toBe('principal');
        });

        it('debería devolver 404 si el tenant no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .get(`/api/tenants/${fakeId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(404);
        });
    });

    // =============================================
    // GET /api/tenants/me
    // =============================================
    describe('GET /api/tenants/me', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app).get('/api/tenants/me');
            expect(res.status).toBe(401);
        });

        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .get('/api/tenants/me')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería permitir acceso a super_admin (no tiene tenant)', async () => {
            const res = await request(app)
                .get('/api/tenants/me')
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(404);
        });

        it('debería denegar acceso a recepcionista', async () => {
            const res = await request(app)
                .get('/api/tenants/me')
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(403);
        });

        it('debería denegar acceso a paciente', async () => {
            const res = await request(app)
                .get('/api/tenants/me')
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(403);
        });

        it('debería devolver los datos del tenant del admin', async () => {
            const res = await request(app)
                .get('/api/tenants/me')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(tenantId);
            expect(res.body.data.name).toBe('Clínica Principal');
            expect(res.body.data.slug).toBe('principal');
        });
    });

    // =============================================
    // PATCH /api/tenants/:id (solo super_admin)
    // =============================================
    describe('PATCH /api/tenants/:id', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app)
                .patch(`/api/tenants/${tenantId}`)
                .send({ name: 'Nuevo Nombre' });
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para admin', async () => {
            const res = await request(app)
                .patch(`/api/tenants/${tenantId}`)
                .send({ name: 'Nuevo Nombre' })
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a super_admin', async () => {
            const res = await request(app)
                .patch(`/api/tenants/${tenantId}`)
                .set('X-Tenant-ID', tenantId)
                .send({ name: 'Nuevo Nombre' })
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería actualizar el nombre del tenant', async () => {
            const res = await request(app)
                .patch(`/api/tenants/${tenantId}`)
                .send({ name: 'Clínica Modificada' })
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Clínica Modificada');

            const tenant = await db('tenants').where({ id: tenantId }).first();
            expect(tenant.name).toBe('Clínica Modificada');
        });

        it('debería actualizar el teléfono del tenant', async () => {
            const res = await request(app)
                .patch(`/api/tenants/${tenantId}`)
                .send({ phone: '123456789' })
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.phone).toBe('123456789');

            const tenant = await db('tenants').where({ id: tenantId }).first();
            expect(tenant.phone).toBe('123456789');
        });

        it('debería actualizar la dirección del tenant', async () => {
            const res = await request(app)
                .patch(`/api/tenants/${tenantId}`)
                .send({ address: 'Av. Principal 123' })
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.address).toBe('Av. Principal 123');

            const tenant = await db('tenants').where({ id: tenantId }).first();
            expect(tenant.address).toBe('Av. Principal 123');
        });

        it('debería actualizar múltiples campos', async () => {
            const res = await request(app)
                .patch(`/api/tenants/${tenantId}`)
                .send({
                    name: 'Nombre Nuevo',
                    phone: '987654321',
                    city: 'Lima'
                })
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Nombre Nuevo');
            expect(res.body.data.phone).toBe('987654321');
            expect(res.body.data.city).toBe('Lima');
        });

        it('debería devolver 404 si el tenant no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .patch(`/api/tenants/${fakeId}`)
                .send({ name: 'Nuevo Nombre' })
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(404);
        });

        it('debería rechazar campos no permitidos', async () => {
            const res = await request(app)
                .patch(`/api/tenants/${tenantId}`)
                .send({
                    name: 'Nombre Nuevo',
                    slug: 'nuevo-slug', // Campo no permitido
                    campo_invalido: 'test'
                })
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(400);
        });
    });

    // =============================================
    // PATCH /api/tenants/me
    // =============================================
    describe('PATCH /api/tenants/me', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app)
                .patch('/api/tenants/me')
                .send({ name: 'Nuevo Nombre' });
            expect(res.status).toBe(401);
        });

        it('debería permitir acceso a admin', async () => {
            const res = await request(app)
                .patch('/api/tenants/me')
                .send({ name: 'Nuevo Nombre' })
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería denegar acceso a super_admin', async () => {
            const res = await request(app)
                .patch('/api/tenants/me')
                .send({ name: 'Nuevo Nombre' })
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(403); // Corregido: 403 por authorize('admin')
        });

        it('debería denegar acceso a recepcionista', async () => {
            const res = await request(app)
                .patch('/api/tenants/me')
                .send({ name: 'Nuevo Nombre' })
                .set('Authorization', `Bearer ${receptionistToken}`);
            expect(res.status).toBe(403);
        });

        it('debería denegar acceso a paciente', async () => {
            const res = await request(app)
                .patch('/api/tenants/me')
                .send({ name: 'Nuevo Nombre' })
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.status).toBe(403);
        });

        it('debería actualizar el nombre del tenant', async () => {
            const res = await request(app)
                .patch('/api/tenants/me')
                .send({ name: 'Clínica Renombrada' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Clínica Renombrada');

            const tenant = await db('tenants').where({ id: tenantId }).first();
            expect(tenant.name).toBe('Clínica Renombrada');
        });

        it('debería actualizar el teléfono del tenant', async () => {
            const res = await request(app)
                .patch('/api/tenants/me')
                .send({ phone: '123456789' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.phone).toBe('123456789');

            const tenant = await db('tenants').where({ id: tenantId }).first();
            expect(tenant.phone).toBe('123456789');
        });

        it('debería actualizar la dirección del tenant', async () => {
            const res = await request(app)
                .patch('/api/tenants/me')
                .send({ address: 'Av. Principal 123' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.address).toBe('Av. Principal 123');

            const tenant = await db('tenants').where({ id: tenantId }).first();
            expect(tenant.address).toBe('Av. Principal 123');
        });

        it('debería actualizar múltiples campos permitidos', async () => {
            const res = await request(app)
                .patch('/api/tenants/me')
                .send({
                    name: 'Nombre Nuevo',
                    phone: '987654321',
                    city: 'Lima'
                })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Nombre Nuevo');
            expect(res.body.data.phone).toBe('987654321');
            expect(res.body.data.city).toBe('Lima');
        });

        it('debería rechazar campos no permitidos', async () => {
            const res = await request(app)
                .patch('/api/tenants/me')
                .send({
                    name: 'Nombre Nuevo',
                    slug: 'nuevo-slug',
                    campo_invalido: 'test'
                })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
        });
    });

    // =============================================
    // POST /api/tenants (solo super_admin)
    // =============================================
    describe('POST /api/tenants', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app)
                .post('/api/tenants')
                .send({ name: 'Nueva Clínica', slug: 'nueva' });
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para admin', async () => {
            const res = await request(app)
                .post('/api/tenants')
                .send({ name: 'Nueva Clínica', slug: 'nueva' })
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a super_admin', async () => {
            const res = await request(app)
                .post('/api/tenants')
                .set('X-Tenant-ID', tenantId)
                .send({ name: 'Nueva Clínica', slug: 'nueva' })
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(201);
        });

        it('debería crear un nuevo tenant', async () => {
            const res = await request(app)
                .post('/api/tenants')
                .send({ name: 'Mi Clínica', slug: 'mi-clinica' })
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Mi Clínica');
            expect(res.body.data.slug).toBe('mi-clinica');
            expect(res.body.data.id).toBeDefined();

            const tenant = await db('tenants').where({ slug: 'mi-clinica' }).first();
            expect(tenant).toBeDefined();
            expect(tenant.name).toBe('Mi Clínica');
        });

        it('debería validar slug único', async () => {
            const res = await request(app)
                .post('/api/tenants')
                .send({ name: 'Otra', slug: 'principal' })
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(409);
        });

        it('debería validar formato de slug', async () => {
            const res = await request(app)
                .post('/api/tenants')
                .send({ name: 'Mala', slug: 'Slug Con Mayúsculas y espacios' })
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(400);
        });

        it('debería validar campos requeridos', async () => {
            const res = await request(app)
                .post('/api/tenants')
                .send({ name: 'Solo nombre' })
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(400);
        });
    });

    // =============================================
    // DELETE /api/tenants/:id (solo super_admin) - OPCIONAL
    // =============================================
    describe('DELETE /api/tenants/:id', () => {
        it('debería devolver 401 sin token', async () => {
            const res = await request(app).delete(`/api/tenants/${tenantId}`);
            expect(res.status).toBe(401);
        });

        it('debería devolver 403 para admin', async () => {
            const res = await request(app)
                .delete(`/api/tenants/${tenantId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(403);
        });

        it('debería permitir acceso a super_admin', async () => {
            const res = await request(app)
                .delete(`/api/tenants/${tenantId}`)
                .set('X-Tenant-ID', tenantId)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(200);
        });

        it('debería eliminar el tenant', async () => {
            const newTenant = await createTestTenant('Temp', 'temp');

            const res = await request(app)
                .delete(`/api/tenants/${newTenant.id}`)
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const deleted = await db('tenants').where({ id: newTenant.id }).first();
            expect(deleted).toBeUndefined();
        });

        it('debería devolver 404 si el tenant no existe', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .delete(`/api/tenants/${fakeId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);
            expect(res.status).toBe(404);
        });
    });
});