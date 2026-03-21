import api from "./axios";

export const getFloors = () => api.get("/floors").then((r) => r.data.data);

export const createFloor = (data) =>
  api.post("/floors", data).then((r) => r.data.data);

export const updateFloor = (id, data) =>
  api.patch(`/floors/${id}`, data).then((r) => r.data.data);

export const deleteFloor = (id) =>
  api.delete(`/floors/${id}`).then((r) => r.data.data);
