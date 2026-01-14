import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  type?: 'info' | 'error' | 'success'
  title?: string
  message?: string
  onClose?: () => void
}

export function Alert({ type = 'info', title, message, onClose }: Props) {
  const palette = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  } as const

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${palette[type]}`}>
      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        {title && <p className="font-semibold leading-tight">{title}</p>}
        {message && <p className="text-sm leading-snug">{message}</p>}
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