import React, { useCallback, useState } from 'react'
import { View, ScrollView, RefreshControl, Text, TouchableOpacity, Linking, Platform } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { ExpandableFab, type FabAction } from '../../../../components/ui/ExpandableFab'
import { SellerService, type SellerKPIs, type ScheduledVisit, type SellerAlert } from '../../../../services/api/SellerService'
import { CatalogService, type Product } from '../../../../services/api/CatalogService'
import { useCart } from '../../../../context/CartContext'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import { getUserName } from '../../../../storage/authStorage'

export function SellerHomeScreen() {
    const navigation = useNavigation()
    const { totalItems, totalPrice } = useCart()
    const [userName, setUserName] = useState('Vendedor')

    // Cargar nombre real
    React.useEffect(() => {
        getUserName().then(name => {
            if (name) setUserName(name)
        })
    }, [])
    const [refreshing, setRefreshing] = useState(false)
    const [kpis, setKpis] = useState<SellerKPIs | null>(null)
    const [visits, setVisits] = useState<ScheduledVisit[]>([])
    const [alerts, setAlerts] = useState<SellerAlert[]>([])
    const [promotedProducts, setPromotedProducts] = useState<Product[]>([])

    const loadData = async () => {
        setRefreshing(true)
        try {
            const [kpiData, visitsData, alertsData, productsData] = await Promise.all([
                SellerService.getDashboardKPIs(),
                SellerService.getScheduledVisits(),
                SellerService.getAlerts(),
                CatalogService.getProductsPaginated(1, 10)
            ])
            setKpis(kpiData)
            setVisits(visitsData)
            setAlerts(alertsData)

            // Filtrar productos con promoción activa
            const promos = productsData.items.filter(p =>
                p.precio_oferta && p.precio_original && p.precio_oferta < p.precio_original
            )
            setPromotedProducts(promos.slice(0, 3))
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

    // Obtener próxima visita
    const nextVisit = visits.length > 0 ? visits[0] : null

    // Función para abrir navegación GPS
    const openNavigation = (address: string) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' })
        const url = Platform.select({
            ios: `${scheme}${address}`,
            android: `${scheme}${address}`
        })

        if (url) {
            Linking.openURL(url).catch(err => console.error('Error opening maps:', err))
        }
    }

    const fabActions: FabAction[] = [
        // @ts-expect-error - Navigation is typed but routes are dynamic
        { icon: 'map-outline', label: 'Mi Rutero', onPress: () => navigation.navigate('SellerRoute') },
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
                userName={userName}
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

                {/* 2. Próxima Visita */}
                {nextVisit && (
                    <View className="bg-white p-4 rounded-xl border border-neutral-200 mb-6 shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                                <Ionicons name="time" size={20} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                                    Próxima Visita
                                </Text>
                                <Text className="text-lg font-bold text-neutral-900">{nextVisit.time}</Text>
                            </View>
                        </View>
                        <View className="bg-neutral-50 p-3 rounded-lg mb-3">
                            <Text className="text-sm font-bold text-neutral-900 mb-1">{nextVisit.clientName}</Text>
                            <Text className="text-xs text-neutral-600">{nextVisit.address}</Text>
                        </View>
                        <TouchableOpacity
                            className="bg-blue-600 p-3 rounded-lg flex-row items-center justify-center"
                            onPress={() => openNavigation(nextVisit.address)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="navigate" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text className="text-white font-bold text-sm">Iniciar Navegación</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* 3. Carrito Actual */}
                {totalItems > 0 && (
                    <TouchableOpacity
                        className="bg-white p-4 rounded-xl border border-green-200 mb-6 shadow-sm"
                        // @ts-expect-error - Navigation is typed but routes are dynamic
                        onPress={() => navigation.navigate('SellerCart')}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="cart" size={24} color="#10B981" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-neutral-500 font-semibold uppercase tracking-wide mb-1">
                                        Carrito Actual
                                    </Text>
                                    <Text className="text-base font-bold text-neutral-900">
                                        {totalItems} producto{totalItems !== 1 ? 's' : ''}
                                    </Text>
                                    <Text className="text-sm text-green-600 font-bold">
                                        ${totalPrice.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                            <View className="bg-green-600 w-8 h-8 rounded-full items-center justify-center">
                                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                            </View>
                        </View>
                    </TouchableOpacity>
                )}

                {/* 4. Productos en Promoción */}
                {promotedProducts.length > 0 && (
                    <View className="bg-white p-4 rounded-xl border border-orange-200 mb-6 shadow-sm">
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="pricetag" size={20} color="#F97316" />
                                </View>
                                <View>
                                    <Text className="text-xs text-neutral-500 font-semibold uppercase tracking-wide">
                                        Promociones Activas
                                    </Text>
                                    <Text className="text-sm font-bold text-neutral-900">
                                        {promotedProducts.length} producto{promotedProducts.length !== 1 ? 's' : ''} en oferta
                                    </Text>
                                </View>
                            </View>
                        </View>
                        {promotedProducts.map((product, index) => (
                            <View
                                key={product.id}
                                className={`flex-row items-center py-2 ${index < promotedProducts.length - 1 ? 'border-b border-neutral-100' : ''}`}
                            >
                                <Ionicons name="flash" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-neutral-900" numberOfLines={1}>
                                        {product.nombre}
                                    </Text>
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-xs text-neutral-400 line-through mr-2">
                                            ${product.precio_original?.toFixed(2)}
                                        </Text>
                                        <Text className="text-sm font-bold text-red-600">
                                            ${product.precio_oferta?.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                                <View className="bg-red-100 px-2 py-1 rounded-md">
                                    <Text className="text-xs font-bold text-red-600">
                                        {product.ahorro ? `-$${product.ahorro.toFixed(2)}` : 'OFERTA'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        <TouchableOpacity
                            className="bg-orange-50 p-3 rounded-lg mt-3 flex-row items-center justify-center"
                            // @ts-expect-error - Navigation is typed but routes are dynamic
                            onPress={() => navigation.navigate('SellerPromotions')}
                            activeOpacity={0.8}
                        >
                            <Text className="text-orange-600 font-bold text-sm mr-1">Ver todas las promociones</Text>
                            <Ionicons name="arrow-forward" size={16} color="#F97316" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* 5. Acceso Rápido al Rutero */}
                <TouchableOpacity
                    className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl border border-red-200 mb-6 shadow-sm"
                    // @ts-expect-error - Navigation is typed but routes are dynamic
                    onPress={() => navigation.navigate('SellerRoute')}
                    activeOpacity={0.7}
                    style={{
                        shadowColor: '#DC2626',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                        backgroundColor: '#FEF2F2'
                    }}
                >
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mr-3">
                                <Ionicons name="map" size={24} color="#DC2626" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-neutral-900 mb-1">
                                    Mi Rutero Semanal
                                </Text>
                                <Text className="text-xs text-neutral-600">
                                    {visits.length > 0
                                        ? `${visits.length} visita${visits.length !== 1 ? 's' : ''} programada${visits.length !== 1 ? 's' : ''} para hoy`
                                        : 'Ver agenda de visitas planificadas'
                                    }
                                </Text>
                            </View>
                        </View>
                        <View className="bg-red-600 w-8 h-8 rounded-full items-center justify-center">
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </View>
                    </View>
                </TouchableOpacity>

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

                {/* 6. Agenda / Visitas */}
                <View className="mb-6">
                    <Text className="text-lg font-bold text-neutral-900 mb-3">Agenda de Hoy</Text>
                    {visits.length === 0 ? (
                        <View className="bg-white p-6 rounded-xl border border-neutral-100 items-center">
                            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                            <Text className="text-neutral-400 text-sm mt-3">No tienes visitas programadas</Text>
                        </View>
                    ) : (
                        visits.map(visit => (
                            <View key={visit.id} className="bg-white p-4 rounded-xl border border-neutral-100 mb-2 shadow-sm flex-row items-center justify-between">
                                <View className="flex-1">
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
