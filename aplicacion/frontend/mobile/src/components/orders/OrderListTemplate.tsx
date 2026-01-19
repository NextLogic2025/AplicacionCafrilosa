import React, { useMemo, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, Pressable, Modal, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../ui/Header'
import { SearchBar } from '../ui/SearchBar'
import { EmptyState } from '../ui/EmptyState'
import { OrderCard } from '../ui/OrderCard'
import { Order, OrderStatus, ORDER_STATUS_LABELS } from '../../services/api/OrderService'
import { Client } from '../../services/api/ClientService'
import { BRAND_COLORS } from '../../shared/types'

interface OrderListTemplateProps {
    roleType: 'cliente' | 'supervisor' | 'vendedor'
    orders: Order[]
    loading: boolean
    refreshing?: boolean
    onRefresh: () => Promise<void>
    onOrderPress: (orderId: string) => void

    showClientFilter?: boolean
    clients?: Client[]

    actionButtons?: Array<{
        id: string
        label: string
        icon: keyof typeof Ionicons.glyphMap
        color: string
    }>
    onActionPress?: (order: Order, actionId: string) => void
}

const STATUS_FILTERS: Array<{ id: OrderStatus | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'Todos' },
    { id: 'PENDIENTE', label: 'Pendiente' },
    { id: 'APROBADO', label: 'Aprobado' },
    { id: 'EN_PREPARACION', label: 'En Preparación' },
    { id: 'FACTURADO', label: 'Facturado' },
    { id: 'EN_RUTA', label: 'En Ruta' },
    { id: 'ENTREGADO', label: 'Entregado' },
    { id: 'ANULADO', label: 'Anulado' },
    { id: 'RECHAZADO', label: 'Rechazado' },
]

export function OrderListTemplate({
    roleType,
    orders,
    loading,
    refreshing = false,
    onRefresh,
    onOrderPress,
    showClientFilter = false,
    clients = [],
    actionButtons,
    onActionPress
}: OrderListTemplateProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL')
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [showClientModal, setShowClientModal] = useState(false)

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = searchQuery === '' ||
                order.codigo_visual.toString().includes(searchQuery) ||
                order.id.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus = selectedStatus === 'ALL' || order.estado_actual === selectedStatus

            const matchesClient = !selectedClient || order.cliente_id === selectedClient.id

            return matchesSearch && matchesStatus && matchesClient
        })
    }, [orders, searchQuery, selectedStatus, selectedClient])

    const stats = useMemo(() => ({
        total: orders.length,
        pending: orders.filter(o => o.estado_actual === 'PENDIENTE').length,
        completed: orders.filter(o => o.estado_actual === 'ENTREGADO').length
    }), [orders])

    const handleClearFilters = () => {
        setSelectedStatus('ALL')
        setSelectedClient(null)
        setSearchQuery('')
    }

    const hasActiveFilters = selectedStatus !== 'ALL' || selectedClient !== null

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header
                variant="standard"
                title={roleType === 'cliente' ? 'Mis Pedidos' : roleType === 'supervisor' ? 'Gestión de Pedidos' : 'Mis Pedidos'}
            />

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

            <View className="bg-white px-5 pb-4 shadow-sm shadow-black/5 z-0">
                {roleType !== 'supervisor' && (
                    <SearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onClear={() => setSearchQuery('')}
                        placeholder="Buscar por # de pedido..."
                    />
                )}

                {showClientFilter && (
                    <TouchableOpacity
                        onPress={() => setShowClientModal(true)}
                        className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex-row items-center justify-between mt-3"
                    >
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="person-outline" size={20} color={BRAND_COLORS.red} />
                            <Text className="text-neutral-700 font-medium">
                                {selectedClient ? selectedClient.nombre_comercial || selectedClient.razon_social : 'Filtrar por cliente'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}

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

                {hasActiveFilters && (
                    <View className="flex-row flex-wrap gap-2 mt-3">
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
                )}
            </View>

            {loading && !refreshing ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View className="px-5 mb-3">
                            <OrderCard
                                order={item}
                                onPress={() => onOrderPress(item.id)}
                                showClientInfo={roleType !== 'cliente'}
                                actionButtons={actionButtons?.map(btn => ({
                                    ...btn,
                                    onPress: () => onActionPress?.(item, btn.id),
                                    variant: 'primary' as const
                                }))}
                            />
                        </View>
                    )}
                    contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <EmptyState
                            icon="receipt-outline"
                            title={searchQuery || hasActiveFilters ? "No hay resultados" : "Sin pedidos"}
                            description={searchQuery || hasActiveFilters ? "No se encontraron pedidos con los filtros actuales." : "No hay pedidos para mostrar."}
                            actionLabel={searchQuery || hasActiveFilters ? "Limpiar filtros" : "Recargar"}
                            onAction={searchQuery || hasActiveFilters ? handleClearFilters : onRefresh}
                            style={{ marginTop: 20 }}
                        />
                    }
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}

            {showClientFilter && (
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
            )}
        </View>
    )
}
