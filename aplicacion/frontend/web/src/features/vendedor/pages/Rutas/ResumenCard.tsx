import React from 'react'
import type { ReactNode } from 'react'

export default function ResumenCard({ icon, title, value }: { icon: ReactNode; title: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">{title}</p>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
      </div>
    </div>
  )
}
