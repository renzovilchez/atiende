import { create } from "zustand";
import api from "../api/axios";

let sessionChecked = false;

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  tenantSlug: null,

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    window.__accessToken = data.data.accessToken;

    const slug = data.data.user?.tenantSlug;
    if (slug) {
      localStorage.setItem("tenantSlug", slug);
    }

    set({
      user: data.data.user,
      tenantSlug: slug,
    });
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      sessionChecked = false;
      window.__accessToken = null;
      localStorage.removeItem("tenantSlug");
      set({ user: null, tenantSlug: null });

      const { tenantSlug } = get();
      window.location.href = tenantSlug ? `/${tenantSlug}/login` : "/login";
    }
  },

  checkSession: async () => {
    if (sessionChecked) return;
    sessionChecked = true;

    const savedSlug = localStorage.getItem("tenantSlug");

    try {
      const { data } = await api.post("/auth/refresh");
      window.__accessToken = data.data.accessToken;
      const me = await api.get("/auth/me");

      const user = me.data.data.user;
      const slug = user?.tenantSlug || savedSlug;

      if (slug) {
        localStorage.setItem("tenantSlug", slug);
      }

      set({
        user: user,
        tenantSlug: slug,
      });
    } catch {
      window.__accessToken = null;
      localStorage.removeItem("tenantSlug");
      set({ user: null, tenantSlug: null });
    } finally {
      set({ isLoading: false });
    }
  },

  getTenantSlug: () => {
    const state = get();
    return (
      state.tenantSlug ||
      state.user?.tenantSlug ||
      localStorage.getItem("tenantSlug")
    );
  },
}));

export default useAuthStore;
