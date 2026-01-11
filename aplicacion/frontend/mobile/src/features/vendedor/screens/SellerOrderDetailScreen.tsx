import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { EmptyState } from '../../../components/ui/EmptyState'
import {
    OrderService,
    Order,
    OrderDetail,
    ORDER_STATUS_COLORS,
    ORDER_STATUS_LABELS
} from '../../../services/api/OrderService'

type OrderDetailRouteProp = RouteProp<{ params: { orderId: string } }, 'params'>

/**
 * SellerOrderDetailScreen
 *
 * Pantalla de detalles de un pedido específico
 *
 * Características:
 * - Información completa del pedido
 * - Lista de productos (detalles)
 * - Estado visual con colores
 * - Información del cliente
 * - Totales con IVA
 * - Condición de pago
 * - Fechas
 * - Observaciones
 *
 * Backend:
 * - GET /api/orders/:id para header
 * - GET /api/orders/:id/detalles para items (cuando se implemente)
 */
export function SellerOrderDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute<OrderDetailRouteProp>()
    const { orderId } = route.params

    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState<Order | null>(null)
    const [details, setDetails] = useState<OrderDetail[]>([])

    useEffect(() => {
        loadOrderDetails()
    }, [orderId])

    const loadOrderDetails = async () => {
        setLoading(true)
        try {
            // Cargar pedido
            const orderData = await OrderService.getOrderById(orderId)
            setOrder(orderData)

            // Cargar detalles (items)
            const detailsData = await OrderService.getOrderDetails(orderId)
            setDetails(detailsData)
        } catch (error) {
            console.error('Error loading order details:', error)
            Alert.alert(
                'Error',
                'No se pudo cargar el pedido',
                [
                    { text: 'Reintentar', onPress: loadOrderDetails },
                    { text: 'Volver', onPress: () => navigation.goBack() }
                ]
            )
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="Detalle del Pedido" variant="standard" onBackPress={() => navigation.goBack()} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#DC2626" />
                    <Text style={styles.loadingText}>Cargando pedido...</Text>
                </View>
            </View>
        )
    }

    if (!order) {
        return (
            <View style={styles.container}>
                <Header title="Detalle del Pedido" variant="standard" onBackPress={() => navigation.goBack()} />
                <EmptyState
                    icon="alert-circle-outline"
                    title="Pedido no encontrado"
                    description="No se pudo cargar la información del pedido"
                    actionLabel="Volver"
                    onAction={() => navigation.goBack()}
                />
            </View>
        )
    }

    const statusColor = ORDER_STATUS_COLORS[order.estado_actual]
    const statusLabel = ORDER_STATUS_LABELS[order.estado_actual]

    return (
        <View style={styles.container}>
            <Header title={`Pedido #${order.codigo_visual}`} variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Estado del pedido */}
                <View style={styles.section}>
                    <View style={[styles.statusCard, { backgroundColor: statusColor + '15' }]}>
                        <View style={[styles.statusIcon, { backgroundColor: statusColor + '30' }]}>
                            <Ionicons
                                name={order.estado_actual === 'ENTREGADO' ? 'checkmark-circle' : 'time-outline'}
                                size={32}
                                color={statusColor}
                            />
                        </View>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusLabel}>Estado</Text>
                            <Text style={[styles.statusValue, { color: statusColor }]}>
                                {statusLabel}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Información del cliente */}
                {order.cliente && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cliente</Text>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Ionicons name="person-outline" size={20} color="#6B7280" />
                                <Text style={styles.infoText}>
                                    {order.cliente.nombre_comercial || order.cliente.razon_social}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="card-outline" size={20} color="#6B7280" />
                                <Text style={styles.infoText}>{order.cliente.identificacion}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Información del pedido */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Fecha de creación</Text>
                                <Text style={styles.infoValue}>
                                    {OrderService.formatOrderDate(order.created_at)}
                                </Text>
                            </View>
                        </View>

                        {order.condicion_pago && (
                            <View style={styles.infoRow}>
                                <Ionicons name="cash-outline" size={20} color="#6B7280" />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Condición de pago</Text>
                                    <Text style={styles.infoValue}>{order.condicion_pago}</Text>
                                </View>
                            </View>
                        )}

                        {order.origen_pedido && (
                            <View style={styles.infoRow}>
                                <Ionicons name="location-outline" size={20} color="#6B7280" />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Origen</Text>
                                    <Text style={styles.infoValue}>{order.origen_pedido}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Productos (Detalles) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Productos ({details.length > 0 ? details.length : 'N/A'})
                    </Text>

                    {details.length > 0 ? (
                        <View style={styles.productsContainer}>
                            {details.map((item, index) => (
                                <View key={item.id} style={styles.productItem}>
                                    <View style={styles.productHeader}>
                                        <Text style={styles.productName}>
                                            {item.nombre_producto || 'Producto'}
                                        </Text>
                                        {item.es_bonificacion && (
                                            <View style={styles.bonificacionBadge}>
                                                <Text style={styles.bonificacionText}>BONIF</Text>
                                            </View>
                                        )}
                                    </View>

                                    {item.codigo_sku && (
                                        <Text style={styles.productSKU}>SKU: {item.codigo_sku}</Text>
                                    )}

                                    <View style={styles.productDetails}>
                                        <View style={styles.productDetailRow}>
                                            <Text style={styles.productDetailLabel}>Cantidad:</Text>
                                            <Text style={styles.productDetailValue}>
                                                {item.cantidad} {item.unidad_medida || 'unid'}
                                            </Text>
                                        </View>

                                        <View style={styles.productDetailRow}>
                                            <Text style={styles.productDetailLabel}>Precio:</Text>
                                            <Text style={styles.productDetailValue}>
                                                ${item.precio_final?.toFixed(2) || '0.00'}
                                            </Text>
                                        </View>

                                        <View style={styles.productDetailRow}>
                                            <Text style={styles.productDetailLabel}>Subtotal:</Text>
                                            <Text style={styles.productTotal}>
                                                ${item.subtotal_linea.toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>

                                    {item.motivo_descuento && (
                                        <Text style={styles.descuentoText}>
                                            💰 {item.motivo_descuento}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyProducts}>
                            <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyProductsText}>
                                Los detalles del pedido no están disponibles
                            </Text>
                            <Text style={styles.emptyProductsHint}>
                                El backend aún no retorna los items
                            </Text>
                        </View>
                    )}
                </View>

                {/* Observaciones */}
                {order.observaciones_entrega && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Observaciones</Text>
                        <View style={styles.observacionesCard}>
                            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                            <Text style={styles.observacionesText}>{order.observaciones_entrega}</Text>
                        </View>
                    </View>
                )}

                {/* Resumen de totales */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen</Text>
                    <View style={styles.totalsCard}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalValue}>${order.subtotal.toFixed(2)}</Text>
                        </View>

                        {order.descuento_total > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: '#10B981' }]}>Descuentos</Text>
                                <Text style={[styles.totalValue, { color: '#10B981' }]}>
                                    -${order.descuento_total.toFixed(2)}
                                </Text>
                            </View>
                        )}

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>IVA (12%)</Text>
                            <Text style={styles.totalValue}>${order.impuestos_total.toFixed(2)}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.totalRow}>
                            <Text style={styles.totalFinalLabel}>Total</Text>
                            <Text style={styles.totalFinalValue}>${order.total_final.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Botón de acción (futuro) */}
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => Alert.alert('Info', 'Funcionalidad próximamente')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="print-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Imprimir / Compartir</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    scrollView: {
        flex: 1
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
    section: {
        paddingHorizontal: 20,
        paddingTop: 20
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        gap: 16
    },
    statusIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center'
    },
    statusInfo: {
        flex: 1
    },
    statusLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4
    },
    statusValue: {
        fontSize: 20,
        fontWeight: '700'
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    infoText: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
        flex: 1
    },
    infoTextContainer: {
        flex: 1
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2
    },
    infoValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600'
    },
    productsContainer: {
        gap: 12
    },
    productItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1
    },
    bonificacionBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6
    },
    bonificacionText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF'
    },
    productSKU: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8
    },
    productDetails: {
        gap: 6
    },
    productDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    productDetailLabel: {
        fontSize: 13,
        color: '#6B7280'
    },
    productDetailValue: {
        fontSize: 13,
        color: '#1F2937',
        fontWeight: '600'
    },
    productTotal: {
        fontSize: 14,
        color: '#DC2626',
        fontWeight: '700'
    },
    descuentoText: {
        fontSize: 12,
        color: '#10B981',
        marginTop: 8,
        fontStyle: 'italic'
    },
    emptyProducts: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    emptyProductsText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center'
    },
    emptyProductsHint: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center'
    },
    observacionesCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: '#FDE68A'
    },
    observacionesText: {
        fontSize: 14,
        color: '#78350F',
        flex: 1,
        lineHeight: 20
    },
    totalsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    totalLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500'
    },
    totalValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600'
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8
    },
    totalFinalLabel: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '700'
    },
    totalFinalValue: {
        fontSize: 20,
        color: '#DC2626',
        fontWeight: '700'
    },
    actionSection: {
        padding: 20,
        paddingBottom: 40
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF'
    }
})
