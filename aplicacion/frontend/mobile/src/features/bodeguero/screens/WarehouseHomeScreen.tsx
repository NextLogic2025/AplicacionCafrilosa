import React, { useState, useCallback } from 'react'
import { View, ScrollView, RefreshControl } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { ExpandableFab, type FabAction } from '../../../components/ui/ExpandableFab'
import { WarehouseKPIs, CriticalAlerts, WarehouseRecentActivity } from '../components/WarehouseDashboardComponents'
import { WarehouseService, type WarehouseStats, type RecentActivity } from '../../../services/api/WarehouseService'

export function WarehouseHomeScreen() {
    const navigation = useNavigation()
    const [refreshing, setRefreshing] = useState(false)
    const [stats, setStats] = useState<WarehouseStats>({
        pendingOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        expiringLots: 0,
        criticalStock: 0
    })
    const [activities, setActivities] = useState<RecentActivity[]>([])

    const loadData = async () => {
        setRefreshing(true)
        try {
            const [newStats, newActivities] = await Promise.all([
                WarehouseService.getDashboardStats(),
                WarehouseService.getRecentActivity()
            ])
            setStats(newStats)
            setActivities(newActivities)
        } catch (error) {
            console.error('Error loading dashboard data', error)
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
        {
            icon: 'notifications-outline',
            label: 'Notificaciones',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseNotifications')
        },
        {
            icon: 'refresh-circle-outline',
            label: 'Devoluciones',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseReturns')
        },
        {
            icon: 'bus-outline',
            label: 'Despachos',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseDispatch')
        },
        {
            icon: 'cube-outline',
            label: 'Preparación',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehousePreparation')
        },
        {
            icon: 'warning-outline',
            label: 'Lotes / Vencimientos',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseLots')
        }
    ]

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Bodeguero"
                role="BODEGA"
                showNotification={true}
                variant="home"
                onNotificationPress={() => {
                    // @ts-expect-error - Navigation is typed but routes are dynamic
                    navigation.navigate('WarehouseNotifications')
                }}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={BRAND_COLORS.red} />
                }
            >
                <WarehouseKPIs stats={stats} />
                <CriticalAlerts stats={stats} />
                <WarehouseRecentActivity activities={activities} />
            </ScrollView>

            <ExpandableFab actions={fabActions} />
        </View>
    )
}
