import React from 'react'

export type ActionButtonProps = {
  label?: string
  children?: React.ReactNode
  onClick?: () => void
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  fullWidth?: boolean
}

const variantStyles = {
  primary: 'bg-brand-red text-white hover:bg-brand-red700',
  secondary: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function ActionButton({
  label,
  children,
  onClick,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
}: ActionButtonProps) {
  const content = children || label
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
      `}
    >
      {icon}
      <span>{content}</span>
    </button>
  )
}
