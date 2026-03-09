require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    // Crear tabla de control de migraciones si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Leer migraciones aplicadas
    const { rows: applied } = await client.query('SELECT filename FROM _migrations ORDER BY id');
    const appliedSet = new Set(applied.map(r => r.filename));

    // Leer archivos de migración en orden
    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) continue;

      console.log(`⚡ Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');

      console.log(`✅ Applied: ${file}`);
      count++;
    }

    if (count === 0) {
      console.log('✅ All migrations already applied');
    } else {
      console.log(`✅ Applied ${count} migration(s)`);
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
