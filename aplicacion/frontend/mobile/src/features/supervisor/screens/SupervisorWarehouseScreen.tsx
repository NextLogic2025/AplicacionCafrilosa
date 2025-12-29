import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../components/ui/Header'
import { SupervisorService, type SupervisorWarehouseData } from '../../../services/api/SupervisorService'

export function SupervisorWarehouseScreen() {
    const [data, setData] = useState<SupervisorWarehouseData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const loadData = async () => {
        try {
            setIsLoading(true)
            const result = await SupervisorService.getWarehouseData()
            setData(result)
        } catch (error) {
            console.error('Error loading warehouse data', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadData() }, []))

    if (!data) return null

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Auditoría Bodega" variant="standard" showNotification={false} />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[BRAND_COLORS.red]} />
                }
            >
                {/* Pending Orders Section */}
                <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-4 shadow-sm">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="time" size={20} color={BRAND_COLORS.gold} />
                        <Text className="text-lg font-bold text-neutral-800 ml-2">Pedidos Pendientes</Text>
                    </View>
                    {data.pendingOrders.concat([]).length > 0 ? (
                        data.pendingOrders.map(item => (
                            <View key={item.id} className="flex-row justify-between py-2 border-b border-neutral-100 last:border-0">
                                <Text className="text-neutral-700">Pedido #{item.id}</Text>
                                <Text className="text-neutral-500">{item.timeElapsed}</Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-neutral-400 italic text-center py-4">No hay pedidos pendientes de preparación.</Text>
                    )}
                </View>

                {/* Prep Times Section */}
                <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-4 shadow-sm">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="stopwatch" size={20} color={BRAND_COLORS.blue} />
                        <Text className="text-lg font-bold text-neutral-800 ml-2">Tiempos de Preparación</Text>
                    </View>
                    {data.prepTimes.length > 0 ? (
                        data.prepTimes.map((item, idx) => (
                            <View key={idx} className="flex-row justify-between py-2 border-b border-neutral-100 last:border-0">
                                <Text className="text-neutral-700">#{item.orderId}</Text>
                                <Text className="font-bold text-neutral-800">{item.time}</Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-neutral-400 italic text-center py-4">Sin datos recientes.</Text>
                    )}
                </View>

                {/* Stock Rejections Section */}
                <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-4 shadow-sm">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="alert-circle" size={20} color={BRAND_COLORS.red} />
                        <Text className="text-lg font-bold text-neutral-800 ml-2">Rechazos por Stock</Text>
                    </View>
                    {data.stockRejections.length > 0 ? (
                        data.stockRejections.map((item, idx) => (
                            <View key={idx} className="flex-row justify-between py-2 border-b border-neutral-100 last:border-0">
                                <Text className="text-neutral-700 font-medium">{item.productId}</Text>
                                <Text className="text-red-600 font-bold">{item.quantity} unds</Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-neutral-400 italic text-center py-4">No hay rechazos registrados.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    )
}
