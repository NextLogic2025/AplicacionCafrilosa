import { Ionicons } from '@expo/vector-icons'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { useState } from 'react'
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native'

import { Header } from '../../../../components/ui/Header'
import { TransportistaService, type TransportistaOrder } from '../../../../services/api/TransportistaService'
import { BRAND_COLORS } from '../../../../shared/types'
import { GenericActionModal } from '../../../../components/ui/GenericActionModal'

type RouteParams = {
    params: {
        order: TransportistaOrder
    }
}

export function TransportistaOrderDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute<RouteProp<RouteParams, 'params'>>()
    const { order } = route.params || {}
    const [status, setStatus] = useState(order?.status || 'pending')
    const [loading, setLoading] = useState(false)

    if (!order) return null

    const handleUpdateStatus = async (newStatus: 'shipped') => {
        try {
            setLoading(true)
            await TransportistaService.updateOrderStatus(order.id, newStatus)
            setStatus(newStatus)
            Alert.alert('Éxito', 'Estado del pedido actualizado')
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el estado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={`Pedido #${order.id}`} variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-5 pt-5 pb-10">
                {/* Information Card */}
                <View className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm mb-4">
                    <Text className="text-xl font-bold text-neutral-900 mb-1">{order.clientName}</Text>
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="location-outline" size={16} color="gray" />
                        <Text className="text-neutral-600 ml-1 flex-1">{order.address}</Text>
                    </View>

                    <View className="py-3 border-t border-neutral-100 flex-row justify-between">
                        <View>
                            <Text className="text-xs text-neutral-500 font-bold uppercase">Estado Actual</Text>
                            <View className={`px-2 py-1 rounded mt-1 self-start ${status === 'shipped' ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                                <Text className={`text-xs font-bold ${status === 'shipped' ? 'text-blue-700' : 'text-yellow-700'}`}>
                                    {status === 'shipped' ? 'En Ruta' : 'Listo para despacho'}
                                </Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text className="text-xs text-neutral-500 font-bold uppercase">Total</Text>
                            <Text className="text-lg font-bold text-neutral-900">${order.total?.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Details */}
                <View className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm mb-4">
                    <Text className="font-bold text-neutral-900 mb-4">Detalle del Pedido</Text>

                    <View className="mb-4">
                        <Text className="text-xs text-neutral-500 font-medium mb-1">RESUMEN DE PRODUCTOS</Text>
                        <Text className="text-neutral-800">{order.productSummary || 'Varios productos'}</Text>
                        <Text className="text-xs text-neutral-500 mt-1">{order.itemsCount} productos en total</Text>
                    </View>

                    <View>
                        <Text className="text-xs text-neutral-500 font-medium mb-1">OBSERVACIONES</Text>
                        <Text className="text-neutral-800 bg-neutral-50 p-3 rounded-lg border border-neutral-100 italic">
                            {order.observations || 'Ninguna observación.'}
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                {status === 'pending' && (
                    <View className="gap-3 mb-10">
                        <TouchableOpacity
                            onPress={() => handleUpdateStatus('shipped')}
                            className="bg-brand-red p-4 rounded-xl flex-row justify-center items-center shadow-sm"
                            disabled={loading}
                        >
                            {loading ? (
                                <Text className="text-white font-bold">Procesando...</Text>
                            ) : (
                                <>
                                    <Ionicons name="bus-outline" size={24} color="white" style={{ marginRight: 8 }} />
                                    <Text className="text-white font-bold text-lg">Confirmar Retiro / En Ruta</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
                {status === 'shipped' && (
                    <View className="items-center p-5">
                        <Text className="text-neutral-400">Este pedido ya está en ruta.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}
