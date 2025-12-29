import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { PrimaryButton } from '../../../components/ui/PrimaryButton'

type Props = {
    navigation: any
}

// Configuración de roles para fácil mantenimiento / eliminación
const ROLES = [
    { id: 'Cliente', label: 'Cliente', icon: 'person-outline', color: '#EF4444' },
    { id: 'Supervisor', label: 'Supervisor', icon: 'briefcase-outline', color: '#F59E0B' },
    { id: 'Vendedor', label: 'Vendedor', icon: 'cart-outline', color: '#10B981' },
    { id: 'Transportista', label: 'Transportista', icon: 'bus-outline', color: '#3B82F6' },
    { id: 'Bodeguero', label: 'Bodeguero', icon: 'cube-outline', color: '#6366F1' },
]

export function RoleSelectorScreen({ navigation }: Props) {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
                <View className="mb-8 items-center">
                    <View className="h-16 w-16 bg-neutral-100 rounded-full items-center justify-center mb-4">
                        <Ionicons name="construct-outline" size={32} color="#4B5563" />
                    </View>
                    <Text className="text-2xl font-bold text-neutral-900 text-center">
                        Selector de Roles
                    </Text>
                    <Text className="text-neutral-500 text-center mt-2">
                        Modo desarrollador habilitado. Selecciona un rol para visualizar su interfaz.
                    </Text>
                </View>

                <View className="gap-4">
                    {ROLES.map((role) => (
                        <PrimaryButton
                            key={role.id}
                            title={role.label}
                            onPress={() => navigation.navigate(role.id)}
                            style={{ backgroundColor: role.color }} // Note: PrimaryButton overrides generic styles, might need refactor if we want custom colors, but standard red is fine for now or we just use default behavior
                        />
                    ))}
                </View>

                <Text className="text-neutral-400 text-xs text-center mt-12">
                    Esta pantalla es solo para desarrollo.
                </Text>
            </ScrollView>
        </SafeAreaView>
    )
}
