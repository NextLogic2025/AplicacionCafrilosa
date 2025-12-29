import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, View, Pressable } from 'react-native'
import type { Order } from '../../../services/api/OrderService'

type Props = {
    order: Order
    onPress: () => void
    onAction?: () => void
}

export function WarehouseOrderCard({ order, onPress, onAction }: Props) {
    const isUrgent = order.priority === 'urgente'

    return (
        <Pressable
            onPress={onPress}
            className={`bg-white rounded-xl mb-3 shadow-sm border ${isUrgent ? 'border-red-200' : 'border-neutral-100'} overflow-hidden`}
        >
            {/* Header: ID + Fecha + Priority */}
            <View className={`flex-row justify-between items-center p-3 ${isUrgent ? 'bg-red-50/50' : 'bg-neutral-50'}`}>
                <View className="flex-row items-center gap-2">
                    <Text className="font-bold text-neutral-800">#{order.id}</Text>
                    {isUrgent && (
                        <View className="bg-red-100 px-2 py-0.5 rounded">
                            <Text className="text-[10px] font-bold text-red-700 uppercase">URGENTE</Text>
                        </View>
                    )}
                </View>
                <Text className="text-xs text-neutral-500">{new Date(order.date).toLocaleDateString()}</Text>
            </View>

            <View className="p-3">
                {/* Cliente */}
                <View className="flex-row items-center mb-2">
                    <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
                    <Text className="ml-2 font-bold text-neutral-900 text-base">{order.clientName || 'Cliente Desconocido'}</Text>
                </View>

                {/* Origen */}
                <View className="flex-row items-center mb-3">
                    <View className={`px-2 py-0.5 rounded-md ${order.origin === 'vendedor' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                        <Text className={`text-[10px] font-bold uppercase ${order.origin === 'vendedor' ? 'text-purple-700' : 'text-blue-700'}`}>
                            {order.origin === 'vendedor' ? 'Pedido Web Vendedor' : 'Pedido App Cliente'}
                        </Text>
                    </View>
                </View>

                {/* Resumen */}
                <View className="flex-row justify-between items-center border-t border-neutral-100 pt-3">
                    <Text className="text-neutral-500 text-xs">{order.itemsCount} productos</Text>
                    <Pressable
                        className="flex-row items-center bg-brand-red px-3 py-1.5 rounded-lg"
                        onPress={onAction}
                    >
                        <Text className="text-white text-xs font-bold mr-1">Ver Detalle</Text>
                        <Ionicons name="chevron-forward" size={12} color="white" />
                    </Pressable>
                </View>
            </View>
        </Pressable>
    )
}
