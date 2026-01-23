import { useState, useCallback } from 'react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: number
}

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const show = useCallback((message: string, type: NotificationType = 'info', duration: number = 3000) => {
    const id = Date.now().toString()
    const notification: Notification = {
      id,
      type,
      message,
      timestamp: Date.now(),
    }

    setNotifications((prev) => [...prev, notification])

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, duration)
    }

    return id
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return show(message, 'success', duration)
  }, [show])

  const error = useCallback((message: string, duration?: number) => {
    return show(message, 'error', duration)
  }, [show])

  const info = useCallback((message: string, duration?: number) => {
    return show(message, 'info', duration)
  }, [show])

  const warning = useCallback((message: string, duration?: number) => {
    return show(message, 'warning', duration)
  }, [show])

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return {
    notifications,
    show,
    success,
    error,
    info,
    warning,
    remove,
  }
}
