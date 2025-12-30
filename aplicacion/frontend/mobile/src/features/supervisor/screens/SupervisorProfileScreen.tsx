import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../components/ui/Header'
import { SupervisorService, type SupervisorProfile } from '../../../services/api/SupervisorService'
import { signOut } from '../../../services/auth/authClient'

export function SupervisorProfileScreen() {
    const navigation = useNavigation()
    const [profile, setProfile] = useState<SupervisorProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const loadProfile = async () => {
        try {
            setIsLoading(true)
            const data = await SupervisorService.getProfile()
            setProfile(data)
        } catch (error) {
            console.error('Error loading profile', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadProfile() }, []))

    if (!profile) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Perfil" variant="standard" showNotification={false} />
                <View className="flex-1 items-center justify-center">
                    <Text>Cargando perfil...</Text>
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Mi Perfil" variant="standard" showNotification={false} />

            <View className="p-6 items-center">
                <View className="w-24 h-24 bg-brand-red rounded-full items-center justify-center mb-4 shadow-sm border-4 border-white">
                    <Text className="text-white text-3xl font-bold">{profile.name.charAt(0)}</Text>
                </View>
                <Text className="text-xl font-bold text-neutral-900 mb-1">{profile.name}</Text>
                <Text className="text-neutral-500 mb-6">{profile.role}</Text>

                <View className="w-full bg-white rounded-xl border border-neutral-200 p-4 mb-6 shadow-sm">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="mail-outline" size={20} color="gray" />
                        <Text className="text-neutral-700 ml-3">{profile.email}</Text>
                    </View>
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="call-outline" size={20} color="gray" />
                        <Text className="text-neutral-700 ml-3">{profile.phone}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={async () => {
                        await signOut()
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' as never }],
                        })
                    }}
                    className="w-full py-4 bg-white border border-red-100 rounded-xl items-center shadow-sm active:bg-red-50"
                >
                    <Text className="text-brand-red font-bold">Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
