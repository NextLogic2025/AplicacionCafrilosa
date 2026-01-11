import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { SupervisorService, type SupervisorReturn } from '../../../../services/api/SupervisorService'

export function SupervisorReturnsScreen() {
    const navigation = useNavigation()
    const [returns, setReturns] = useState<SupervisorReturn[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadReturns = async () => {
        try {
            setIsLoading(true)
            const data = await SupervisorService.getReturns()
            setReturns(data)
        } catch (error) {
            console.error('Error loading returns', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadReturns() }, []))

    const handleAction = (id: string, action: 'approve' | 'reject') => {
        console.log('Return Action:', action, id)
    }

    const renderItem = (item: SupervisorReturn) => (
        <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="font-bold text-neutral-900 text-base">Solicitud #{item.requestId}</Text>
                    <Text className="text-xs text-neutral-500">{item.date}</Text>
                </View>
                <View className={`px-2 py-1 rounded ${item.status === 'pending_approval' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                    <Text className={`text-xs font-bold uppercase ${item.status === 'pending_approval' ? 'text-yellow-700' : 'text-gray-700'}`}>
                        {item.status === 'pending_approval' ? 'Por Aprobar' : item.status}
                    </Text>
                </View>
            </View>

            <Text className="text-neutral-800 font-medium mb-1">{item.clientName}</Text>
            <Text className="text-sm text-neutral-600 mb-2">Monto: ${item.amount.toFixed(2)}</Text>
            <Text className="text-sm text-neutral-500 italic mb-3">"{item.reason}"</Text>

            {item.status === 'pending_approval' && (
                <View className="flex-row gap-2 pt-2 border-t border-neutral-100">
                    <TouchableOpacity
                        className="flex-1 py-2 bg-brand-red rounded-lg items-center"
                        onPress={() => handleAction(item.id, 'approve')}
                    >
                        <Text className="text-white font-bold text-xs">Aprobar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 py-2 border border-neutral-300 rounded-lg items-center"
                        onPress={() => handleAction(item.id, 'reject')}
                    >
                        <Text className="text-neutral-700 font-bold text-xs">Rechazar</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Autorización Devoluciones"
                variant="standard"
                showNotification={false}
                onBackPress={() => navigation.goBack()}
            />
            <GenericList
                items={returns}
                isLoading={isLoading}
                onRefresh={loadReturns}
                renderItem={renderItem}
                emptyState={{
                    icon: 'refresh-circle-outline',
                    title: 'Sin solicitudes',
                    message: 'No hay devoluciones pendientes de aprobación.'
                }}
            />
        </View>
    )
}
