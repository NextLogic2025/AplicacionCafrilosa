import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { OrderService, Order, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../../../services/api/OrderService'
import { BRAND_COLORS } from '../../../../shared/types'

/**
 * ClientOrderDetailScreen
 *
 * Pantalla de detalle completo del pedido con trazabilidad.
 * Muestra información del pedido, items, totales y historial de estados.
 * 
 * PERMISOS DEL CLIENTE:
 * - ✅ VER detalle completo del pedido
 * - ✅ CANCELAR pedido (solo si está en estado PENDIENTE)
 * - ❌ NO puede EDITAR ni MODIFICAR pedidos
 */
export function ClientOrderDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    // @ts-ignore
    const { orderId } = route.params || {}

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => {
        if (orderId) {
            loadOrder()
        }
    }, [orderId])

    const loadOrder = async () => {
        try {
            const data = await OrderService.getOrderById(orderId)
            setOrder(data || null)
        } catch (error) {
            console.error('Error cargando pedido:', error)
            Alert.alert('Error', 'No se pudo cargar el detalle del pedido')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelOrder = async () => {
        if (!order) return

        Alert.alert(
            'Cancelar Pedido',
            '¿Estás seguro de que quieres cancelar este pedido? Esta acción no se puede deshacer.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(true)
                        try {
                            await OrderService.cancelOrder(order.id)
                            // Recargar pedido para actualizar estado
                            await loadOrder()
                            Alert.alert('Pedido cancelado', 'El pedido ha sido cancelado exitosamente.')
                        } catch (error: any) {
                            console.error('Error cancelando pedido:', error)
                            Alert.alert('Error', error.message || 'No se pudo cancelar el pedido')
                        } finally {
                            setCancelling(false)
                        }
                    }
                }
            ]
        )
    }

    /**
     * Generar historial de trazabilidad basado en el estado actual
     * En un futuro, esto vendría del backend con timestamps reales
     */
    const getStatusHistory = (currentStatus: string, createdAt: string) => {
        const statuses = ['PENDIENTE', 'APROBADO', 'EN_PREPARACION', 'FACTURADO', 'EN_RUTA', 'ENTREGADO']
        const history = []

        // Validar fecha antes de parsear
        const createdDate = createdAt ? new Date(createdAt) : new Date()
        
        // Validar que la fecha sea válida
        if (isNaN(createdDate.getTime())) {
            // Si la fecha es inválida, usar fecha actual
            createdDate.setTime(Date.now())
        }

        for (let i = 0; i < statuses.length; i++) {
            const status = statuses[i]
            const isCompleted = statuses.indexOf(currentStatus) >= i
            const isCurrent = status === currentStatus

            // Simular fechas incrementales
            const statusDate = new Date(createdDate.getTime() + (i * 24 * 60 * 60 * 1000)) // +1 día por estado

            history.push({
                status,
                label: ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS],
                color: ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS],
                isCompleted,
                isCurrent,
                date: isCompleted ? statusDate.toISOString() : null
            })

            if (status === currentStatus) break
        }

        return history
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
            <View className="flex-1 bg-neutral-50 relative">
                <Header title="Detalle del Pedido" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-neutral-500">Pedido no encontrado</Text>
                </View>
            </View>
        )
    }

    const statusHistory = getStatusHistory(order.estado_actual, order.created_at)
    const canCancel = order.estado_actual === 'PENDIENTE'

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title={`Pedido #${order.codigo_visual}`}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>

                {/* Estado Actual y Fecha */}
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

                    {/* Origen del pedido */}
                    {order.origen_pedido && (
                        <View className="flex-row items-center mt-3 pt-3 border-t border-neutral-100">
                            <Ionicons name="phone-portrait-outline" size={16} color="#9CA3AF" />
                            <Text className="text-neutral-500 text-sm ml-2">
                                Realizado desde: {order.origen_pedido.replace('_', ' ')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Trazabilidad - Timeline */}
                <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                    <Text className="text-neutral-900 font-bold text-lg mb-4">Trazabilidad del Pedido</Text>

                    {statusHistory.map((step, index) => (
                        <View key={step.status} className="flex-row items-start mb-4 last:mb-0">
                            {/* Indicador de estado */}
                            <View className="mr-4">
                                {step.isCompleted ? (
                                    <View
                                        className="w-8 h-8 rounded-full items-center justify-center"
                                        style={{ backgroundColor: step.color }}
                                    >
                                        <Ionicons name="checkmark" size={16} color="white" />
                                    </View>
                                ) : step.isCurrent ? (
                                    <View
                                        className="w-8 h-8 rounded-full items-center justify-center border-2"
                                        style={{ borderColor: step.color, backgroundColor: `${step.color}20` }}
                                    >
                                        <View
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: step.color }}
                                        />
                                    </View>
                                ) : (
                                    <View className="w-8 h-8 rounded-full border-2 border-neutral-300 bg-neutral-50" />
                                )}
                            </View>

                            {/* Contenido del paso */}
                            <View className="flex-1">
                                <Text
                                    className={`font-bold text-base ${step.isCompleted || step.isCurrent ? 'text-neutral-900' : 'text-neutral-400'}`}
                                >
                                    {step.label}
                                </Text>
                                {step.date && (
                                    <Text className="text-neutral-500 text-sm mt-1">
                                        {(() => {
                                            try {
                                                const date = new Date(step.date)
                                                if (isNaN(date.getTime())) return 'Fecha no disponible'
                                                return date.toLocaleDateString('es-EC', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                            } catch {
                                                return 'Fecha no disponible'
                                            }
                                        })()}
                                    </Text>
                                )}
                            </View>

                            {/* Línea conectora */}
                            {index < statusHistory.length - 1 && (
                                <View className="absolute left-4 top-8 w-0.5 h-8 bg-neutral-200" />
                            )}
                        </View>
                    ))}
                </View>

                {/* Productos */}
                <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-neutral-900 font-bold text-lg">
                            Productos ({order.detalles?.length || 0})
                        </Text>
                        <View className="bg-neutral-100 px-3 py-1 rounded-full">
                            <Text className="text-neutral-600 text-xs font-bold">
                                {order.detalles?.length || 0} items
                            </Text>
                        </View>
                    </View>

                    {order.detalles && order.detalles.length > 0 ? (
                        order.detalles.map((item, index) => (
                            <View
                                key={item.id}
                                className={`flex-row justify-between py-3 ${index < order.detalles!.length - 1 ? 'border-b border-neutral-100' : ''}`}
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

                {/* Acciones */}
                {canCancel && (
                    <TouchableOpacity
                        onPress={handleCancelOrder}
                        disabled={cancelling}
                        className={`flex-row items-center justify-center py-4 rounded-xl mb-8 ${cancelling ? 'bg-neutral-300' : 'bg-red-500'}`}
                        activeOpacity={0.8}
                    >
                        {cancelling ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Ionicons name="close-circle" size={24} color="white" />
                        )}
                        <Text className="text-white font-bold text-base ml-2">
                            {cancelling ? 'Cancelando...' : 'Cancelar Pedido'}
                        </Text>
                    </TouchableOpacity>
                )}

                <View className="h-8" />
            </ScrollView>
        </View>
    )
}
