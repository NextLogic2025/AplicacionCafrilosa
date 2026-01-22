import React from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../ui/Header'
import { OrderTimeline } from '../ui/OrderTimeline'
import { Order, OrderDetail, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../services/api/OrderService'
import { BRAND_COLORS } from '../../shared/types'

interface ActionButton {
    id: string
    label: string
    icon: keyof typeof Ionicons.glyphMap
    variant: 'primary' | 'danger' | 'secondary'
    onPress: () => void | Promise<void>
    visible?: boolean
    loading?: boolean
}

interface OrderDetailTemplateProps {
    roleType: 'cliente' | 'supervisor' | 'vendedor'
    order: Order | null
    orderDetails: OrderDetail[]
    loading: boolean
    showTimeline?: boolean
    actionButtons?: ActionButton[]
    onBackPress?: () => void
    onViewInvoice?: (invoiceId: string) => void
}

export function OrderDetailTemplate({
    roleType,
    order,
    orderDetails,
    loading,
    showTimeline = false,
    actionButtons = [],
    onBackPress,
    onViewInvoice
}: OrderDetailTemplateProps) {
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
                <Header title="Detalle del Pedido" variant="standard" onBackPress={onBackPress} />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-neutral-500">Pedido no encontrado</Text>
                </View>
            </View>
        )
    }

    const visibleActions = actionButtons.filter(btn => btn.visible !== false)

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title={`Pedido #${order.codigo_visual}`}
                variant="standard"
                onBackPress={onBackPress}
            />

            <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
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

                    {order.origen_pedido && (
                        <View className="flex-row items-center mt-3 pt-3 border-t border-neutral-100">
                            <Ionicons name="phone-portrait-outline" size={16} color="#9CA3AF" />
                            <Text className="text-neutral-500 text-sm ml-2">
                                Realizado desde: {order.origen_pedido.replace('_', ' ')}
                            </Text>
                        </View>
                    )}
                </View>

                {order.factura_numero && (
                    <View className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-5 mb-4 shadow-md shadow-cyan-500/20">
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center">
                                <View className="bg-white/20 p-2 rounded-full mr-3">
                                    <Ionicons name="document-text" size={24} color="white" />
                                </View>
                                <View>
                                    <Text className="text-white/80 text-xs uppercase tracking-wide">Factura</Text>
                                    <Text className="text-white font-bold text-lg">{order.factura_numero}</Text>
                                </View>
                            </View>
                            <View className="bg-white/20 px-3 py-1 rounded-full">
                                <Text className="text-white text-xs font-bold">Generada</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-2 mt-2">
                            {onViewInvoice && (
                                <TouchableOpacity
                                    className="flex-1 flex-row items-center justify-center bg-white py-3 rounded-xl"
                                    onPress={() => onViewInvoice(order.factura_id || '')}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="eye-outline" size={18} color="#0891B2" />
                                    <Text className="text-cyan-700 font-bold ml-2 text-sm">Ver Detalle</Text>
                                </TouchableOpacity>
                            )}
                            {order.url_pdf_factura && (
                                <TouchableOpacity
                                    className="flex-1 flex-row items-center justify-center bg-white/20 py-3 rounded-xl border border-white/30"
                                    onPress={() => {
                                        // TODO: Implement PDF viewer or download
                                        alert('Abriendo PDF: ' + order.url_pdf_factura)
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="download-outline" size={18} color="white" />
                                    <Text className="text-white font-bold ml-2 text-sm">Descargar PDF</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {roleType !== 'cliente' && order.cliente && (
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

                {showTimeline && (
                    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                        <Text className="text-neutral-900 font-bold text-lg mb-4">Trazabilidad del Pedido</Text>
                        <OrderTimeline currentStatus={order.estado_actual} createdAt={order.created_at} />
                    </View>
                )}

                <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-neutral-900 font-bold text-lg">
                            Productos ({orderDetails.length})
                        </Text>
                        <View className="bg-neutral-100 px-3 py-1 rounded-full">
                            <Text className="text-neutral-600 text-xs font-bold">
                                {orderDetails.length} items
                            </Text>
                        </View>
                    </View>

                    {orderDetails.length > 0 ? (
                        orderDetails.map((item, index) => (
                            <View
                                key={item.id}
                                className={`flex-row justify-between py-3 ${index < orderDetails.length - 1 ? 'border-b border-neutral-100' : ''}`}
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

                {visibleActions.length > 0 && (
                    <View className="mb-8">
                        {visibleActions.map((action, index) => {
                            const bgColor = action.variant === 'primary'
                                ? BRAND_COLORS.red
                                : action.variant === 'danger'
                                    ? '#EF4444'
                                    : '#F3F4F6'
                            const textColor = action.variant === 'secondary' ? '#374151' : 'white'

                            return (
                                <TouchableOpacity
                                    key={action.id}
                                    onPress={action.onPress}
                                    disabled={action.loading}
                                    className={`flex-row items-center justify-center py-4 rounded-xl ${index > 0 ? 'mt-3' : ''}`}
                                    style={{ backgroundColor: bgColor }}
                                    activeOpacity={0.8}
                                >
                                    {action.loading ? (
                                        <ActivityIndicator color={textColor} size="small" />
                                    ) : (
                                        <Ionicons name={action.icon} size={24} color={textColor} />
                                    )}
                                    <Text className="font-bold text-base ml-2" style={{ color: textColor }}>
                                        {action.loading ? 'Procesando...' : action.label}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                )}

                <View className="h-8" />
            </ScrollView>
        </View>
    )
}
