// knex.js — instancia única de Knex compartida en todo el servidor
const knex = require('knex')

const db = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
        min: 2,
        max: 10,
    },
    // Log queries en desarrollo
    debug: false
})

module.exports = db