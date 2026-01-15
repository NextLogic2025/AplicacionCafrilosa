import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  type?: 'info' | 'error' | 'success'
  variant?: 'default' | 'destructive' | 'warning' | 'info' | 'success'
  title?: string
  message?: string
  children?: React.ReactNode
  onClose?: () => void
}

export function Alert({ type = 'info', variant, title, message, children, onClose }: Props) {
  const chosen = variant ?? (type === 'error' ? 'destructive' : type === 'success' ? 'success' : 'info')
  const paletteMap: Record<string, string> = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    destructive: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    default: 'bg-neutral-50 text-neutral-900 border-neutral-200',
  }

  const body = message ?? (typeof children === 'string' ? children : undefined)

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${paletteMap[chosen]}`}>
      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        {title && <p className="font-semibold leading-tight">{title}</p>}
        {body && <p className="text-sm leading-snug">{body}</p>}
        {!body && children && <div className="text-sm leading-snug">{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Cerrar alerta"
          onClick={onClose}
          className="text-sm font-semibold hover:opacity-80"
        >
          ×
        </button>
      )}
    </div>
  )
}