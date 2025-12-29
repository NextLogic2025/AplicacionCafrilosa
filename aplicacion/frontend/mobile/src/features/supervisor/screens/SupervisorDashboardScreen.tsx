import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { Header } from '../../../components/ui/Header'
import { SupervisorService, type KPI, type Alert } from '../../../services/api/SupervisorService'

export function SupervisorDashboardScreen() {
    const [kpis, setKpis] = useState<KPI[]>([])
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadData = async () => {
        try {
            setIsLoading(true)
            const [kpiData, alertData] = await Promise.all([
                SupervisorService.getDashboardKPIs(),
                SupervisorService.getDashboardAlerts()
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
                title="Dashboard Supervisor"
                variant="home"
                userName="Supervisor"
                role="SUPERVISOR"
            />

            <ScrollView
                className="flex-1 px-4 pt-4"
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[BRAND_COLORS.red]} />
                }
            >
                {/* General Status Card */}
                <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-4 shadow-sm flex-row items-center justify-between">
                    <View>
                        <Text className="text-lg font-bold text-neutral-800">Estado General</Text>
                        <Text className="text-sm text-neutral-500">Monitoreo en tiempo real</Text>
                    </View>
                    <View className="flex-row items-center bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: BRAND_COLORS.gold, marginRight: 8 }} />
                        <Text className="font-bold text-neutral-700 uppercase">ALERTA</Text>
                    </View>
                </View>

                {/* KPIs Grid */}
                <View className="flex-row flex-wrap justify-between mb-4">
                    {kpis.map((kpi, index) => (
                        <View key={index} className="bg-white p-4 rounded-xl border border-neutral-200 mb-3 shadow-sm" style={{ width: '48%' }}>
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="p-2 rounded-lg bg-neutral-100">
                                    <Ionicons name={kpi.icon as any} size={20} color={kpi.color} />
                                </View>
                                <Text className="text-xs font-bold text-neutral-400 uppercase">Hoy</Text>
                            </View>
                            <Text className="text-2xl font-bold text-neutral-900 mb-1">{kpi.value}</Text>
                            <Text className="text-xs text-neutral-500 font-medium">{kpi.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Alerts Section */}
                <View className="mb-8">
                    <Text className="text-lg font-bold text-neutral-800 mb-3 px-1">Alertas Recientes</Text>
                    {alerts.length > 0 ? (
                        alerts.map(alert => (
                            <View key={alert.id} className="bg-white p-4 rounded-xl border-l-4 mb-3 shadow-sm border-neutral-200" style={{ borderLeftColor: alert.type === 'critical' ? BRAND_COLORS.red : BRAND_COLORS.gold }}>
                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1 mr-2">
                                        <Text className="font-bold text-neutral-800 text-base mb-1">{alert.type === 'critical' ? 'Bloqueo Crítico' : 'Advertencia'}</Text>
                                        <Text className="text-neutral-600 leading-snug">{alert.message}</Text>
                                    </View>
                                    <Text className="text-xs text-neutral-400 whitespace-nowrap">{alert.timestamp}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View className="bg-white p-8 rounded-xl border border-neutral-200 items-center justify-center border-dashed">
                            <Ionicons name="checkmark-circle-outline" size={48} color={BRAND_COLORS.red} />
                            <Text className="text-neutral-400 mt-2">No hay alertas activas</Text>
                        </View>
                    )}
                </View>

                <View className="h-20" />
            </ScrollView>
        </View>
    )
}
