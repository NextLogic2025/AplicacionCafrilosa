import { delay } from '../../utils/delay'

export interface Notification {
    id: string
    title: string
    message: string
    date: string
    read: boolean
    type?: 'order_status' | 'general'
}

export const NotificationService = {
    async getNotifications(): Promise<Notification[]> {
        await delay(500)
        return []
    }
}
