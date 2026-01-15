import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import {
    OrderService,
    Order,
    OrderDetail,
    OrderStatus,
    ORDER_STATUS_COLORS,
    ORDER_STATUS_LABELS
} from '../../../../services/api/OrderService'
import { BRAND_COLORS } from '../../../../shared/types'

type OrderDetailRouteProp = RouteProp<{ params: { orderId: string } }, 'params'>

// Estados que el supervisor puede asignar (validación de pedidos)
const SUPERVISOR_ALLOWED_STATUSES: OrderStatus[] = [
    'APROBADO',
    'RECHAZADO'
]

// Todos los estados solo para referencia
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

export function SupervisorOrderDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute<OrderDetailRouteProp>()
    const { orderId } = route.params

    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState<Order | null>(null)
    const [details, setDetails] = useState<OrderDetail[]>([])
    const [showStatusModal, setShowStatusModal] = useState(false)

    useEffect(() => {
        loadOrderDetails()
    }, [orderId])

    const loadOrderDetails = async () => {
        setLoading(true)
        try {
            const orderData = await OrderService.getOrderById(orderId)
            setOrder(orderData)
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

    const handleChangeStatus = async (newStatus: OrderStatus) => {
        if (!order) return

        try {
            await OrderService.changeOrderStatus(order.id, newStatus)
            setShowStatusModal(false)
            Alert.alert('Éxito', `Pedido #${order.codigo_visual} actualizado a ${ORDER_STATUS_LABELS[newStatus]}`)
            await loadOrderDetails() // Reload to get updated data
        } catch (error) {
            console.error('Error changing status:', error)
            Alert.alert('Error', 'No se pudo cambiar el estado del pedido')
        }
    }

    if (loading) {
        return (
            <View className="flex-1 bg-neutral-50 justify-center">
                <ActivityIndicator color={BRAND_COLORS.red} size="large" />
            </View>
        )
    }

    if (!order) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle del Pedido" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-neutral-500">Pedido no encontrado</Text>
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title={`Pedido #${order.codigo_visual}`}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>

                {/* Estado Actual */}
                <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5 border-2" style={{ borderColor: ORDER_STATUS_COLORS[order.estado_actual] }}>
                    <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-1">
                            <Text className="text-neutral-400 text-xs font-medium uppercase tracking-wide mb-1">
                                Pedido
                            </Text>
                            <Text className="text-neutral-900 font-bold text-2xl mb-2">
                                #{order.codigo_visual}
                            </Text>
                            <Text className="text-neutral-500 text-sm">
                                {order.created_at ? new Date(order.created_at).toLocaleDateString('es-EC', {
                                    weekday: 'long',
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : 'Fecha no disponible'}
                            </Text>
                        </View>

                        <View
                            className="px-4 py-2 rounded-full"
                            style={{ backgroundColor: `${ORDER_STATUS_COLORS[order.estado_actual]}20` }}
                        >
                            <Text
                                className="text-sm font-bold uppercase tracking-wide text-center"
                                style={{ color: ORDER_STATUS_COLORS[order.estado_actual] }}
                            >
                                {ORDER_STATUS_LABELS[order.estado_actual]}
                            </Text>
                        </View>
                    </View>

                    {/* Botón cambiar estado */}
                    <TouchableOpacity
                        onPress={() => setShowStatusModal(true)}
                        className="mt-3 pt-3 border-t border-neutral-100 flex-row items-center justify-center"
                    >
                        <Ionicons name="swap-horizontal" size={20} color={BRAND_COLORS.red} />
                        <Text className="text-brand-red font-bold ml-2">Cambiar Estado del Pedido</Text>
                    </TouchableOpacity>
                </View>

                {/* Cliente */}
                {order.cliente && (
                    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                        <Text className="text-neutral-900 font-bold text-lg mb-3">Cliente</Text>
                        <View className="flex-row items-center">
                            <Ionicons name="person-outline" size={20} color="#6B7280" />
                            <Text className="text-neutral-900 font-medium ml-2 flex-1">
                                {order.cliente.nombre_comercial || order.cliente.razon_social}
                            </Text>
                        </View>
                        <View className="flex-row items-center mt-2">
                            <Ionicons name="card-outline" size={20} color="#6B7280" />
                            <Text className="text-neutral-600 text-sm ml-2">{order.cliente.identificacion}</Text>
                        </View>
                    </View>
                )}

                {/* Información Adicional */}
                <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                    <Text className="text-neutral-900 font-bold text-lg mb-3">Información</Text>
                    {order.condicion_pago && (
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="cash-outline" size={20} color="#6B7280" />
                            <View className="ml-2 flex-1">
                                <Text className="text-neutral-500 text-xs">Condición de pago</Text>
                                <Text className="text-neutral-900 font-medium">{order.condicion_pago}</Text>
                            </View>
                        </View>
                    )}
                    {order.origen_pedido && (
                        <View className="flex-row items-center">
                            <Ionicons name="phone-portrait-outline" size={20} color="#6B7280" />
                            <View className="ml-2 flex-1">
                                <Text className="text-neutral-500 text-xs">Origen</Text>
                                <Text className="text-neutral-900 font-medium">{order.origen_pedido.replace('_', ' ')}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Productos */}
                <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-neutral-900 font-bold text-lg">
                            Productos ({details.length})
                        </Text>
                        <View className="bg-neutral-100 px-3 py-1 rounded-full">
                            <Text className="text-neutral-600 text-xs font-bold">
                                {details.length} items
                            </Text>
                        </View>
                    </View>

                    {details.length > 0 ? (
                        details.map((item, index) => (
                            <View
                                key={item.id}
                                className={`flex-row justify-between py-3 ${index < details.length - 1 ? 'border-b border-neutral-100' : ''}`}
                            >
                                <View className="flex-1 pr-4">
                                    <Text className="text-neutral-900 font-bold text-sm">
                                        {item.nombre_producto || `Producto ${item.producto_id}`}
                                    </Text>
                                    <Text className="text-neutral-500 text-xs mt-1">
                                        {Number(item.cantidad || 0)} × ${Number(item.precio_final || 0).toFixed(2)}
                                    </Text>
                                    {item.motivo_descuento && (
                                        <Text className="text-green-600 text-xs mt-1">
                                            {item.motivo_descuento}
                                        </Text>
                                    )}
                                    {item.es_bonificacion && (
                                        <View className="bg-green-500 self-start px-2 py-0.5 rounded mt-1">
                                            <Text className="text-white text-xs font-bold">BONIF</Text>
                                        </View>
                                    )}
                                </View>
                                <Text className="text-neutral-900 font-bold text-sm">
                                    ${Number(item.subtotal_linea || 0).toFixed(2)}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-neutral-400 text-sm italic">
                            Detalle de productos no disponible
                        </Text>
                    )}
                </View>

                {/* Totales */}
                <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                    <Text className="text-neutral-900 font-bold text-lg mb-3">Resumen</Text>

                    <View className="flex-row justify-between py-2">
                        <Text className="text-neutral-600">Subtotal</Text>
                        <Text className="text-neutral-900 font-medium">
                            ${Number(order.subtotal || 0).toFixed(2)}
                        </Text>
                    </View>

                    {Number(order.descuento_total || 0) > 0 && (
                        <View className="flex-row justify-between py-2">
                            <Text className="text-green-600">Descuentos</Text>
                            <Text className="text-green-600 font-medium">
                                -${Number(order.descuento_total || 0).toFixed(2)}
                            </Text>
                        </View>
                    )}

                    <View className="flex-row justify-between py-2">
                        <Text className="text-neutral-600">IVA (12%)</Text>
                        <Text className="text-neutral-900 font-medium">
                            ${Number(order.impuestos_total || 0).toFixed(2)}
                        </Text>
                    </View>

                    <View className="flex-row justify-between pt-3 mt-2 border-t border-neutral-200">
                        <Text className="text-neutral-900 font-bold text-lg">Total</Text>
                        <Text className="text-brand-red font-bold text-xl">
                            ${Number(order.total_final || 0).toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Observaciones */}
                {order.observaciones_entrega && (
                    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                        <Text className="text-neutral-900 font-bold text-base mb-2">
                            Observaciones de entrega
                        </Text>
                        <Text className="text-neutral-600 text-sm leading-5">
                            {order.observaciones_entrega}
                        </Text>
                    </View>
                )}

                <View className="h-8" />
            </ScrollView>

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
                                <Text className="text-neutral-500 text-sm mt-1">
                                    Pedido #{order.codigo_visual}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="max-h-96">
                            <View className="p-5">
                                <View className="mb-4 p-3 bg-neutral-50 rounded-xl">
                                    <Text className="text-neutral-600 text-sm mb-1">Estado actual:</Text>
                                    <View
                                        className="self-start px-3 py-1.5 rounded-full"
                                        style={{ backgroundColor: `${ORDER_STATUS_COLORS[order.estado_actual]}20` }}
                                    >
                                        <Text
                                            className="text-sm font-bold uppercase"
                                            style={{ color: ORDER_STATUS_COLORS[order.estado_actual] }}
                                        >
                                            {ORDER_STATUS_LABELS[order.estado_actual]}
                                        </Text>
                                    </View>
                                </View>

                                <Text className="text-neutral-900 font-bold mb-3">Selecciona acción:</Text>
                                <Text className="text-neutral-500 text-sm mb-3">
                                    Como supervisor, puedes aprobar o rechazar pedidos pendientes
                                </Text>

                                {SUPERVISOR_ALLOWED_STATUSES.map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        onPress={() => handleChangeStatus(status)}
                                        className="flex-row items-center justify-between p-4 mb-2 bg-neutral-50 rounded-xl border border-neutral-100 active:bg-neutral-100"
                                        disabled={order.estado_actual === status}
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
                                                <Text className={`font-medium ${order.estado_actual === status ? 'text-neutral-400' : 'text-neutral-900'}`}>
                                                    {ORDER_STATUS_LABELS[status]}
                                                </Text>
                                                <Text className="text-neutral-500 text-xs">
                                                    {status === 'APROBADO' ? 'Validar y aprobar pedido' : 'Rechazar pedido'}
                                                </Text>
                                            </View>
                                        </View>
                                        {order.estado_actual === status && (
                                            <Ionicons name="checkmark-circle" size={24} color={ORDER_STATUS_COLORS[status]} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    )
}
