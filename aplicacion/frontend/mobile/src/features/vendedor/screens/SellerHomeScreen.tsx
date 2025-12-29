import React, { useCallback, useState } from 'react'
import { View, ScrollView, RefreshControl, Text } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { ExpandableFab, type FabAction } from '../../../components/ui/ExpandableFab'
import { SellerService, type SellerKPIs, type ScheduledVisit, type SellerAlert } from '../../../services/api/SellerService'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

export function SellerHomeScreen() {
    const navigation = useNavigation()
    const [refreshing, setRefreshing] = useState(false)
    const [kpis, setKpis] = useState<SellerKPIs | null>(null)
    const [visits, setVisits] = useState<ScheduledVisit[]>([])
    const [alerts, setAlerts] = useState<SellerAlert[]>([])

    const loadData = async () => {
        setRefreshing(true)
        try {
            const [kpiData, visitsData, alertsData] = await Promise.all([
                SellerService.getDashboardKPIs(),
                SellerService.getScheduledVisits(),
                SellerService.getAlerts()
            ])
            setKpis(kpiData)
            setVisits(visitsData)
            setAlerts(alertsData)
        } catch (error) {
            console.error('Error loading seller dashboard', error)
        } finally {
            setRefreshing(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [])
    )

    const fabActions: FabAction[] = [
        // @ts-expect-error - Navigation is typed but routes are dynamic
        { icon: 'pricetags-outline', label: 'Productos', onPress: () => navigation.navigate('SellerProducts') },
        // @ts-expect-error - Navigation is typed but routes are dynamic
        { icon: 'ticket-outline', label: 'Promociones', onPress: () => navigation.navigate('SellerPromotions') },
        // @ts-expect-error - Navigation is typed but routes are dynamic
        { icon: 'receipt-outline', label: 'Pedidos', onPress: () => navigation.navigate('SellerOrdersHistory') },
        // @ts-expect-error - Navigation is typed but routes are dynamic
        { icon: 'document-text-outline', label: 'Facturas', onPress: () => navigation.navigate('SellerInvoices') },
        // @ts-expect-error - Navigation is typed but routes are dynamic
        { icon: 'bus-outline', label: 'Entregas', onPress: () => navigation.navigate('SellerDeliveries') },
        // @ts-expect-error - Navigation is typed but routes are dynamic
        { icon: 'refresh-circle-outline', label: 'Devoluciones', onPress: () => navigation.navigate('SellerReturns') },
        // @ts-expect-error - Navigation is typed but routes are dynamic
        { icon: 'notifications-outline', label: 'Notificaciones', onPress: () => navigation.navigate('SellerNotifications') },
    ]

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Vendedor"
                role="VENDEDOR"
                showNotification={true}
                variant="home"
                onNotificationPress={() => {
                    // @ts-expect-error - Navigation is typed but routes are dynamic
                    navigation.navigate('SellerNotifications')
                }}
            />

            <ScrollView
                className="flex-1 px-5 pt-5"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[BRAND_COLORS.red]} />}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* 1. KPIs */}
                <View className="flex-row justify-between mb-6">
                    <KPICard icon="receipt" value={kpis?.todayOrders || 0} label="Pedidos Hoy" color="#10B981" />
                    <KPICard icon="people" value={kpis?.activeClients || 0} label="Clientes Activos" color="#3B82F6" />
                    <KPICard icon="alert-circle" value={kpis?.overdueInvoices || 0} label="Fac. Vencidas" color="#EF4444" />
                </View>

                {/* 2. Alertas Críticas */}
                {(alerts.length > 0) && (
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-neutral-900 mb-3">Atención Requerida</Text>
                        {alerts.map(alert => (
                            <View key={alert.id} className="bg-red-50 border border-red-200 p-4 rounded-xl mb-2 flex-row items-center">
                                <Ionicons name="warning" size={24} color="#EF4444" style={{ marginRight: 12 }} />
                                <View className="flex-1">
                                    <Text className="text-red-800 font-bold text-sm">{alert.type === 'order_rejected' ? 'Pedido Rechazado' : 'Crédito Bloqueado'}</Text>
                                    <Text className="text-red-700 text-xs mt-1">{alert.message} - {alert.clientName}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* 3. Agenda / Visitas */}
                <View className="mb-6">
                    <Text className="text-lg font-bold text-neutral-900 mb-3">Agenda de Hoy</Text>
                    {visits.length === 0 ? (
                        <View className="bg-white p-6 rounded-xl border border-neutral-100 items-center">
                            <Text className="text-neutral-400 text-sm">No tienes visitas programadas.</Text>
                        </View>
                    ) : (
                        visits.map(visit => (
                            <View key={visit.id} className="bg-white p-4 rounded-xl border border-neutral-100 mb-2 shadow-sm flex-row items-center justify-between">
                                <View>
                                    <Text className="font-bold text-neutral-900">{visit.time}</Text>
                                    <Text className="text-neutral-600 font-medium">{visit.clientName}</Text>
                                    <Text className="text-neutral-400 text-xs">{visit.address}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>

            <ExpandableFab actions={fabActions} />
        </View>
    )
}

function KPICard({ icon, value, label, color }: { icon: any, value: number, label: string, color: string }) {
    return (
        <View className="bg-white p-3 rounded-2xl w-[31%] shadow-sm border border-neutral-100 items-center">
            <View className={`p-2 rounded-full mb-2`} style={{ backgroundColor: `${color}15` }}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text className="text-2xl font-bold text-neutral-900">{value}</Text>
            <Text className="text-[10px] text-neutral-500 text-center font-medium mt-1">{label}</Text>
        </View>
    )
}
