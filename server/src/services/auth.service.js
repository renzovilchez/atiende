const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const db = require('../db/knex')
const { AppError } = require('../middleware/error.middleware')

function generateTokens(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id || null,
    firstName: user.first_name || null,
    lastName: user.last_name || null,
    tenantName: user.tenant_name || null,
  }

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  })

  const refreshToken = crypto.randomBytes(64).toString('hex')

  return { accessToken, refreshToken }
}

async function login(email, password) {
  const user = await db('users as u')
    .leftJoin('tenants as t', 't.id', 'u.tenant_id')
    .where('u.email', email.toLowerCase())
    .where('u.is_active', true)
    .select('u.*', 't.name as tenant_name', 't.slug as tenant_slug')
    .first()

  if (!user) throw new AppError('Credenciales inválidas', 401)

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw new AppError('Credenciales inválidas', 401)

  const { accessToken, refreshToken } = generateTokens(user)

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db('refresh_tokens').insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
      tenantSlug: user.tenant_slug,
    },
  }
}

async function refreshAccessToken(refreshToken) {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')

  const row = await db('refresh_tokens as rt')
    .join('users as u', 'u.id', 'rt.user_id')
    .leftJoin('tenants as t', 't.id', 'u.tenant_id')
    .where('rt.token_hash', tokenHash)
    .whereNull('rt.revoked_at')
    .where('rt.expires_at', '>', db.fn.now())
    .select('rt.*', 'u.id as user_id', 'u.email', 'u.role', 'u.tenant_id', 'u.is_active', 'u.first_name', 'u.last_name', 't.name as tenant_name')
    .first()

  if (!row) throw new AppError('Refresh token inválido o expirado', 401)
  if (!row.is_active) throw new AppError('Usuario inactivo', 401)

  const { accessToken, refreshToken: newRefreshToken } = generateTokens({
    id: row.user_id,
    email: row.email,
    role: row.role,
    tenant_id: row.tenant_id,
    first_name: row.first_name,
    last_name: row.last_name,
    tenant_name: row.tenant_name,
  })

  await db('refresh_tokens').where('token_hash', tokenHash).update({ revoked_at: db.fn.now() })

  const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db('refresh_tokens').insert({
    user_id: row.user_id,
    token_hash: newHash,
    expires_at: expiresAt,
  })

  return { accessToken, refreshToken: newRefreshToken }
}

async function logout(refreshToken) {
  if (!refreshToken) return
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
  await db('refresh_tokens').where('token_hash', tokenHash).update({ revoked_at: db.fn.now() })
}

module.exports = { login, refreshAccessToken, logout }