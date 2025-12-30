import * as React from 'react'

import { cn } from '../../utils/cn'

type Props = {
  label: string
  error?: string
  left?: React.ReactNode
  right?: React.ReactNode
  tone?: 'dark' | 'light'
} & React.InputHTMLAttributes<HTMLInputElement>

export const TextField = React.forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, left, right, tone = 'dark', ...inputProps },
  ref
) {
  const isLight = tone === 'light'
  return (
    <label className="grid gap-2">
      <span className={cn('text-xs', isLight ? 'text-neutral-600' : 'text-white/70')}>{label}</span>
      <span
        className={cn(
          'flex items-center gap-2 rounded-xl border px-3 py-2.5 transition',
          isLight
            ? 'bg-neutral-50 border-neutral-200 focus-within:border-brand-red/60 focus-within:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]'
            : 'bg-white/5 border-white/10 focus-within:border-brand-gold/55 focus-within:shadow-[0_0_0_4px_rgba(244,212,106,0.35)]',
          error ? 'border-red-400/60' : null
        )}
      >
        {left ? (
          <span className={cn('shrink-0', isLight ? 'text-neutral-400' : 'text-white/55')}>{left}</span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            'w-full min-w-0 flex-1 border-0 bg-transparent outline-none',
            isLight
              ? 'text-neutral-900 placeholder:text-neutral-400'
              : 'text-white/90 placeholder:text-white/45'
          )}
          {...inputProps}
        />
        {right ? <span className="shrink-0">{right}</span> : null}
      </span>
      {error ? (
        <span className={cn('text-xs', isLight ? 'text-red-700' : 'text-red-300')}>{error}</span>
      ) : null}
    </label>
  )
})
