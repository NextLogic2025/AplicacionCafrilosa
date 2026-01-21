import React from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = '¿Estás seguro?',
  description,
  onCancel,
  onConfirm,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
}) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xs animate-in fade-in-80">
        {title && <h3 className="text-lg font-bold mb-2 text-neutral-900">{title}</h3>}
        {description && <p className="text-sm text-neutral-700 mb-4">{description}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" onClick={onCancel} className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300">
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm} className="bg-brand-red text-white hover:bg-brand-red/90">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
