import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { UserService, UserProfile } from '../../../services/api/UserService'
import { signOut } from '../../../services/auth/authClient'

// New imports
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { useToast } from '../../../context/ToastContext'

export function SellerProfileScreen() {
    const navigation = useNavigation()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<UserProfile | null>(null)

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

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        setLoading(true)
        try {
            const data = await UserService.getProfile()
            setProfile(data)
        } catch (error) {
            console.error('Error loading profile', error)
        } finally {
            setLoading(false)
        }
    }

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
                <Header title="Perfil Vendedor" variant="standard" />
                <View className="flex-1 items-center justify-center p-8">
                    <EmptyProfileState />
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
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Perfil Vendedor" variant="standard" />

            <ScrollView className="flex-1 px-5 pt-6 pb-20">
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-neutral-100 flex-row items-center">
                    <View className="h-16 w-16 bg-neutral-100 rounded-full items-center justify-center mr-4 border border-neutral-200">
                        <Ionicons name="person" size={32} color={BRAND_COLORS.red} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-neutral-900 font-bold text-xl">{profile.name}</Text>
                        <Text className="text-neutral-500 text-xs mt-1">{profile.role}</Text>
                    </View>
                </View>

                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-neutral-100">
                    <View className="mb-4">
                        <Text className="text-neutral-900 font-bold text-lg">Mis Datos</Text>
                    </View>
                    <View className="gap-3">
                        <InfoRow label="Email" value={profile.email} />
                        <InfoRow label="Teléfono" value={profile.phone} />
                    </View>
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

function EmptyProfileState() {
    return (
        <>
            <View className="h-24 w-24 bg-neutral-100 rounded-full items-center justify-center mb-6 border border-neutral-200">
                <Ionicons name="person" size={48} color={BRAND_COLORS.red} />
            </View>
            <Text className="text-neutral-900 font-bold text-xl mb-2 text-center">Sesión no iniciada</Text>
            <Text className="text-neutral-500 text-center mb-8">No se ha cargado la información.</Text>
        </>
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
