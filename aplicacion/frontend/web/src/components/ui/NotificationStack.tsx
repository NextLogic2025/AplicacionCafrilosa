import React from 'react'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'
import type { Notification } from '../../hooks/useNotification'

interface NotificationStackProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

export function NotificationStack({ notifications, onRemove }: NotificationStackProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`pointer-events-auto rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right-5 fade-in-80 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : notification.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-900'
                : notification.type === 'warning'
                  ? 'bg-amber-50 border border-amber-200 text-amber-900'
                  : 'bg-blue-50 border border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex-shrink-0">
            {notification.type === 'success' && (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            )}
            {notification.type === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            {notification.type === 'warning' && (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            {notification.type === 'info' && (
              <Info className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => onRemove(notification.id)}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
