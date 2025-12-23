import { credentialsSchema } from '@cafrilosa/shared-types'
import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useAuth } from '../../hooks/useAuth'
import { signInWithPassword } from '../../services/auth/authApi'

function IconMail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function IconLock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
      <path d="M6 11h12v10H6z" />
    </svg>
  )
}

function IconEye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  )
}

const schema = credentialsSchema.extend({
  remember: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: true },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      setServerError(null)
      const { token } = await signInWithPassword(values.email, values.password)
      auth.signIn(token, { persist: Boolean(values.remember) })
      navigate('/app', { replace: true })
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'No se pudo iniciar sesión')
    }
  })

  return (
    <div className="grid min-h-dvh place-items-center bg-neutral-50 px-4 py-10">
      <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.12)] md:grid-cols-2">
        <section className="relative overflow-hidden bg-brand-red px-8 py-12 md:px-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-28 -top-28 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -right-22.5 top-10 h-52 w-52 rounded-full bg-white/10" />
            <div className="absolute -bottom-30 -left-30 h-72 w-72 rounded-full bg-black/10" />
            <div className="absolute -bottom-35 -right-35 h-80 w-80 rounded-full bg-brand-gold/20" />
          </div>

          <div className="relative flex h-full flex-col items-center justify-start gap-10 text-center">
            <img
              src="/assets/logo.png"
              alt="Cafrilosa"
              width={520}
              height={260}
              className="w-80 max-w-[78vw] drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]"
            />

            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold tracking-tight text-white">Bienvenido</h2>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/90">
                Calidad que se disfruta, sabor que se comparte.
              </p>
            </div>
          </div>
        </section>

        <section className="px-8 py-12 md:px-12">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950">Iniciar sesión</h1>
            <p className="mt-2 text-sm text-neutral-600">Accede a tu cuenta de Cafrilosa</p>

            {serverError ? (
              <div className="mt-5 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                {serverError}
              </div>
            ) : null}

            <form className="mt-7 grid gap-5" onSubmit={onSubmit}>
              <TextField
                label="Correo electrónico"
                placeholder="tu@correo.com"
                autoComplete="email"
                inputMode="email"
                {...register('email')}
                error={errors.email?.message}
                tone="light"
                left={<IconMail />}
              />

              <TextField
                label="Contraseña"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                error={errors.password?.message}
                tone="light"
                left={<IconLock />}
                right={
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    <IconEye />
                  </button>
                }
              />

              <div className="flex items-center justify-between gap-4">
                <label className="inline-flex select-none items-center gap-2 text-sm text-neutral-700">
                  <input type="checkbox" className="h-4 w-4 accent-brand-red" {...register('remember')} />
                  Recordarme
                </label>
                <a className="text-sm font-semibold text-brand-red hover:underline" href="/forgot-password">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-linear-to-r from-brand-red to-brand-red700 text-white shadow-[0_14px_30px_rgba(240,65,45,0.25)]"
              >
                {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
