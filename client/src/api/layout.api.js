import api from "./axios";

export const getMyLayout = () =>
  api.get("/tenants/me/layout").then((r) => r.data.data);
