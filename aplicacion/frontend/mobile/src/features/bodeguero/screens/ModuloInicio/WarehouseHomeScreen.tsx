import React, { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, RefreshControl, Text, ActivityIndicator } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../../../components/ui/Header'
import { ExpandableFab, type FabAction } from '../../../../components/ui/ExpandableFab'
import { DashboardCard } from '../../../../components/ui/DashboardCard'
import { BRAND_COLORS } from '../../../../shared/types'
import { OrderService } from '../../../../services/api/OrderService'
import { InvoiceService } from '../../../../services/api/InvoiceService'
import { PickingService } from '../../../../services/api/PickingService'
import { getUserName } from '../../../../storage/authStorage'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'

interface OrderStats {
    total: number
    pending: number
    preparing: number
    ready: number
}

interface InvoiceStats {
    total: number
    pending: number
    overdue: number
    balance: number
}

interface PickingStats {
    total: number
    pendientes: number
    enProceso: number
}

export function WarehouseHomeScreen() {
    const navigation = useNavigation()
    const [userName, setUserName] = useState('Bodeguero')
    const [refreshing, setRefreshing] = useState(false)
    const [orderStats, setOrderStats] = useState<OrderStats>({ total: 0, pending: 0, preparing: 0, ready: 0 })
    const [invoiceStats, setInvoiceStats] = useState<InvoiceStats>({ total: 0, pending: 0, overdue: 0, balance: 0 })
    const [pickingStats, setPickingStats] = useState<PickingStats>({ total: 0, pendientes: 0, enProceso: 0 })
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        getUserName().then(name => {
            if (name) setUserName(name)
        })
    }, [])

    const refreshDashboard = useCallback(async () => {
        setRefreshing(true)
        setLoading(true)
        setErrorMessage(null)
        try {
            const [orders, invoices, pickings] = await Promise.all([
                OrderService.getOrders(),
                InvoiceService.getInvoices(),
                PickingService.listMine()
            ])

            setOrderStats({
                total: orders.length,
                pending: orders.filter(o => o.estado_actual === 'PENDIENTE').length,
                preparing: orders.filter(o => o.estado_actual === 'EN_PREPARACION').length,
                ready: orders.filter(o => ['PREPARADO', 'ENTREGADO'].includes(o.estado_actual)).length
            })

            const balance = invoices.reduce((acc, invoice) => acc + (invoice.balance ?? 0), 0)
            setInvoiceStats({
                total: invoices.length,
                pending: invoices.filter(invoice => invoice.status === 'pending').length,
                overdue: invoices.filter(invoice => invoice.status === 'overdue').length,
                balance
            })

            setPickingStats({
                total: pickings.length,
                pendientes: pickings.filter(p => p.estado === 'PENDIENTE').length,
                enProceso: pickings.filter(p => p.estado === 'EN_PROCESO').length
            })
        } catch (error) {
            console.error('Error loading dashboard data', error)
            setErrorMessage(getUserFriendlyMessage(error, 'FETCH_ERROR'))
        } finally {
            setRefreshing(false)
            setLoading(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            refreshDashboard()
        }, [refreshDashboard])
    )

    const fabActions: FabAction[] = [
        {
            icon: 'layers-outline',
            label: 'Órdenes',
            onPress: () => navigation.navigate('WarehouseOrders')
        },
        {
            icon: 'checkbox-outline',
            label: 'Empaque',
            onPress: () => navigation.navigate('WarehousePreparation')
        },
        {
            icon: 'send-outline',
            label: 'Despachos',
            onPress: () => navigation.navigate('WarehouseDispatch')
        },
        {
            icon: 'refresh-circle-outline',
            label: 'Devoluciones',
            onPress: () => navigation.navigate('WarehouseReturns')
        },
        {
            icon: 'analytics-outline',
            label: 'Stock',
            onPress: () => navigation.navigate('WarehouseStock')
        },
        {
            icon: 'warning-outline',
            label: 'Lotes',
            onPress: () => navigation.navigate('WarehouseLots')
        },
        {
            icon: 'business-outline',
            label: 'Almacenes',
            onPress: () => navigation.navigate('WarehouseAlmacenes')
        },
        {
            icon: 'notifications-outline',
            label: 'Alertas',
            onPress: () => navigation.navigate('WarehouseNotifications')
        },
        {
            icon: 'receipt-outline',
            label: 'Facturas',
            onPress: () => navigation.navigate('WarehouseInvoices')
        }
    ]

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName={userName}
                role="BODEGA"
                showNotification
                variant="home"
                notificationRoute="WarehouseNotifications"
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 140 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refreshDashboard} tintColor={BRAND_COLORS.red} />
                }
            >
                <View className="mx-4 mt-4">
                    <Text className="text-neutral-500 text-xs font-bold uppercase mb-3">Operaciones de hoy</Text>
                    <View className="flex-row justify-between">
                        <DashboardCard label="Pedidos totales" icon="layers-outline" value={orderStats.total} color="#374151" columns={3} />
                        <DashboardCard label="Pendientes" icon="time-outline" value={orderStats.pending} color="#FBBF24" columns={3} />
                        <DashboardCard label="Preparando" icon="arrow-redo-outline" value={orderStats.preparing} color="#7C3AED" columns={3} />
                    </View>
                    <View className="flex-row justify-between mt-4">
                        <DashboardCard label="Listos" icon="checkmark-done-outline" value={orderStats.ready} color="#10B981" columns={3} />
                        <DashboardCard label="Pickings totales" icon="cube-outline" value={pickingStats.total} color="#EF4444" columns={3} />
                        <DashboardCard label="En curso" icon="sync-outline" value={pickingStats.enProceso} color="#2563EB" columns={3} />
                    </View>
                </View>

                <View className="mx-4 mt-6">
                    <Text className="text-neutral-500 text-xs font-bold uppercase mb-3">Finanzas relevantes</Text>
                    <View className="flex-row justify-between">
                        <DashboardCard label="Facturas emitidas" icon="receipt-outline" value={invoiceStats.total} color="#0F172A" columns={3} />
                        <DashboardCard label="Por cobrar" icon="alert-circle-outline" value={invoiceStats.pending} color="#D97706" columns={3} />
                        <DashboardCard label="Vencidas" icon="time-outline" value={invoiceStats.overdue} color={invoiceStats.overdue ? '#EF4444' : '#10B981'} columns={3} />
                    </View>
                    <Text className="text-xs text-neutral-500 mt-2">
                        Balance por cobrar: ${invoiceStats.balance.toFixed(2)}
                    </Text>
                </View>

                {loading && (
                    <View className="mt-8 items-center">
                        <ActivityIndicator color={BRAND_COLORS.red} />
                    </View>
                )}

                {errorMessage && (
                    <View className="mx-4 mt-4">
                        <Text className="text-xs text-red-500">{errorMessage}</Text>
                    </View>
                )}
            </ScrollView>

            <ExpandableFab actions={fabActions} />
        </View>
    )
}
