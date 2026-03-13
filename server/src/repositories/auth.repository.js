const crypto = require('crypto')
const db = require('../db/knex')

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex')
}

async function findActiveUserByEmail(email) {
    return db('users as u')
        .leftJoin('tenants as t', 't.id', 'u.tenant_id')
        .where('u.email', email.toLowerCase())
        .where('u.is_active', true)
        .select('u.*', 't.name as tenant_name', 't.slug as tenant_slug')
        .first()
}

async function findRefreshToken(refreshToken) {
    const tokenHash = hashToken(refreshToken)

    return db('refresh_tokens as rt')
        .join('users as u', 'u.id', 'rt.user_id')
        .leftJoin('tenants as t', 't.id', 'u.tenant_id')
        .where('rt.token_hash', tokenHash)
        .whereNull('rt.revoked_at')
        .where('rt.expires_at', '>', db.fn.now())
        .select(
            'rt.id as token_id',
            'u.id as user_id',
            'u.email',
            'u.role',
            'u.tenant_id',
            'u.is_active',
            'u.first_name',
            'u.last_name',
            't.name as tenant_name'
        )
        .first()
}

async function saveRefreshToken(userId, refreshToken) {
    const tokenHash = hashToken(refreshToken)
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

    await db('refresh_tokens').insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
    })
}

async function revokeRefreshToken(refreshToken) {
    if (!refreshToken) return
    const tokenHash = hashToken(refreshToken)

    await db('refresh_tokens')
        .where('token_hash', tokenHash)
        .update({ revoked_at: db.fn.now() })
}

module.exports = {
    findActiveUserByEmail,
    findRefreshToken,
    saveRefreshToken,
    revokeRefreshToken,
}