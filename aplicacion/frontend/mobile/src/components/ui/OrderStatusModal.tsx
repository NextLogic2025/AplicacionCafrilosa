import React, { useState } from 'react'
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Order, OrderStatus, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../services/api/OrderService'
import { BRAND_COLORS } from '../../shared/types'

interface OrderStatusModalProps {
    visible: boolean
    order: Order | null
    allowedStatuses: OrderStatus[]
    onStatusChange: (status: OrderStatus) => Promise<void>
    onClose: () => void
}

export function OrderStatusModal({
    visible,
    order,
    allowedStatuses,
    onStatusChange,
    onClose
}: OrderStatusModalProps) {
    const [changing, setChanging] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)

    const handleStatusChange = async (status: OrderStatus) => {
        setSelectedStatus(status)
        setChanging(true)
        try {
            await onStatusChange(status)
        } finally {
            setChanging(false)
            setSelectedStatus(null)
        }
    }

    const getStatusIcon = (status: OrderStatus): keyof typeof Ionicons.glyphMap => {
        switch (status) {
            case 'APROBADO':
                return 'checkmark-circle'
            case 'RECHAZADO':
                return 'close-circle'
            case 'EN_PREPARACION':
                return 'cube'
            case 'FACTURADO':
                return 'receipt'
            case 'EN_RUTA':
                return 'car'
            case 'ENTREGADO':
                return 'checkmark-done-circle'
            case 'ANULADO':
                return 'ban'
            default:
                return 'time'
        }
    }

    const getStatusDescription = (status: OrderStatus): string => {
        switch (status) {
            case 'APROBADO':
                return 'Validar y aprobar pedido'
            case 'RECHAZADO':
                return 'Rechazar pedido'
            case 'EN_PREPARACION':
                return 'Marcar como en preparación'
            case 'FACTURADO':
                return 'Marcar como facturado'
            case 'EN_RUTA':
                return 'Marcar como en ruta'
            case 'ENTREGADO':
                return 'Marcar como entregado'
            case 'ANULADO':
                return 'Anular pedido'
            default:
                return 'Cambiar a este estado'
        }
    }

    if (!order) return null

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl pb-8">
                    <View className="flex-row justify-between items-center p-5 border-b border-neutral-100">
                        <View>
                            <Text className="text-neutral-900 font-bold text-lg">Cambiar Estado</Text>
                            <Text className="text-neutral-500 text-sm mt-1">
                                Pedido #{order.codigo_visual}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} disabled={changing}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="max-h-96">
                        <View className="p-5">
                            <View className="mb-4 p-3 bg-neutral-50 rounded-xl">
                                <Text className="text-neutral-600 text-sm mb-1">Estado actual:</Text>
                                <View
                                    className="self-start px-3 py-1.5 rounded-full"
                                    style={{ backgroundColor: `${ORDER_STATUS_COLORS[order.estado_actual]}20` }}
                                >
                                    <Text
                                        className="text-sm font-bold uppercase"
                                        style={{ color: ORDER_STATUS_COLORS[order.estado_actual] }}
                                    >
                                        {ORDER_STATUS_LABELS[order.estado_actual]}
                                    </Text>
                                </View>
                            </View>

                            <Text className="text-neutral-900 font-bold mb-3">Selecciona nuevo estado:</Text>

                            {allowedStatuses.map((status) => {
                                const isCurrentStatus = order.estado_actual === status
                                const isProcessing = changing && selectedStatus === status

                                return (
                                    <TouchableOpacity
                                        key={status}
                                        onPress={() => handleStatusChange(status)}
                                        className="flex-row items-center justify-between p-4 mb-2 bg-neutral-50 rounded-xl border border-neutral-100 active:bg-neutral-100"
                                        disabled={isCurrentStatus || changing}
                                    >
                                        <View className="flex-row items-center gap-3">
                                            <View
                                                className="w-10 h-10 rounded-full items-center justify-center"
                                                style={{ backgroundColor: `${ORDER_STATUS_COLORS[status]}20` }}
                                            >
                                                {isProcessing ? (
                                                    <ActivityIndicator size="small" color={ORDER_STATUS_COLORS[status]} />
                                                ) : (
                                                    <Ionicons
                                                        name={getStatusIcon(status)}
                                                        size={24}
                                                        color={ORDER_STATUS_COLORS[status]}
                                                    />
                                                )}
                                            </View>
                                            <View>
                                                <Text className={`font-medium ${isCurrentStatus ? 'text-neutral-400' : 'text-neutral-900'}`}>
                                                    {ORDER_STATUS_LABELS[status]}
                                                </Text>
                                                <Text className="text-neutral-500 text-xs">
                                                    {getStatusDescription(status)}
                                                </Text>
                                            </View>
                                        </View>
                                        {isCurrentStatus && (
                                            <Ionicons name="checkmark-circle" size={24} color={ORDER_STATUS_COLORS[status]} />
                                        )}
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}
