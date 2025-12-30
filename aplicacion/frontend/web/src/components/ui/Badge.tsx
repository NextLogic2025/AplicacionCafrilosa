import React from 'react'

type BadgeProps = {
  label: string
  color?: 'red' | 'blue' | 'yellow' | 'emerald' | 'gray' | 'purple'
  size?: 'sm' | 'md'
}

const colorClasses: Record<string, string> = {
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  gray: 'bg-gray-100 text-gray-800',
  purple: 'bg-purple-100 text-purple-800',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
}

export function Badge({ label, color = 'blue', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-block rounded font-semibold ${colorClasses[color]} ${sizeClasses[size]}`}>
      {label}
    </span>
  )
}
