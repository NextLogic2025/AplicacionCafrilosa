import React from 'react'

type Chip = string | { label: string; variant?: string }

export function PageHero({ title, subtitle, chips = [] }: { title: string; subtitle?: string; chips?: Chip[] }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-linear-to-r from-brand-red to-brand-red700 p-6 text-white shadow-lg">
      <h1 className="text-3xl font-bold leading-tight">{title}</h1>
      {subtitle && <p className="mt-2 max-w-3xl text-sm text-white/90">{subtitle}</p>}
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          {chips.map((chip, idx) => {
            const chipLabel = typeof chip === 'string' ? chip : chip.label
            return (
              <span key={idx} className="rounded-full bg-white/15 px-3 py-1">{chipLabel}</span>
            )
          })}
        </div>
      )}
    </div>
  )
}
