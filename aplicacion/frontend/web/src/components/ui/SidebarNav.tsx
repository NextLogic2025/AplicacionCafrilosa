import React from 'react'
import { NavLink } from 'react-router-dom'

export type SidebarItem = {
  id: string
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

export function SidebarNav({ items }: { items: SidebarItem[] }) {
  return (
    <nav className="grid gap-1">
      {items.map(({ id, label, to, icon: Icon, end }) => (
        <NavLink
          key={id}
          to={to}
          end={!!end}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition',
              isActive ? 'bg-brand-red text-white shadow-sm' : 'text-neutral-700 hover:bg-neutral-50',
            ].join(' ')
          }
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
