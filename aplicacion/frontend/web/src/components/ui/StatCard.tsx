import React from 'react'

type StatCardProps = {
  label: string
  value: number | string
  color?: 'blue' | 'yellow' | 'emerald' | 'red' | 'purple' | 'gray'
  icon?: React.ComponentType<{ className?: string }>
  borderColor?: string
  bgColor?: string
}

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700' },
  yellow: { border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  red: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700' },
  purple: { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700' },
  gray: { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-700' },
}

export function StatCard({
  label,
  value,
  color = 'blue',
  icon: Icon,
  borderColor,
  bgColor,
}: StatCardProps) {
  const palette = colorMap[color]

  return (
    <div className={`rounded-lg border ${borderColor || palette.border} ${bgColor || palette.bg} p-3`}>
      {Icon && <Icon className={`mb-2 h-5 w-5 ${palette.text}`} />}
      <p className={`text-xs font-medium ${palette.text}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold ${palette.text.replace('700', '900')}`}>{value}</p>
    </div>
  )
}
