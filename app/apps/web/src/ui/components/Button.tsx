import * as React from 'react'
import { cn } from '../cn'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>

export const Button = React.memo(function Button(props: Props) {
  const { className, ...rest } = props
  return (
    <button
      {...rest}
      className={cn(
        // Base del botón. Se personaliza con `className` desde cada pantalla.
        'inline-flex items-center justify-center rounded-xl px-4 py-3 font-extrabold transition',
        // Defaults seguros (evitan texto invisible si falta alguna clase).
        'bg-brand-red text-white',
        'hover:brightness-[1.02] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
    />
  )
})

