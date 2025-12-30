import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { UserService, type UserProfile } from '../../../services/api/UserService'
import { signOut } from '../../../services/auth/authClient'

// New imports
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'
import { useToast } from '../../../context/ToastContext'

export function ClientProfileScreen() {
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

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await UserService.getProfile()
                setProfile(data)
            } catch (error) {
                console.error('Error loading profile', error)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

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
            <View className="flex-1 bg-neutral-50 justify-center">
                <ActivityIndicator color={BRAND_COLORS.red} size="large" />
            </View>
        )
    }

    if (!profile) {
        return (
            <View className="flex-1 bg-neutral-50 relative">
                <Header title="Mi Perfil" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center p-8">
                    <View className="h-24 w-24 bg-neutral-100 rounded-full items-center justify-center mb-6 border border-neutral-200">
                        <Ionicons name="person" size={48} color={BRAND_COLORS.red} />
                    </View>
                    <Text className="text-neutral-900 font-bold text-xl mb-2 text-center">Bienvenido</Text>
                    <Text className="text-neutral-500 text-center mb-8">
                        No se ha cargado la información del perfil.
                    </Text>
                    <TouchableOpacity
                        className="bg-brand-red py-3 px-8 rounded-xl shadow-lg shadow-red-500/30"
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
            <Header title="Mi Perfil" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-5 pt-6 pb-20">

                {/* 1. Header Card (Avatar + Info Básica) */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100 flex-row items-center">
                    <View className="h-16 w-16 bg-neutral-100 rounded-full items-center justify-center mr-4 border border-neutral-200">
                        <Ionicons name="person" size={32} color={BRAND_COLORS.red} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-neutral-900 font-bold text-xl">{profile.name}</Text>
                        <View className="bg-brand-gold/20 self-start px-2 py-0.5 rounded-md mt-1">
                            <Text className="text-brand-gold text-[10px] font-bold uppercase">{profile.role}</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Datos del Cliente */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-neutral-900 font-bold text-lg">Datos Personales</Text>
                    </View>

                    <View className="gap-3">
                        <InfoRow label="Nombre" value={profile.name} />
                        <InfoRow label="Email" value={profile.email} />
                        <InfoRow label="Teléfono" value={profile.phone} />
                    </View>
                </View>

                {/* 3. Seguridad */}
                <View className="gap-3 mb-10">
                    <Pressable
                        className="bg-white border border-neutral-200 rounded-xl p-4 flex-row justify-between items-center active:bg-neutral-50"
                        onPress={() => Alert.alert('Seguridad', 'Cambiar Contraseña: Próximamente')}
                    >
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="lock-closed-outline" size={20} color="#4B5563" />
                            <Text className="text-neutral-700 font-medium">Cambiar Contraseña</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    </Pressable>

                    {/* Botón Cerrar Sesión */}
                    <TouchableOpacity
                        className="bg-neutral-100 p-4 rounded-xl items-center border border-neutral-200 mt-2"
                        onPress={handleLogoutPress}
                    >
                        <Text className="text-neutral-600 font-bold">Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>

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
