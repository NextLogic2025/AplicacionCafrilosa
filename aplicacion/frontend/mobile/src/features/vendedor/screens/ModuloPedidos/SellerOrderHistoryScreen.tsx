import React, { useState, useEffect, useCallback } from 'react'
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { OrderService, Order, OrderStatus, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../../../services/api/OrderService'
import { ClientService, Client } from '../../../../services/api/ClientService'
import { SellerStackParamList } from '../../../../navigation/SellerNavigator'

/**
 * SellerOrderHistoryScreen
 *
 * Pantalla de historial de pedidos del vendedor
 */
export function SellerOrderHistoryScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<SellerStackParamList>>()

    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL')
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [showClientModal, setShowClientModal] = useState(false)
    const [clients, setClients] = useState<Client[]>([])

    useFocusEffect(
        useCallback(() => {
            loadOrders()
        }, [])
    )

    useEffect(() => {
        loadClients()
    }, [])

    const loadClients = async () => {
        try {
            const data = await ClientService.getMyClients()
            setClients(data)
        } catch (error) {
            console.error('Error loading clients:', error)
        }
    }

    const loadOrders = async () => {
        setLoading(true)
        try {
            // Use getOrderHistory() which uses JWT token automatically
            // Backend resolves vendedor_id from token
            const data = await OrderService.getOrderHistory()
            setOrders(data)
            setFilteredOrders(data)
        } catch (error) {
            console.error('Error loading orders:', error)
            setOrders([])
            setFilteredOrders([])
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadOrders()
        setRefreshing(false)
    }

    useEffect(() => {
        let filtered = [...orders]

        if (searchQuery.trim()) {
            filtered = filtered.filter(order =>
                order.codigo_visual.toString().includes(searchQuery.trim())
            )
        }

        if (selectedStatus !== 'ALL') {
            filtered = filtered.filter(order => order.estado_actual === selectedStatus)
        }

        if (selectedClient) {
            filtered = filtered.filter(order => order.cliente_id === selectedClient.id)
        }

        setFilteredOrders(filtered)
    }, [searchQuery, selectedStatus, selectedClient, orders])

    const handleOrderPress = (order: Order) => {
        navigation.navigate('SellerOrderDetail', { orderId: order.id })
    }

    const handleClearFilters = () => {
        setSelectedStatus('ALL')
        setSelectedClient(null)
        setSearchQuery('')
    }

    const renderOrderItem = ({ item }: { item: Order }) => {
        const statusColor = ORDER_STATUS_COLORS[item.estado_actual]
        const statusLabel = ORDER_STATUS_LABELS[item.estado_actual]

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => handleOrderPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.orderCodeContainer}>
                        <Ionicons name="receipt-outline" size={20} color="#DC2626" />
                        <Text style={styles.orderCode}>Pedido #{item.codigo_visual}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {statusLabel}
                        </Text>
                    </View>
                </View>

                {item.cliente && (
                    <View style={styles.clientInfo}>
                        <Ionicons name="person-outline" size={16} color="#6B7280" />
                        <Text style={styles.clientName}>
                            {item.cliente.nombre_comercial || item.cliente.razon_social}
                        </Text>
                    </View>
                )}

                <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                        <Text style={styles.detailText}>
                            {OrderService.formatOrderDateShort(item.created_at)}
                        </Text>
                    </View>

                    {item.condicion_pago && (
                        <View style={styles.detailRow}>
                            <Ionicons name="cash-outline" size={16} color="#9CA3AF" />
                            <Text style={styles.detailText}>{item.condicion_pago}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.orderFooter}>
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${Number(item.total_final || 0).toFixed(2)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
            </TouchableOpacity>
        )
    }

    const renderFilterChips = () => {
        const hasFilters = selectedStatus !== 'ALL' || selectedClient !== null

        if (!hasFilters) return null

        return (
            <View style={styles.filterChipsContainer}>
                {selectedStatus !== 'ALL' && (
                    <View style={styles.filterChip}>
                        <Text style={styles.filterChipText}>
                            {ORDER_STATUS_LABELS[selectedStatus]}
                        </Text>
                        <TouchableOpacity onPress={() => setSelectedStatus('ALL')}>
                            <Ionicons name="close-circle" size={18} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                )}

                {selectedClient && (
                    <View style={styles.filterChip}>
                        <Text style={styles.filterChipText}>
                            {selectedClient.nombre_comercial || selectedClient.razon_social}
                        </Text>
                        <TouchableOpacity onPress={() => setSelectedClient(null)}>
                            <Ionicons name="close-circle" size={18} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={handleClearFilters}
                >
                    <Text style={styles.clearFiltersText}>Limpiar</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Historial de Pedidos" variant="standard" />

            <View style={styles.searchSection}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Buscar por código de pedido..."
                />
            </View>

            <View style={styles.filtersSection}>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowClientModal(true)}
                >
                    <Ionicons name="person-outline" size={18} color="#DC2626" />
                    <Text style={styles.filterButtonText}>
                        {selectedClient ? 'Cliente' : 'Filtrar por cliente'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.statusFilters}>
                    <TouchableOpacity
                        style={[
                            styles.statusFilterChip,
                            selectedStatus === 'ALL' && styles.statusFilterChipActive
                        ]}
                        onPress={() => setSelectedStatus('ALL')}
                    >
                        <Text
                            style={[
                                styles.statusFilterText,
                                selectedStatus === 'ALL' && styles.statusFilterTextActive
                            ]}
                        >
                            Todos
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.statusFilterChip,
                            selectedStatus === 'PENDIENTE' && styles.statusFilterChipActive
                        ]}
                        onPress={() => setSelectedStatus('PENDIENTE')}
                    >
                        <Text
                            style={[
                                styles.statusFilterText,
                                selectedStatus === 'PENDIENTE' && styles.statusFilterTextActive
                            ]}
                        >
                            Pendientes
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.statusFilterChip,
                            selectedStatus === 'ENTREGADO' && styles.statusFilterChipActive
                        ]}
                        onPress={() => setSelectedStatus('ENTREGADO')}
                    >
                        <Text
                            style={[
                                styles.statusFilterText,
                                selectedStatus === 'ENTREGADO' && styles.statusFilterTextActive
                            ]}
                        >
                            Entregados
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {renderFilterChips()}

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#DC2626" />
                    <Text style={styles.loadingText}>Cargando pedidos...</Text>
                </View>
            ) : filteredOrders.length > 0 ? (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#DC2626']}
                            tintColor="#DC2626"
                        />
                    }
                />
            ) : (
                <EmptyState
                    icon="receipt-outline"
                    title={searchQuery || selectedStatus !== 'ALL' || selectedClient
                        ? 'No se encontraron pedidos'
                        : 'Sin pedidos aún'
                    }
                    description={searchQuery || selectedStatus !== 'ALL' || selectedClient
                        ? 'Intenta ajustar los filtros'
                        : 'Tus pedidos aparecerán aquí'
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
            )}

            <Modal
                visible={showClientModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowClientModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filtrar por Cliente</Text>
                            <TouchableOpacity
                                onPress={() => setShowClientModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={clients}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.clientItem}
                                    onPress={() => {
                                        setSelectedClient(item)
                                        setShowClientModal(false)
                                    }}
                                >
                                    <View style={styles.clientItemIcon}>
                                        <Ionicons name="person" size={20} color="#DC2626" />
                                    </View>
                                    <View style={styles.clientItemInfo}>
                                        <Text style={styles.clientItemName}>
                                            {item.nombre_comercial || item.razon_social}
                                        </Text>
                                        <Text style={styles.clientItemId}>
                                            {item.identificacion}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <EmptyState
                                    icon="person-outline"
                                    title="No hay clientes"
                                    description="No tienes clientes asignados"
                                />
                            }
                        />
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    searchSection: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12
    },
    filtersSection: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        gap: 12
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 8
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937'
    },
    statusFilters: {
        flexDirection: 'row',
        gap: 8
    },
    statusFilterChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    statusFilterChipActive: {
        backgroundColor: '#DC2626',
        borderColor: '#DC2626'
    },
    statusFilterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280'
    },
    statusFilterTextActive: {
        color: '#FFFFFF'
    },
    filterChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        paddingBottom: 12,
        gap: 8
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        gap: 6
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#DC2626'
    },
    clearFiltersButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DC2626'
    },
    clearFiltersText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#DC2626'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12
    },
    loadingText: {
        fontSize: 14,
        color: '#9CA3AF'
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    orderCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    orderCode: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937'
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12
    },
    clientName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        flex: 1
    },
    orderDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    detailText: {
        fontSize: 13,
        color: '#6B7280'
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    totalContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8
    },
    totalLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500'
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#DC2626'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '70%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937'
    },
    closeButton: {
        padding: 4
    },
    clientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12
    },
    clientItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center'
    },
    clientItemInfo: {
        flex: 1
    },
    clientItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2
    },
    clientItemId: {
        fontSize: 13,
        color: '#6B7280'
    }
})
