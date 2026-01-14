import { BRAND_COLORS, credentialsSchema, type Credentials } from '../../../shared/types'
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
  onSignedIn: (role?: string) => void
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

  // Limpiar errores al cambiar inputs
  React.useEffect(() => {
    if (serverError) setServerError(null)
  }, [control._formState.isDirty])

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      setServerError(null)
      const result = await signIn(email, password)
      // Tokens are already stored by signIn
      onSignedIn(result.user?.role)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Credenciales incorrectas')
    }
  })

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Background Decorativo Superior */}
      <View className="absolute top-0 left-0 right-0 h-1/3 bg-brand-red opacity-5" />
      <View className="absolute -top-20 -right-20 w-64 h-64 bg-brand-red rounded-full opacity-[0.03]" />
      <View className="absolute top-10 -left-10 w-40 h-40 bg-brand-gold rounded-full opacity-[0.03]" />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
            className="flex-1"
          >
            <View className="flex-1 justify-center px-8 pb-10 pt-4">

              {/* Logo y Encabezado */}
              <View className="items-center mb-10">
                <View className="h-32 w-full items-center justify-center mb-6">
                  <Image
                    source={logo}
                    style={{ width: '80%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-3xl font-bold text-neutral-900 text-center">
                  Bienvenido
                </Text>
                <Text className="text-neutral-500 mt-2 text-center text-base">
                  Ingresa a tu cuenta para continuar
                </Text>
              </View>

              {/* Formulario */}
              <View className="w-full gap-5">
                {serverError && (
                  <View className="flex-row items-center bg-red-50 border border-red-100 p-4 rounded-xl gap-3">
                    <Ionicons name="alert-circle" size={20} color={BRAND_COLORS.red700} />
                    <Text className="flex-1 text-red-700 text-sm font-medium">
                      {serverError}
                    </Text>
                  </View>
                )}

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
                      textContentType="emailAddress"
                      error={errors.email?.message}
                      left={<Ionicons name="mail-outline" size={20} color={BRAND_COLORS.red} style={{ opacity: 0.6 }} />}
                    />
                  )}
                />

                <View>
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
                        left={<Ionicons name="lock-closed-outline" size={20} color={BRAND_COLORS.red} style={{ opacity: 0.6 }} />}
                        right={
                          <Pressable
                            onPress={() => setShowPassword(!showPassword)}
                            hitSlop={10}
                            className="p-1"
                          >
                            <Ionicons
                              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                              size={20}
                              color="#6B7280"
                            />
                          </Pressable>
                        }
                      />
                    )}
                  />
                  <View className="items-end mt-2">
                    <Pressable onPress={onForgotPassword} hitSlop={10}>
                      <Text className="text-brand-red font-semibold text-sm py-1">
                        ¿Olvidaste tu contraseña?
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Recordarme - Opcional, si se desea mantener */}
                <Pressable
                  onPress={() => setRemember(!remember)}
                  className="flex-row items-center gap-2 self-start"
                >
                  <Ionicons
                    name={remember ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={remember ? BRAND_COLORS.red : '#9CA3AF'}
                  />
                  <Text className="text-neutral-600">Mantener sesión iniciada</Text>
                </Pressable>

                <View className="mt-4">
                  <PrimaryButton
                    title={isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
                    loading={isSubmitting}
                    onPress={onSubmit}
                    style={{
                      shadowColor: BRAND_COLORS.red,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      elevation: 8,
                    }}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}
