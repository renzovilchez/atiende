const crypto = require("crypto");
const db = require("../db/knex");
const redis = require("../utils/redis");

const REFRESH_TOKEN_TTL_DAYS = 7;
const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_SECONDS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── Redis helpers ────────────────────────────────────────────────────────────

function redisKey(tokenHash) {
  return `refresh:${tokenHash}`;
}

async function saveTokenInRedis(tokenHash, userId) {
  await redis.setex(
    redisKey(tokenHash),
    REFRESH_TOKEN_TTL_SECONDS,
    String(userId),
  );
}

async function deleteTokenFromRedis(tokenHash) {
  await redis.del(redisKey(tokenHash));
}

async function existsInRedis(tokenHash) {
  const val = await redis.get(redisKey(tokenHash));
  return val !== null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

async function findActiveUserByEmail(email) {
  return db("users as u")
    .leftJoin("tenants as t", "t.id", "u.tenant_id")
    .where("u.email", email.toLowerCase())
    .where("u.is_active", true)
    .select("u.*", "t.name as tenant_name", "t.slug as tenant_slug")
    .first();
}

async function findRefreshToken(refreshToken) {
  const tokenHash = hashToken(refreshToken);

  // 1. Verifica en Redis primero — si no existe, está revocado o expirado
  const existsInCache = await existsInRedis(tokenHash);
  if (!existsInCache) {
    // Fallback a PostgreSQL (por si Redis se reinició y perdió datos)
    const row = await db("refresh_tokens as rt")
      .join("users as u", "u.id", "rt.user_id")
      .leftJoin("tenants as t", "t.id", "u.tenant_id")
      .where("rt.token_hash", tokenHash)
      .whereNull("rt.revoked_at")
      .where("rt.expires_at", ">", db.fn.now())
      .select(
        "rt.id as token_id",
        "u.id as user_id",
        "u.email",
        "u.role",
        "u.tenant_id",
        "u.is_active",
        "u.first_name",
        "u.last_name",
        "t.name as tenant_name",
      )
      .first();

    // Si existe en PostgreSQL pero no en Redis, lo reinserta en Redis
    if (row) {
      await saveTokenInRedis(tokenHash, row.user_id);
    }

    return row || null;
  }

  // 2. Existe en Redis — consulta los datos del usuario en PostgreSQL
  return db("refresh_tokens as rt")
    .join("users as u", "u.id", "rt.user_id")
    .leftJoin("tenants as t", "t.id", "u.tenant_id")
    .where("rt.token_hash", tokenHash)
    .whereNull("rt.revoked_at")
    .where("rt.expires_at", ">", db.fn.now())
    .select(
      "rt.id as token_id",
      "u.id as user_id",
      "u.email",
      "u.role",
      "u.tenant_id",
      "u.is_active",
      "u.first_name",
      "u.last_name",
      "t.name as tenant_name",
    )
    .first();
}

async function saveRefreshToken(userId, refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  // Guarda en ambos en paralelo
  await Promise.all([
    db("refresh_tokens").insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    }),
    saveTokenInRedis(tokenHash, userId),
  ]);
}

async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);

  // Revoca en ambos en paralelo
  await Promise.all([
    db("refresh_tokens")
      .where("token_hash", tokenHash)
      .update({ revoked_at: db.fn.now() }),
    deleteTokenFromRedis(tokenHash),
  ]);
}

module.exports = {
  findActiveUserByEmail,
  findRefreshToken,
  saveRefreshToken,
  revokeRefreshToken,
};
