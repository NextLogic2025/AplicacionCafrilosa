import { BRAND_COLORS, emailSchema } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { StatusBar } from 'expo-status-bar'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'

import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { TextField } from '../../../components/ui/TextField'
import { requestPasswordReset } from '../../../services/auth/authClient'

type Props = {
  onBack: () => void
  onDone?: () => void
}

// Schema solo para este form
const schema = z.object({
  email: emailSchema,
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordScreen({ onBack }: Props) {
  const [success, setSuccess] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const emailValue = watch('email')

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      setServerError(null)
      await requestPasswordReset(email)
      setSuccess(true)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Error al solicitar recuperación')
    }
  })

  // Si se completa exitosamente, mostrar vista de éxito
  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-8">
        <View className="bg-green-50 w-24 h-24 rounded-full items-center justify-center mb-6 border border-green-100">
          <Ionicons name="mail-open" size={40} color="#166534" />
        </View>
        <Text className="text-2xl font-bold text-center text-neutral-900 mb-3">
          ¡Correo enviado!
        </Text>
        <Text className="text-center text-neutral-500 mb-8 leading-6">
          Hemos enviado las instrucciones para restablecer tu contraseña a <Text className="font-bold text-neutral-800">{emailValue}</Text>
        </Text>
        <PrimaryButton
          title="Volver al inicio"
          onPress={onBack}
          style={{ width: '100%' }}
        />
      </SafeAreaView>
    )
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <View className="px-4 py-2">
          <Pressable
            onPress={onBack}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-neutral-100"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 pt-10">
              <View className="rounded-2xl bg-brand-red/5 w-16 h-16 items-center justify-center mb-6 self-start">
                <Ionicons name="key-outline" size={32} color={BRAND_COLORS.red} />
              </View>

              <Text className="text-3xl font-bold text-neutral-900 mb-3">
                Recuperar contraseña
              </Text>

              <Text className="text-neutral-500 text-base mb-10 leading-6">
                Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
              </Text>

              {serverError && (
                <View className="mb-6 flex-row items-center bg-red-50 border border-red-100 p-4 rounded-xl gap-3">
                  <Ionicons name="alert-circle" size={20} color={BRAND_COLORS.red700} />
                  <Text className="flex-1 text-red-700 text-sm font-medium">
                    {serverError}
                  </Text>
                </View>
              )}

              <View className="gap-6">
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      label="Correo electrónico"
                      placeholder="ejemplo@cafrilosa.com"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      error={errors.email?.message}
                      left={<Ionicons name="mail-outline" size={20} color={BRAND_COLORS.red} style={{ opacity: 0.6 }} />}
                    />
                  )}
                />

                <PrimaryButton
                  title={isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
                  loading={isSubmitting}
                  onPress={onSubmit}
                  style={{
                    marginTop: 10,
                    shadowColor: BRAND_COLORS.red,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4
                  }}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}
