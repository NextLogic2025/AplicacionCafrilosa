import { BRAND_COLORS, credentialsSchema, type Credentials } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { StatusBar } from 'expo-status-bar'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import logo from '../../../assets/logo'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { TextField } from '../../../components/ui/TextField'
import { signIn } from '../../../services/auth/authClient'
import { setToken } from '../../../storage/authStorage'

type Props = {
  onSignedIn: () => void
  onForgotPassword: () => void
}

export function LoginScreen({ onSignedIn, onForgotPassword }: Props) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [remember, setRemember] = React.useState(true)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      setServerError(null)
      const result = await signIn(email, password)
      await setToken(result.token, { persist: remember })
      onSignedIn()
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'No se pudo iniciar sesión')
    }
  })

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <StatusBar style="dark" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingVertical: 26 }}
        >
          <View className="mx-auto w-full max-w-md">
            <View className="overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-black/20">
              <View className="relative bg-brand-red px-6 pb-7 pt-7">
                <View className="pointer-events-none absolute inset-0 opacity-70">
                  <View className="absolute -right-15 -top-5 h-40 w-40 rounded-full bg-white/10" />
                  <View className="absolute -left-22.5 -bottom-22.5 h-56 w-56 rounded-full bg-black/10" />
                  <View className="absolute -left-15 top-10 h-44 w-44 rounded-full bg-white/10" />
                </View>

                <View className="items-center">
                  <Image source={logo} style={{ width: 260, height: 120 }} resizeMode="contain" />
                  <Text className="mt-4 text-2xl font-extrabold text-white">Bienvenido</Text>
                  <Text className="mt-1 text-sm text-white/90">Inicia sesión para continuar</Text>
                </View>
              </View>

              <View className="px-6 pb-7 pt-6">
                {serverError ? (
                  <Text className="mb-4 rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-red-800">
                    {serverError}
                  </Text>
                ) : null}

                <View className="gap-4">
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
                        left={<Ionicons name="mail-outline" size={18} color="rgba(17,24,39,0.55)" />}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextField
                        label="Contraseña"
                        placeholder="••••••••"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showPassword}
                        textContentType="password"
                        error={errors.password?.message}
                        left={<Ionicons name="lock-closed-outline" size={18} color="rgba(17,24,39,0.55)" />}
                        right={
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            onPress={() => setShowPassword((s) => !s)}
                          >
                            <Ionicons
                              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                              size={18}
                              color="rgba(17,24,39,0.55)"
                            />
                          </Pressable>
                        }
                      />
                    )}
                  />

                  <View className="flex-row items-center justify-between">
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: remember }}
                      onPress={() => setRemember((v) => !v)}
                      className="flex-row items-center gap-2"
                    >
                      <Ionicons
                        name={remember ? 'checkbox-outline' : 'square-outline'}
                        size={18}
                        color={remember ? BRAND_COLORS.red : 'rgba(17,24,39,0.55)'}
                      />
                      <Text className="text-sm text-neutral-700">Recordarme</Text>
                    </Pressable>

                    <Pressable accessibilityRole="button" onPress={onForgotPassword}>
                      <Text className="text-sm font-semibold text-brand-red">¿Olvidaste tu contraseña?</Text>
                    </Pressable>
                  </View>

                  <PrimaryButton
                    title={isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
                    loading={isSubmitting}
                    onPress={onSubmit}
                    style={{ width: '100%' }}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
