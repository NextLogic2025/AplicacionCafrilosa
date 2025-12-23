import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { RootStackParamList } from '../../../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelector'>

const ROLES: Array<{ key: string; label: string; screen: keyof RootStackParamList }> = [
  { key: 'cliente', label: 'Cliente', screen: 'Cliente' },
  { key: 'supervisor', label: 'Supervisor', screen: 'Supervisor' },
  { key: 'vendedor', label: 'Vendedor', screen: 'Vendedor' },
  { key: 'transportista', label: 'Transportista', screen: 'Transportista' },
  { key: 'bodeguero', label: 'Bodeguero', screen: 'Bodeguero' },
]

export function RoleSelectorScreen({ navigation }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50 px-6 py-6">
      <Text className="text-2xl font-extrabold text-neutral-950">Selecciona tu vista</Text>
      <Text className="mt-1 text-sm text-neutral-600">
        Por ahora se elige manualmente. Después puedes leer el rol desde el backend/JWT.
      </Text>

      <View className="mt-6 gap-3">
        {ROLES.map((r) => (
          <Pressable
            key={r.key}
            onPress={() => navigation.navigate(r.screen)}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 active:opacity-90"
          >
            <Text className="text-base font-extrabold text-neutral-900">{r.label}</Text>
            <Text className="mt-1 text-xs text-neutral-600">Vista: {r.key}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  )
}
