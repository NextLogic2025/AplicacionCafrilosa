import React, { useState, useCallback } from 'react'
import { View, ScrollView, RefreshControl } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { ExpandableFab, type FabAction } from '../../../../components/ui/ExpandableFab'
import { WarehouseKPIs, CriticalAlerts, WarehouseRecentActivity } from '../../components/WarehouseDashboardComponents'
import { WarehouseService, type WarehouseStats, type RecentActivity } from '../../../../services/api/WarehouseService'

import { getUserName } from '../../../../storage/authStorage'

export function WarehouseHomeScreen() {
    const navigation = useNavigation()
    const [userName, setUserName] = useState('Bodeguero')

    // Cargar nombre real
    React.useEffect(() => {
        getUserName().then(name => {
            if (name) setUserName(name)
        })
    }, [])
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

    // Acciones ordenadas por flujo de trabajo:
    // Picking → Preparación/Empaque → Despacho
    const fabActions: FabAction[] = [
        {
            icon: 'lock-closed-outline',
            label: 'Reservas',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseReservations')
        },
        {
            icon: 'checkbox-outline',
            label: 'Empaque',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehousePreparation')
        },
        {
            icon: 'send-outline',
            label: 'Despachos',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseDispatch')
        },
        {
            icon: 'refresh-circle-outline',
            label: 'Devoluciones',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseReturns')
        },
        {
            icon: 'analytics-outline',
            label: 'Stock',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseStock')
        },
        {
            icon: 'warning-outline',
            label: 'Lotes',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseLots')
        },
        {
            icon: 'business-outline',
            label: 'Almacenes',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseAlmacenes')
        },
        {
            icon: 'notifications-outline',
            label: 'Alertas',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseNotifications')
        },
        {
            icon: 'receipt-outline',
            label: 'Facturas',
            // @ts-expect-error - Navigation is typed but routes are dynamic
            onPress: () => navigation.navigate('WarehouseInvoices')
        }
    ]

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName={userName}
                role="BODEGA"
                showNotification={true}
                variant="home"
                notificationRoute="WarehouseNotifications"
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
