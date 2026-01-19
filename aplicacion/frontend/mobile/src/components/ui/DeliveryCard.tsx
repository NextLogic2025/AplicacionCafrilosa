import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

export interface DeliveryCardData {
    id: string
    orderId: string
    clientName: string
    address: string
    status: 'pending' | 'in_transit' | 'delivered' | 'failed'
    estimatedTime: string
    itemsCount: number
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'clock-outline' },
    in_transit: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'navigate-outline' },
    delivered: { bg: 'bg-green-50', text: 'text-green-700', icon: 'checkmark-circle-outline' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', icon: 'close-circle-outline' }
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    in_transit: 'En Tránsito',
    delivered: 'Entregado',
    failed: 'Falló'
}

export interface DeliveryCardProps {
    delivery: DeliveryCardData
    onPress?: () => void
    showActionButton?: boolean
}


export function DeliveryCard({ delivery, onPress, showActionButton = true }: DeliveryCardProps) {
    const statusColor = STATUS_COLORS[delivery.status] || STATUS_COLORS.pending
    const statusLabel = STATUS_LABELS[delivery.status] || 'Desconocido'

    return (
        <TouchableOpacity
            className={`${statusColor.bg} p-4 rounded-xl border border-neutral-200 mb-3 active:opacity-70`}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="font-bold text-neutral-900 text-base mb-1">
                        {delivery.clientName}
                    </Text>
                    <Text className="text-neutral-500 text-sm mb-2 flex-wrap" numberOfLines={2}>
                        {delivery.address}
                    </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${statusColor.bg} border border-neutral-300`}>
                    <Text className={`text-xs font-semibold ${statusColor.text}`}>
                        {statusLabel}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center justify-between pt-3 border-t border-neutral-200">
                <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center gap-1">
                        <View className="w-4 h-4 rounded-full" style={{ backgroundColor: statusColor.text.includes('yellow') ? '#D97706' : statusColor.text.includes('blue') ? '#2563EB' : statusColor.text.includes('green') ? '#10B981' : '#DC2626' }} />
                        <Text className={`text-xs font-medium ${statusColor.text}`}>
                            {delivery.estimatedTime}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Ionicons name="cube-outline" size={14} color="#6B7280" />
                        <Text className="text-xs text-neutral-500">
                            {delivery.itemsCount} productos
                        </Text>
                    </View>
                </View>
                <Text className="text-xs font-semibold text-neutral-600">
                    #{delivery.orderId.slice(-6)}
                </Text>
            </View>

            {showActionButton && onPress && (
                <View className="mt-3 pt-3 border-t border-neutral-200 flex-row justify-end">
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </View>
            )}
        </TouchableOpacity>
    )
}
