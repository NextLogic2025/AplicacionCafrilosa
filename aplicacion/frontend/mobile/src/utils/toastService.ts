import type { ToastType } from '../components/ui/ToastNotification'

type ToastHandler = (message: string, type?: ToastType, duration?: number) => void

let handler: ToastHandler | null = null
let lastToastKey: string | null = null
let lastToastAt = 0
const TOAST_DEDUP_MS = 2000

export function registerToastHandler(fn: ToastHandler) {
  handler = fn
}

export function unregisterToastHandler() {
  handler = null
}

export function showGlobalToast(message: string, type: ToastType = 'info', duration = 2000) {
  if (!handler) return

  const key = `${type}:${message}`
  const now = Date.now()
  if (lastToastKey === key && now - lastToastAt < TOAST_DEDUP_MS) return

  lastToastKey = key
  lastToastAt = now
  handler(message, type, duration)
}
