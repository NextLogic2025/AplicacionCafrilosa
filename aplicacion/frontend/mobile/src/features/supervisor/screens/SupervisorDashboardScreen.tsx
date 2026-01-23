import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../shared/types'

import { Header } from '../../../components/ui/Header'
import { getUserName } from '../../../storage/authStorage'
import { DashboardAdapter } from '../adapters/DashboardAdapter'
import { KPI, Alert } from '../../../services/api/SupervisorService'
import { DashboardCard } from '../../../components/ui/DashboardCard'
import { QuickActionsGrid } from '../../../components/ui/QuickActionsGrid'

export function SupervisorDashboardScreen() {
    const [kpis, setKpis] = useState<KPI[]>([])
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userName, setUserName] = useState('Supervisor')

    const loadData = async () => {
        try {
            setIsLoading(true)
            const storedName = await getUserName()
            if (storedName) setUserName(storedName)

            const [kpiData, alertData] = await Promise.all([
                DashboardAdapter.getKPIs(),
                DashboardAdapter.getAlerts()
            ])
            setKpis(kpiData)
            setAlerts(alertData)
        } catch (error) {
            console.error('Error loading dashboard data', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(useCallback(() => { loadData() }, []))

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName={userName}
                role="SUPERVISOR"
                variant="home"
                showNotification={true}
                notificationRoute="SupervisorAlerts"
            />

            <ScrollView
                className="flex-1 px-4 pt-4"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[BRAND_COLORS.red]} />
                }
            >


                <View className="flex-row justify-between mb-6 -mx-1.5">
                    {kpis.map((kpi, index) => (
                        <DashboardCard
                            key={index}
                            label={kpi.label}
                            value={kpi.value}
                            icon={kpi.icon}
                            color={kpi.color}
                        />
                    ))}
                </View>

                <QuickActionsGrid />

                <View className="mb-24">
                    <Text className="text-lg font-bold text-neutral-800 mb-3 px-1">Alertas Recientes</Text>
                    {alerts.length > 0 ? (
                        alerts.map(alert => (
                            <View key={alert.id} className="bg-white p-4 rounded-xl border-l-4 mb-3 shadow-sm border-neutral-200" style={{ borderLeftColor: alert.type === 'critical' ? BRAND_COLORS.red : BRAND_COLORS.gold }}>
                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1 mr-2">
                                        <Text className="font-bold text-neutral-800 text-base mb-1">{alert.type === 'critical' ? 'Atención Requerida' : 'Advertencia'}</Text>
                                        <Text className="text-neutral-600 leading-snug text-sm">{alert.message}</Text>
                                    </View>
                                    <Text className="text-xs text-neutral-400 whitespace-nowrap">{alert.timestamp}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View className="bg-white p-8 rounded-xl border border-neutral-200 items-center justify-center border-dashed">
                            <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
                            <Text className="text-neutral-400 mt-2">No hay alertas activas</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    )
}
