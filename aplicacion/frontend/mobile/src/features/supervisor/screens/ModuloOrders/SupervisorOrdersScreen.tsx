import React, { useState, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { OrderCard } from '../../../../components/ui/OrderCard'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import {
    OrderService,
    Order,
    OrderStatus,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_COLORS
} from '../../../../services/api/OrderService'
import { ClientService, Client } from '../../../../services/api/ClientService'
import { BRAND_COLORS } from '../../../../shared/types'

// Estados que el supervisor puede asignar (validación de pedidos)
const SUPERVISOR_ALLOWED_STATUSES: OrderStatus[] = [
    'APROBADO',
    'RECHAZADO'
]

// Todos los estados para filtros
const ALL_ORDER_STATUSES: OrderStatus[] = [
    'PENDIENTE',
    'APROBADO',
    'EN_PREPARACION',
    'FACTURADO',
    'EN_RUTA',
    'ENTREGADO',
    'ANULADO',
    'RECHAZADO'
]

/**
 * SupervisorOrdersScreen
 * 
 * Pantalla de gestión de pedidos para supervisores con:
 * - Visualización de todos los pedidos
 * - Filtrado por cliente y estado
 * - Cambio de estado de pedidos
 * - Búsqueda por código
 */
export function SupervisorOrdersScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [clients, setClients] = useState<Client[]>([])

    // Filtros
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL')
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

    // Modales
    const [showClientModal, setShowClientModal] = useState(false)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    useFocusEffect(
        useCallback(() => {
            loadOrders()
            loadClients()
        }, [])
    )

    const loadOrders = async () => {
        setLoading(true)
        try {
            // Supervisores usan getOrders() que llama a GET /orders
            const data = await OrderService.getOrders()
            setOrders(data)
        } catch (error) {
            console.error('Error loading orders:', error)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const loadClients = async () => {
        try {
            // Usar getClients() que existe en ClientService
            const data = await ClientService.getClients()
            setClients(data)
        } catch (error) {
            console.error('Error loading clients:', error)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadOrders()
        setRefreshing(false)
    }

    const handleClearFilters = () => {
        setSelectedStatus('ALL')
        setSelectedClient(null)
        setSearchQuery('')
    }

    const handleChangeStatus = (order: Order) => {
        setSelectedOrder(order)
        setShowStatusModal(true)
    }

    const confirmStatusChange = async (newStatus: OrderStatus) => {
        if (!selectedOrder) return

        try {
            await OrderService.changeOrderStatus(selectedOrder.id, newStatus)
            setShowStatusModal(false)
            setSelectedOrder(null)
            Alert.alert('Éxito', `Pedido #${selectedOrder.codigo_visual} actualizado a ${ORDER_STATUS_LABELS[newStatus]}`)
            await loadOrders() // Recargar pedidos
        } catch (error) {
            console.error('Error changing status:', error)
            Alert.alert('Error', 'No se pudo cambiar el estado del pedido')
        }
    }

    // Filtrado local
    const filteredOrders = orders.filter(order => {
        const matchesSearch = searchQuery === '' ||
            order.codigo_visual.toString().includes(searchQuery) ||
            order.id.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = selectedStatus === 'ALL' || order.estado_actual === selectedStatus

        const matchesClient = !selectedClient || order.cliente_id === selectedClient.id

        return matchesSearch && matchesStatus && matchesClient
    })

    const renderFilterChips = () => {
        const hasFilters = selectedStatus !== 'ALL' || selectedClient !== null

        if (!hasFilters) return null

        return (
            <View className="px-5 pb-3 flex-row flex-wrap gap-2">
                {selectedStatus !== 'ALL' && (
                    <View className="bg-red-50 px-3 py-1.5 rounded-full flex-row items-center gap-2">
                        <Text className="text-brand-red text-xs font-bold">
                            {ORDER_STATUS_LABELS[selectedStatus]}
                        </Text>
                        <TouchableOpacity onPress={() => setSelectedStatus('ALL')}>
                            <Ionicons name="close-circle" size={16} color={BRAND_COLORS.red} />
                        </TouchableOpacity>
                    </View>
                )}

                {selectedClient && (
                    <View className="bg-red-50 px-3 py-1.5 rounded-full flex-row items-center gap-2">
                        <Text className="text-brand-red text-xs font-bold">
                            {selectedClient.nombre_comercial || selectedClient.razon_social}
                        </Text>
                        <TouchableOpacity onPress={() => setSelectedClient(null)}>
                            <Ionicons name="close-circle" size={16} color={BRAND_COLORS.red} />
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    onPress={handleClearFilters}
                    className="border border-brand-red px-3 py-1.5 rounded-full"
                >
                    <Text className="text-brand-red text-xs font-bold">Limpiar</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Gestión de Pedidos" variant="standard" showNotification={false} />

            {/* Búsqueda */}
            <View className="px-5 pt-4 pb-3">
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Buscar por código de pedido..."
                    onClear={() => setSearchQuery('')}
                />
            </View>

            {/* Filtros */}
            <View className="px-5 pb-3 gap-3">
                <TouchableOpacity
                    onPress={() => setShowClientModal(true)}
                    className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="person-outline" size={20} color={BRAND_COLORS.red} />
                        <Text className="text-neutral-700 font-medium">
                            {selectedClient ? 'Cliente seleccionado' : 'Filtrar por cliente'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Filtros de estado - Horizontal scroll */}
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[{ id: 'ALL', label: 'Todos' }, ...ALL_ORDER_STATUSES.map(s => ({ id: s, label: ORDER_STATUS_LABELS[s] }))]}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const isSelected = selectedStatus === item.id
                        return (
                            <TouchableOpacity
                                onPress={() => setSelectedStatus(item.id as OrderStatus | 'ALL')}
                                className={`px-4 py-2 rounded-full mr-2 border ${isSelected ? 'bg-brand-red border-brand-red' : 'bg-white border-neutral-200'}`}
                            >
                                <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-600'}`}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )
                    }}
                />
            </View>

            {/* Chips de filtros activos */}
            {renderFilterChips()}

            {/* Lista de pedidos */}
            {loading && !refreshing ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                    <Text className="text-neutral-500 mt-3">Cargando pedidos...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View className="px-5 mb-3">
                            <OrderCard
                                order={item}
                                // @ts-ignore
                                onPress={() => navigation.navigate('SupervisorOrderDetail', { orderId: item.id })}
                            />
                            {/* Botón de cambiar estado */}
                            <TouchableOpacity
                                onPress={() => handleChangeStatus(item)}
                                className="mt-2 bg-white border border-brand-red rounded-xl py-3 flex-row items-center justify-center"
                            >
                                <Ionicons name="swap-horizontal" size={20} color={BRAND_COLORS.red} />
                                <Text className="text-brand-red font-bold ml-2">Cambiar Estado</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    ListEmptyComponent={
                        <EmptyState
                            icon="receipt-outline"
                            title={searchQuery || selectedStatus !== 'ALL' || selectedClient
                                ? 'No hay resultados'
                                : 'Sin pedidos'
                            }
                            description={searchQuery || selectedStatus !== 'ALL' || selectedClient
                                ? 'Intenta ajustar los filtros'
                                : 'No hay pedidos para mostrar'
                            }
                            actionLabel={searchQuery || selectedStatus !== 'ALL' || selectedClient
                                ? 'Limpiar filtros'
                                : undefined
                            }
                            onAction={searchQuery || selectedStatus !== 'ALL' || selectedClient
                                ? handleClearFilters
                                : undefined
                            }
                            style={{ marginTop: 60 }}
                        />
                    }
                />
            )}

            {/* Modal de selección de cliente */}
            <Modal
                visible={showClientModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowClientModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[70%]">
                        <View className="flex-row justify-between items-center p-5 border-b border-neutral-100">
                            <Text className="text-neutral-900 font-bold text-lg">Filtrar por Cliente</Text>
                            <TouchableOpacity onPress={() => setShowClientModal(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={clients}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedClient(item)
                                        setShowClientModal(false)
                                    }}
                                    className="flex-row items-center p-4 border-b border-neutral-50"
                                >
                                    <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="person" size={20} color={BRAND_COLORS.red} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-neutral-900 font-medium">
                                            {item.nombre_comercial || item.razon_social}
                                        </Text>
                                        <Text className="text-neutral-500 text-sm">{item.identificacion}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <EmptyState
                                    icon="person-outline"
                                    title="No hay clientes"
                                    description="No se encontraron clientes"
                                />
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal de cambio de estado */}
            <Modal
                visible={showStatusModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowStatusModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl pb-8">
                        <View className="flex-row justify-between items-center p-5 border-b border-neutral-100">
                            <View>
                                <Text className="text-neutral-900 font-bold text-lg">Cambiar Estado</Text>
                                {selectedOrder && (
                                    <Text className="text-neutral-500 text-sm mt-1">
                                        Pedido #{selectedOrder.codigo_visual}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View className="p-5">
                            {selectedOrder && (
                                <View className="mb-4 p-3 bg-neutral-50 rounded-xl">
                                    <Text className="text-neutral-600 text-sm mb-1">Estado actual:</Text>
                                    <View
                                        className="self-start px-3 py-1.5 rounded-full"
                                        style={{ backgroundColor: `${ORDER_STATUS_COLORS[selectedOrder.estado_actual]}20` }}
                                    >
                                        <Text
                                            className="text-sm font-bold uppercase"
                                            style={{ color: ORDER_STATUS_COLORS[selectedOrder.estado_actual] }}
                                        >
                                            {ORDER_STATUS_LABELS[selectedOrder.estado_actual]}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <Text className="text-neutral-900 font-bold mb-3">Selecciona acción:</Text>
                            <Text className="text-neutral-500 text-sm mb-3">
                                Como supervisor, puedes aprobar o rechazar pedidos pendientes
                            </Text>

                            {SUPERVISOR_ALLOWED_STATUSES.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => confirmStatusChange(status)}
                                    className="flex-row items-center justify-between p-4 mb-2 bg-neutral-50 rounded-xl border border-neutral-100 active:bg-neutral-100"
                                    disabled={selectedOrder?.estado_actual === status}
                                >
                                    <View className="flex-row items-center gap-3">
                                        <View
                                            className="w-10 h-10 rounded-full items-center justify-center"
                                            style={{ backgroundColor: `${ORDER_STATUS_COLORS[status]}20` }}
                                        >
                                            <Ionicons
                                                name={status === 'APROBADO' ? 'checkmark-circle' : 'close-circle'}
                                                size={24}
                                                color={ORDER_STATUS_COLORS[status]}
                                            />
                                        </View>
                                        <View>
                                            <Text className="text-neutral-900 font-medium">
                                                {ORDER_STATUS_LABELS[status]}
                                            </Text>
                                            <Text className="text-neutral-500 text-xs">
                                                {status === 'APROBADO' ? 'Validar y aprobar pedido' : 'Rechazar pedido'}
                                            </Text>
                                        </View>
                                    </View>
                                    {selectedOrder?.estado_actual === status && (
                                        <Ionicons name="checkmark-circle" size={24} color={ORDER_STATUS_COLORS[status]} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}
