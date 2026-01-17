import { BRAND_COLORS } from '../../../../shared/types'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import React, { useState, useCallback } from 'react'
import { View, ScrollView, RefreshControl, Text, ActivityIndicator } from 'react-native'

import { ExpandableFab, type FabAction } from '../../../../components/ui/ExpandableFab'
import { Header } from '../../../../components/ui/Header'
import { TransportistaService, type TransportistaAlert, type TransportistaKPIs, type Delivery } from '../../../../services/api/TransportistaService'

import { getUserName } from '../../../../storage/authStorage'

export function TransportistaHomeScreen() {
    const navigation = useNavigation<any>()
    const [userName, setUserName] = useState('Transportista')

    useFocusEffect(
        useCallback(() => {
            getUserName().then(name => {
                if (name) setUserName(name)
            })
            // ... load data
            loadData()
        }, [])
    )

    const [refreshing, setRefreshing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [kpis, setKpis] = useState<TransportistaKPIs | null>(null)
    const [alerts, setAlerts] = useState<TransportistaAlert[]>([])
    const [nextDelivery, setNextDelivery] = useState<Delivery | null>(null)

    const loadData = async () => {
        try {
            setRefreshing(true)
            const [kpiData, alertsData, deliveryData] = await Promise.all([
                TransportistaService.getDashboardKPIs(),
                TransportistaService.getAlerts(),
                TransportistaService.getNextDelivery()
            ])
            setKpis(kpiData)
            setAlerts(alertsData || [])
            setNextDelivery(deliveryData || null)
        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setRefreshing(false)
            setLoading(false)
        }
    }

    // Removed redundant useFocusEffect since we combined it above


    const fabActions: FabAction[] = [
        {
            icon: 'map-outline',
            label: 'Rutas',
            onPress: () => navigation.navigate('Rutas')
        },
        {
            icon: 'refresh-circle-outline',
            label: 'Devoluciones',
            onPress: () => navigation.navigate('Devoluciones')
        },
        {
            icon: 'time-outline',
            label: 'Historial',
            onPress: () => navigation.navigate('Historial')
        },
        {
            icon: 'notifications-outline',
            label: 'Notificaciones',
            onPress: () => navigation.navigate('Notificaciones')
        }
    ]

    if (loading && !refreshing && !kpis) {
        return (
            <View className="flex-1 justify-center items-center bg-neutral-50">
                <ActivityIndicator size="large" color={BRAND_COLORS.red} />
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName={userName}
                role="TRANSPORTISTA"
                showNotification={true}
                variant="home"
                notificationRoute="Notificaciones"
            />

            <ScrollView
                className="flex-1 px-5 pt-5"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={loadData}
                        tintColor={BRAND_COLORS.red}
                    />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* KPIs */}
                <View className="flex-row justify-between mb-6">
                    <DashboardCard
                        icon="cube"
                        value={kpis?.assignedOrders || 0}
                        label="Pedidos Asignados"
                        color="#3B82F6"
                    />
                    <DashboardCard
                        icon="bus"
                        value={kpis?.pendingDeliveries || 0}
                        label="Por Entregar"
                        color="#F59E0B"
                    />
                    <DashboardCard
                        icon="checkmark-circle"
                        value={kpis?.deliveredToday || 0}
                        label="Entregados Hoy"
                        color="#10B981"
                    />
                </View>

                {/* Alerts */}
                {alerts.length > 0 && (
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-neutral-900 mb-3">Avisos Importantes</Text>
                        {alerts.map((alert) => (
                            <AlertItem key={alert.id} alert={alert} />
                        ))}
                    </View>
                )}

                {/* Next Delivery */}
                <View className="mb-6">
                    <Text className="text-lg font-bold text-neutral-900 mb-3">Próxima Entrega</Text>
                    <NextDeliveryItem delivery={nextDelivery} />
                </View>
            </ScrollView>

            <ExpandableFab actions={fabActions} />
        </View>
    )
}

// Sub-components to keep clean
function DashboardCard({ icon, value, label, color }: any) {
    return (
        <View className="bg-white p-3 rounded-2xl w-[31%] shadow-sm border border-neutral-100 items-center">
            <View className="p-2 rounded-full mb-2" style={{ backgroundColor: `${color}15` }}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text className="text-2xl font-bold text-neutral-900">{value}</Text>
            <Text className="text-[10px] text-neutral-500 text-center font-medium mt-1">{label}</Text>
        </View>
    )
}

function AlertItem({ alert }: { alert: TransportistaAlert }) {
    const isWarning = alert.type === 'route_changed'
    return (
        <View className={`p-4 rounded-xl mb-2 flex-row items-center border ${isWarning ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
            <Ionicons name={isWarning ? 'warning' : 'information-circle'} size={24} color={isWarning ? '#D97706' : '#2563EB'} style={{ marginRight: 12 }} />
            <View className="flex-1">
                <Text className="font-bold text-sm text-neutral-800">{alert.message}</Text>
                <Text className="text-xs text-neutral-500 mt-1">{alert.date}</Text>
            </View>
        </View>
    )
}

function NextDeliveryItem({ delivery }: { delivery: Delivery | null }) {
    if (!delivery) return (
        <View className="bg-white p-6 rounded-xl border border-neutral-100 items-center">
            <Text className="text-neutral-400 text-sm">No hay entregas pendientes.</Text>
        </View>
    )
    return (
        <View className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                    <Text className="font-bold text-neutral-900 text-lg">{delivery.clientName}</Text>
                    <Text className="text-neutral-500 text-sm flex-wrap w-60">{delivery.address}</Text>
                </View>
                <View className="bg-brand-red px-2 py-1 rounded">
                    <Text className="text-white text-xs font-bold">{delivery.estimatedTime}</Text>
                </View>
            </View>
            <View className="flex-row items-center mt-2">
                <Ionicons name="cube-outline" size={16} color="#6B7280" style={{ marginRight: 4 }} />
                <Text className="text-neutral-500 text-xs">{delivery.itemsCount} productos • Pedido #{delivery.orderId}</Text>
            </View>
        </View>
    )
}
