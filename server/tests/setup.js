require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') })

jest.mock('ioredis', () => {
    const RedisMock = require('ioredis-mock')
    return RedisMock
})

afterAll(async () => {
    const { closeDb } = require('./helpers/db')
    await closeDb()
})