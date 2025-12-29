import { useFocusEffect, useNavigation } from '@react-navigation/native'
import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { TransportistaService, type TransportistaOrder } from '../../../services/api/TransportistaService'

export function TransportistaOrdersScreen() {
    const navigation = useNavigation<any>()
    const [orders, setOrders] = useState<TransportistaOrder[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadOrders = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getOrders()
            setOrders(data)
        } catch (error) {
            console.error('Error loading orders:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadOrders() }, []))

    const renderItem = (order: TransportistaOrder) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('TransportistaOrderDetail', { order })}
            className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm active:bg-neutral-50"
        >
            <View className="flex-row justify-between items-start mb-1">
                <Text className="text-neutral-500 text-xs font-bold">Pedido #{order.id}</Text>
                <View className={`px-2 py-0.5 rounded ${order.status === 'shipped' ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                    <Text className={`text-[10px] font-bold ${order.status === 'shipped' ? 'text-blue-700' : 'text-yellow-700'}`}>
                        {order.status === 'shipped' ? 'EN RUTA' : 'LISTO'}
                    </Text>
                </View>
            </View>

            <Text className="font-bold text-neutral-900 text-lg mb-1">{order.clientName}</Text>
            <Text className="text-neutral-500 text-sm mb-3" numberOfLines={1}>{order.address}</Text>

            <View className="flex-row justify-between pt-3 border-t border-neutral-100">
                <Text className="text-neutral-600 font-medium">{order.itemsCount} productos</Text>
                <Text className="font-bold text-neutral-900">${order.total?.toFixed(2)}</Text>
            </View>
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header userName="Transportista" role="TRANSPORTISTA" showNotification={false} />
            <GenericList
                items={orders}
                isLoading={isLoading}
                onRefresh={loadOrders}
                renderItem={renderItem}
                emptyState={{
                    icon: 'cube-outline',
                    title: 'Sin Pedidos',
                    message: 'No hay pedidos asignados'
                }}
            />
        </View>
    )
}
