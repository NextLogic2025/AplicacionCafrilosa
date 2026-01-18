import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './useAuth'
import { env } from '../config/env'

interface NotificationPayload {
    type: string
    title: string
    message: string
    data?: any
}

export function useSocket() {
    const { token } = useAuth()
    const socketRef = useRef<Socket | null>(null)
    const [notifications, setNotifications] = useState<NotificationPayload[]>([])
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        if (!token) return

        // Connect to Catalog Service WebSocket
        // Namespace: /ws/catalog
        const socket = io(`${env.api.catalogo}/ws/catalog`, {
            auth: {
                token: `Bearer ${token}`
            },
            transports: ['websocket'], // Force WebSocket to avoid polling issues
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        })

        socketRef.current = socket

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id)
            setIsConnected(true)
        })

        socket.on('disconnect', () => {
            console.log('Socket disconnected')
            setIsConnected(false)
        })

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err)
            setIsConnected(false)
        })

        // Listen for generic notification event
        socket.on('notification', (payload: NotificationPayload) => {
            console.log('Notification received:', payload)
            setNotifications(prev => [payload, ...prev])
        })

        return () => {
            socket.disconnect()
            socketRef.current = null
        }
    }, [token])

    // Function to manually subscribe to specific rooms if needed (though backend handles joining logic on connection)
    const subscribeToPriceList = (listaId: number) => {
        socketRef.current?.emit('subscribePricelist', { listaId })
    }

    const clearNotifications = () => {
        setNotifications([])
    }

    return {
        socket: socketRef.current,
        isConnected,
        notifications,
        clearNotifications,
        subscribeToPriceList
    }
}
