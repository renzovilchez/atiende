require('dotenv').config()
const bcrypt = require('bcryptjs')
const db = require('./knex')

async function seed() {
  console.log('🌱 Seeding development data...')

  await db.transaction(async (trx) => {

    // ─── TENANTS ───────────────────────────────────────────────────────────
    const [t1] = await trx('tenants')
      .insert({ name: 'Clínica San Marcos', slug: 'clinica-san-marcos', ruc: '20123456789', phone: '044-123456', city: 'Trujillo' })
      .onConflict('slug').merge(['name'])
      .returning('id')

    const [t2] = await trx('tenants')
      .insert({ name: 'Centro Médico Vita', slug: 'centro-medico-vita', ruc: '20987654321', phone: '044-654321', city: 'Trujillo' })
      .onConflict('slug').merge(['name'])
      .returning('id')

    const t1id = t1.id
    const t2id = t2.id

    // ─── USUARIOS ──────────────────────────────────────────────────────────
    const hash = await bcrypt.hash('password123', 10)

    const usersData = [
      { tenant_id: null, role: 'super_admin', email: 'super@atiende.com', password_hash: hash, first_name: 'Super', last_name: 'Admin' },
      { tenant_id: t1id, role: 'admin', email: 'admin@sanmarcos.com', password_hash: hash, first_name: 'Carlos', last_name: 'Mendoza' },
      { tenant_id: t1id, role: 'receptionist', email: 'recepcion@sanmarcos.com', password_hash: hash, first_name: 'Ana', last_name: 'Torres' },
      { tenant_id: t1id, role: 'doctor', email: 'dr.garcia@sanmarcos.com', password_hash: hash, first_name: 'Luis', last_name: 'García' },
      { tenant_id: t1id, role: 'doctor', email: 'dr.perez@sanmarcos.com', password_hash: hash, first_name: 'María', last_name: 'Pérez' },
      { tenant_id: t1id, role: 'patient', email: 'paciente1@gmail.com', password_hash: hash, first_name: 'Juan', last_name: 'Ríos' },
      { tenant_id: t2id, role: 'admin', email: 'admin@vita.com', password_hash: hash, first_name: 'Rosa', last_name: 'Vásquez' },
      { tenant_id: t2id, role: 'receptionist', email: 'recepcion@vita.com', password_hash: hash, first_name: 'Pedro', last_name: 'Chávez' },
      { tenant_id: t2id, role: 'patient', email: 'paciente2@gmail.com', password_hash: hash, first_name: 'Lucía', last_name: 'Flores' },
    ]

    for (const u of usersData) {
      await trx('users').insert(u).onConflict('email').ignore()
    }

    // Obtener IDs de doctores para usarlos más abajo
    const drGarcia = await trx('users').where({ email: 'dr.garcia@sanmarcos.com' }).first()
    const drPerez = await trx('users').where({ email: 'dr.perez@sanmarcos.com' }).first()

    // ─── ESPECIALIDADES ────────────────────────────────────────────────────
    const [specMed] = await trx('specialties')
      .insert({ tenant_id: t1id, name: 'Medicina General', duration_minutes: 20 })
      .onConflict().ignore().returning('id')

    const [specPed] = await trx('specialties')
      .insert({ tenant_id: t1id, name: 'Pediatría', duration_minutes: 25 })
      .onConflict().ignore().returning('id')

    // ─── PISOS ─────────────────────────────────────────────────────────────
    const [floor1] = await trx('floors')
      .insert({ tenant_id: t1id, name: 'Primer Piso', number: 1 })
      .onConflict().ignore().returning('id')

    // ─── CONSULTORIOS ──────────────────────────────────────────────────────
    const [room1] = await trx('rooms')
      .insert({ tenant_id: t1id, floor_id: floor1.id, name: 'Consultorio 1', number: '101' })
      .onConflict().ignore().returning('id')

    const [room2] = await trx('rooms')
      .insert({ tenant_id: t1id, floor_id: floor1.id, name: 'Consultorio 2', number: '102' })
      .onConflict().ignore().returning('id')

    // ─── PERFILES DE MÉDICO ────────────────────────────────────────────────
    const [doc1] = await trx('doctors')
      .insert({ tenant_id: t1id, user_id: drGarcia.id, specialty_id: specMed.id, license_number: 'CMP-12345' })
      .onConflict(['tenant_id', 'user_id']).ignore().returning('id')

    const [doc2] = await trx('doctors')
      .insert({ tenant_id: t1id, user_id: drPerez.id, specialty_id: specPed.id, license_number: 'CMP-67890' })
      .onConflict(['tenant_id', 'user_id']).ignore().returning('id')

    // ─── TURNOS SEMANALES ──────────────────────────────────────────────────
    // Dr. García: lunes, miércoles y viernes 8:00-13:00
    for (const day of [1, 3, 5]) {
      await trx('schedules')
        .insert({ tenant_id: t1id, doctor_id: doc1.id, room_id: room1.id, day_of_week: day, start_time: '08:00', end_time: '13:00', max_patients: 15 })
        .onConflict().ignore()
    }

    // Dra. Pérez: martes y jueves 9:00-14:00
    for (const day of [2, 4]) {
      await trx('schedules')
        .insert({ tenant_id: t1id, doctor_id: doc2.id, room_id: room2.id, day_of_week: day, start_time: '09:00', end_time: '14:00', max_patients: 12 })
        .onConflict().ignore()
    }
  })

  console.log('✅ Seed completo')
  console.log('')
  console.log('  Usuarios de prueba (password: password123)')
  console.log('  ─────────────────────────────────────────')
  console.log('  super@atiende.com         → super_admin')
  console.log('  admin@sanmarcos.com       → admin (Clínica San Marcos)')
  console.log('  recepcion@sanmarcos.com   → recepcionista')
  console.log('  dr.garcia@sanmarcos.com   → doctor (Medicina General)')
  console.log('  dr.perez@sanmarcos.com    → doctor (Pediatría)')
  console.log('  paciente1@gmail.com       → paciente')
  console.log('  admin@vita.com            → admin (Centro Médico Vita)')

  await db.destroy()
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})