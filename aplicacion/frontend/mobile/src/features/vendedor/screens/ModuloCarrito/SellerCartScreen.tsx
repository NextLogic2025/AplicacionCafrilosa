import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
    ActivityIndicator
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useCart } from '../../../../context/CartContext'
import { Header } from '../../../../components/ui/Header'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { ClientService, type Client } from '../../../../services/api/ClientService'
import { CartService } from '../../../../services/api/CartService'
import { getToken } from '../../../../storage/authStorage'
import { jwtDecode } from 'jwt-decode'

/**
 * SellerCartScreen - Pantalla del Carrito del Vendedor
 *
 * Características:
 * - Lista de productos en el carrito
 * - Selector de cliente (modal)
 * - Validación de lista de precios
 * - Cálculo de totales con IVA
 * - Crear pedido
 * - Promociones aplicadas
 */
export function SellerCartScreen() {
    const navigation = useNavigation()
    const { cart, removeFromCart, updateQuantity, clearCart, setClient, validatePriceList, recalculatePrices } = useCart()

    const [userId, setUserId] = useState<string>('')
    const [showClientModal, setShowClientModal] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [loadingClients, setLoadingClients] = useState(false)
    const [clientsError, setClientsError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [creatingOrder, setCreatingOrder] = useState(false)

    // Obtener userId del token al montar el componente
    useEffect(() => {
        const getUserId = async () => {
            try {
                const token = await getToken()
                if (token) {
                    const decoded: any = jwtDecode(token)
                    setUserId(decoded.userId || decoded.sub || '')
                }
            } catch (error) {
                console.error('Error decoding token:', error)
            }
        }
        getUserId()
    }, [])

    // Cargar clientes al abrir el modal
    const loadClients = async () => {
        setLoadingClients(true)
        setClientsError(null)
        try {
            const data = await ClientService.getMyClients()

            // Si el array está vacío, puede ser porque el backend falló o no hay clientes asignados
            if (data.length === 0) {
                setClientsError('No tienes clientes asignados o hay un problema de conexión.')
            }

            setClients(data)
        } catch (error) {
            console.error('Error loading clients:', error)
            setClientsError('Error al cargar clientes. Por favor intenta de nuevo.')
        } finally {
            setLoadingClients(false)
        }
    }

    // Filtrar clientes por búsqueda
    const filteredClients = clients.filter(client =>
        client.razon_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.nombre_comercial?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        client.identificacion.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Seleccionar cliente y validar lista de precios
    const handleSelectClient = (client: Client) => {
        setClient(client)
        setShowClientModal(false)

        // Validar si los productos del carrito coinciden con la lista del cliente
        if (cart.items.length > 0 && client.lista_precios_id) {
            const isValid = validatePriceList(client.lista_precios_id)

            if (!isValid) {
                Alert.alert(
                    'Lista de Precios Diferente',
                    `El cliente "${client.nombre_comercial || client.razon_social}" pertenece a una lista de precios diferente a los productos en el carrito.\n\n¿Deseas recalcular los precios según su lista?`,
                    [
                        {
                            text: 'Cancelar',
                            onPress: () => setClient(null),
                            style: 'cancel'
                        },
                        {
                            text: 'Recalcular Precios',
                            onPress: async () => {
                                // TODO: Cargar productos para recalcular
                                Alert.alert('Info', 'Funcionalidad de recalculo en desarrollo')
                            }
                        }
                    ]
                )
            }
        }
    }

    // Crear pedido
    const handleCreateOrder = async () => {
        // Validaciones
        if (cart.items.length === 0) {
            Alert.alert('Carrito Vacío', 'Agrega productos al carrito antes de crear el pedido')
            return
        }

        if (!cart.cliente_id) {
            Alert.alert('Cliente Requerido', 'Selecciona un cliente para crear el pedido')
            setShowClientModal(true)
            return
        }

        if (!userId) {
            Alert.alert('Error', 'No se pudo identificar el vendedor')
            return
        }

        Alert.alert(
            'Confirmar Pedido',
            `¿Deseas crear el pedido para ${cart.cliente_nombre}?${cart.sucursal_nombre ? `\n📍 Sucursal: ${cart.sucursal_nombre}` : ''}\n\nTotal: $${cart.total_final.toFixed(2)}`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Crear Pedido',
                    onPress: async () => {
                        setCreatingOrder(true)
                        try {
                            await CartService.createOrderFromCart({
                                cliente_id: cart.cliente_id!,
                                vendedor_id: userId,
                                sucursal_id: cart.sucursal_id,
                                items: cart.items.map(item => ({
                                    producto_id: item.producto_id,
                                    codigo_sku: item.codigo_sku,
                                    nombre_producto: item.nombre_producto,
                                    cantidad: item.cantidad,
                                    unidad_medida: item.unidad_medida,
                                    precio_lista: item.precio_lista,
                                    precio_final: item.precio_final,
                                    subtotal_linea: item.subtotal,
                                    campania_aplicada_id: item.campania_aplicada_id
                                })),
                                subtotal: cart.subtotal,
                                descuento_total: cart.descuento_total,
                                impuestos_total: cart.impuestos_total,
                                total_final: cart.total_final,
                                condicion_pago: 'CONTADO'
                            })

                            Alert.alert(
                                'Pedido Creado',
                                'El pedido se ha creado exitosamente',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            clearCart()
                                            navigation.navigate('SellerHome' as never)
                                        }
                                    }
                                ]
                            )
                        } catch (error: any) {
                            console.error('Error creating order:', error)
                            Alert.alert('Error', 'No se pudo crear el pedido. Intenta nuevamente.')
                        } finally {
                            setCreatingOrder(false)
                        }
                    }
                }
            ]
        )
    }

    // Renderizar item del carrito
    const renderCartItem = ({ item }: { item: typeof cart.items[0] }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemHeader}>
                {item.imagen_url ? (
                    <Image source={{ uri: item.imagen_url }} style={styles.productImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
                    </View>
                )}

                <View style={styles.itemInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                        {item.nombre_producto}
                    </Text>
                    <Text style={styles.productSku}>{item.codigo_sku}</Text>

                    {item.tiene_promocion && (
                        <View style={styles.promotionBadge}>
                            <Ionicons name="pricetag" size={12} color="#DC2626" />
                            <Text style={styles.promotionText}>
                                -{item.descuento_porcentaje}% OFF
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeFromCart(item.producto_id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.itemFooter}>
                <View style={styles.quantityControl}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.producto_id, item.cantidad - 1)}
                    >
                        <Ionicons name="remove" size={18} color="#DC2626" />
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>{item.cantidad}</Text>

                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.producto_id, item.cantidad + 1)}
                    >
                        <Ionicons name="add" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>

                <View style={styles.priceContainer}>
                    {item.tiene_promocion && (
                        <Text style={styles.originalPrice}>
                            ${(item.precio_lista * item.cantidad).toFixed(2)}
                        </Text>
                    )}
                    <Text style={styles.finalPrice}>
                        ${item.subtotal.toFixed(2)}
                    </Text>
                </View>
            </View>
        </View>
    )

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <Header title="Mi Carrito" variant="standard" />

            {/* Cliente seleccionado */}
            <View style={styles.clientSection}>
                {cart.cliente_id ? (
                    <TouchableOpacity
                        style={styles.selectedClientCard}
                        onPress={() => setShowClientModal(true)}
                    >
                        <View style={styles.clientIcon}>
                            <Ionicons name="person" size={20} color="#DC2626" />
                        </View>
                        <View style={styles.clientInfo}>
                            <Text style={styles.clientLabel}>Cliente</Text>
                            <Text style={styles.clientName}>{cart.cliente_nombre}</Text>
                            {cart.sucursal_nombre && (
                                <Text style={styles.clientBranch}>📍 {cart.sucursal_nombre}</Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.selectClientButton}
                        onPress={() => {
                            loadClients()
                            setShowClientModal(true)
                        }}
                    >
                        <Ionicons name="person-add-outline" size={20} color="#DC2626" />
                        <Text style={styles.selectClientText}>Seleccionar Cliente</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Lista de productos */}
            {cart.items.length > 0 ? (
                <FlatList
                    data={cart.items}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCartItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <EmptyState
                    icon="cart-outline"
                    title="Carrito Vacío"
                    description="Agrega productos desde el catálogo para crear un pedido"
                    actionLabel="Ver Productos"
                    onAction={() => navigation.navigate('SellerProductList' as never)}
                    style={{ marginTop: 60 }}
                />
            )}

            {/* Resumen y totales */}
            {cart.items.length > 0 && (
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>${cart.subtotal.toFixed(2)}</Text>
                    </View>

                    {cart.descuento_total > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: '#10B981' }]}>
                                Descuentos
                            </Text>
                            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                                -${cart.descuento_total.toFixed(2)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>IVA (12%)</Text>
                        <Text style={styles.summaryValue}>${cart.impuestos_total.toFixed(2)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${cart.total_final.toFixed(2)}</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.createOrderButton,
                            (!cart.cliente_id || creatingOrder) && styles.createOrderButtonDisabled
                        ]}
                        onPress={handleCreateOrder}
                        disabled={!cart.cliente_id || creatingOrder}
                    >
                        {creatingOrder ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.createOrderText}>Confirmar Pedido</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Modal de selección de cliente */}
            <Modal
                visible={showClientModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowClientModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
                            <TouchableOpacity
                                onPress={() => setShowClientModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Barra de búsqueda */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#9CA3AF" />
                            <Text
                                style={styles.searchInput}
                                onPress={() => {/* TODO: Implementar búsqueda */}}
                            >
                                Buscar cliente...
                            </Text>
                        </View>

                        {loadingClients ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#DC2626" />
                                <Text style={styles.loadingText}>Cargando clientes...</Text>
                            </View>
                        ) : clientsError ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                                <Text style={styles.emptyTitle}>Error al cargar clientes</Text>
                                <Text style={styles.emptyMessage}>{clientsError}</Text>
                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={loadClients}
                                >
                                    <Ionicons name="refresh" size={18} color="#FFFFFF" />
                                    <Text style={styles.retryButtonText}>Reintentar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setShowClientModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredClients}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.clientItem}
                                        onPress={() => handleSelectClient(item)}
                                    >
                                        <View style={styles.clientItemIcon}>
                                            <Ionicons name="business" size={20} color="#DC2626" />
                                        </View>
                                        <View style={styles.clientItemInfo}>
                                            <Text style={styles.clientItemName}>
                                                {item.nombre_comercial || item.razon_social}
                                            </Text>
                                            <Text style={styles.clientItemRuc}>{item.identificacion}</Text>
                                            {item.lista_precios_id && (
                                                <View style={styles.priceListBadge}>
                                                    <Ionicons name="pricetag" size={10} color="#DC2626" />
                                                    <Text style={styles.priceListText}>
                                                        Lista: {item.lista_precios_id}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    clientsError ? null : (
                                        <View style={styles.emptyContainer}>
                                            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                                            <Text style={styles.emptyTitle}>No hay clientes</Text>
                                            <Text style={styles.emptyMessage}>
                                                No se encontraron clientes asignados a tu cuenta
                                            </Text>
                                        </View>
                                    )
                                }
                                contentContainerStyle={styles.clientList}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    clientSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    selectClientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#DC2626',
        borderStyle: 'dashed',
        gap: 8
    },
    selectClientText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#DC2626'
    },
    selectedClientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 12
    },
    clientIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center'
    },
    clientInfo: {
        flex: 1
    },
    clientLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 2
    },
    clientName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827'
    },
    clientBranch: {
        fontSize: 12,
        fontWeight: '500',
        color: '#059669',
        marginTop: 2
    },
    listContent: {
        padding: 20,
        paddingBottom: 300
    },
    cartItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3
    },
    itemHeader: {
        flexDirection: 'row',
        marginBottom: 12
    },
    productImage: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#F3F4F6'
    },
    placeholderImage: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4
    },
    productSku: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
        marginBottom: 6
    },
    promotionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 4
    },
    promotionText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#DC2626'
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center'
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 12,
        paddingHorizontal: 8
    },
    quantityButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center'
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        minWidth: 24,
        textAlign: 'center'
    },
    priceContainer: {
        alignItems: 'flex-end'
    },
    originalPrice: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        marginBottom: 2
    },
    finalPrice: {
        fontSize: 18,
        fontWeight: '800',
        color: '#DC2626'
    },
    summaryContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 32,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280'
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827'
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827'
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#DC2626'
    },
    createOrderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 16,
        gap: 8,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    createOrderButtonDisabled: {
        backgroundColor: '#D1D5DB'
    },
    createOrderText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF'
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
        height: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827'
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
        gap: 12
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#9CA3AF'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12
    },
    loadingText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center'
    },
    emptyMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        marginBottom: 12,
        minWidth: 160
    },
    retryButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF'
    },
    cancelButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 160,
        alignItems: 'center'
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280'
    },
    clientList: {
        paddingHorizontal: 20,
        paddingBottom: 20
    },
    clientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        fontWeight: '700',
        color: '#111827',
        marginBottom: 3
    },
    clientItemRuc: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
        marginBottom: 4
    },
    priceListBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
        gap: 4
    },
    priceListText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#DC2626'
    }
})
