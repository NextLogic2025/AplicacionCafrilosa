import React from 'react'
import { View, Text, Pressable, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'
import { Order, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../services/api/OrderService'

interface ActionButton {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    onPress: () => void
    variant: 'primary' | 'danger' | 'secondary'
}

interface OrderCardProps {
    order: Order
    onPress: () => void
    onCancel?: () => void
    actionButtons?: ActionButton[]
    showClientInfo?: boolean
}


export function OrderCard({ order, onPress, onCancel, actionButtons, showClientInfo }: OrderCardProps) {
    const statusColor = ORDER_STATUS_COLORS[order.estado_actual]
    const statusLabel = ORDER_STATUS_LABELS[order.estado_actual]

    const dateFormatted = (() => {
        try {
            if (!order.created_at) return 'Fecha no disponible'
            const date = new Date(order.created_at)
            if (isNaN(date.getTime())) return 'Fecha no disponible'
            return date.toLocaleDateString('es-EC', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return 'Fecha no disponible'
        }
    })()

    const itemsCount = order.detalles?.length || 0

    const getButtonStyles = (variant: ActionButton['variant']) => {
        switch (variant) {
            case 'primary':
                return { bg: 'bg-red-50', text: 'text-brand-red', border: 'border-brand-red' }
            case 'danger':
                return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
            case 'secondary':
                return { bg: 'bg-neutral-50', text: 'text-neutral-600', border: 'border-neutral-200' }
        }
    }

    return (
        <View>
            <Pressable
                onPress={onPress}
                className="bg-white rounded-2xl p-4 shadow-sm shadow-black/5 border border-neutral-100 active:bg-neutral-50"
            >
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                        <Text className="text-neutral-500 text-xs font-medium uppercase tracking-wide">
                            Pedido #{order.codigo_visual}
                        </Text>
                        <Text className="text-neutral-400 text-xs mt-1">
                            {dateFormatted}
                        </Text>
                        {showClientInfo && order.cliente && (
                            <View className="flex-row items-center mt-2">
                                <Ionicons name="person" size={14} color={BRAND_COLORS.red} />
                                <Text className="text-neutral-700 text-xs font-bold ml-1">
                                    {order.cliente.nombre_comercial || order.cliente.razon_social}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View
                        className="px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: `${statusColor}20` }}
                    >
                        <Text
                            className="text-xs font-bold uppercase tracking-wide"
                            style={{ color: statusColor }}
                        >
                            {statusLabel}
                        </Text>
                    </View>
                </View>

                <View className="h-px bg-neutral-100 mb-3" />

                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4">
                        <View>
                            <Text className="text-neutral-400 text-xs mb-1">Total</Text>
                            <Text className="text-brand-red font-bold text-lg">
                                ${Number(order.total_final || 0).toFixed(2)}
                            </Text>
                        </View>

                        <View className="h-8 w-px bg-neutral-200" />

                        <View>
                            <Text className="text-neutral-400 text-xs mb-1">Items</Text>
                            <Text className="text-neutral-700 font-semibold">
                                {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
                            </Text>
                        </View>
                    </View>

                    {order.estado_actual === 'PENDIENTE' && onCancel && !actionButtons && (
                        <Pressable
                            onPress={(e) => {
                                e.stopPropagation()
                                onCancel()
                            }}
                            className="bg-red-50 p-2.5 rounded-full active:bg-red-100"
                        >
                            <Ionicons name="close-circle-outline" size={22} color={BRAND_COLORS.red} />
                        </Pressable>
                    )}

                    {!actionButtons && order.estado_actual !== 'PENDIENTE' && (
                        <View className="bg-neutral-50 p-2.5 rounded-full">
                            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
                        </View>
                    )}
                </View>
            </Pressable>

            {actionButtons && actionButtons.length > 0 && (
                <View className="mt-2">
                    {actionButtons.map((button, index) => {
                        const styles = getButtonStyles(button.variant)
                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={(e) => {
                                    e.stopPropagation()
                                    button.onPress()
                                }}
                                className={`flex-row items-center justify-center py-3 rounded-xl border ${styles.bg} ${styles.border} ${index > 0 ? 'mt-2' : ''}`}
                            >
                                <Ionicons name={button.icon} size={20} color={BRAND_COLORS.red} />
                                <Text className={`${styles.text} font-bold ml-2`}>{button.label}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            )}
        </View>
    )
}
