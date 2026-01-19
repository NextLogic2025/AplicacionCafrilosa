import { loadNotifications, saveNotifications, clearNotifications } from '../../storage/notificationStorage'

export interface Notification {
    id: string
    title: string
    message: string
    date: string
    read: boolean
    type?: 'order_status' | 'general' | string
    data?: any
}

const persist = async (items: Notification[]) => {
    await saveNotifications(items)
    return items
}

export const NotificationService = {
    async getNotifications(): Promise<Notification[]> {
        return await loadNotifications()
    },

    async addNotification(notification: Notification): Promise<Notification[]> {
        const existing = await loadNotifications()
        const updated = [notification, ...existing]
        return persist(updated)
    },

    async markAsRead(id: string): Promise<Notification[]> {
        const existing = await loadNotifications()
        const updated = existing.map((n) => (n.id === id ? { ...n, read: true } : n))
        return persist(updated)
    },

    async markAllRead(): Promise<Notification[]> {
        const existing = await loadNotifications()
        const updated = existing.map((n) => ({ ...n, read: true }))
        return persist(updated)
    },

    async clearAll(): Promise<void> {
        await clearNotifications()
    },
}
