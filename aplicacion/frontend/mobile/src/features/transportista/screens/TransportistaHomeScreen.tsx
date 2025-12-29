import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import React from 'react'
import { View, ScrollView, RefreshControl, Text } from 'react-native'

import { ExpandableFab, type FabAction } from '../../../components/ui/ExpandableFab'
import { Header } from '../../../components/ui/Header'
import { TransportistaService, type TransportistaAlert, type TransportistaKPIs, type Delivery } from '../../../services/api/TransportistaService'

/**
 * KPI Card Component
 * Displays key performance indicators with icon, value and label
 */
function KPICard({
    icon,
    value,
    label,
    color
}: {
    icon: keyof typeof Ionicons.glyphMap
    value: number | string
    label: string
    color: string
}) {
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

/**
 * Alert Card Component
 * Displays delivery alerts and important notifications
 */
function AlertCard({ alert }: { alert: TransportistaAlert }) {
    const isWarning = alert.type === 'route_changed'
    const bgColor = isWarning ? 'bg-amber-50' : 'bg-blue-50'
    const borderColor = isWarning ? 'border-amber-200' : 'border-blue-200'
    const iconColor = isWarning ? '#D97706' : '#2563EB'
    const iconName = isWarning ? 'warning' : 'information-circle'

    return (
        <View className={`p-4 rounded-xl mb-2 flex-row items-center border ${bgColor} ${borderColor}`}>
            <Ionicons name={iconName} size={24} color={iconColor} style={{ marginRight: 12 }} />
            <View className="flex-1">
                <Text className="font-bold text-sm text-neutral-800">{alert.message}</Text>
                <Text className="text-xs text-neutral-500 mt-1">{alert.date}</Text>
            </View>
        </View>
    )
}

/**
 * Next Delivery Card Component
 * Shows upcoming delivery information
 */
function NextDeliveryCard({ delivery }: { delivery: Delivery | null }) {
    if (!delivery) {
        return (
            <View className="bg-white p-6 rounded-xl border border-neutral-100 items-center">
                <Text className="text-neutral-400 text-sm">No hay entregas pendientes.</Text>
            </View>
        )
    }

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
                <Text className="text-neutral-500 text-xs">
                    {delivery.itemsCount} productos • Pedido #{delivery.orderId.slice(-6)}
                </Text>
            </View>
        </View>
    )
}

export function TransportistaHomeScreen() {
    const navigation = useNavigation()
    const [refreshing, setRefreshing] = React.useState(false)
    const [kpis, setKpis] = React.useState<TransportistaKPIs | null>(null)
    const [alerts, setAlerts] = React.useState<TransportistaAlert[]>([])
    const [nextDelivery, setNextDelivery] = React.useState<Delivery | null>(null)

    /**
     * Load dashboard data from backend
     */
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
            console.error('Error loading transportista dashboard:', error)
        } finally {
            setRefreshing(false)
        }
    }

    /**
     * Load data on screen focus
     */
    useFocusEffect(
        React.useCallback(() => {
            loadData()
        }, [])
    )

    /**
     * FAB Actions - Quick access to key features
     */
    const fabActions: FabAction[] = [
        {
            icon: 'map-outline',
            label: 'Rutas',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('TransportistaRoutes')
        },
        {
            icon: 'refresh-circle-outline',
            label: 'Devoluciones',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('TransportistaReturns')
        },
        {
            icon: 'time-outline',
            label: 'Historial',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('TransportistaHistory')
        },
        {
            icon: 'notifications-outline',
            label: 'Notificaciones',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('TransportistaNotifications')
        }
    ]

    return (
        <View className="flex-1 bg-neutral-50">
            {/* Header with user info and notifications */}
            <Header
                userName="Transportista"
                role="TRANSPORTISTA"
                showNotification={true}
                variant="home"
                onNotificationPress={() => {
                    // @ts-expect-error - Navigation is typed but routes are dynamic
                    navigation.navigate('TransportistaNotifications')
                }}
            />

            {/* Main content with refresh control */}
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
                {/* Section 1: KPIs - Dashboard metrics */}
                <View className="flex-row justify-between mb-6">
                    <KPICard
                        icon="cube"
                        value={kpis?.assignedOrders || 0}
                        label="Pedidos Asignados"
                        color="#3B82F6"
                    />
                    <KPICard
                        icon="bus"
                        value={kpis?.pendingDeliveries || 0}
                        label="Por Entregar"
                        color="#F59E0B"
                    />
                    <KPICard
                        icon="checkmark-circle"
                        value={kpis?.deliveredToday || 0}
                        label="Entregados Hoy"
                        color="#10B981"
                    />
                </View>

                {/* Section 2: Alerts - Important notices */}
                {alerts.length > 0 && (
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-neutral-900 mb-3">
                            Avisos Importantes
                        </Text>
                        {alerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} />
                        ))}
                    </View>
                )}

                {/* Section 3: Next Delivery - Upcoming delivery info */}
                <View className="mb-6">
                    <Text className="text-lg font-bold text-neutral-900 mb-3">
                        Próxima Entrega
                    </Text>
                    <NextDeliveryCard delivery={nextDelivery} />
                </View>
            </ScrollView>

            {/* Floating Action Button with quick access */}
            <ExpandableFab actions={fabActions} />
        </View>
    )
}
