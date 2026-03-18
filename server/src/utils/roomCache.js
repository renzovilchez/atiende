const redis = require("./redis");

async function updateRoomCache(tenantId, roomId, data) {
  const key = `room:${tenantId}:${roomId}`;
  await redis.hset(key, {
    status: data.status,
    current_patient: data.current_patient || "",
    queue_count: String(data.queue_count || 0),
    updated_at: new Date().toISOString(),
  });
  await redis.expire(key, 86400); // expira en 24h
}

async function clearRoomCache(tenantId, roomId) {
  const key = `room:${tenantId}:${roomId}`;
  await redis.hset(key, {
    status: "available",
    current_patient: "",
    queue_count: "0",
    updated_at: new Date().toISOString(),
  });
  await redis.expire(key, 86400);
}

module.exports = { updateRoomCache, clearRoomCache };
