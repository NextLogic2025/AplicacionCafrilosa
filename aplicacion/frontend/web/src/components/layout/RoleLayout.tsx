import React from 'react'
import { LogOut } from 'lucide-react'
import { SidebarNav, SidebarItem } from 'components/ui/SidebarNav'

type RoleLayoutProps = {
  roleLabel: string
  avatarText: string
  systemLabel?: string
  navItems: SidebarItem[]
  onSignOut: () => void
  topRightSlot?: React.ReactNode
  children: React.ReactNode
}

export function RoleLayout({ roleLabel, avatarText, systemLabel = 'Sistema', navItems, onSignOut, topRightSlot, children }: RoleLayoutProps) {
  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <div className="grid min-h-dvh w-full grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:self-start">
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-neutral-50 px-3 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-red text-sm font-semibold text-white">{avatarText}</div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Rol</p>
              <p className="text-sm font-semibold text-neutral-900">{roleLabel}</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <SidebarNav items={navItems} />
          </div>

          <div className="mt-4 space-y-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{systemLabel}</p>
              <p className="text-sm text-neutral-700">Distribución Comercial (Embutidos)</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-brand-red transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="space-y-5 px-6 py-6">
          {topRightSlot && (
            <div className="flex items-center justify-end">{topRightSlot}</div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
