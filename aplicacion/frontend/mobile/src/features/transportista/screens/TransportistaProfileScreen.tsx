import { useFocusEffect, useNavigation } from '@react-navigation/native'
import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'

import { Header } from '../../../components/ui/Header'
import { UserService, type UserProfile } from '../../../services/api/UserService'
import { signOut } from '../../../services/auth/authClient'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

// New imports
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { useToast } from '../../../context/ToastContext'

export function TransportistaProfileScreen() {
    const navigation = useNavigation()
    const { showToast } = useToast()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    // Feedback State
    const [feedbackVisible, setFeedbackVisible] = useState(false)
    const [feedbackConfig, setFeedbackConfig] = useState<{
        type: FeedbackType
        title: string
        message: string
        onConfirm?: () => void
        showCancel?: boolean
    }>({
        type: 'info',
        title: '',
        message: ''
    })

    const loadProfile = async () => {
        try {
            const data = await UserService.getProfile()
            setProfile(data)
        } catch (error) {
            console.error('Error loading profile')
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadProfile() }, []))

    const handleLogoutPress = () => {
        setFeedbackConfig({
            type: 'warning',
            title: 'Cerrar Sesión',
            message: '¿Estás seguro de que deseas cerrar sesión?',
            showCancel: true,
            onConfirm: performLogout
        })
        setFeedbackVisible(true)
    }

    const performLogout = async () => {
        setFeedbackVisible(false)
        try {
            await signOut()
            showToast('Sesión cerrada exitosamente', 'success')
            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' as never }],
                })
            }, 300)
        } catch (error) {
            showToast('Error al cerrar sesión', 'error')
        }
    }

    if (loading) return (
        <View className="flex-1 bg-neutral-50 justify-center items-center">
            <ActivityIndicator size="large" color={BRAND_COLORS.red} />
        </View>
    )

    if (!profile) return (
        <View className="flex-1 bg-neutral-50">
            <Header userName="Transportista" role="TRANSPORTISTA" showNotification={false} />
            <View className="flex-1 justify-center items-center">
                <Text>No se pudo cargar el perfil.</Text>
                <TouchableOpacity
                    className="bg-brand-red py-3 px-8 rounded-xl mt-4"
                    onPress={handleLogoutPress}
                >
                    <Text className="text-white font-bold">Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>

            <FeedbackModal
                visible={feedbackVisible}
                type={feedbackConfig.type}
                title={feedbackConfig.title}
                message={feedbackConfig.message}
                onClose={() => setFeedbackVisible(false)}
                onConfirm={feedbackConfig.onConfirm}
                showCancel={feedbackConfig.showCancel}
                confirmText="Cerrar Sesión"
                cancelText="Cancelar"
            />
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
                    <View className="mt-2 bg-neutral-100 px-3 py-1 rounded-full">
                        <Text className="text-xs font-bold text-neutral-600">{profile.role}</Text>
                    </View>
                </View>

                {/* Details Section */}
                <View className="gap-4 mb-10">
                    <ProfileItem
                        icon="call"
                        label="Teléfono de Contacto"
                        value={profile.phone}
                    />
                    <ProfileItem
                        icon="id-card"
                        label="Email"
                        value={profile.email}
                    />
                </View>

                <TouchableOpacity
                    className="w-full py-4 bg-white border border-red-100 rounded-xl items-center shadow-sm active:bg-red-50"
                    onPress={handleLogoutPress}
                >
                    <Text className="text-brand-red font-bold">Cerrar Sesión</Text>
                </TouchableOpacity>

            </ScrollView>

            <FeedbackModal
                visible={feedbackVisible}
                type={feedbackConfig.type}
                title={feedbackConfig.title}
                message={feedbackConfig.message}
                onClose={() => setFeedbackVisible(false)}
                onConfirm={feedbackConfig.onConfirm}
                showCancel={feedbackConfig.showCancel}
                confirmText="Cerrar Sesión"
                cancelText="Cancelar"
            />
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
