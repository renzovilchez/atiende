// =============================================
// Helpers para tests de appointments
// =============================================

const request = require('supertest');
const { db } = require('../../helpers/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');

// Obtiene una fecha futura para tests (7 días por defecto)
function getFutureDate(days = 7) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

// Crea un tenant de prueba
async function createTestTenant(name = 'Clínica Test', slug = 'clinica-test') {
    const [tenant] = await db('tenants').insert({ name, slug }).returning('*');
    return tenant;
}

// Crea una especialidad
async function createTestSpecialty(tenantId, name = 'Medicina General') {
    const [specialty] = await db('specialties').insert({
        tenant_id: tenantId,
        name,
    }).returning('*');
    return specialty;
}

// Crea un doctor completo (usuario + doctor)
async function createTestDoctor(tenantId, specialtyId, email = 'doctor@test.com', password = 'doctor123') {
    const hash = await bcrypt.hash(password, 10);
    const [user] = await db('users').insert({
        tenant_id: tenantId,
        role: 'doctor',
        email,
        password_hash: hash,
        first_name: 'Carlos',
        last_name: 'Médico',
        is_active: true,
    }).returning('*');

    const [doctor] = await db('doctors').insert({
        user_id: user.id,
        tenant_id: tenantId,
        specialty_id: specialtyId,
        license_number: '12345',
    }).returning('*');

    return { doctor, user };
}

// Crea un horario para un doctor en una fecha específica
async function createTestSchedule(tenantId, doctorId, date, start = '09:00', end = '13:00', maxPatients = 10) {
    const dayOfWeek = new Date(date).getUTCDay();
    const [schedule] = await db('schedules').insert({
        doctor_id: doctorId,
        tenant_id: tenantId,
        day_of_week: dayOfWeek,
        start_time: start,
        end_time: end,
        max_patients: maxPatients,
        is_active: true,
    }).returning('*');
    return schedule;
}

// Crea un paciente con login real (obtiene token mediante /auth/login)
async function createPatientWithLogin(tenantId, email, password) {
    const hash = await bcrypt.hash(password, 10);
    const [user] = await db('users').insert({
        tenant_id: tenantId,
        role: 'patient',
        email,
        password_hash: hash,
        first_name: 'Paciente',
        last_name: email.split('@')[0],
        is_active: true,
    }).returning('*');

    const login = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

    if (login.status !== 200) {
        throw new Error(`Error en login para ${email}: ${login.body.error}`);
    }

    return { id: user.id, token: login.body.data.accessToken };
}

// Crea un paciente con token JWT directo (sin login)
async function createPatientWithToken(tenantId, email, password) {
    const hash = await bcrypt.hash(password, 10);
    const [user] = await db('users').insert({
        tenant_id: tenantId,
        role: 'patient',
        email,
        password_hash: hash,
        first_name: 'Paciente',
        last_name: email.split('@')[0],
        is_active: true,
    }).returning('*');

    const token = jwt.sign(
        { sub: user.id, email: user.email, role: 'patient', tenantId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    return { id: user.id, token };
}

// Crea un admin y obtiene su token
async function createTestAdmin(tenantId, email = 'admin@test.com', password = 'admin123') {
    const hash = await bcrypt.hash(password, 10);
    const [user] = await db('users').insert({
        tenant_id: tenantId,
        role: 'admin',
        email,
        password_hash: hash,
        first_name: 'Admin',
        last_name: 'Test',
        is_active: true,
    }).returning('*');

    const login = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

    return { id: user.id, token: login.body.data.accessToken };
}

// Crea un recepcionista y obtiene su token
async function createTestReceptionist(tenantId, email = 'reception@test.com', password = 'reception123') {
    const hash = await bcrypt.hash(password, 10);
    const [user] = await db('users').insert({
        tenant_id: tenantId,
        role: 'receptionist',
        email,
        password_hash: hash,
        first_name: 'Recepcionista',
        last_name: 'Test',
        is_active: true,
    }).returning('*');

    const login = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

    return { id: user.id, token: login.body.data.accessToken };
}

// Inserta un paciente directamente en DB (sin token, solo para llenar cupos)
async function insertPatientOnly(tenantId, email, password = 'pass123') {
    const hash = await bcrypt.hash(password, 10);
    const [user] = await db('users').insert({
        tenant_id: tenantId,
        role: 'patient',
        email,
        password_hash: hash,
        first_name: 'Paciente',
        last_name: email.split('@')[0],
        is_active: true,
    }).returning('*');
    return user;
}

module.exports = {
    getFutureDate,
    createTestTenant,
    createTestSpecialty,
    createTestDoctor,
    createTestSchedule,
    createPatientWithLogin,
    createPatientWithToken,
    createTestAdmin,
    createTestReceptionist,
    insertPatientOnly,
};