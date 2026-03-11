const db = require('../../src/db/knex')

async function cleanDb() {
    await db.raw(`
        TRUNCATE TABLE
            queue_events,
            appointments,
            schedule_overrides,
            schedules,
            doctors,
            specialties,
            rooms,
            floors,
            refresh_tokens,
            users,
            tenants
        RESTART IDENTITY CASCADE
    `)
}

async function closeDb() {
    await db.destroy()
}

module.exports = { db, cleanDb, closeDb }