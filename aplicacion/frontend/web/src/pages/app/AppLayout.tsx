import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { APP_ROLES } from '../../types/roles'

export function AppLayout() {
  const auth = useAuth()

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-950">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="Cafrilosa" className="h-9 w-auto" />
            <span className="hidden text-sm font-extrabold tracking-tight text-neutral-900 sm:inline">
              Panel
            </span>
          </div>

          <Button
            type="button"
            onClick={() => auth.signOut()}
            className="bg-neutral-900 text-white shadow-none hover:bg-neutral-800"
          >
            Cerrar sesión
          </Button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-neutral-200 bg-white p-3 md:sticky md:top-20 md:h-[calc(100dvh-6.5rem)] md:self-start">
          <nav className="grid gap-1">
            {APP_ROLES.map((r) => (
              <NavLink
                key={r.key}
                to={r.path}
                className={({ isActive }) =>
                  [
                    'rounded-xl px-3 py-2 text-sm font-semibold transition',
                    isActive ? 'bg-brand-red text-white' : 'text-neutral-700 hover:bg-neutral-50',
                  ].join(' ')
                }
                end
              >
                {r.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
