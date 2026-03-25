const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { AppError } = require("../middleware/error.middleware");
const authRepository = require("../repositories/auth.repository");

function generateTokens(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id || null,
    firstName: user.first_name || null,
    lastName: user.last_name || null,
    tenantName: user.tenant_name || null,
    tenantSlug: user.tenant_slug || null,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

  const refreshToken = crypto.randomBytes(64).toString("hex");

  return { accessToken, refreshToken };
}

async function login(email, password) {
  const user = await authRepository.findActiveUserByEmail(email);
  if (!user) throw new AppError("Credenciales inválidas", 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError("Credenciales inválidas", 401);

  const { accessToken, refreshToken } = generateTokens(user);

  await authRepository.saveRefreshToken(user.id, refreshToken);

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
      tenantSlug: user.tenant_slug,
    },
  };
}

async function refreshAccessToken(refreshToken) {
  const row = await authRepository.findRefreshToken(refreshToken);
  if (!row) throw new AppError("Refresh token inválido o expirado", 401);
  if (!row.is_active) throw new AppError("Usuario inactivo", 401);

  const { accessToken, refreshToken: newRefreshToken } = generateTokens({
    id: row.user_id,
    email: row.email,
    role: row.role,
    tenant_id: row.tenant_id,
    first_name: row.first_name,
    last_name: row.last_name,
    tenant_name: row.tenant_name,
  });

  await authRepository.revokeRefreshToken(refreshToken);
  await authRepository.saveRefreshToken(row.user_id, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}

async function logout(refreshToken) {
  await authRepository.revokeRefreshToken(refreshToken);
}

module.exports = { login, refreshAccessToken, logout };
