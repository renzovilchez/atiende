const fs = require('fs')
const path = require('path')
const db = require('./knex')

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations')

async function migrate() {
  await db.raw(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const applied = await db('_migrations').pluck('filename')
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  const pending = files.filter(f => !applied.includes(f))

  if (pending.length === 0) {
    console.log('[migrate] Nada que migrar')
    await db.destroy()
    return
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
    console.log(`[migrate] Aplicando ${file}...`)

    await db.transaction(async (trx) => {
      await trx.raw(sql)
      await trx('_migrations').insert({ filename: file })
    })

    console.log(`[migrate] ✓ ${file}`)
  }

  console.log('[migrate] Completado')
  await db.destroy()
}

migrate().catch(err => {
  console.error('[migrate] Error:', err.message)
  process.exit(1)
})