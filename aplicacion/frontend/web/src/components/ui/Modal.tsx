import React from 'react'

type ModalProps = {
  isOpen: boolean
  title: string
  onClose: () => void
  headerGradient?: 'red' | 'blue' | 'green'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  children: React.ReactNode
}

const gradients: Record<string, string> = {
  red: 'bg-gradient-to-r from-brand-red to-brand-red700',
  blue: 'bg-gradient-to-r from-blue-600 to-blue-700',
  green: 'bg-gradient-to-r from-green-600 to-green-700',
}

const widths: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export function Modal({
  isOpen,
  title,
  onClose,
  headerGradient = 'blue',
  maxWidth = 'md',
  children,
}: ModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className={`max-h-[90vh] w-full ${widths[maxWidth]} overflow-y-auto rounded-lg bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sticky top-0 flex items-center justify-between ${gradients[headerGradient]} p-6 text-white`}>
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-2xl text-white hover:opacity-80"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="space-y-4 p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
