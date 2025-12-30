import React from 'react'

type InfoCardProps = {
  label: string
  value: string | number
  tone?: 'default' | 'highlight'
}

export function InfoCard({ label, value, tone = 'default' }: InfoCardProps) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm ${tone === 'highlight' ? 'ring-2 ring-brand-red/20' : ''}`}>
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  )
}
