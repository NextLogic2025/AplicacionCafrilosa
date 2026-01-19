import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'

import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { SupervisorService, type SupervisorDelivery } from '../../../../services/api/SupervisorService'

export function SupervisorDeliveriesScreen() {
    const [deliveries, setDeliveries] = useState<SupervisorDelivery[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadDeliveries = async () => {
        try {
            setIsLoading(true)
            const data = await SupervisorService.getDeliveries()
            setDeliveries(data)
        } catch (error) {
            console.error('Error loading deliveries', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadDeliveries() }, []))

    const handleAction = (id: string, action: 'retry' | 'validate_failure') => {
        Alert.alert(
            action === 'retry' ? 'Autorizar Reintento' : 'Validar Fallo',
            `Acción registrada para la entrega ${id}`,
            [{ text: 'OK' }]
        )
    }

    const renderItem = (item: SupervisorDelivery) => (
        <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-xs text-neutral-400 font-bold mb-0.5">ENTREGA #{item.id}</Text>
                    <Text className="font-bold text-neutral-900 text-base">{item.clientName}</Text>
                </View>
                {item.status === 'in_route' && (
                    <View className="bg-blue-100 px-2 py-1 rounded">
                        <Text className="text-blue-700 text-xs font-bold">EN RUTA</Text>
                    </View>
                )}
                {item.status === 'delivered' && (
                    <View className="bg-green-100 px-2 py-1 rounded">
                        <Text className="text-green-700 text-xs font-bold">ENTREGADA</Text>
                    </View>
                )}
                {item.status === 'failed' && (
                    <View className="bg-red-100 px-2 py-1 rounded">
                        <Text className="text-red-700 text-xs font-bold">FALLIDA</Text>
                    </View>
                )}
            </View>

            <View className="flex-row items-center mb-1">
                <Ionicons name="person-outline" size={14} color="gray" />
                <Text className="text-sm text-neutral-600 ml-1">{item.transportistaName}</Text>
            </View>
            <View className="flex-row items-center mb-3">
                <Ionicons name="location-outline" size={14} color="gray" />
                <Text className="text-sm text-neutral-600 ml-1 flex-1" numberOfLines={1}>{item.address}</Text>
            </View>

            {item.evidence && (
                <View className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 mb-3">
                    <Text className="text-xs font-bold text-neutral-500 mb-1 uppercase">Evidencia</Text>
                    {item.evidence.notes && <Text className="text-sm text-neutral-800 italic mb-2">"{item.evidence.notes}"</Text>}

                    <View className="flex-row gap-2">
                        {item.evidence.photoUrl && (
                            <View className="w-16 h-16 bg-neutral-200 rounded items-center justify-center">
                                <Ionicons name="image" size={20} color="gray" />
                                <Text className="text-[10px] text-neutral-500">Foto</Text>
                            </View>
                        )}
                        {item.evidence.signatureUrl && (
                            <View className="w-16 h-16 bg-neutral-200 rounded items-center justify-center">
                                <Ionicons name="pencil" size={20} color="gray" />
                                <Text className="text-[10px] text-neutral-500">Firma</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {item.status === 'failed' && (
                <View className="flex-row gap-2 mt-2 pt-2 border-t border-neutral-100">
                    <TouchableOpacity
                        className="flex-1 py-2 bg-brand-red rounded-lg items-center"
                        onPress={() => handleAction(item.id, 'validate_failure')}
                    >
                        <Text className="text-white font-bold text-xs">Validar Fallo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 py-2 bg-white border border-brand-red rounded-lg items-center"
                        onPress={() => handleAction(item.id, 'retry')}
                    >
                        <Text className="text-brand-red font-bold text-xs">Reintentar</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Entregas" variant="standard" showNotification={false} />
            <GenericList
                items={deliveries}
                isLoading={isLoading}
                onRefresh={loadDeliveries}
                renderItem={renderItem}
                emptyState={{
                    icon: 'cube-outline',
                    title: 'Sin Entregas',
                    message: 'No hay entregas activas en este momento.'
                }}
            />
        </View>
    )
}
