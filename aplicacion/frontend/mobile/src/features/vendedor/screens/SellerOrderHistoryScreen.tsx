/// <reference types="nativewind/types" />
import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { EmptyState } from '../../../components/ui/EmptyState'
import { OrderService, type Order } from '../../../services/api/OrderService'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'

export function SellerOrdersScreen() {
    const navigation = useNavigation()
    const [loading, setLoading] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null) // For simple expand details

    useEffect(() => {
        loadOrders()
    }, [])

    const loadOrders = async () => {
        setLoading(true)
        try {
            const data = await OrderService.getOrders()
            // Simulating orders for seller view with client names
            setOrders(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-amber-600 bg-amber-100'
            case 'approved': return 'text-blue-600 bg-blue-100'
            case 'delivered': return 'text-green-600 bg-green-100'
            case 'cancelled': return 'text-red-600 bg-red-100'
            default: return 'text-neutral-600 bg-neutral-100'
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'pending': 'Por Validar',
            'processing': 'En Proceso',
            'shipped': 'En Ruta',
            'delivered': 'Entregado',
            'cancelled': 'Rechazado'
        }
        return labels[status] || status
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Historial de Pedidos" variant="standard" onBackPress={() => navigation.goBack()} notificationRoute="SellerNotifications" />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <EmptyState
                            icon="receipt-outline"
                            title="Sin Pedidos"
                            description="No se han registrado pedidos recientes."
                            actionLabel="Recargar"
                            onAction={loadOrders}
                        />
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            className="bg-white p-4 rounded-xl border border-neutral-100 mb-3 shadow-sm"
                            onPress={() => setSelectedOrder(selectedOrder === item.id ? null : item.id)}
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View>
                                    <View className="flex-row items-center mb-1">
                                        <Text className="font-bold text-neutral-900 mr-2">#{item.id.slice(0, 8)}</Text>
                                        <View className={`px-2 py-0.5 rounded ${getStatusColor(item.status).split(' ')[1]}`}>
                                            <Text className={`text-[10px] font-bold uppercase ${getStatusColor(item.status).split(' ')[0]}`}>
                                                {getStatusLabel(item.status)}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-neutral-500 text-sm font-medium">{item.clientName || 'Cliente Desconocido'}</Text>
                                    <Text className="text-neutral-400 text-xs">{item.date}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="font-bold text-neutral-900 text-lg">${item.total.toFixed(2)}</Text>
                                    <Text className="text-neutral-400 text-xs">{item.itemsCount} items</Text>
                                </View>
                            </View>

                            {/* Expanded Details / Timeline */}
                            {selectedOrder === item.id && (
                                <View className="mt-3 pt-3 border-t border-neutral-100">
                                    <Text className="font-bold text-neutral-900 text-xs mb-2 uppercase">Línea de Tiempo</Text>
                                    {item.timeline ? item.timeline.map((step, index) => (
                                        <View key={index} className="flex-row items-start mb-2 last:mb-0">
                                            <View className={`w-2 h-2 rounded-full mt-1.5 mr-2 ${step.active ? 'bg-brand-red' : 'bg-neutral-300'}`} />
                                            <View className="flex-1">
                                                <Text className={`text-xs ${step.active ? 'text-neutral-900 font-bold' : 'text-neutral-500'}`}>{step.status}</Text>
                                                <Text className="text-[10px] text-neutral-400">{step.description} • {step.date}</Text>
                                            </View>
                                        </View>
                                    )) : (
                                        <Text className="text-neutral-400 italic text-xs">Sin información de seguimiento.</Text>
                                    )}

                                    {item.observations && (
                                        <View className="mt-3 bg-neutral-50 p-2 rounded-lg">
                                            <Text className="text-[10px] text-neutral-500 font-bold">OBSERVACIONES:</Text>
                                            <Text className="text-xs text-neutral-600">{item.observations}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </Pressable>
                    )}
                />
            )}
        </View>
    )
}
