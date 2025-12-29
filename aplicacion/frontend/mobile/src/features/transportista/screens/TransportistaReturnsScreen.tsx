import { useFocusEffect } from '@react-navigation/native'
import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { TransportistaService, type Return } from '../../../services/api/TransportistaService'

export function TransportistaReturnsScreen() {
    const [returns, setReturns] = useState<Return[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadReturns = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getReturns()
            setReturns(data)
        } catch (error) {
            console.error('Error loading returns', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadReturns() }, []))

    const handleAction = (returnId: string, action: 'collect' | 'confirm' | 'warehouse') => {
        // Implement logic based on action
        if (action === 'collect') {
            Alert.alert('Retirar Producto', '¿Confirmas el retiro del producto del cliente?', [
                { text: 'Cancelar' },
                { text: 'Confirmar Retiro', onPress: () => console.log('Collected', returnId) }
            ])
        }
    }

    const renderItem = (item: Return) => (
        <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
            <View className="flex-row justify-between mb-2">
                <Text className="text-xs font-bold text-brand-red">DEVOLUCIÓN #{item.id}</Text>
                <Text className="text-xs text-neutral-500">{item.date}</Text>
            </View>

            <Text className="text-lg font-bold text-neutral-900 mb-1">{item.clientName}</Text>
            <View className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 mb-3">
                <Text className="font-medium text-neutral-800">{item.productName}</Text>
                <Text className="text-sm text-neutral-600">Cantidad: {item.quantity}</Text>
                <Text className="text-sm text-neutral-500 italic mt-1">"{item.reason}"</Text>
            </View>

            <View className="flex-row gap-2 mt-2">
                {item.status === 'pending' && (
                    <TouchableOpacity
                        className="flex-1 bg-white border border-brand-red py-2 rounded-lg items-center"
                        onPress={() => handleAction(item.id, 'collect')}
                    >
                        <Text className="text-brand-red font-bold">Retirar</Text>
                    </TouchableOpacity>
                )}
                {item.status === 'collected' && (
                    <TouchableOpacity
                        className="flex-1 bg-brand-red py-2 rounded-lg items-center"
                        onPress={() => handleAction(item.id, 'warehouse')}
                    >
                        <Text className="text-white font-bold">Entregar en Bodega</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Devoluciones" variant="standard" showNotification={false} />
            <GenericList
                items={returns}
                isLoading={isLoading}
                onRefresh={loadReturns}
                renderItem={renderItem}
                emptyState={{
                    icon: 'reload-circle-outline',
                    title: 'No hay devoluciones',
                    message: 'No tienes solicitudes de devolución pendientes.'
                }}
            />
        </View>
    )
}
