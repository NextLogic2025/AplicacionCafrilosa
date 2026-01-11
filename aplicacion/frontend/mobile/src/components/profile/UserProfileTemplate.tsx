/// <reference types="nativewind/types" />
import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, TextInput, Image } from 'react-native'
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
    lastLogin?: string
    avatarUrl?: string
}

export interface CommercialData {
    identificacion?: string
    tipo_identificacion?: string
    razon_social?: string
    nombre_comercial?: string
    lista_precios?: string
    vendedor_asignado?: string
    zona_comercial?: string
    tiene_credito?: boolean
    limite_credito?: number
    saldo_actual?: number
    dias_plazo?: number
    direccion?: string
}

interface Props {
    user: UserProfileData
    commercialInfo?: CommercialData
    isClient?: boolean
    isLoading?: boolean
    onLogout: () => void
    onUpdateProfile?: (data: { nombre: string; telefono: string }) => Promise<boolean>
}

export function UserProfileTemplate({
    user,
    commercialInfo,
    isClient = false,
    isLoading = false,
    onLogout,
    onUpdateProfile
}: Props) {
    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false)
    const [editedName, setEditedName] = useState(user.name || '')
    const [editedPhone, setEditedPhone] = useState(user.phone || '')
    const [isSaving, setIsSaving] = useState(false)

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
        setFeedbackConfig({
            type: 'info',
            title: 'Próximamente',
            message: 'La función de cambiar contraseña estará disponible pronto.',
            showCancel: false
        })
        setFeedbackVisible(true)
    }

    const handleEditToggle = () => {
        if (isEditMode) {
            // Cancel edit
            setEditedName(user.name || '')
            setEditedPhone(user.phone || '')
        }
        setIsEditMode(!isEditMode)
    }

    const handleSaveProfile = async () => {
        if (!onUpdateProfile) {
            setFeedbackConfig({
                type: 'error',
                title: 'Error',
                message: 'No se puede actualizar el perfil en este momento.',
                showCancel: false
            })
            setFeedbackVisible(true)
            return
        }

        if (!editedName.trim()) {
            setFeedbackConfig({
                type: 'warning',
                title: 'Campo Requerido',
                message: 'El nombre no puede estar vacío.',
                showCancel: false
            })
            setFeedbackVisible(true)
            return
        }

        setIsSaving(true)
        try {
            const success = await onUpdateProfile({
                nombre: editedName.trim(),
                telefono: editedPhone.trim()
            })

            if (success) {
                setIsEditMode(false)
                setFeedbackConfig({
                    type: 'success',
                    title: 'Éxito',
                    message: 'Perfil actualizado correctamente.',
                    showCancel: false
                })
            } else {
                setFeedbackConfig({
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo actualizar el perfil. Intenta nuevamente.',
                    showCancel: false
                })
            }
            setFeedbackVisible(true)
        } catch (error) {
            setFeedbackConfig({
                type: 'error',
                title: 'Error',
                message: 'Ocurrió un error al actualizar el perfil.',
                showCancel: false
            })
            setFeedbackVisible(true)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-neutral-50">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                <Text className="text-neutral-500 mt-4">Cargando perfil...</Text>
            </View>
        )
    }

    // Role badge color based on role
    const getRoleParams = (roleStr: string) => {
        if (!roleStr) return { bg: 'bg-neutral-200', text: 'text-neutral-700', icon: 'person-circle' as const }
        const r = roleStr.toLowerCase()
        if (r.includes('super')) return { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: 'shield-checkmark' as const }
        if (r.includes('clien')) return { bg: 'bg-green-100', text: 'text-green-700', icon: 'person' as const }
        if (r.includes('vend')) return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'briefcase' as const }
        if (r.includes('trans')) return { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'car' as const }
        if (r.includes('bode')) return { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'cube' as const }
        return { bg: 'bg-neutral-200', text: 'text-neutral-700', icon: 'person-circle' as const }
    }

    const roleStyle = getRoleParams(user.role || '')

    // Format date for last login
    const formatLastLogin = (dateStr?: string) => {
        // Si no hay fecha disponible, mostramos "Sesión actual" ya que el usuario está logueado
        if (!dateStr) {
            return 'Sesión actual'
        }

        try {
            const date = new Date(dateStr)

            if (isNaN(date.getTime())) {
                return 'Sesión actual'
            }

            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMs / 3600000)
            const diffDays = Math.floor(diffMs / 86400000)

            if (diffMins < 1) return 'Hace un momento'
            if (diffMins < 60) return `Hace ${diffMins} min`
            if (diffHours < 24) return `Hace ${diffHours}h`
            if (diffDays < 7) return `Hace ${diffDays}d`
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        } catch (error) {
            return 'Sesión actual'
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={true}
            >

                {/* Header Card - Avatar + Role Badge */}
                <View className="rounded-3xl p-6 mb-6" style={{ backgroundColor: BRAND_COLORS.red, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 8 }}>
                    <View className="flex-row items-center">
                        {/* Avatar */}
                        <View className="h-20 w-20 rounded-full items-center justify-center border-4 border-white overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 16 }}>
                            {user.photoUrl || user.avatarUrl ? (
                                <Image
                                    source={{ uri: user.photoUrl || user.avatarUrl }}
                                    className="h-full w-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text className="text-white text-3xl font-bold">
                                    {user.name && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : '?'}
                                </Text>
                            )}
                        </View>

                        {/* Name + Role */}
                        <View className="flex-1">
                            <Text className="text-white font-bold text-xl mb-2" numberOfLines={1}>
                                {user.name || 'Sin nombre'}
                            </Text>
                            <View className="self-start px-3 py-1.5 rounded-full flex-row items-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                <Ionicons name={roleStyle.icon} size={14} color="white" />
                                <Text className="text-white text-xs font-bold uppercase tracking-wider" style={{ marginLeft: 6 }}>
                                    {user.role || 'Sin rol'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Personal Information Section */}
                <SectionContainer
                    title="Información Personal"
                    icon="person-outline"
                    rightAction={
                        onUpdateProfile && !isEditMode ? (
                            <TouchableOpacity onPress={handleEditToggle} className="flex-row items-center">
                                <Ionicons name="create-outline" size={18} color={BRAND_COLORS.red} />
                                <Text className="text-brand-red text-xs font-semibold" style={{ marginLeft: 4 }}>Editar</Text>
                            </TouchableOpacity>
                        ) : undefined
                    }
                >
                    {isEditMode ? (
                        <>
                            <EditableField
                                label="Nombre Completo"
                                value={editedName}
                                onChangeText={setEditedName}
                                icon="person"
                                placeholder="Ingresa tu nombre"
                            />
                            <EditableField
                                label="Teléfono"
                                value={editedPhone}
                                onChangeText={setEditedPhone}
                                icon="call"
                                placeholder="Ingresa tu teléfono"
                                keyboardType="phone-pad"
                            />
                            <InfoRow label="Correo Electrónico" value={user.email} icon="mail" locked />

                            {/* Save/Cancel Buttons */}
                            <View className="flex-row mt-4" style={{ marginLeft: -4, marginRight: -4 }}>
                                <TouchableOpacity
                                    onPress={handleEditToggle}
                                    className="flex-1 bg-neutral-100 py-3 rounded-xl items-center flex-row justify-center"
                                    style={{ marginLeft: 4, marginRight: 4 }}
                                    disabled={isSaving}
                                >
                                    <Ionicons name="close-outline" size={20} color="#6B7280" />
                                    <Text className="text-neutral-600 font-semibold" style={{ marginLeft: 8 }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSaveProfile}
                                    className="flex-1 py-3 rounded-xl items-center flex-row justify-center"
                                    style={{ backgroundColor: BRAND_COLORS.red, marginLeft: 4, marginRight: 4 }}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-outline" size={20} color="white" />
                                            <Text className="text-white font-bold" style={{ marginLeft: 8 }}>Guardar</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            <InfoRow label="Nombre Completo" value={user.name || 'Sin nombre'} icon="person" />
                            <InfoRow label="Correo Electrónico" value={user.email || 'Sin correo'} icon="mail" />
                            <InfoRow label="Teléfono" value={user.phone || 'Sin teléfono'} icon="call" />
                        </>
                    )}
                </SectionContainer>

                {/* Commercial Information Section (Only for Clients) */}
                {isClient && commercialInfo && (
                    <SectionContainer title="Información Comercial" icon="business-outline">
                        <View className="bg-neutral-50 p-4 rounded-xl mb-3">
                            <InfoRow label="Razón Social" value={commercialInfo.razon_social || '-'} icon="document-text" />
                            <View className="h-3" />
                            <InfoRow label="Nombre Comercial" value={commercialInfo.nombre_comercial || '-'} icon="storefront" />
                        </View>

                        <View className="flex-row" style={{ marginLeft: -4, marginRight: -4 }}>
                            <View className="flex-1" style={{ marginLeft: 4, marginRight: 4 }}>
                                <InfoRow
                                    label="Identificación"
                                    value={commercialInfo.tipo_identificacion && commercialInfo.identificacion
                                        ? `${commercialInfo.tipo_identificacion}: ${commercialInfo.identificacion}`
                                        : '-'
                                    }
                                    icon="card"
                                />
                            </View>
                        </View>

                        <InfoRow label="Dirección" value={commercialInfo.direccion || '-'} icon="location" />

                        <View className="h-[1px] bg-neutral-200 my-4" />

                        <View className="flex-row" style={{ marginLeft: -4, marginRight: -4 }}>
                            <View className="flex-1" style={{ marginLeft: 4, marginRight: 4 }}>
                                <InfoRow label="Lista de Precios" value={commercialInfo.lista_precios || 'General'} icon="pricetag" />
                            </View>
                            <View className="flex-1" style={{ marginLeft: 4, marginRight: 4 }}>
                                <InfoRow label="Zona" value={commercialInfo.zona_comercial || 'Sin Zona'} icon="map" />
                            </View>
                        </View>

                        <InfoRow label="Vendedor Asignado" value={commercialInfo.vendedor_asignado || 'No asignado'} icon="person-circle" />

                        <View className="h-[1px] bg-neutral-200 my-4" />

                        {/* Credit Info */}
                        <View className="bg-neutral-50 p-4 rounded-xl">
                            <View className="flex-row items-center mb-3">
                                <Ionicons name="card-outline" size={18} color={BRAND_COLORS.red} />
                                <Text className="text-neutral-700 font-bold text-sm ml-2">Información de Crédito</Text>
                            </View>

                            <View className="flex-row" style={{ marginLeft: -4, marginRight: -4 }}>
                                <View className="flex-1" style={{ marginLeft: 4, marginRight: 4 }}>
                                    <InfoRow
                                        label="Estado"
                                        value={commercialInfo.tiene_credito ? 'Habilitado' : 'Deshabilitado'}
                                        valueColor={commercialInfo.tiene_credito ? 'text-green-600' : 'text-neutral-500'}
                                    />
                                </View>
                                {commercialInfo.tiene_credito && (
                                    <View className="flex-1" style={{ marginLeft: 4, marginRight: 4 }}>
                                        <InfoRow
                                            label="Días de Plazo"
                                            value={commercialInfo.dias_plazo ? `${commercialInfo.dias_plazo} días` : '-'}
                                        />
                                    </View>
                                )}
                            </View>

                            {commercialInfo.tiene_credito && (
                                <>
                                    <View className="h-3" />
                                    <View className="flex-row" style={{ marginLeft: -4, marginRight: -4 }}>
                                        <View className="flex-1" style={{ marginLeft: 4, marginRight: 4 }}>
                                            <InfoRow
                                                label="Límite de Crédito"
                                                value={commercialInfo.limite_credito
                                                    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(commercialInfo.limite_credito)
                                                    : '-'
                                                }
                                            />
                                        </View>
                                        <View className="flex-1" style={{ marginLeft: 4, marginRight: 4 }}>
                                            <InfoRow
                                                label="Saldo Actual"
                                                value={commercialInfo.saldo_actual != null
                                                    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(commercialInfo.saldo_actual)
                                                    : '-'
                                                }
                                                valueColor={
                                                    commercialInfo.saldo_actual != null && commercialInfo.limite_credito != null && commercialInfo.saldo_actual > commercialInfo.limite_credito
                                                        ? 'text-red-600'
                                                        : 'text-neutral-800'
                                                }
                                            />
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>
                    </SectionContainer>
                )}

                {/* Security Section */}
                <SectionContainer title="Seguridad" icon="shield-checkmark-outline">
                    <View className="bg-neutral-50 p-4 rounded-xl mb-3">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="text-neutral-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Último Inicio de Sesión</Text>
                                <Text className="text-neutral-800 font-medium text-sm">{formatLastLogin(user.lastLogin)}</Text>
                            </View>
                            <View className="bg-green-100 px-3 py-1.5 rounded-full">
                                <Text className="text-green-700 text-xs font-bold">Activo</Text>
                            </View>
                        </View>
                    </View>

                    <Pressable
                        className="bg-white border border-neutral-200 rounded-xl p-4 flex-row justify-between items-center active:bg-neutral-50"
                        onPress={handleChangePassword}
                    >
                        <View className="flex-row items-center flex-1">
                            <View className="bg-neutral-100 p-2.5 rounded-full">
                                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                            </View>
                            <View className="flex-1" style={{ marginLeft: 12 }}>
                                <Text className="text-neutral-800 font-semibold text-sm">Cambiar Contraseña</Text>
                                <Text className="text-neutral-400 text-xs" style={{ marginTop: 2 }}>Próximamente disponible</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    </Pressable>
                </SectionContainer>

                {/* Logout Button */}
                <TouchableOpacity
                    className="p-4 rounded-xl items-center flex-row justify-center border-2 border-red-200 active:bg-red-50 mb-6"
                    style={{ backgroundColor: 'white' }}
                    onPress={handleLogoutPress}
                >
                    <Ionicons name="log-out-outline" size={22} color={BRAND_COLORS.red} />
                    <Text className="text-brand-red font-bold text-base" style={{ marginLeft: 8 }}>Cerrar Sesión</Text>
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
                confirmText={feedbackConfig.showCancel ? 'Cerrar Sesión' : 'Aceptar'}
                cancelText="Cancelar"
            />
        </View>
    )
}

// Sub-components

interface SectionContainerProps {
    title: string
    icon: keyof typeof Ionicons.glyphMap
    children: React.ReactNode
    rightAction?: React.ReactNode
}

function SectionContainer({ title, icon, children, rightAction }: SectionContainerProps) {
    return (
        <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm border border-neutral-100" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 }}>
            <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                <View className="flex-row items-center flex-1">
                    <View className="bg-red-50 p-2 rounded-lg">
                        <Ionicons name={icon} size={20} color={BRAND_COLORS.red} />
                    </View>
                    <Text className="text-neutral-900 font-bold text-base" style={{ marginLeft: 12 }}>{title}</Text>
                </View>
                {rightAction}
            </View>
            <View style={{ marginTop: -4, marginBottom: -4 }}>
                {children}
            </View>
        </View>
    )
}

interface InfoRowProps {
    label: string
    value: string | number
    valueColor?: string
    icon?: keyof typeof Ionicons.glyphMap
    locked?: boolean
}

function InfoRow({ label, value, valueColor = 'text-neutral-800', icon, locked }: InfoRowProps) {
    return (
        <View className="mb-4">
            <View className="flex-row items-center mb-1">
                {icon && <Ionicons name={icon} size={14} color="#9CA3AF" style={{ marginRight: 6 }} />}
                <Text className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider">{label}</Text>
                {locked && <Ionicons name="lock-closed" size={12} color="#D1D5DB" style={{ marginLeft: 6 }} />}
            </View>
            <Text className={`${valueColor} font-medium text-sm`}>{value}</Text>
        </View>
    )
}

interface EditableFieldProps {
    label: string
    value: string
    onChangeText: (text: string) => void
    icon?: keyof typeof Ionicons.glyphMap
    placeholder?: string
    keyboardType?: 'default' | 'email-address' | 'phone-pad'
}

function EditableField({ label, value, onChangeText, icon, placeholder, keyboardType = 'default' }: EditableFieldProps) {
    return (
        <View className="mb-4">
            <View className="flex-row items-center mb-2">
                {icon && <Ionicons name={icon} size={14} color="#9CA3AF" style={{ marginRight: 6 }} />}
                <Text className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider">{label}</Text>
            </View>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                keyboardType={keyboardType}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-800 font-medium text-sm"
                placeholderTextColor="#9CA3AF"
            />
        </View>
    )
}
