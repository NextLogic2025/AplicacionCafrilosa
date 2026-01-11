import React, { useCallback, useState } from 'react'
import { View, FlatList, ActivityIndicator, Text, Pressable } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { OrderCard } from '../../../components/ui/OrderCard'
import { EmptyState } from '../../../components/ui/EmptyState'
import { SearchBar } from '../../../components/ui/SearchBar'
import { OrderService, Order } from '../../../services/api/OrderService'
import { UserService } from '../../../services/api/UserService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

// Filtros de estado para "Chips"
const STATUS_FILTERS = [
    { id: 'all', label: 'Todos' },
    { id: 'PENDIENTE', label: 'Pendientes' },
    { id: 'ENTREGADO', label: 'Entregados' },
    { id: 'ANULADO', label: 'Cancelados' },
]

export function ClientOrdersScreen() {
    const navigation = useNavigation()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('all')

    const fetchOrders = async () => {
        setLoading(true)
        try {
            // Obtener ID del usuario actual
            const user = await UserService.getProfile()
            if (user?.id) {
                const data = await OrderService.getClientOrders(user.id)
                setOrders(data)
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchOrders()
            return () => { }
        }, [])
    )

    const handleCancelOrder = async (orderId: string) => {
        try {
            await OrderService.cancelOrder(orderId)
            fetchOrders() // Recargar lista
            alert('Pedido cancelado exitosamente')
        } catch (error) {
            alert('No se pudo cancelar el pedido')
        }
    }

    // Filtrado en memoria (idealmente esto sería params al backend)
    const filteredOrders = React.useMemo(() => {
        return orders.filter(order => {
            const matchesStatus = selectedStatus === 'all' || order.estado_actual === selectedStatus
            const matchesSearch = order.codigo_visual.toString().includes(searchQuery) || order.id.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesStatus && matchesSearch
        })
    }, [orders, selectedStatus, searchQuery])

    // Estadísticas simples
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.estado_actual === 'PENDIENTE').length,
        completed: orders.filter(o => o.estado_actual === 'ENTREGADO').length
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header
                variant="standard"
                title="Mis Pedidos"
            />

            <View className="flex-1">
                {/* 1. Estadísticas Resumen */}
                <View className="flex-row px-5 py-4 gap-3 bg-white border-b border-neutral-100 z-10">
                    <View className="flex-1 bg-neutral-50 p-3 rounded-xl border border-neutral-100 items-center">
                        <Text className="text-neutral-500 text-xs font-medium uppercase mb-1">Totales</Text>
                        <Text className="text-neutral-900 text-xl font-bold">{stats.total}</Text>
                    </View>
                    <View className="flex-1 bg-neutral-50 p-3 rounded-xl border border-neutral-100 items-center">
                        <Text className="text-yellow-600 text-xs font-medium uppercase mb-1">Pendientes</Text>
                        <Text className="text-neutral-900 text-xl font-bold">{stats.pending}</Text>
                    </View>
                    <View className="flex-1 bg-neutral-50 p-3 rounded-xl border border-neutral-100 items-center">
                        <Text className="text-green-600 text-xs font-medium uppercase mb-1">Entregados</Text>
                        <Text className="text-neutral-900 text-xl font-bold">{stats.completed}</Text>
                    </View>
                </View>

                {/* 2. Búsqueda y Filtros */}
                <View className="bg-white px-5 pb-4 shadow-sm shadow-black/5 z-0">
                    <SearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onClear={() => setSearchQuery('')}
                        placeholder="Buscar por # de pedido..."
                    />

                    <View className="flex-row mt-4 gap-2">
                        <FlatList
                            data={STATUS_FILTERS}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => {
                                const isSelected = selectedStatus === item.id
                                return (
                                    <Pressable
                                        onPress={() => setSelectedStatus(item.id)}
                                        className={`px-4 py-1.5 rounded-full mr-2 border ${isSelected ? 'bg-brand-red border-brand-red' : 'bg-white border-neutral-200'}`}
                                    >
                                        <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-600'}`}>
                                            {item.label}
                                        </Text>
                                    </Pressable>
                                )
                            }}
                        />
                    </View>
                </View>

                {/* 3. Lista de Resultados */}
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredOrders}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <OrderCard
                                order={item}
                                // @ts-ignore
                                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                                onCancel={() => handleCancelOrder(item.id)}
                            />
                        )}
                        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <EmptyState
                                icon="receipt-outline"
                                title={searchQuery || selectedStatus !== 'all' ? "No hay resultados" : "Sin historial"}
                                description="No se encontraron pedidos con los filtros actuales."
                                actionLabel="Recargar"
                                onAction={fetchOrders}
                                style={{ marginTop: 20 }}
                            />
                        }
                        refreshing={loading}
                        onRefresh={fetchOrders}
                    />
                )}
            </View>
        </View>
    )
}
