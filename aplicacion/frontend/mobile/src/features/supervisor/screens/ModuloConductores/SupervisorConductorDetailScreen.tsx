import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal'
import { useStableInsets } from '../../../../hooks/useStableInsets'
import { ConductorService, type Conductor } from '../../../../services/api/ConductorService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

interface RouteParams {
    conductorId: string
}

export function SupervisorConductorDetailScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const insets = useStableInsets()
    const params = route.params as RouteParams

    const [loading, setLoading] = useState(true)
    const [conductor, setConductor] = useState<Conductor | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
    }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    useEffect(() => {
        loadConductor()
    }, [params.conductorId])

    const loadConductor = async () => {
        setLoading(true)
        try {
            const data = await ConductorService.getById(params.conductorId)
            setConductor(data)
        } catch (error) {
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error al Cargar',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!conductor) return

        setDeleting(true)
        try {
            await ConductorService.delete(conductor.id)
            setShowDeleteConfirm(false)
            setFeedbackModal({
                visible: true,
                type: 'success',
                title: 'Conductor Eliminado',
                message: `${conductor.nombre_completo} ha sido eliminado exitosamente.`,
            })

            setTimeout(() => {
                navigation.goBack()
            }, 1500)
        } catch (error) {
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error al Eliminar',
                message: getUserFriendlyMessage(error, 'DELETE_ERROR'),
            })
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle del Conductor" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text className="text-neutral-600 mt-4">Cargando información...</Text>
                </View>
            </View>
        )
    }

    if (!conductor) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle del Conductor" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="alert-circle-outline" size={64} color="#6B7280" />
                    <Text className="text-lg font-bold text-neutral-900 mt-4">
                        Conductor No Encontrado
                    </Text>
                    <Text className="text-neutral-600 text-center mt-2">
                        No se pudo cargar la información del conductor.
                    </Text>
                </View>
            </View>
        )
    }

    const estadoColor = conductor.activo ? '#10B981' : '#6B7280'
    const estadoBg = conductor.activo ? '#D1FAE5' : '#F3F4F6'
    const initials = ConductorService.getInitials(conductor.nombre_completo)

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle del Conductor" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                {/* Avatar y nombre */}
                <View className="bg-white p-6 items-center border-b border-neutral-100">
                    <View
                        className="w-24 h-24 rounded-full items-center justify-center mb-4"
                        style={{ backgroundColor: `${estadoColor}20` }}
                    >
                        <Text
                            className="text-3xl font-bold"
                            style={{ color: estadoColor }}
                        >
                            {initials}
                        </Text>
                    </View>

                    <Text className="text-xl font-bold text-neutral-900 text-center">
                        {conductor.nombre_completo}
                    </Text>

                    <View
                        className="px-4 py-2 rounded-full mt-3"
                        style={{ backgroundColor: estadoBg }}
                    >
                        <Text
                            className="text-sm font-semibold"
                            style={{ color: estadoColor }}
                        >
                            {conductor.activo ? 'Activo' : 'Inactivo'}
                        </Text>
                    </View>
                </View>

                {/* Información Personal */}
                <View className="mx-4 mt-4">
                    <View className="bg-white rounded-2xl p-4 mb-4" style={{ elevation: 2 }}>
                        <View className="flex-row items-center mb-4">
                            <Ionicons name="person-outline" size={20} color={BRAND_COLORS.red} />
                            <Text className="text-base font-bold text-neutral-900 ml-2">
                                Información Personal
                            </Text>
                        </View>

                        {conductor.licencia ? (
                            <InfoRow
                                icon="card-outline"
                                label="Licencia"
                                value={conductor.licencia}
                            />
                        ) : (
                            <View className="flex-row items-center py-3">
                                <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
                                <Text className="text-sm text-amber-600 ml-3">
                                    Sin licencia registrada
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Usuario Vinculado */}
                    {conductor.usuario_id && (
                        <View className="bg-white rounded-2xl p-4 mb-4" style={{ elevation: 2 }}>
                            <View className="flex-row items-center mb-3">
                                <Ionicons name="link-outline" size={20} color={BRAND_COLORS.red} />
                                <Text className="text-base font-bold text-neutral-900 ml-2">
                                    Vinculación
                                </Text>
                            </View>

                            <View className="flex-row items-center py-3">
                                <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
                                <View className="ml-3 flex-1">
                                    <Text className="text-sm text-neutral-500">Usuario del Sistema</Text>
                                    <Text className="text-sm font-semibold text-neutral-900 mt-0.5">
                                        Vinculado (ID: {conductor.usuario_id.substring(0, 8)}...)
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Fechas */}
                    <View className="bg-white rounded-2xl p-4" style={{ elevation: 2 }}>
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="calendar-outline" size={20} color={BRAND_COLORS.red} />
                            <Text className="text-base font-bold text-neutral-900 ml-2">
                                Registro
                            </Text>
                        </View>

                        <InfoRow
                            icon="time-outline"
                            label="Fecha de Registro"
                            value={new Date(conductor.created_at).toLocaleDateString('es-EC', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                            })}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Botones de acción */}
            <View
                className="border-t border-neutral-200 bg-white px-4 py-3"
                style={{ paddingBottom: insets.bottom + 12 }}
            >
                <View className="flex-row gap-3">
                    {/* Editar */}
                    <Pressable
                        onPress={() =>
                            navigation.navigate('SupervisorConductorForm', {
                                conductorId: conductor.id,
                                origin: 'supervisor',
                            })
                        }
                        className="flex-1 py-3 rounded-xl items-center justify-center active:opacity-80"
                        style={{ backgroundColor: '#3B82F6' }}
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="create-outline" size={20} color="white" />
                            <Text className="text-base font-bold text-white ml-2">
                                Editar
                            </Text>
                        </View>
                    </Pressable>

                    {/* Eliminar */}
                    <Pressable
                        onPress={() => setShowDeleteConfirm(true)}
                        disabled={deleting}
                        className="flex-1 py-3 rounded-xl items-center justify-center active:opacity-80"
                        style={{ backgroundColor: '#EF4444' }}
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="trash-outline" size={20} color="white" />
                            <Text className="text-base font-bold text-white ml-2">
                                Eliminar
                            </Text>
                        </View>
                    </Pressable>
                </View>
            </View>

            {/* Modal de confirmación de eliminación */}
            <ConfirmationModal
                visible={showDeleteConfirm}
                title="¿Eliminar Conductor?"
                message={`¿Estás seguro de que deseas eliminar a ${conductor.nombre_completo}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                isDestructive={true}
                icon="trash-outline"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            {/* Feedback Modal */}
            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
            />
        </View>
    )
}

// Componente auxiliar para filas de información
function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
    return (
        <View className="flex-row items-center py-3 border-b border-neutral-100 last:border-b-0">
            <Ionicons name={icon} size={20} color="#6B7280" />
            <View className="ml-3 flex-1">
                <Text className="text-sm text-neutral-500">{label}</Text>
                <Text className="text-sm font-semibold text-neutral-900 mt-0.5">{value}</Text>
            </View>
        </View>
    )
}
