import { create } from 'zustand'
import api from '../api/axios'

const useAuthStore = create((set) => ({
    user: null,
    isLoading: true, // true al inicio mientras verifica sesión existente

    // Login — guarda el accessToken en memoria y el user en el store
    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        window.__accessToken = data.data.accessToken
        set({ user: data.data.user })
    },

    // Logout — revoca el refresh token y limpia el estado
    logout: async () => {
        try {
            await api.post('/auth/logout')
        } finally {
            window.__accessToken = null
            set({ user: null })
            window.location.href = '/login'
        }
    },

    // Verifica si hay sesión activa al cargar la app (usa el refresh token en cookie)
    checkSession: async () => {
        try {
            const { data } = await api.post('/auth/refresh')
            window.__accessToken = data.data.accessToken
            const me = await api.get('/auth/me')
            set({ user: me.data.data.user })
        } catch {
            // No hay sesión válida — estado limpio
            window.__accessToken = null
            set({ user: null })
        } finally {
            set({ isLoading: false })
        }
    },
}))

export default useAuthStore