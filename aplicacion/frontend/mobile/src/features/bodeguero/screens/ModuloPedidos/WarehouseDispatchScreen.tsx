import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { OrderService, type Order } from '../../../../services/api/OrderService'

export function WarehouseDispatchScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])

    useEffect(() => {
        loadOrders()
    }, [])

    const loadOrders = async () => {
        setLoading(true)
        try {
            const allOrders = await OrderService.getOrders()
            // Filter: Shipped/Ready status. Assuming 'shipped' implies ready for final dispatch or create 'ready_dispatch' status logic.
            // For now, let's assume 'shipped' implies "En proceso de entrega" but for the warehouse, maybe we want 'processing' -> 'ready'.
            // Using 'shipped' as "Listo para salir" for simplicity in this context or assuming a custom status.
            // Let's assume we filter orders that are "Pending Dispatch".
            const readyOrders = allOrders.filter(o => o.status === 'shipped') // Placeholder logic
            setOrders(readyOrders)
        } catch (error) {
            console.error('Error loading dispatch orders', error)
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmDispatch = (order: Order) => {
        Alert.alert('Confirmar Salida', `¿Autorizar salida del pedido #${order.id}?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Autorizar',
                onPress: async () => {
                    setLoading(true)
                    // Mock carrier info
                    await OrderService.confirmDispatch(order.id, 'CARRIER-01', `GUIDE-${order.id}`)
                    setLoading(false)
                    Alert.alert('Despacho Registrado', 'Se ha generado la guía interna.')
                    loadOrders()
                }
            }
        ])
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Despachos" variant="standard" onBackPress={() => navigation.goBack()} />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="bus-outline"
                            title="Zona de Despacho Vacía"
                            description="No hay pedidos listos para salir."
                            actionLabel="Actualizar"
                            onAction={loadOrders}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-base font-bold text-neutral-900">Pedido #{item.id}</Text>
                                <View className="bg-blue-100 px-2 py-1 rounded">
                                    <Text className="text-blue-700 text-[10px] font-bold uppercase">LISTO PARA SALIR</Text>
                                </View>
                            </View>
                            <Text className="text-sm text-neutral-600 mb-1">Destino: {item.clientName}</Text>
                            <Text className="text-xs text-neutral-400 mb-3">Transportista Asignado: T-99</Text>

                            <TouchableOpacity
                                onPress={() => handleConfirmDispatch(item)}
                                className="bg-neutral-900 py-2.5 rounded-lg items-center flex-row justify-center"
                            >
                                <Ionicons name="paper-plane-outline" size={18} color="white" style={{ marginRight: 6 }} />
                                <Text className="text-white font-bold text-sm">Confirmar Salida</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    )
}
