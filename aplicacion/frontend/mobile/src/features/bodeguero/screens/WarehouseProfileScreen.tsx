import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { ProfileService, type UserProfile } from '../../../services/api/ProfileService'

export function WarehouseProfileScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<UserProfile | null>(null)

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        setLoading(true)
        try {
            const data = await ProfileService.getProfile()
            setProfile(data)
        } catch (error) {
            console.error('Error loading profile', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Salir',
                style: 'destructive',
                onPress: () => {
                    // Logic to clear token and navigate to login
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' as never }],
                    });
                }
            }
        ])
    }

    if (loading) {
        return (
            <View className="flex-1 bg-neutral-50 items-center justify-center">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
            </View>
        )
    }

    if (!profile) {
        return (
            <View className="flex-1 bg-neutral-50 relative">
                <Header title="Perfil de Bodega" variant="standard" />
                <View className="flex-1 items-center justify-center p-8">
                    <View className="h-24 w-24 bg-neutral-100 rounded-full items-center justify-center mb-6 border border-neutral-200">
                        <Ionicons name="person" size={48} color={BRAND_COLORS.red} />
                    </View>
                    <Text className="text-neutral-900 font-bold text-xl mb-2 text-center">Sesión no iniciada</Text>
                    <Text className="text-neutral-500 text-center mb-8">
                        No se ha cargado la información del bodeguero.
                    </Text>
                    <Pressable
                        className="bg-brand-red py-3 px-8 rounded-xl shadow-lg shadow-red-500/30"
                        onPress={() => Alert.alert('Login', 'Navegar a Login')}
                    >
                        <Text className="text-white font-bold">Iniciar Sesión</Text>
                    </Pressable>
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Perfil de Bodega" variant="standard" />

            <ScrollView className="flex-1 px-5 pt-6 pb-20">

                {/* 1. Header Card */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100 flex-row items-center">
                    <View className="h-16 w-16 bg-neutral-100 rounded-full items-center justify-center mr-4 border border-neutral-200">
                        <Ionicons name="person" size={32} color={BRAND_COLORS.red} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-neutral-900 font-bold text-xl">{profile.name}</Text>
                        <View className="bg-blue-50 self-start px-2 py-0.5 rounded-md mt-1">
                            <Text className="text-blue-700 text-[10px] font-bold uppercase">
                                {profile.role ? profile.role : 'BODEGUERO'}
                            </Text>
                        </View>
                        <Text className="text-neutral-500 text-xs mt-1">Turno: {profile.shift || 'General'}</Text>
                    </View>
                </View>

                {/* 2. Información */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100">
                    <View className="mb-4">
                        <Text className="text-neutral-900 font-bold text-lg">Información Laboral</Text>
                    </View>

                    <View className="gap-3">
                        <InfoRow label="ID Empleado" value={profile.employeeId || '--'} />
                        <InfoRow label="Zona Asignada" value={profile.zone?.name || '--'} />
                        <InfoRow label="Email" value={profile.email} />
                        <InfoRow label="Teléfono" value={profile.phone} />
                    </View>
                </View>

                {/* 3. Acciones */}
                <View className="gap-3 mb-10">
                    <Pressable className="bg-neutral-100 p-4 rounded-xl items-center border border-neutral-200" onPress={handleLogout}>
                        <Text className="text-neutral-600 font-bold">Cerrar Sesión</Text>
                    </Pressable>
                </View>

            </ScrollView>
        </View>
    )
}

function InfoRow({ label, value }: { label: string, value: string }) {
    return (
        <View className="flex-row items-center py-2 border-b border-neutral-50 last:border-0">
            <View>
                <Text className="text-neutral-400 text-xs uppercase font-bold mb-0.5">{label}</Text>
                <Text className="text-neutral-800 font-medium text-base">{value}</Text>
            </View>
        </View>
    )
}
