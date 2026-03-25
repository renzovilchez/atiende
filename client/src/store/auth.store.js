import { create } from "zustand";
import api from "../api/axios";

let sessionChecked = false;

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    window.__accessToken = data.data.accessToken;
    set({ user: data.data.user });
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      sessionChecked = false;
      window.__accessToken = null;
      set({ user: null });
      const { user } = get();
      // Si tenía slug, redirige al login de su clínica
      window.location.href = user?.tenantSlug
        ? `/${user.tenantSlug}/login`
        : "/login";
    }
  },

  checkSession: async () => {
    if (sessionChecked) return;
    sessionChecked = true;
    try {
      const { data } = await api.post("/auth/refresh");
      window.__accessToken = data.data.accessToken;
      const me = await api.get("/auth/me");
      set({ user: me.data.data.user });
    } catch {
      window.__accessToken = null;
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
