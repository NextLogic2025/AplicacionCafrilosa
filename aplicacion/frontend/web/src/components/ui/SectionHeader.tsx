import React from 'react'

type Props = {
  title: string
  subtitle?: string
  rightSlot?: React.ReactNode
}

export function SectionHeader({ title, subtitle, rightSlot }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-gray-600">{subtitle}</p> : null}
      </div>
      {rightSlot ? <div className="flex flex-shrink-0 items-center gap-2">{rightSlot}</div> : null}
    </div>
  )
}