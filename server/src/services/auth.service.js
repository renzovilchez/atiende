const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../db/pool');
const { AppError } = require('../middleware/error.middleware');

function generateTokens(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id || null,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

  const refreshToken = crypto.randomBytes(64).toString('hex');

  return { accessToken, refreshToken };
}

async function login(email, password) {
  const { rows } = await query(
    `SELECT u.*, t.name as tenant_name, t.slug as tenant_slug
     FROM users u
     LEFT JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = $1 AND u.is_active = TRUE`,
    [email.toLowerCase()]
  );

  const user = rows[0];
  if (!user) throw new AppError('Credenciales inválidas', 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Credenciales inválidas', 401);

  const { accessToken, refreshToken } = generateTokens(user);

  // Guardar refresh token hasheado
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

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
  };
}

async function refreshAccessToken(refreshToken) {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const { rows } = await query(
    `SELECT rt.*, u.id as user_id, u.email, u.role, u.tenant_id, u.is_active
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
    [tokenHash]
  );

  if (!rows[0]) throw new AppError('Refresh token inválido o expirado', 401);
  if (!rows[0].is_active) throw new AppError('Usuario inactivo', 401);

  const user = rows[0];
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

  // Rotar el refresh token
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);

  const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.user_id, newHash, expiresAt]
  );

  return { accessToken, refreshToken: newRefreshToken };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
}

module.exports = { login, refreshAccessToken, logout };
