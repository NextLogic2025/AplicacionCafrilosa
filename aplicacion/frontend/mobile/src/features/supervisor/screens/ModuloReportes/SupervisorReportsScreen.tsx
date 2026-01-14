import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'

import { Header } from '../../../../components/ui/Header'
import { GenericList } from '../../../../components/ui/GenericList'
import { SupervisorService, type SupervisorReport } from '../../../../services/api/SupervisorService'

export function SupervisorReportsScreen() {
    const navigation = useNavigation()
    const [reports, setReports] = useState<SupervisorReport[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadReports = async () => {
        try {
            setIsLoading(true)
            const data = await SupervisorService.getReports()
            setReports(data)
        } catch (error) {
            console.error('Error loading reports', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadReports() }, []))

    const renderItem = (item: SupervisorReport) => (
        <TouchableOpacity className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center">
                <View className="bg-red-50 p-2 rounded-lg mr-3">
                    <Ionicons name="document-text" size={24} color={BRAND_COLORS.red} />
                </View>
                <View>
                    <Text className="font-bold text-neutral-900 text-base">{item.title}</Text>
                    <Text className="text-xs text-neutral-500 uppercase">{item.type} • {item.date}</Text>
                </View>
            </View>
            <Ionicons name="download-outline" size={20} color="gray" />
        </TouchableOpacity>
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Reportes"
                variant="standard"
                showNotification={false}
                onBackPress={() => navigation.goBack()}
            />
            <GenericList
                items={reports}
                isLoading={isLoading}
                onRefresh={loadReports}
                renderItem={renderItem}
                emptyState={{
                    icon: 'stats-chart-outline',
                    title: 'Sin Reportes',
                    message: 'No hay reportes disponibles para descargar.'
                }}
            />
        </View>
    )
}
