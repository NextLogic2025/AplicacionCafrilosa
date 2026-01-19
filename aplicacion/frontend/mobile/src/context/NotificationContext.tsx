import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { env } from '../config/env'
import { getToken } from '../storage/authStorage'
import { NotificationToast } from '../components/ui/NotificationToast'
import { Notification, NotificationService } from '../services/api/NotificationService'

type NotificationPayload = {
    type?: string
    title?: string
    message?: string
    data?: any
}

type NotificationContextType = {
    notifications: Notification[]
    badgeCount: number
    loaded: boolean
    markAllRead: () => void
    markRead: (id: string) => void
    clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

const mapToastType = (type?: string): 'info' | 'success' | 'warning' | 'error' => {
    if (!type) return 'info'
    if (type.includes('PROMO')) return 'success'
    if (type.includes('ALERT') || type.includes('ROUTE')) return 'warning'
    if (type.includes('ERROR')) return 'error'
    return 'info'
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loaded, setLoaded] = useState(false)
    const [toast, setToast] = useState<{ message: string; title?: string; type?: 'info' | 'success' | 'warning' | 'error' } | null>(null)

    const badgeCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

    const upsertNotification = async (payload: NotificationPayload) => {
        const now = new Date().toISOString()
        const newNotification: Notification = {
            id: `${Date.now()}`,
            title: payload.title || 'Nueva notificacion',
            message: payload.message || 'Tienes una nueva notificacion',
            date: now,
            read: false,
            type: payload.type || 'general',
            data: payload.data,
        }

        setNotifications((prev) => {
            const updated = [newNotification, ...prev].slice(0, 100)
            NotificationService.addNotification(newNotification).catch(() => {})
            return updated
        })

        setToast({ title: newNotification.title, message: newNotification.message, type: mapToastType(payload.type) })
    }

    const connectSocket = async () => {
        const token = await getToken()
        if (!token) return

        const url = `${env.api.catalogUrl}/ws/catalog`
        const socket = io(url, {
            transports: ['websocket'],
            auth: { token },
            extraHeaders: { Authorization: `Bearer ${token}` },
        })

        socket.on('notification', (payload: NotificationPayload) => {
            upsertNotification(payload)
        })

        socket.on('connect_error', () => {
            // reconexión automática de socket.io
        })

        socketRef.current = socket
    }

    const markAllRead = () => {
        setNotifications((prev) => {
            const updated = prev.map((n) => ({ ...n, read: true }))
            NotificationService.markAllRead().catch(() => {})
            return updated
        })
    }

    const markRead = (id: string) => {
        setNotifications((prev) => {
            const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            NotificationService.markAsRead(id).catch(() => {})
            return updated
        })
    }

    const clearAll = () => {
        setNotifications([])
        NotificationService.clearAll().catch(() => {})
    }

    useEffect(() => {
        NotificationService.getNotifications()
            .then((items) => setNotifications(items))
            .finally(() => setLoaded(true))
        connectSocket()
        return () => {
            socketRef.current?.disconnect()
        }
    }, [])

    const value = useMemo(
        () => ({
            notifications,
            badgeCount,
            loaded,
            markAllRead,
            markRead,
            clearAll,
        }),
        [notifications, badgeCount, loaded]
    )

    return (
        <NotificationContext.Provider value={value}>
            {children}
            {toast && (
                <NotificationToast
                    title={toast.title}
                    message={toast.message}
                    type={toast.type}
                    duration={3800}
                    onHide={() => setToast(null)}
                />
            )}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => {
    const ctx = useContext(NotificationContext)
    if (!ctx) {
        throw new Error('useNotifications must be used within NotificationProvider')
    }
    return ctx
}

export const useNotificationsOptional = () => useContext(NotificationContext)
