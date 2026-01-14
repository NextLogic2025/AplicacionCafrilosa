import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'
import { Order, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../services/api/OrderService'

interface OrderCardProps {
    order: Order
    onPress: () => void
    onCancel?: () => void
}

/**
 * OrderCard - Tarjeta de pedido con estados visuales
 *
 * Muestra información resumida del pedido con colores
 * según el estado actual (PENDIENTE, EN_RUTA, ENTREGADO, etc.)
 */
export function OrderCard({ order, onPress, onCancel }: OrderCardProps) {
    const statusColor = ORDER_STATUS_COLORS[order.estado_actual]
    const statusLabel = ORDER_STATUS_LABELS[order.estado_actual]

    // Formatear fecha con validación defensiva
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

    // Calcular número de items
    const itemsCount = order.detalles?.length || 0

    return (
        <Pressable
            onPress={onPress}
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-black/5 border border-neutral-100 active:bg-neutral-50"
        >
            {/* Header: Código y Estado */}
            <View className="flex-row justify-between items-start mb-3">
                <View>
                    <Text className="text-neutral-500 text-xs font-medium uppercase tracking-wide">
                        Pedido #{order.codigo_visual}
                    </Text>
                    <Text className="text-neutral-400 text-xs mt-1">
                        {dateFormatted}
                    </Text>
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

            {/* Divider */}
            <View className="h-px bg-neutral-100 mb-3" />

            {/* Footer: Total y Items */}
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                    {/* Total */}
                    <View>
                        <Text className="text-neutral-400 text-xs mb-1">Total</Text>
                        <Text className="text-brand-red font-bold text-lg">
                            ${Number(order.total_final || 0).toFixed(2)}
                        </Text>
                    </View>

                    <View className="h-8 w-px bg-neutral-200" />

                    {/* Items */}
                    <View>
                        <Text className="text-neutral-400 text-xs mb-1">Items</Text>
                        <Text className="text-neutral-700 font-semibold">
                            {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
                        </Text>
                    </View>
                </View>

                {/* Botón de cancelar (solo si está PENDIENTE) */}
                {order.estado_actual === 'PENDIENTE' && onCancel && (
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

                {/* Indicador de ver detalle */}
                {order.estado_actual !== 'PENDIENTE' && (
                    <View className="bg-neutral-50 p-2.5 rounded-full">
                        <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
                    </View>
                )}
            </View>
        </Pressable>
    )
}
