import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import useAuthStore from '../store/auth.store'

let socketInstance = null

export function getSocket() {
    return socketInstance
}

export function useSocket() {
    const user = useAuthStore(s => s.user)
    const socketRef = useRef(null)

    const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace('/api', '').replace(/\/$/, '')

    useEffect(() => {
        if (!user?.tenantId) return

        const socket = io(SOCKET_URL, {
            auth: {
                tenantId: user.tenantId,
                userId: user.id,
                token: window.__accessToken,
            },
            withCredentials: true,
            transports: ['websocket'],
        })

        socketRef.current = socket
        socketInstance = socket

        socket.on('connect', () => {
            console.log('[Socket] Conectado:', socket.id)
        })

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Desconectado:', reason)
        })

        socket.on('connect_error', (err) => {
            console.error('[Socket] Error de conexión:', err.message)
        })

        return () => {
            socket.disconnect()
            socketInstance = null
        }
    }, [user?.tenantId])

    return socketRef.current
}