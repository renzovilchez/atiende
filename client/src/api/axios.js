import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    withCredentials: true,
})

api.interceptors.request.use((config) => {
    const token = window.__accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

let isRefreshing = false
let queue = []

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config

        if (original._retry || original.url?.includes('/auth/refresh')) {
            return Promise.reject(error)
        }

        if (error.response?.status !== 401) {
            return Promise.reject(error)
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                queue.push({ resolve, reject })
            }).then((token) => {
                original.headers.Authorization = `Bearer ${token}`
                return api(original)
            })
        }

        original._retry = true
        isRefreshing = true

        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/refresh`,
                {},
                { withCredentials: true, _isRefresh: true }
            )
            const newToken = data.data.accessToken
            window.__accessToken = newToken
            queue.forEach(({ resolve }) => resolve(newToken))
            queue = []
            original.headers.Authorization = `Bearer ${newToken}`
            return api(original)
        } catch (err) {
            queue.forEach(({ reject }) => reject(err))
            queue = []
            window.__accessToken = null
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login'
            }
            return Promise.reject(err)
        } finally {
            isRefreshing = false
        }
    }
)

export default api