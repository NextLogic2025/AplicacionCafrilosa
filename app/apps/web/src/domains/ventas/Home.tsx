import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { clearToken } from '../../app/auth/tokenStorage'
import { Button } from '../../ui/components/Button'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-3 px-6 py-10">
      <h1 className="text-2xl font-extrabold text-neutral-950">Dashboard</h1>
      <p className="text-sm text-neutral-600">Placeholder: aquí irá tu app.</p>

      <div className="mt-2">
        <Button
          onClick={() => {
            // Cerrar sesión local y volver al login.
            clearToken()
            navigate('/login', { replace: true })
          }}
          className="bg-neutral-900 text-white shadow-none hover:bg-neutral-800"
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}

