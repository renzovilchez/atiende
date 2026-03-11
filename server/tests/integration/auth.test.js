// =============================================
// Tests de integración para el módulo de autenticación
// =============================================

// Supertest: librería para simular peticiones HTTP a nuestra app Express
const request = require('supertest');
// Importamos la instancia de Express (sin levantar el servidor)
const app = require('../../src/app');
// Helpers personalizados para manejar la base de datos en los tests
const { db, cleanDb, closeDb } = require('../helpers/db');
// Bcrypt para hashear contraseñas en la preparación de datos
const bcrypt = require('bcryptjs');
// JWT para decodificar tokens y verificar su contenido
const jwt = require('jsonwebtoken');

// Grupo principal de tests para autenticación
describe('Auth', () => {
    // Variables compartidas dentro del bloque describe
    let tenantId;          // ID del tenant creado para los tests
    let testUser;          // Usuario activo (paciente) que usaremos en múltiples tests

    // beforeAll se ejecuta una vez antes de todos los tests, pero usamos beforeEach
    // para tener una base de datos limpia en cada test (aislamiento)
    beforeEach(async () => {
        // Limpia todas las tablas de la BD (truncado ordenado) antes de cada test
        await cleanDb();

        // -------------------------------------------------
        // Crear un tenant (clínica) de prueba
        // -------------------------------------------------
        const [tenant] = await db('tenants').insert({
            name: 'Clínica Test',
            slug: 'clinica-test',
        }).returning('*');
        tenantId = tenant.id; // Guardamos el ID para usarlo en inserciones posteriores

        // -------------------------------------------------
        // Crear un usuario activo con rol 'patient'
        // -------------------------------------------------
        const hash = await bcrypt.hash('password123', 10);
        const [user] = await db('users').insert({
            tenant_id: tenantId,
            role: 'patient',
            email: 'paciente@test.com',
            password_hash: hash,
            first_name: 'Juan',
            last_name: 'Ríos',
            is_active: true, // Usuario activo
        }).returning('*');
        testUser = user; // Guardamos para usar en aserciones que necesiten el ID

        // -------------------------------------------------
        // Crear un usuario inactivo (para probar que no puede loguearse)
        // -------------------------------------------------
        const hashInactive = await bcrypt.hash('password123', 10);
        await db('users').insert({
            tenant_id: tenantId,
            role: 'patient',
            email: 'inactivo@test.com',
            password_hash: hashInactive,
            first_name: 'Inactivo',
            last_name: 'Usuario',
            is_active: false, // Usuario inactivo
        });

        // -------------------------------------------------
        // Crear un usuario con rol admin (para probar /me con otro rol)
        // -------------------------------------------------
        const hashAdmin = await bcrypt.hash('admin123', 10);
        await db('users').insert({
            tenant_id: tenantId,
            role: 'admin',
            email: 'admin@test.com',
            password_hash: hashAdmin,
            first_name: 'Admin',
            last_name: 'Test',
            is_active: true,
        });
    });

    // afterAll se ejecuta una vez después de todos los tests, cerramos la conexión a la BD
    afterAll(async () => {
        await closeDb();
    });

    // -------------------------------------------------
    // Tests para el endpoint POST /api/auth/login
    // -------------------------------------------------
    describe('POST /api/auth/login', () => {
        it('debería hacer login exitoso y devolver accessToken + refreshToken en cookie', async () => {
            // Simulamos una petición POST con credenciales correctas
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'paciente@test.com', password: 'password123' });

            // Verificamos código 200 y estructura de respuesta
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
            // Verificamos que los datos del usuario sean los esperados (sin password)
            expect(res.body.data.user).toMatchObject({
                email: 'paciente@test.com',
                role: 'patient',
                firstName: 'Juan',
                lastName: 'Ríos',
                tenantId: tenantId,
                tenantName: 'Clínica Test',
                tenantSlug: 'clinica-test',
            });
            expect(res.body.data.user.password_hash).toBeUndefined();

            // Verificamos que se haya enviado la cookie httpOnly con el refresh token
            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();
            const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
            expect(refreshCookie).toBeDefined();
            // Comprobamos las opciones de seguridad de la cookie
            expect(refreshCookie).toContain('HttpOnly');
            expect(refreshCookie).toContain('Max-Age=604800'); // 7 días en segundos
            expect(refreshCookie).toContain('SameSite=Lax');
        });

        it('debería incluir tenant_id y role en el payload del JWT', async () => {
            // Hacemos login y obtenemos el token
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'paciente@test.com', password: 'password123' });

            const token = res.body.data.accessToken;
            // Decodificamos sin verificar (solo para inspeccionar el payload)
            const decoded = jwt.decode(token);
            // Verificamos que el payload contenga los campos esperados
            expect(decoded.sub).toBe(testUser.id);
            expect(decoded.email).toBe('paciente@test.com');
            expect(decoded.role).toBe('patient');
            expect(decoded.tenantId).toBe(tenantId);
            expect(decoded.firstName).toBe('Juan');
            expect(decoded.lastName).toBe('Ríos');
        });

        it('credenciales incorrectas devuelve 401', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'paciente@test.com', password: 'incorrecta' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Credenciales inválidas');
        });

        it('email inexistente devuelve 401', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'noexiste@test.com', password: 'password123' });

            expect(res.status).toBe(401);
        });

        it('usuario inactivo devuelve 401', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'inactivo@test.com', password: 'password123' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Credenciales inválidas');
        });

        it('validación de esquema: email inválido devuelve 400', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'correo-mal', password: 'password123' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Datos inválidos');
            expect(res.body.details).toBeDefined(); // Detalles del error de validación
        });

        it('validación de esquema: password corta devuelve 400', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'paciente@test.com', password: '123' });

            expect(res.status).toBe(400);
        });
    });

    // -------------------------------------------------
    // Tests para el endpoint POST /api/auth/refresh
    // -------------------------------------------------
    describe('POST /api/auth/refresh', () => {
        let refreshToken;

        // Antes de cada test de este grupo, hacemos login para obtener un refresh token válido
        beforeEach(async () => {
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'paciente@test.com', password: 'password123' });

            const cookies = loginRes.headers['set-cookie'];
            const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
            // Extraemos el valor de la cookie (quitando 'refreshToken=' y los atributos)
            refreshToken = refreshCookie.split(';')[0].split('=')[1];
        });

        it('debería renovar accessToken con refreshToken válido', async () => {
            // Enviamos el refresh token en la cookie
            const res = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`]);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();

            // Verificamos que se haya emitido una nueva cookie (rotación del refresh token)
            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();
            const newRefreshCookie = cookies.find(c => c.startsWith('refreshToken='));
            expect(newRefreshCookie).toBeDefined();
            // La nueva cookie debe ser diferente a la anterior
            expect(newRefreshCookie).not.toContain(refreshToken);

            // Verificamos que el token antiguo ya no sea válido (debería estar revocado)
            const oldTokenRes = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`]);
            expect(oldTokenRes.status).toBe(401);
        });

        it('debería devolver 401 si no se envía refresh token', async () => {
            const res = await request(app).post('/api/auth/refresh');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Refresh token requerido');
        });

        it('debería devolver 401 con refresh token inválido', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', ['refreshToken=inventado123']);
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Refresh token inválido o expirado');
        });

        it('debería devolver 401 con refresh token revocado', async () => {
            // Primero hacemos logout para revocar el token
            await request(app)
                .post('/api/auth/logout')
                .set('Cookie', [`refreshToken=${refreshToken}`]);

            // Intentamos usarlo de nuevo en refresh
            const res = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`]);
            expect(res.status).toBe(401);
        });
    });

    // -------------------------------------------------
    // Tests para el endpoint POST /api/auth/logout
    // -------------------------------------------------
    describe('POST /api/auth/logout', () => {
        let refreshToken;

        beforeEach(async () => {
            // Obtenemos un refresh token válido
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'paciente@test.com', password: 'password123' });

            const cookies = loginRes.headers['set-cookie'];
            const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
            refreshToken = refreshCookie.split(';')[0].split('=')[1];
        });

        it('debería cerrar sesión y revocar refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', [`refreshToken=${refreshToken}`]);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verificamos que la cookie se haya eliminado (max-age=0)
            const cookies = res.headers['set-cookie'];
            const clearCookie = cookies.find(c => c.startsWith('refreshToken=;'));
            expect(clearCookie).toBeDefined();
            expect(clearCookie).toMatch(/Max-Age=0|Expires=.*1970/);

            // Comprobamos que el token ya no sirve para refresh
            const refreshRes = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`]);
            expect(refreshRes.status).toBe(401);
        });

        it('debería funcionar aunque no haya refresh token (no revoca nada)', async () => {
            // Llamada sin cookie
            const res = await request(app).post('/api/auth/logout');
            expect(res.status).toBe(200); // El servicio llama a revoke con undefined, no falla
            expect(res.body.success).toBe(true);
        });
    });

    // -------------------------------------------------
    // Tests para el endpoint GET /api/auth/me
    // -------------------------------------------------
    describe('GET /api/auth/me', () => {
        let accessToken;

        beforeEach(async () => {
            // Obtenemos un accessToken válido
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'paciente@test.com', password: 'password123' });
            accessToken = loginRes.body.data.accessToken;
        });

        it('debería devolver datos del usuario autenticado', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            // Verificamos que los datos coincidan con el usuario logueado
            expect(res.body.data.user).toMatchObject({
                id: testUser.id,
                email: 'paciente@test.com',
                role: 'patient',
                firstName: 'Juan',
                lastName: 'Ríos',
                tenantId: tenantId,
                tenantName: 'Clínica Test',
            });
            // Aseguramos que no se filtre el hash de password
            expect(res.body.data.user.password_hash).toBeUndefined();
        });

        it('debería devolver 401 sin token', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('No autorizado');
        });

        it('debería devolver 401 con token inválido', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer token-falso');
            expect(res.status).toBe(401);
        });

        it('debería devolver 401 con token expirado', async () => {
            // Generamos un token con fecha de expiración en el pasado
            const expiredToken = jwt.sign(
                { sub: testUser.id, email: testUser.email, role: testUser.role, tenantId },
                process.env.JWT_SECRET,
                { expiresIn: '-1s' } // expira inmediatamente
            );
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${expiredToken}`);
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Token expirado');
        });

        it('debería funcionar para admin', async () => {
            // Hacemos login con el usuario admin creado en beforeEach
            const loginAdmin = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@test.com', password: 'admin123' });
            const adminToken = loginAdmin.body.data.accessToken;

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.user.role).toBe('admin');
        });
    });
});