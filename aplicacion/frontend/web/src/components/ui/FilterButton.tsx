import React from 'react'

type FilterButtonProps = {
  label: string
  isActive: boolean
  onClick: () => void
  count?: number
}

export function FilterButton({ label, isActive, onClick, count }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        isActive
          ? 'bg-brand-red text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {label}
      {count !== undefined && ` (${count})`}
    </button>
  )
}

type FilterGroupProps = {
  filters: {
    value: string
    label: string
    count?: number
  }[]
  activeFilter: string
  onChange: (value: string) => void
}

export function FilterGroup({ filters, activeFilter, onChange }: FilterGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(filter => (
        <FilterButton
          key={filter.value}
          label={filter.label}
          isActive={activeFilter === filter.value}
          onClick={() => onChange(filter.value)}
          count={filter.count}
        />
      ))}
    </div>
  )
}
