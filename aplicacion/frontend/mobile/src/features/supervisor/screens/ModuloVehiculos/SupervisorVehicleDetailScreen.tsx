import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal'
import { useStableInsets } from '../../../../hooks/useStableInsets'
import { VehicleService, type Vehicle, VEHICLE_ESTADO_COLORS, VEHICLE_ESTADO_LABELS } from '../../../../services/api/VehicleService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

export function SupervisorVehicleDetailScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const insets = useStableInsets()

    const vehicleId = route.params?.vehicleId

    const [vehicle, setVehicle] = useState<Vehicle | null>(null)
    const [loading, setLoading] = useState(true)
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
        loadVehicleData()
    }, [vehicleId])

    const loadVehicleData = async () => {
        if (!vehicleId) return

        setLoading(true)
        try {
            const data = await VehicleService.getById(vehicleId)
            setVehicle(data)
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
        if (!vehicle) return

        setDeleting(true)
        setShowDeleteConfirm(false)
        try {
            await VehicleService.delete(vehicle.id)
            setFeedbackModal({
                visible: true,
                type: 'success',
                title: 'Vehículo Eliminado',
                message: `El vehículo ${vehicle.placa} ha sido eliminado exitosamente.`,
            })
            setTimeout(() => navigation.goBack(), 1500)
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
                <Header title="Detalle del Vehículo" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text className="text-neutral-600 mt-4">Cargando información...</Text>
                </View>
            </View>
        )
    }

    if (!vehicle) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle del Vehículo" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="alert-circle-outline" size={64} color="#6B7280" />
                    <Text className="text-lg font-bold text-neutral-900 mt-4">
                        Vehículo No Encontrado
                    </Text>
                    <Text className="text-neutral-600 text-center mt-2">
                        El vehículo que buscas no existe o fue eliminado
                    </Text>
                </View>
            </View>
        )
    }

    const estadoColor = VEHICLE_ESTADO_COLORS[vehicle.estado]
    const estadoLabel = VEHICLE_ESTADO_LABELS[vehicle.estado]

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle del Vehículo" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
                <View className="bg-white rounded-2xl p-6 mb-4 items-center border border-neutral-100" style={{ elevation: 2 }}>
                    <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: `${estadoColor}15` }}>
                        <Ionicons name="car-sport" size={40} color={estadoColor} />
                    </View>

                    <Text className="text-2xl font-bold text-neutral-900 mb-2">
                        {vehicle.placa.toUpperCase()}
                    </Text>

                    <View className="px-4 py-2 rounded-full" style={{ backgroundColor: `${estadoColor}15` }}>
                        <Text className="font-bold text-sm" style={{ color: estadoColor }}>
                            {estadoLabel}
                        </Text>
                    </View>
                </View>

                <View className="bg-white rounded-2xl p-4 mb-4 border border-neutral-100" style={{ elevation: 2 }}>
                    <Text className="text-base font-bold text-neutral-900 mb-4">Detalles del Vehículo</Text>

                    {vehicle.marca && (
                        <View className="flex-row items-center py-3 border-b border-neutral-100">
                            <Ionicons name="business-outline" size={20} color="#6B7280" />
                            <View className="ml-3 flex-1">
                                <Text className="text-xs text-neutral-500">Marca</Text>
                                <Text className="text-base text-neutral-900 font-medium">{vehicle.marca}</Text>
                            </View>
                        </View>
                    )}

                    {vehicle.modelo && (
                        <View className="flex-row items-center py-3 border-b border-neutral-100">
                            <Ionicons name="car-outline" size={20} color="#6B7280" />
                            <View className="ml-3 flex-1">
                                <Text className="text-xs text-neutral-500">Modelo</Text>
                                <Text className="text-base text-neutral-900 font-medium">{vehicle.modelo}</Text>
                            </View>
                        </View>
                    )}

                    {vehicle.anio && (
                        <View className="flex-row items-center py-3 border-b border-neutral-100">
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                            <View className="ml-3 flex-1">
                                <Text className="text-xs text-neutral-500">Año</Text>
                                <Text className="text-base text-neutral-900 font-medium">{vehicle.anio}</Text>
                            </View>
                        </View>
                    )}

                    {vehicle.capacidad_kg && (
                        <View className="flex-row items-center py-3">
                            <Ionicons name="cube-outline" size={20} color="#6B7280" />
                            <View className="ml-3 flex-1">
                                <Text className="text-xs text-neutral-500">Capacidad</Text>
                                <Text className="text-base text-neutral-900 font-medium">
                                    {parseFloat(vehicle.capacidad_kg).toFixed(0)} kg
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                <View className="bg-white rounded-2xl p-4 mb-4 border border-neutral-100" style={{ elevation: 2 }}>
                    <Text className="text-base font-bold text-neutral-900 mb-4">Registro</Text>

                    <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={20} color="#6B7280" />
                        <View className="ml-3 flex-1">
                            <Text className="text-xs text-neutral-500">Fecha de registro</Text>
                            <Text className="text-sm text-neutral-900">
                                {new Date(vehicle.created_at).toLocaleDateString('es-EC', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View className="px-4 pb-4 bg-white border-t border-neutral-100" style={{ paddingBottom: insets.bottom + 16 }}>
                <View className="flex-row gap-3 mt-4">
                    <Pressable
                        className="flex-1 py-4 rounded-xl items-center flex-row justify-center"
                        style={{ backgroundColor: '#3B82F6' }}
                        onPress={() => navigation.navigate('SupervisorVehicleForm', { vehicleId: vehicle.id })}
                        disabled={deleting}
                    >
                        <Ionicons name="create-outline" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-base">Editar</Text>
                    </Pressable>

                    <Pressable
                        className="flex-1 py-4 rounded-xl items-center flex-row justify-center"
                        style={{ backgroundColor: '#EF4444' }}
                        onPress={() => setShowDeleteConfirm(true)}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="trash-outline" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text className="text-white font-bold text-base">Eliminar</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </View>

            <ConfirmationModal
                visible={showDeleteConfirm}
                title="¿Eliminar Vehículo?"
                message={`¿Estás seguro de que deseas eliminar el vehículo ${vehicle.placa}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                isDestructive={true}
                icon="trash-outline"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    )
}
