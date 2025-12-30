import * as React from 'react'
import { Link } from 'react-router-dom'

import { getSelectedRole, setSelectedRole } from '../../services/storage/roleStorage'
import { APP_ROLES } from '../../types/roles'

export default function AppIndexPage() {
  const [selected, setSelected] = React.useState(getSelectedRole())

  return (
    <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">Inicio</h1>
      <p className="text-sm text-neutral-600">
        Selecciona una vista por rol. Esto es solo para desarrollo (cuando el backend entregue el rol, se
        puede redirigir automáticamente).
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {APP_ROLES.map((r) => (
          <Link
            key={r.key}
            to={r.path}
            onClick={() => {
              setSelectedRole(r.key)
              setSelected(r.key)
            }}
            className="group rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-brand-red/40 hover:bg-white"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-neutral-900">{r.label}</div>
                <div className="mt-1 text-xs text-neutral-600">Vista: {r.key}</div>
              </div>
              <div
                className={
                  selected === r.key
                    ? 'rounded-full bg-brand-red px-2 py-1 text-[11px] font-bold text-white'
                    : 'rounded-full bg-neutral-200 px-2 py-1 text-[11px] font-bold text-neutral-700 group-hover:bg-brand-red/15'
                }
              >
                {selected === r.key ? 'ACTIVA' : 'IR'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
