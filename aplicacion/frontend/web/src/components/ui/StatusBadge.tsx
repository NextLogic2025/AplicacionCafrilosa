import React from 'react'

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-neutral-100 text-neutral-800',
}

export type StatusBadgeProps = {
  label?: string
  children?: React.ReactNode
  variant?: StatusVariant
  className?: string
}

export function StatusBadge({ label, children, variant = 'neutral', className = '' }: StatusBadgeProps) {
  const content = children || label
  
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variantStyles[variant]} ${className}`}>
      {content}
    </span>
  )
}
