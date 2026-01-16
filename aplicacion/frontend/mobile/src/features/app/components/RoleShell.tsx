import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { RootStackParamList } from '../../../navigation/types'
import { clearTokens } from '../../../storage/authStorage'

type Props = {
  title: string
  children?: ReactNode
}

export function RoleShell({ title, children }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 px-6 py-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-extrabold text-neutral-950">{title}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await clearTokens()
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
          }}
          className="rounded-2xl bg-neutral-900 px-4 py-2 active:opacity-90"
        >
          <Text className="font-extrabold text-white">Salir</Text>
        </Pressable>
      </View>

      <View className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <Text className="text-sm text-neutral-600">Vista base lista para conectar con backend.</Text>
        {children ? <View className="mt-4">{children}</View> : null}
      </View>
    </SafeAreaView>
  )
}
