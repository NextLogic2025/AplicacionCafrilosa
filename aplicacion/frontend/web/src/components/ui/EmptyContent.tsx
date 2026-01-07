import React from 'react'

type EmptyContentProps = {
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode
  title: string
  description?: string
  subtitle?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyContent({ icon, title, description, subtitle, action }: EmptyContentProps) {
  const displaySubtitle = description || subtitle

  return (
    <div className="py-12 text-center">
      {icon && (
        React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement, { className: 'mb-4 inline-block h-12 w-12 text-gray-300' })
          : React.createElement(icon as React.ComponentType<{ className?: string }>, { className: 'mb-4 inline-block h-12 w-12 text-gray-300' })
      )}
      <p className="text-lg text-gray-600">{title}</p>
      {displaySubtitle && <p className="mt-1 text-sm text-gray-500">{displaySubtitle}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 font-medium text-brand-red transition hover:opacity-80"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
