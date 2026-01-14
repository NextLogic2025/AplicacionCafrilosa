import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { OrderService, type Order } from '../../../../services/api/OrderService'

export function WarehousePreparationScreen() {
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
            // Filter for orders needing preparation (e.g., 'processing' or 'approved')
            // Using 'processing' as the status for preparation phase
            const preparationOrders = allOrders.filter(o => o.status === 'processing' || o.status === 'pending')
            setOrders(preparationOrders)
        } catch (error) {
            console.error('Error loading preparation orders', error)
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmPicking = (order: Order) => {
        Alert.alert('Confirmar Picking', `¿Marcar pedido #${order.id} como Listo para Despacho?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Confirmar',
                onPress: async () => {
                    setLoading(true)
                    await OrderService.confirmPicking(order.id)
                    setLoading(false)
                    Alert.alert('Picking Completado', 'El pedido pasa a zona de despacho.')
                    loadOrders()
                }
            }
        ])
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Preparación de Pedidos" variant="standard" onBackPress={() => navigation.goBack()} />

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
                            icon="cube-outline"
                            title="Sin Pedidos Pendientes"
                            description="No hay pedidos en cola de preparación."
                            actionLabel="Actualizar"
                            onAction={loadOrders}
                        />
                    }
                    renderItem={({ item }) => (
                        <View className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-base font-bold text-neutral-900">Pedido #{item.id}</Text>
                                <View className="bg-orange-100 px-2 py-1 rounded">
                                    <Text className="text-orange-700 text-[10px] font-bold uppercase">POR PREPARAR</Text>
                                </View>
                            </View>

                            <Text className="text-sm text-neutral-600 mb-1">{item.clientName || 'Cliente General'}</Text>
                            <Text className="text-xs text-neutral-400 mb-3">{item.itemsCount} productos • {item.priority?.toUpperCase() || 'NORMAL'}</Text>

                            <TouchableOpacity
                                onPress={() => handleConfirmPicking(item)}
                                className="bg-brand-red py-2.5 rounded-lg items-center flex-row justify-center"
                            >
                                <Ionicons name="checkbox-outline" size={18} color="white" style={{ marginRight: 6 }} />
                                <Text className="text-white font-bold text-sm">Confirmar Picking</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    )
}
