/// <reference types="nativewind/types" />
import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Pressable, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { FeedbackModal, FeedbackType } from '../ui/FeedbackModal'

// Interfaces
export interface UserProfileData {
    id: string
    name: string
    email: string
    phone: string
    role: string
    photoUrl?: string
}

export interface CommercialData {
    identificacion?: string
    tipo_identificacion?: string
    razon_social?: string
    nombre_comercial?: string
    lista_precios?: string // Name of list, not ID
    vendedor_asignado?: string // Name of vendor
    zona_comercial?: string // Name of zone
    tiene_credito?: boolean
    limite_credito?: number
    saldo_actual?: number
    dias_plazo?: number
    direccion?: string
}

interface Props {
    user: UserProfileData
    commercialInfo?: CommercialData // Only for clients
    isClient?: boolean
    isLoading?: boolean
    onLogout: () => void
    onEditProfile?: () => void // For future use
}

export function UserProfileTemplate({
    user,
    commercialInfo,
    isClient = false,
    isLoading = false,
    onLogout,
}: Props) {
    // Feedback/Modal State
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

    const handleLogoutPress = () => {
        setFeedbackConfig({
            type: 'warning',
            title: 'Cerrar Sesión',
            message: '¿Estás seguro de que deseas cerrar sesión?',
            showCancel: true,
            onConfirm: () => {
                setFeedbackVisible(false)
                onLogout()
            }
        })
        setFeedbackVisible(true)
    }

    const handleChangePassword = () => {
        Alert.alert('Seguridad', 'La función de cambiar contraseña estará disponible próximamente.')
    }

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-neutral-50">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
            </View>
        )
    }

    // Role badge color based on role
    const getRoleParams = (roleStr: string) => {
        const r = roleStr.toLowerCase()
        if (r.includes('super')) return { bg: 'bg-indigo-100', text: 'text-indigo-700' }
        if (r.includes('clien')) return { bg: 'bg-green-100', text: 'text-green-700' }
        if (r.includes('vend')) return { bg: 'bg-blue-100', text: 'text-blue-700' }
        if (r.includes('trans')) return { bg: 'bg-orange-100', text: 'text-orange-700' }
        if (r.includes('bode')) return { bg: 'bg-purple-100', text: 'text-purple-700' }
        return { bg: 'bg-neutral-200', text: 'text-neutral-700' }
    }

    const roleStyle = getRoleParams(user.role)

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <ScrollView className="flex-1 px-5 pt-6 pb-20" showsVerticalScrollIndicator={false}>

                {/* 1. Header Card (Avatar + Info Básica) */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100 flex-row items-center">
                    <View className="h-16 w-16 bg-neutral-100 rounded-full items-center justify-center mr-4 border border-neutral-200 overflow-hidden">
                        {user.photoUrl ? (
                            // Logic for image would go here if we had a real URL component
                            <Text className="text-2xl">{user.name.charAt(0)}</Text>
                        ) : (
                            <Text className="text-brand-red text-2xl font-bold">{user.name.charAt(0)}</Text>
                        )}
                    </View>
                    <View className="flex-1">
                        <Text className="text-neutral-900 font-bold text-lg mb-1" numberOfLines={1}>
                            {user.name}
                        </Text>
                        <View className={`self-start px-2 py-1 rounded-md ${roleStyle.bg}`}>
                            <Text className={`${roleStyle.text} text-[10px] font-bold uppercase`}>
                                {user.role}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 2. Información Personal */}
                <SectionContainer title="Información Personal" icon="person-outline">
                    <InfoRow label="Nombre Completo" value={user.name} />
                    <InfoRow label="Correo Electrónico" value={user.email} />
                    <InfoRow label="Teléfono" value={user.phone} />
                </SectionContainer>

                {/* 3. Información Comercial (Solo Clientes) */}
                {isClient && commercialInfo && (
                    <SectionContainer title="Información Comercial" icon="business-outline">
                        <InfoRow label="Razón Social" value={commercialInfo.razon_social || '-'} />
                        <InfoRow label="Nombre Comercial" value={commercialInfo.nombre_comercial || '-'} />
                        <View className='flex-row gap-4'>
                            <View className='flex-1'>
                                <InfoRow label="Identificación" value={`${commercialInfo.tipo_identificacion}: ${commercialInfo.identificacion}`} />
                            </View>
                        </View>
                        <InfoRow label="Dirección" value={commercialInfo.direccion || '-'} />

                        <View className="h-[1px] bg-neutral-100 my-2" />

                        <View className="flex-row">
                            <View className="flex-1 pr-2">
                                <InfoRow label="Lista de Precios" value={commercialInfo.lista_precios || 'General'} />
                            </View>
                            <View className="flex-1 pl-2">
                                <InfoRow label="Zona" value={commercialInfo.zona_comercial || 'Sin Zona'} />
                            </View>
                        </View>

                        <InfoRow label="Vendedor Asignado" value={commercialInfo.vendedor_asignado || 'No asignado'} />

                        <View className="h-[1px] bg-neutral-100 my-2" />

                        <View className="flex-row">
                            <View className="flex-1 pr-2">
                                <InfoRow
                                    label="Crédito"
                                    value={commercialInfo.tiene_credito ? 'Habilitado' : 'Deshabilitado'}
                                    valueColor={commercialInfo.tiene_credito ? 'text-green-600' : 'text-neutral-500'}
                                />
                            </View>
                            {commercialInfo.tiene_credito && (
                                <View className="flex-1 pl-2">
                                    <InfoRow label="Saldo Actual" value={`$${commercialInfo.saldo_actual?.toFixed(2) || '0.00'}`} />
                                </View>
                            )}
                        </View>
                    </SectionContainer>
                )}

                {/* 4. Seguridad */}
                <View className="gap-3 mb-10">
                    <Pressable
                        className="bg-white border border-neutral-200 rounded-xl p-4 flex-row justify-between items-center active:bg-neutral-50 shadow-sm shadow-black/5"
                        onPress={handleChangePassword}
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="bg-neutral-50 p-2 rounded-full">
                                <Ionicons name="lock-closed-outline" size={20} color="#4B5563" />
                            </View>
                            <Text className="text-neutral-700 font-medium">Cambiar Contraseña</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    </Pressable>

                    <TouchableOpacity
                        className="bg-white p-4 rounded-xl items-center border border-red-100 mt-2 flex-row justify-center gap-2 active:bg-red-50"
                        onPress={handleLogoutPress}
                    >
                        <Ionicons name="log-out-outline" size={20} color={BRAND_COLORS.red} />
                        <Text className="text-brand-red font-bold">Cerrar Sesión</Text>
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
                confirmText={feedbackConfig.showCancel ? 'Cerrar Sesión' : 'Aceptar'}
                cancelText="Cancelar"
            />
        </View>
    )
}

// Sub-components for internal use

function SectionContainer({ title, icon, children }: { title: string, icon: keyof typeof Ionicons.glyphMap, children: React.ReactNode }) {
    return (
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100">
            <View className="flex-row items-center mb-4 pb-2 border-b border-neutral-50">
                <Ionicons name={icon} size={20} color={BRAND_COLORS.red} />
                <Text className="text-neutral-900 font-bold text-lg ml-2">{title}</Text>
            </View>
            <View className="gap-4">
                {children}
            </View>
        </View>
    )
}

function InfoRow({ label, value, valueColor = 'text-neutral-800' }: { label: string, value: string | number, valueColor?: string }) {
    return (
        <View>
            <Text className="text-neutral-400 text-[10px] uppercase font-bold mb-0.5 tracking-wider">{label}</Text>
            <Text className={`${valueColor} font-medium text-sm`}>{value}</Text>
        </View>
    )
}
