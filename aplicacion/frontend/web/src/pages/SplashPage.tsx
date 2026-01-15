import * as React from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

export function SplashPage() {
  const navigate = useNavigate()
  const auth = useAuth()

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate(auth.isAuthenticated ? '/app' : '/login', { replace: true })
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [auth.isAuthenticated, navigate])

  return (
    <div
      className="relative grid min-h-dvh place-items-center overflow-hidden bg-brand-red"
      aria-label="Cargando Cafrilosa"
    >
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-black/15 blur-2xl animate-caf-glow motion-reduce:animate-none" />
        <div className="absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-brand-gold/25 blur-3xl animate-caf-glow motion-reduce:animate-none" />
      </div>

      <div className="animate-caf-pop motion-reduce:animate-none">
        <img
          src="/assets/logo.png"
          alt="Cafrilosa"
          className="w-[280px] max-w-[78vw] drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)] animate-caf-float motion-reduce:animate-none"
        />
      </div>

      <div className="sr-only">Cargando…</div>
    </div>
  )
}
