import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../components/ui/Header'
import { UserService, type UserProfile } from '../../../services/api/UserService'
import { signOut } from '../../../services/auth/authClient'

// New imports
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { useToast } from '../../../context/ToastContext'

export function SupervisorProfileScreen() {
    const navigation = useNavigation()
    const { showToast } = useToast()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

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
            setIsLoading(true)
            const data = await UserService.getProfile()
            setProfile(data)
        } catch (error) {
            console.error('Error loading profile', error)
        } finally {
            setIsLoading(false)
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
        setFeedbackVisible(false) // Close modal first
        try {
            await signOut()
            showToast('Sesión cerrada exitosamente', 'success')
            // Delay slightly to let the modal fade animation finish smoothly if needed
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

    if (!profile) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Perfil Supervisor" variant="standard" showNotification={false} />
                <View className="flex-1 items-center justify-center">
                    {isLoading ? (
                        <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    ) : (
                        <Text>No se pudo cargar el perfil.</Text>
                    )}
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Mi Perfil" variant="standard" showNotification={false} />

            <View className="p-6 items-center flex-1">
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
                    onPress={handleLogoutPress}
                    className="w-full py-4 bg-white border border-red-100 rounded-xl items-center shadow-sm active:bg-red-50 mt-auto mb-10"
                >
                    <Text className="text-brand-red font-bold">Cerrar Sesión</Text>
                </TouchableOpacity>

                {/* Feedback Modal for Confirmation */}
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
        </View>
    )
}
