import React, { useState, useCallback } from 'react'
import { View, Text } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { SupervisorService, type Alert } from '../../../services/api/SupervisorService'

export function SupervisorAlertsScreen() {
    const navigation = useNavigation()
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadAlerts = async () => {
        try {
            setIsLoading(true)
            const data = await SupervisorService.getAllAlerts()
            setAlerts(data)
        } catch (error) {
            console.error('Error loading alerts', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadAlerts() }, []))

    const renderItem = (item: Alert) => (
        <View className="bg-white p-4 rounded-xl border-l-4 mb-3 shadow-sm border-neutral-200" style={{ borderLeftColor: item.type === 'critical' ? BRAND_COLORS.red : BRAND_COLORS.gold }}>
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2">
                    <Text className="font-bold text-neutral-800 text-base mb-1">{item.type === 'critical' ? 'Bloqueo Crítico' : 'Advertencia'}</Text>
                    <Text className="text-neutral-600 leading-snug">{item.message}</Text>
                </View>
                <Text className="text-xs text-neutral-400 whitespace-nowrap">{item.timestamp}</Text>
            </View>
        </View>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Alertas del Sistema"
                variant="standard"
                showNotification={false}
                onBackPress={() => navigation.goBack()}
            />
            <GenericList
                items={alerts}
                isLoading={isLoading}
                onRefresh={loadAlerts}
                renderItem={renderItem}
                emptyState={{
                    icon: 'notifications-off-outline',
                    title: 'Sin Alertas',
                    message: 'Todo opera con normalidad.'
                }}
            />
        </View>
    )
}
