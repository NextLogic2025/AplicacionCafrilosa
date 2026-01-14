import { useFocusEffect } from '@react-navigation/native'
import React, { useState, useCallback } from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { TransportistaService, type Route } from '../../../../services/api/TransportistaService'

export function TransportistaHistoryScreen() {
    const [history, setHistory] = useState<Route[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadHistory = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getRouteHistory()
            setHistory(data)
        } catch (error) {
            console.error('Error loading history', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadHistory() }, []))

    const renderItem = (item: Route) => (
        <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="font-bold text-neutral-900 text-base">{item.name}</Text>
                <View className="bg-gray-100 px-2 py-1 rounded">
                    <Text className="text-gray-600 text-xs font-bold">COMPLETADA</Text>
                </View>
            </View>

            <View className="flex-row items-center mb-2">
                <Ionicons name="calendar-outline" size={14} color="gray" />
                <Text className="text-sm text-neutral-500 ml-1">{item.startTime}</Text>
            </View>

            <View className="flex-row justify-between border-t border-neutral-100 pt-3 mt-2">
                <View className="items-center">
                    <Text className="text-xs text-neutral-400 uppercase font-bold">Entregas</Text>
                    <Text className="text-lg font-bold text-neutral-800">{item.deliveries.length}</Text>
                </View>
                <View className="items-center">
                    <Text className="text-xs text-neutral-400 uppercase font-bold">Distancia</Text>
                    <Text className="text-lg font-bold text-neutral-800">{item.distance} km</Text>
                </View>
                <View className="items-center">
                    <Text className="text-xs text-neutral-400 uppercase font-bold">Tiempo</Text>
                    <Text className="text-lg font-bold text-neutral-800">{Math.floor(item.estimatedDuration / 60)}h {item.estimatedDuration % 60}m</Text>
                </View>
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Historial" variant="standard" showNotification={false} />
            <GenericList
                items={history}
                isLoading={isLoading}
                onRefresh={loadHistory}
                renderItem={renderItem}
                emptyState={{
                    icon: 'time-outline',
                    title: 'Sin Historial',
                    message: 'Aún no has completado ninguna ruta.'
                }}
            />
        </View>
    )
}
