import { useFocusEffect } from '@react-navigation/native'
import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, Image } from 'react-native'

import { Header } from '../../../components/ui/Header'
import { TransportistaService, type TransportistaProfile } from '../../../services/api/TransportistaService'
import { Ionicons } from '@expo/vector-icons'

export function TransportistaProfileScreen() {
    const [profile, setProfile] = useState<TransportistaProfile | null>(null)
    const [loading, setLoading] = useState(true)

    const loadProfile = async () => {
        try {
            const data = await TransportistaService.getProfile()
            setProfile(data)
        } catch (error) {
            console.error('Error loading profile')
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadProfile() }, []))

    if (!profile) return (
        <View className="flex-1 bg-neutral-50">
            <Header userName="Transportista" role="TRANSPORTISTA" showNotification={false} />
            <View className="flex-1 justify-center items-center">
                <Text>Cargando perfil...</Text>
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header userName={profile.name} role="TRANSPORTISTA" showNotification={false} />
            <ScrollView className="flex-1 px-5 pt-5">

                {/* Header Profile */}
                <View className="items-center mb-6">
                    <View className="w-24 h-24 bg-brand-red rounded-full items-center justify-center border-4 border-white shadow-sm mb-3">
                        <Text className="text-4xl text-white font-bold">{profile.name.charAt(0)}</Text>
                    </View>
                    <Text className="text-2xl font-bold text-neutral-900">{profile.name}</Text>
                    <Text className="text-neutral-500">{profile.email}</Text>
                    <View className="flex-row items-center mt-2 bg-yellow-100 px-3 py-1 rounded-full">
                        <Ionicons name="star" size={14} color="#D97706" />
                        <Text className="text-xs font-bold text-yellow-800 ml-1">{profile.rating} / 5.0</Text>
                    </View>
                </View>

                {/* Details Section */}
                <View className="gap-4 mb-10">
                    <ProfileItem
                        icon="bus"
                        label="Vehículo Asignado"
                        value={profile.vehicle}
                        subValue={`Placa: ${profile.licensePlate}`}
                    />
                    <ProfileItem
                        icon="map"
                        label="Zona de Operación"
                        value={profile.assignedZone}
                    />
                    <ProfileItem
                        icon="call"
                        label="Teléfono de Contacto"
                        value={profile.phone}
                    />
                    <ProfileItem
                        icon="id-card"
                        label="Identificador"
                        value={profile.id}
                    />
                </View>

            </ScrollView>
        </View>
    )
}

function ProfileItem({ icon, label, value, subValue }: any) {
    return (
        <View className="bg-white p-4 rounded-xl border border-neutral-100 flex-row items-center shadow-sm">
            <View className="w-12 h-12 bg-neutral-50 rounded-full items-center justify-center mr-4">
                <Ionicons name={icon} size={24} color="#EF4444" />
            </View>
            <View className="flex-1">
                <Text className="text-xs text-neutral-500 uppercase font-bold mb-1">{label}</Text>
                <Text className="text-lg text-neutral-900 font-semibold">{value}</Text>
                {subValue && <Text className="text-sm text-neutral-500">{subValue}</Text>}
            </View>
        </View>
    )
}
