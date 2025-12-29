import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../components/ui/Header'
import { OrderService, Order } from '../../../services/api/OrderService'
import { Timeline } from '../../../components/ui/Timeline'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

export function ClientOrderDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    // @ts-ignore
    const { orderId } = route.params || {}

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (orderId) {
            OrderService.getOrderById(orderId).then(data => {
                setOrder(data || null)
                setLoading(false)
            })
        }
    }, [orderId])

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
                <Header title="Detalle" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-neutral-500">Pedido no encontrado</Text>
                </View>
            </View>
        )
    }

    // Calcular subtotal real si tenemos items, sino usar total
    // En mock data simple, usaremos el total del pedido

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header
                title={`Pedido #${order.id}`}
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>

                {/* Estado y Fecha */}
                <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-neutral-400 text-xs font-medium uppercase">Fecha del pedido</Text>
                        <Text className="text-neutral-400 text-xs font-medium uppercase">Estado</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-neutral-900 font-bold text-base">
                            {new Date(order.date).toLocaleDateString()}
                        </Text>
                        <View className="bg-neutral-100 px-3 py-1 rounded-full">
                            <Text className="text-neutral-600 font-bold text-xs uppercase">{order.status}</Text>
                        </View>
                    </View>
                </View>

                {/* Timeline Visual */}
                <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                    <Text className="text-neutral-900 font-bold text-lg mb-4">Progreso del Pedido</Text>
                    {/* @ts-ignore */}
                    <Timeline steps={[
                        { title: 'Registrado', status: 'completed', date: order.date },
                        { title: 'En Validación', status: ['processing', 'approved', 'in_transit', 'delivered'].includes(order.status) ? 'completed' : order.status === 'pending' ? 'current' : 'pending' },
                        { title: 'Aprobado', status: ['approved', 'in_transit', 'delivered'].includes(order.status) ? 'completed' : order.status === 'processing' ? 'current' : 'pending' },
                        { title: 'En Ruta', status: ['in_transit', 'delivered'].includes(order.status) ? 'completed' : order.status === 'approved' ? 'current' : 'pending' },
                        { title: 'Entregado', status: order.status === 'delivered' ? 'completed' : 'pending' }
                    ]} />
                </View>

                {/* Lista de Productos */}
                <Text className="text-neutral-900 font-bold text-lg mb-3 ml-1">Productos</Text>
                <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-black/5">
                    {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                            <View key={item.id} className={`flex-row justify-between py-3 ${index !== order.items!.length - 1 ? 'border-b border-neutral-50' : ''}`}>
                                <View className="flex-1 pr-4">
                                    <Text className="text-neutral-900 font-bold text-sm">{item.productName}</Text>
                                    <Text className="text-neutral-400 text-xs mt-0.5">{item.quantity} x ${item.price.toFixed(2)}</Text>
                                </View>
                                <Text className="text-neutral-800 font-bold text-sm self-center">
                                    ${item.total.toFixed(2)}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-neutral-400 text-sm italic">
                            Detalle de items no disponible en historial histórico.
                        </Text>
                    )}
                </View>

                {/* Resumen Financiero */}
                <View className="bg-white rounded-2xl p-5 mb-8 shadow-sm shadow-black/5">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-neutral-500 text-sm">Subtotal</Text>
                        <Text className="text-neutral-900 font-medium text-sm">${order.total.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between mb-4">
                        <Text className="text-neutral-500 text-sm">Envío</Text>
                        <Text className="text-green-600 font-medium text-sm">Gratis</Text>
                    </View>
                    <View className="h-[1px] bg-neutral-100 mb-4" />
                    <View className="flex-row justify-between">
                        <Text className="text-neutral-900 font-bold text-lg">Total</Text>
                        <Text className="text-brand-red font-bold text-xl">${order.total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Factura */}
                <Pressable className="flex-row items-center justify-center gap-2 bg-white border border-brand-red rounded-xl py-3 mb-10 active:bg-red-50">
                    <Ionicons name="document-text-outline" size={20} color={BRAND_COLORS.red} />
                    <Text className="text-brand-red font-bold text-base">Descargar Factura</Text>
                </Pressable>

            </ScrollView>
        </View>
    )
}
