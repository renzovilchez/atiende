const redis = require("./redis");

async function updateRoomCache(tenantId, roomId, data) {
  const key = `room:${tenantId}:${roomId}`;
  await redis.hset(key, {
    status: data.status,
    current_patient: data.current_patient || "",
    current_doctor: data.current_doctor || "",
    queue_count: String(data.queue_count || 0),
    updated_at: new Date().toISOString(),
  });
  await redis.expire(key, 86400);
}

async function clearRoomCache(tenantId, roomId) {
  const key = `room:${tenantId}:${roomId}`;
  await redis.hset(key, {
    status: "available",
    current_patient: "",
    current_doctor: "",
    queue_count: "0",
    updated_at: new Date().toISOString(),
  });
  await redis.expire(key, 86400);
}

module.exports = { updateRoomCache, clearRoomCache };
