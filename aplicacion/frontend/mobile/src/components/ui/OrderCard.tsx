import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Order } from '../../services/api/OrderService'

interface OrderCardProps {
    order: Order
    onPress: () => void
    onCancel?: () => void
}

const getStatusColor = (status: Order['status']) => {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800'
        case 'processing': return 'bg-blue-100 text-blue-800'
        case 'shipped': return 'bg-indigo-100 text-indigo-800'
        case 'delivered': return 'bg-green-100 text-green-800'
        case 'cancelled': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

const getStatusLabel = (status: Order['status']) => {
    switch (status) {
        case 'pending': return 'Pendiente'
        case 'processing': return 'Procesando'
        case 'shipped': return 'En camino'
        case 'delivered': return 'Entregado'
        case 'cancelled': return 'Cancelado'
        default: return status
    }
}

export function OrderCard({ order, onPress, onCancel }: OrderCardProps) {
    const statusStyle = getStatusColor(order.status)
    const dateFormatted = new Date(order.date).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric'
    })

    return (
        <Pressable
            onPress={onPress}
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-black/5 border border-neutral-100"
        >
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-neutral-500 text-xs font-medium">#{order.id}</Text>
                    <Text className="text-neutral-900 font-bold text-base mt-0.5">
                        {dateFormatted}
                    </Text>
                </View>
                <View className="flex-row gap-2">
                    <View className={`px-2 py-0.5 rounded-full ${order.origin === 'cliente' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        <Text className={`text-[10px] font-bold uppercase ${order.origin === 'cliente' ? 'text-blue-800' : 'text-purple-800'}`}>
                            {order.origin}
                        </Text>
                    </View>
                    <View className={`px-2.5 py-1 rounded-full ${statusStyle.split(' ')[0]}`}>
                        <Text className={`text-[10px] font-bold uppercase tracking-wide ${statusStyle.split(' ')[1]}`}>
                            {getStatusLabel(order.status)}
                        </Text>
                    </View>
                </View>
            </View>

            <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row items-center gap-4">
                    <View>
                        <Text className="text-neutral-400 text-xs">Total</Text>
                        <Text className="text-brand-red font-bold text-lg">
                            ${order.total.toFixed(2)}
                        </Text>
                    </View>
                    <View className="h-6 w-[1px] bg-neutral-200" />
                    <View>
                        <Text className="text-neutral-400 text-xs">Items</Text>
                        <Text className="text-neutral-700 font-medium">
                            {order.itemsCount} productos
                        </Text>
                    </View>
                </View>

                {order.status === 'pending' && onCancel && (
                    <Pressable
                        onPress={onCancel}
                        className="bg-red-50 p-2 rounded-full active:bg-red-100"
                    >
                        <Ionicons name="close-circle-outline" size={20} color={BRAND_COLORS.red} />
                    </Pressable>
                )}
            </View>
        </Pressable>
    )
}
