import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { requestPasswordReset } from '../../services/auth/authApi'

const schema = z.object({
  email: z.string().email('Ingresa un correo válido'),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [kind, setKind] = React.useState<'none' | 'success' | 'error'>('none')
  const [message, setMessage] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      setKind('none')
      setMessage(null)
      await requestPasswordReset(email)
      setKind('success')
      setMessage('Si el correo existe, recibirás un enlace para restablecer la contraseña.')
    } catch (e) {
      setKind('error')
      setMessage(e instanceof Error ? e.message : 'No se pudo enviar el correo de recuperación')
    }
  })

  return (
    <div className="grid min-h-dvh place-items-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.12)]">
        <div className="bg-brand-red px-8 py-10 text-center">
          <img
            src="/assets/logo.png"
            alt="Cafrilosa"
            width={420}
            height={210}
            className="mx-auto w-72 max-w-[78vw] drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]"
          />
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-white">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-white/90">Te enviaremos instrucciones a tu correo.</p>
        </div>

        <div className="px-8 py-10">
          {message ? (
            <div
              className={
                kind === 'success'
                  ? 'mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
                  : 'mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800'
              }
            >
              {message}
            </div>
          ) : null}

          <form className="grid gap-5" onSubmit={onSubmit}>
            <TextField
              label="Correo electrónico"
              placeholder="tu@correo.com"
              autoComplete="email"
              inputMode="email"
              {...register('email')}
              error={errors.email?.message}
              tone="light"
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-linear-to-r from-brand-red to-brand-red700 text-white shadow-[0_14px_30px_rgba(240,65,45,0.25)]"
            >
              {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a className="text-sm font-semibold text-brand-red hover:underline" href="/login">
              Volver al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
