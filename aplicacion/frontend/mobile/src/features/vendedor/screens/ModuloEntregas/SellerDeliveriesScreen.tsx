import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { OrderService, type Order } from '../../../../services/api/OrderService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'

export function SellerDeliveriesScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [deliveries, setDeliveries] = useState<Order[]>([])

    useEffect(() => {
        loadDeliveries()
    }, [])

    const loadDeliveries = async () => {
        setLoading(true)
        try {
            // In real integration, fetch orders with status 'shipped' or 'delivered' for today
            const data = await OrderService.getOrders()
            // Mock filter for demonstration purposes
            const shippedOrders = data.filter(o => o.status === 'shipped' || o.status === 'delivered')
            setDeliveries(shippedOrders)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Entregas en Curso" variant="standard" onBackPress={() => navigation.goBack()} notificationRoute="SellerNotifications" />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={deliveries}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="bus-outline"
                            title="Sin Entregas"
                            description="No hay entregas en ruta en este momento."
                            actionLabel="Recargar"
                            onAction={loadDeliveries}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm flex-row items-center">
                            <View className="bg-blue-50 p-3 rounded-full mr-3">
                                <Ionicons name="bus" size={24} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-neutral-900 text-base">{item.clientName}</Text>
                                <Text className="text-neutral-500 text-sm">Pedido #{item.id.slice(0, 8)}</Text>
                                <Text className="text-neutral-400 text-xs mt-1">
                                    {item.status === 'shipped' ? 'En camino' : 'Entregado'} • Conductor: Juan Pérez
                                </Text>
                            </View>
                            <View className="bg-green-100 px-2 py-1 rounded">
                                <Text className="text-green-700 text-[10px] font-bold">ETA: 14:00</Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    )
}
