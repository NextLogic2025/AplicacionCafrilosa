import * as React from 'react'
import { LucideIcon, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  icon?: LucideIcon
  loading?: boolean
}

export const Button = React.memo(function Button({
  className,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  children,
  ...props
}: Props) {
  const variants = {
    primary: 'bg-brand-red text-white hover:bg-brand-red/90 shadow-sm border border-transparent',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-transparent',
    outline: 'bg-transparent border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900',
    ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-transparent',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10 p-0',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-red/20 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className={cn('h-4 w-4', children ? 'mr-2' : '')} />}
      {children}
    </button>
  )
})
