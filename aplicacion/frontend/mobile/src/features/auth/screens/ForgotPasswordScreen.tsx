import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'

import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { TextField } from '../../../components/ui/TextField'
import { requestPasswordReset } from '../../../services/auth/authClient'

const schema = z.object({
  email: z.string().email('Ingresa un correo válido'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  onDone: () => void
}

export function ForgotPasswordScreen({ onDone }: Props) {
  const [message, setMessage] = React.useState<string | null>(null)
  const [kind, setKind] = React.useState<'none' | 'success' | 'error'>('none')

  const {
    control,
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
    <SafeAreaView className="flex-1 bg-neutral-50">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingVertical: 26 }}>
          <View className="mx-auto w-full max-w-md">
            <View className="rounded-[28px] bg-white p-6 shadow-2xl shadow-black/20">
              <Text className="text-2xl font-extrabold text-neutral-950">Recuperar contraseña</Text>
              <Text className="mt-1 text-sm text-neutral-600">Te enviaremos instrucciones a tu correo.</Text>

              {message ? (
                <Text
                  className={[
                    'mt-4 rounded-2xl border px-3 py-2 text-sm',
                    kind === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-red-200 bg-red-50 text-red-800',
                  ].join(' ')}
                >
                  {message}
                </Text>
              ) : null}

              <View className="mt-5 gap-4">
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      label="Correo electrónico"
                      placeholder="tu@correo.com"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      error={errors.email?.message}
                    />
                  )}
                />

                <PrimaryButton
                  title={isSubmitting ? 'Enviando…' : 'Enviar enlace'}
                  loading={isSubmitting}
                  onPress={onSubmit}
                  style={{ width: '100%' }}
                />
              </View>

              <Pressable accessibilityRole="button" onPress={onDone} className="mt-5 items-center">
                <Text className="text-sm font-semibold text-brand-red">Volver</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
