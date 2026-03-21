import api from "./axios";

export const getRooms = () => api.get("/rooms").then((r) => r.data.data);

export const getRoomById = (id) =>
  api.get(`/rooms/${id}`).then((r) => r.data.data);

export const getRoomsStatus = () =>
  api.get("/rooms/status").then((r) => r.data.data);

export const createRoom = (data) =>
  api.post("/rooms", data).then((r) => r.data.data);

export const updateRoom = (id, data) =>
  api.patch(`/rooms/${id}`, data).then((r) => r.data.data);

export const updateRoomPosition = (id, data) =>
  api.patch(`/rooms/${id}/position`, data).then((r) => r.data.data);

export const deleteRoom = (id) =>
  api.delete(`/rooms/${id}`).then((r) => r.data.data);
