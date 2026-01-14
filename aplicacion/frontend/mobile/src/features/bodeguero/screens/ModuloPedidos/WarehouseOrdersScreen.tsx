import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { WarehouseOrderCard } from '../../components/WarehouseOrderCard'
import { OrderService, type Order } from '../../../../services/api/OrderService'

export function WarehouseOrdersScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [filter, setFilter] = useState<'Pendientes' | 'Preparación'>('Pendientes')

    useEffect(() => {
        loadOrders()
    }, [])

    const loadOrders = async () => {
        setLoading(true)
        try {
            const data = await OrderService.getOrders()
            setOrders(data)
        } catch (error) {
            console.error('Error loading orders', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredOrders = orders.filter(o =>
        filter === 'Pendientes' ? o.estado_actual === 'PENDIENTE' : o.estado_actual === 'EN_PREPARACION'
    )

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Gestión de Pedidos" variant="standard" />

            <View className="px-5 py-4 bg-white border-b border-neutral-100 z-10">
                {/* Search */}
                <View className="flex-row items-center bg-neutral-100 rounded-xl px-4 h-10 mb-3">
                    <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder="Buscar pedido o cliente..."
                        className="flex-1 text-sm font-medium text-neutral-900"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Tabs Filtro */}
                <View className="flex-row gap-3">
                    <FilterTab label="Pendientes" active={filter === 'Pendientes'} onPress={() => setFilter('Pendientes')} count={orders.filter(o => o.estado_actual === 'PENDIENTE').length} />
                    <FilterTab label="En Preparación" active={filter === 'Preparación'} onPress={() => setFilter('Preparación')} count={orders.filter(o => o.estado_actual === 'EN_PREPARACION').length} />
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <WarehouseOrderCard
                            order={item}
                            onPress={() => console.log('Open Detail', item.id)} // TODO: Navigate to detail
                            onAction={() => console.log('Action', item.id)}
                        />
                    )}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="checkmark-circle-outline"
                            title="Sin pedidos pendientes"
                            description="No hay órdenes en esta categoría."
                            actionLabel="Actualizar"
                            onAction={loadOrders}
                        />
                    }
                />
            )}
        </View>
    )
}

function FilterTab({ label, active, onPress, count }: { label: string, active: boolean, onPress: () => void, count?: number }) {
    return (
        <React.Fragment>
            {/* @ts-ignore */}
            <Text
                onPress={onPress}
                className={`overflow-hidden rounded-full px-4 py-1.5 text-xs font-bold border ${active ? 'bg-brand-red border-brand-red text-white' : 'bg-white border-neutral-200 text-neutral-600'
                    }`}
            >
                {label} {count !== undefined && count > 0 && `(${count})`}
            </Text>
        </React.Fragment>
    )
}
