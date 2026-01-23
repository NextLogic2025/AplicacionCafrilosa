import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal'
import { useStableInsets } from '../../../../hooks/useStableInsets'
import { DespachosService, type Despacho, DESPACHO_ESTADO_COLORS, DESPACHO_ESTADO_LABELS } from '../../../../services/api/DespachosService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

export function SupervisorDespachoDetailScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const insets = useStableInsets()

    const despachoId = route.params?.despachoId

    const [despacho, setDespacho] = useState<Despacho | null>(null)
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
        loadDespachoData()
    }, [despachoId])

    const loadDespachoData = async () => {
        if (!despachoId) return

        setLoading(true)
        try {
            const data = await DespachosService.getById(despachoId)
            setDespacho(data)
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
        if (!despacho) return

        setDeleting(true)
        setShowDeleteConfirm(false)
        try {
            await DespachosService.delete(despacho.id)
            setFeedbackModal({
                visible: true,
                type: 'success',
                title: 'Despacho Eliminado',
                message: 'El despacho ha sido eliminado exitosamente.',
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
                <Header title="Detalle del Despacho" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text className="text-neutral-600 mt-4">Cargando información...</Text>
                </View>
            </View>
        )
    }

    if (!despacho) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle del Despacho" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="alert-circle-outline" size={64} color="#6B7280" />
                    <Text className="text-lg font-bold text-neutral-900 mt-4">Despacho No Encontrado</Text>
                </View>
            </View>
        )
    }

    const estadoColor = DESPACHO_ESTADO_COLORS[despacho.estado_viaje]
    const estadoLabel = DESPACHO_ESTADO_LABELS[despacho.estado_viaje]
    const codigoManifiesto = DespachosService.formatCodigoManifiesto(despacho.codigo_manifiesto)

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle del Despacho" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
                <View className="bg-white rounded-2xl p-6 mb-4 items-center border border-neutral-100" style={{ elevation: 2 }}>
                    <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: `${estadoColor}15` }}>
                        <Ionicons name="document-text" size={40} color={estadoColor} />
                    </View>

                    <Text className="text-2xl font-bold text-neutral-900 mb-2">{codigoManifiesto}</Text>

                    <View className="px-4 py-2 rounded-full" style={{ backgroundColor: `${estadoColor}15` }}>
                        <Text className="font-bold text-sm" style={{ color: estadoColor }}>{estadoLabel}</Text>
                    </View>
                </View>

                <View className="bg-white rounded-2xl p-4 mb-4 border border-neutral-100" style={{ elevation: 2 }}>
                    <Text className="text-base font-bold text-neutral-900 mb-4">Detalles del Despacho</Text>

                    {despacho.fecha_programada && (
                        <View className="flex-row items-center py-3 border-b border-neutral-100">
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                            <View className="ml-3 flex-1">
                                <Text className="text-xs text-neutral-500">Fecha Programada</Text>
                                <Text className="text-base text-neutral-900 font-medium">
                                    {new Date(despacho.fecha_programada).toLocaleDateString('es-EC')}
                                </Text>
                            </View>
                        </View>
                    )}

                    {despacho.vehiculo && (
                        <View className="flex-row items-center py-3 border-b border-neutral-100">
                            <Ionicons name="car-sport-outline" size={20} color="#6B7280" />
                            <View className="ml-3 flex-1">
                                <Text className="text-xs text-neutral-500">Vehículo</Text>
                                <Text className="text-base text-neutral-900 font-medium">
                                    {despacho.vehiculo.placa} - {despacho.vehiculo.marca} {despacho.vehiculo.modelo}
                                </Text>
                            </View>
                        </View>
                    )}

                    {despacho.conductor && (
                        <View className="flex-row items-center py-3 border-b border-neutral-100">
                            <Ionicons name="person-outline" size={20} color="#6B7280" />
                            <View className="ml-3 flex-1">
                                <Text className="text-xs text-neutral-500">Conductor</Text>
                                <Text className="text-base text-neutral-900 font-medium">{despacho.conductor.nombre_completo}</Text>
                            </View>
                        </View>
                    )}

                    {parseFloat(despacho.peso_total_kg) > 0 && (
                        <View className="flex-row items-center py-3">
                            <Ionicons name="cube-outline" size={20} color="#6B7280" />
                            <View className="ml-3 flex-1">
                                <Text className="text-xs text-neutral-500">Peso Total</Text>
                                <Text className="text-base text-neutral-900 font-medium">
                                    {parseFloat(despacho.peso_total_kg).toFixed(0)} kg
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {despacho.observaciones_ruta && (
                    <View className="bg-white rounded-2xl p-4 mb-4 border border-neutral-100" style={{ elevation: 2 }}>
                        <Text className="text-base font-bold text-neutral-900 mb-2">Observaciones</Text>
                        <Text className="text-sm text-neutral-600">{despacho.observaciones_ruta}</Text>
                    </View>
                )}
            </ScrollView>

            <View className="px-4 pb-4 bg-white border-t border-neutral-100" style={{ paddingBottom: insets.bottom + 16 }}>
                <View className="flex-row gap-3 mt-4">
                    <Pressable
                        className="flex-1 py-4 rounded-xl items-center flex-row justify-center"
                        style={{ backgroundColor: '#3B82F6' }}
                        onPress={() => navigation.navigate('SupervisorDespachoForm', { despachoId: despacho.id })}
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
                title="¿Eliminar Despacho?"
                message={`¿Estás seguro de que deseas eliminar este despacho? Esta acción no se puede deshacer.`}
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
