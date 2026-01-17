import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Notification } from '../services/api/NotificationService'

const STORAGE_KEY = 'cafrilosa.notifications.v1'
const MAX_NOTIFICATIONS = 100

export async function loadNotifications(): Promise<Notification[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
        return []
    } catch {
        return []
    }
}

export async function saveNotifications(notifications: Notification[]): Promise<void> {
    try {
        const trimmed = notifications.slice(0, MAX_NOTIFICATIONS)
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch {
        // ignore persist errors
    }
}

export async function clearNotifications(): Promise<void> {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY)
    } catch {
        // ignore
    }
}
