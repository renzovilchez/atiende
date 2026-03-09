require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding development data...');
    await client.query('BEGIN');

    // --- Tenants ---
    const { rows: [t1] } = await client.query(`
      INSERT INTO tenants (name, slug, ruc, phone, city)
      VALUES ('Clínica San Marcos', 'clinica-san-marcos', '20123456789', '044-123456', 'Trujillo')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const { rows: [t2] } = await client.query(`
      INSERT INTO tenants (name, slug, ruc, phone, city)
      VALUES ('Centro Médico Vita', 'centro-medico-vita', '20987654321', '044-654321', 'Trujillo')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);

    const hash = await bcrypt.hash('password123', 10);

    const users = [
      // Super admin (sin tenant)
      [null,  'super_admin',   'super@atiende.com',            hash, 'Super', 'Admin'],
      // Clínica 1
      [t1.id, 'admin',         'admin@sanmarcos.com',           hash, 'Carlos', 'Mendoza'],
      [t1.id, 'receptionist',  'recepcion@sanmarcos.com',       hash, 'Ana', 'Torres'],
      [t1.id, 'doctor',        'dr.garcia@sanmarcos.com',       hash, 'Luis', 'García'],
      [t1.id, 'doctor',        'dr.perez@sanmarcos.com',        hash, 'María', 'Pérez'],
      [t1.id, 'patient',       'paciente1@gmail.com',           hash, 'Juan', 'Ríos'],
      // Clínica 2
      [t2.id, 'admin',         'admin@vita.com',                hash, 'Rosa', 'Vásquez'],
      [t2.id, 'receptionist',  'recepcion@vita.com',            hash, 'Pedro', 'Chávez'],
      [t2.id, 'patient',       'paciente2@gmail.com',           hash, 'Lucía', 'Flores'],
    ];

    for (const [tenant_id, role, email, password_hash, first_name, last_name] of users) {
      await client.query(`
        INSERT INTO users (tenant_id, role, email, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
      `, [tenant_id, role, email, password_hash, first_name, last_name]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed completo');
    console.log('');
    console.log('  Usuarios de prueba (password: password123)');
    console.log('  ─────────────────────────────────────────');
    console.log('  super@atiende.com         → super_admin');
    console.log('  admin@sanmarcos.com       → admin (Clínica San Marcos)');
    console.log('  recepcion@sanmarcos.com   → recepcionista');
    console.log('  dr.garcia@sanmarcos.com   → doctor');
    console.log('  paciente1@gmail.com       → paciente');
    console.log('  admin@vita.com            → admin (Centro Médico Vita)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
